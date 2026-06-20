export const meta = {
  name: 'typologie-investigation',
  description: 'Cross the 5 teacher archetypes against all data to answer: who reaches the classroom, and why most do not return',
  phases: [
    { title: 'Investigate', detail: 'one agent per question, each runs pandas on the shared master table' },
    { title: 'Verify', detail: 'adversarial re-computation of each finding (censoring, confounds, sample size)' },
    { title: 'Synthesize', detail: 'assemble confirmed findings into the two narratives + recommendations' },
  ],
}

const ROOT = '/Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/enquete_usages_2026'
const SP = '/private/tmp/claude-502/-Users-akim-Documents-MathAData-Git-mathadata-dashboard-next/49f4f306-c2bb-43a0-af8f-f1b5ce99e908/scratchpad'

const DICT = `
SHARED DATA (run python3/pandas; you may write scratch scripts under ${SP}):
- MASTER (one row per teacher who taught, n=224): ${ROOT}/commons/data/master_teachers.csv
  Columns:
   pseudo, arch (archetype: pionnier_intensif|fidele_pluriannuel|explorateur_multi|deployeur_classe|petit_groupe),
   behavior (enseigné_sans_test|testé_puis_enseigné|enseigné_puis_testé),
   n_eleves_uniq, n_sessions, n_activities_taught, n_tests, n_sy_taught,
   returned (bool: taught >=2 school years), returned_next_year (bool/empty: taught the school year AFTER entry),
   eligible_return (bool: entered in 2023-2024 or 2024-2025 -> had a chance to return),
   entry_sy (2023-2024|2024-2025|2025-2026), entry_month (1-12), entry_activity (id), entry_act_label,
   y1_sess, y1_el, y1_act, y1_max_sess (metrics in the teacher's FIRST teaching year),
   uai, type_etab, secteur, academie, departement, commune, ips, ips_bucket,
   n_prof_uai (nb of MathAData teachers in same establishment), site_present (bool: establishment has >=1 mathadata.fr account),
   etab_formed (bool: establishment had a présentiel formation), form_month,
   taught_2425, taught_2526, active_2324, active_2425, active_2526.
- sessions (738 teaching sessions): ${ROOT}/volet1/data/sessions.csv  [session_id, teacher, mathadata_id, act_label, uai_el, n_eleves, start, end, sy, date, span_min]
- usages_enriched (per-row, incl. tests where role!=student): ${ROOT}/volet1/data/usages_enriched.csv
- engaged_teachers (401 = 224 a_enseigne + 140 stagiaire_seul + 37 testeur_distributeur): ${ROOT}/volet1/data/engaged_teachers.csv
- volet2 facts: ${ROOT}/volet2/data/facts_cross.json , facts_formation.json , cohorts.csv , presentiel_etabs.csv , match_candidates.csv (46 individual site<->capytale pairs)
- upstream site accounts (2715): ${SP}/payload_users_work.csv

NON-NEGOTIABLE METHOD RULES:
1. RETENTION: only the 101 teachers with eligible_return==True can have returned. Use returned_next_year as the target. NEVER compute retention including 2025-2026 entrants (they are right-censored). State the eligible n every time.
2. Always report the subgroup n. Treat any cell with n<10 as INDICATIVE ONLY (say so). Do not headline a difference resting on <10.
3. Class size: session-grain (sessions.n_eleves, median ~5) differs from teacher-grain unique pupils (median ~20). Be explicit which you use.
4. Archetypes are not random: pionnier/fidele are partly DEFINED using multi-year info, so "fidele return more" is partly tautological — flag any such circularity and prefer first-year-only predictors when testing what PREDICTS return.
5. Show the actual numbers you computed (counts + rates), not just adjectives.
`

const FINDING = {
  type: 'object', additionalProperties: false,
  required: ['question','headline','key_numbers','method','evidence','confidence','caveats','surprising'],
  properties: {
    question: { type:'string' },
    headline: { type:'string', description:'one-sentence direct answer with the key number' },
    key_numbers: { type:'array', items:{ type:'object', additionalProperties:false, required:['label','value'], properties:{ label:{type:'string'}, value:{type:'string'} } } },
    method: { type:'string', description:'exactly what you computed, on which subset, with n' },
    evidence: { type:'string', description:'the raw crosstab / rates as text so it can be re-checked' },
    confidence: { type:'string', enum:['high','medium','low'] },
    caveats: { type:'array', items:{type:'string'} },
    surprising: { type:'boolean' },
  },
}

const VERDICT = {
  type:'object', additionalProperties:false,
  required:['verdict','corrected_headline','issues','recomputed','notes'],
  properties:{
    verdict:{ type:'string', enum:['confirmed','qualified','refuted'] },
    corrected_headline:{ type:'string', description:'the headline you would stand behind after re-checking (may equal original)' },
    issues:{ type:'array', items:{type:'string'} },
    recomputed:{ type:'array', items:{ type:'object', additionalProperties:false, required:['label','value'], properties:{ label:{type:'string'}, value:{type:'string'} } } },
    notes:{ type:'string' },
  },
}

const QUESTIONS = [
  { key:'retention_by_arch', q:`Among the eligible-to-return teachers, which archetypes actually come back the next year and which churn? Quantify returned_next_year rate per archetype (with n per archetype among eligible). Because pionnier/fidele are defined using multi-year info, ALSO answer the non-circular version: among teachers whose ENTRY YEAR behaviour was identical (use y1_sess, y1_act, behavior), does anything separate returners from churners? This is the core of "why most do not return".` },
  { key:'y1_predicts_return', q:`Does FIRST-YEAR behaviour predict returning? Among eligible teachers, compare returners vs non-returners on y1_sess, y1_el, y1_act, y1_max_sess, behavior (tested first or not), n_tests. Which year-1 signal best separates the 31 returners from the 70 churners? Give rates of return by buckets (e.g. y1_act==1 vs >=2; y1_sess==1 vs >=2; tested vs not). This tells the team what an early "will-stick" signal looks like.` },
  { key:'entry_activity', q:`Does the ENTRY activity shape destiny? Among eligible teachers, group by entry_act_label (and entry_activity id): for each entry activity, give n, return rate, and median y1 reach. Is "Intro IA – chiffres 2 et 7" an easy on-ramp that does NOT convert to durable use, vs the Statistics activity being more structural? Only headline activities with n>=10.` },
  { key:'establishment', q:`Test the "collective vs isolated" hypothesis against retention. Among eligible teachers: does being in a multi-prof establishment (n_prof_uai>=2) raise return rate vs solo pioneers (n_prof_uai==1)? Also cross return with ips_bucket, type_etab, secteur. Report n and rates. Is local critical mass a durability driver?` },
  { key:'formation', q:`Does FORMATION produce durable teachers — and does the type matter? This is the key cross of volet2 into the profiles. (a) Among teachers in establishments with etab_formed==True vs not, compare archetype mix and return rate (eligible only). (b) Use match_candidates.csv (46 individual pairs) and facts_formation.json / cohorts.csv to characterise, where known, the formation type (présentiel / webinaire / établissement-ciblée) of teachers who became durable vs one-shot. Be explicit about how few individual links exist; do not over-claim. Distinguish formation TYPES as far as the data allow.` },
  { key:'timing', q:`Does WHEN in the year a teacher starts predict durability? Among eligible teachers, bucket entry_month into Sept-Nov (early), Dec-Feb (mid), Mar-Jun (late end-of-year try-out). Give n and return rate per bucket. Are late-year "try it before summer" entrants the churn engine? Also: distribution of entry_month overall (seasonality of first classroom use).` },
  { key:'geography', q:`Geography as a proxy for local animation. By academie: count teachers, count pionnier+fidele (durable core), and (eligible only) return rate. Which académies concentrate the durable core or retain best? Only highlight académies with n>=8. Relate to whether those académies had formations (cohorts.csv / presentiel_etabs.csv).` },
  { key:'trajectories', q:`Reconstruct the TRAJECTORIES of the 32 multi-year teachers (n_sy_taught>=2). Using sessions.csv per (teacher, sy): how does behaviour evolve from year1 to year2 — do they intensify (more sessions/pupils), broaden (new activities, climb the catalog from Intro IA to Stats/Géométrie), or just repeat the same activity at the same scale? Are pionniers "born" (already intense in y1) or "made" (grew into it)? Give concrete counts (e.g. X of 32 added a new activity in y2; Y grew class size).` },
  { key:'petit_groupe', q:`Resolve the petit_groupe profile (48 teachers, ~4 pupils). Is it a DEAD-END (one-shot, never returns, abandoned deployment) or a STABLE NICHE (soutien/demi-groupe that recurs)? Among eligible petit_groupe teachers, what is the return rate vs other archetypes? Look at sessions: are their sessions recurring small groups (same teacher many small sessions) or a single tiny try? Settle whether the old "8 élèves average" was a session-grain artefact (compute session-grain vs teacher-grain class size for this group and overall).` },
  { key:'who_reaches_class', q:`WHO reaches the classroom at all? Using engaged_teachers.csv (401): contrast the 224 'a_enseigne' with the 177 who engaged but never taught their own pupils (140 stagiaire_seul + 37 testeur_distributeur). What distinguishes those who cross into the classroom — selftest, was_trainee, is_formateur, establishment context? Then, from the upstream site side (${SP}/payload_users_work.csv), restate at a high level what fraction of site accounts ever reach a real class (reference facts_cross.json site_funnel) — but keep this brief to avoid duplicating volet 2; focus on the PROFILE angle.` },
]

phase('Investigate')
const results = await pipeline(
  QUESTIONS,
  (item) => agent(
    `You are a data analyst on the MathAData usage study. Investigate ONE question by running real pandas on the shared tables. Return a rigorous, number-rich finding.\n\n${DICT}\n\nQUESTION [${item.key}]:\n${item.q}\n\nWrite and run python3 (pandas) to compute the answer. Verify your own counts (e.g. subgroup ns sum to the whole). Then return the structured finding. Headlines must carry the actual number. If the honest answer is "no signal / too few cases", say so plainly — a null result is a valid finding.`,
    { label: `inv:${item.key}`, phase: 'Investigate', schema: FINDING, effort: 'high' }
  ).then(f => ({ item, finding: f })),
  (prev) => {
    if (!prev || !prev.finding) return null
    return agent(
      `You are an adversarial verifier. Re-compute the following finding INDEPENDENTLY with your own pandas and try to break it. Check specifically: (1) censoring — were 2025-2026 entrants wrongly included in any retention rate? (2) sample size — is any headline resting on n<10? (3) circularity — is the claim just restating how archetypes were defined? (4) confounds — could a third variable (entry cohort, establishment, activity) explain it? (5) arithmetic — do the numbers reproduce?\n\n${DICT}\n\nFINDING UNDER REVIEW [${prev.item.key}]:\nheadline: ${prev.finding.headline}\nmethod: ${prev.finding.method}\nevidence: ${prev.finding.evidence}\nkey_numbers: ${JSON.stringify(prev.finding.key_numbers)}\ncaveats: ${JSON.stringify(prev.finding.caveats)}\n\nReturn your verdict. If confirmed, corrected_headline may equal the original. If the numbers are right but over-stated, use 'qualified' and give the headline you would actually stand behind. Use 'refuted' only if the core claim is wrong. recomputed = the key numbers as YOU computed them.`,
      { label: `ver:${prev.item.key}`, phase: 'Verify', schema: VERDICT, effort: 'high' }
    ).then(v => ({ key: prev.item.key, finding: prev.finding, verdict: v }))
  }
)

const clean = results.filter(Boolean)
log(`investigated+verified ${clean.length}/${QUESTIONS.length} questions`)
const confirmed = clean.filter(r => r.verdict && r.verdict.verdict !== 'refuted')
log(`${confirmed.length} findings stand (non-refuted)`)

phase('Synthesize')
const synth = await agent(
  `You are the lead author. Below are ${clean.length} investigated+verified findings about the 5 MathAData teacher archetypes. Synthesise them into the spine of a report whose two headline questions are: (A) WHO reaches the classroom, and (B) WHY most teachers do not return year-over-year. Exploit the archetypes throughout — the value is in the CROSSINGS, not in re-describing the clusters. Prefer the verifier's corrected_headline over the original where they differ. Be honest about null results and small-n limits.\n\nFINDINGS (with verdicts):\n${JSON.stringify(clean.map(r => ({ key:r.key, headline:r.finding.headline, verdict:r.verdict.verdict, corrected:r.verdict.corrected_headline, key_numbers:r.finding.key_numbers, recomputed:r.verdict.recomputed, caveats:r.finding.caveats, surprising:r.finding.surprising })), null, 1)}\n\nReturn the synthesis: two narratives (A and B, each a few tight paragraphs grounded in the numbers), per-archetype actionable insights, the strongest cross-findings (ranked), concrete recommendations tied to evidence, and a short list of charts that would best convey the story (each as a title + what it plots + which numbers).`,
  { label: 'synthesize', phase: 'Synthesize', schema: {
    type:'object', additionalProperties:false,
    required:['who_reaches_class','why_dont_return','profile_insights','cross_findings','recommendations','suggested_charts','headline_numbers'],
    properties:{
      who_reaches_class:{ type:'string' },
      why_dont_return:{ type:'string' },
      headline_numbers:{ type:'array', items:{ type:'object', additionalProperties:false, required:['label','value'], properties:{ label:{type:'string'}, value:{type:'string'} } } },
      profile_insights:{ type:'array', items:{ type:'object', additionalProperties:false, required:['archetype','insight'], properties:{ archetype:{type:'string'}, insight:{type:'string'} } } },
      cross_findings:{ type:'array', items:{ type:'string' } },
      recommendations:{ type:'array', items:{ type:'object', additionalProperties:false, required:['lever','rationale','evidence'], properties:{ lever:{type:'string'}, rationale:{type:'string'}, evidence:{type:'string'} } } },
      suggested_charts:{ type:'array', items:{ type:'object', additionalProperties:false, required:['title','plots','numbers'], properties:{ title:{type:'string'}, plots:{type:'string'}, numbers:{type:'string'} } } },
    },
  }, effort: 'high' }
)

return { confirmed_count: confirmed.length, total: clean.length,
  findings: clean.map(r => ({ key:r.key, headline:r.finding.headline, verdict:r.verdict.verdict, corrected:r.verdict.corrected_headline, key_numbers:r.finding.key_numbers, recomputed:r.verdict.recomputed, surprising:r.finding.surprising, caveats:r.finding.caveats, issues:r.verdict.issues })),
  synthesis: synth }
