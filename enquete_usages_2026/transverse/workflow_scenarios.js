export const meta = {
  name: 'usage-scenarios-investigation',
  description: 'Broaden the typology: characterise usage scenarios, follow individual cases and sub-cohorts to map how MathAData is really used',
  phases: [
    { title: 'Investigate', detail: 'scenarios, individual case studies, sub-cohorts, temporal rhythms — each on real data' },
    { title: 'Verify', detail: 'adversarial re-check of each finding (numbers, censoring, over-claim, anonymity)' },
    { title: 'Synthesize', detail: 'assemble into scenario gallery + case studies + sub-cohort tracking' },
  ],
}

const ROOT = '/Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/enquete_usages_2026'

const DICT = `
SHARED DATA (run python3/pandas). Teacher ids are PSEUDONYMS (T000..T223); never attempt to de-anonymise. Commune/academie are establishment-grain and OK to cite.
- SCENARIOS (1 row/teacher, n=224): ${ROOT}/transverse/data/scenarios_teachers.csv
  cols: pseudo, arch, scenario, n_sessions, n_days, spread_days, n_acts, med_size, max_size, pct_small (sessions<=5),
  pct_full (sessions>=15), med_span (session span minutes), med_work_min (median per-PUPIL work duration in min),
  continuation_rate (share of this teacher's pupils who worked >60min = continued), n_classes (distinct classes via
  student-set overlap), uses_multi_class (bool: >=2 distinct classes), dom_slot, fixed_slot_n (max sessions in one
  weekday+slot combo), demigroupe_days (days with >=2 sessions), pct_weekend, pct_evening, n_reprise_pupils, n_home_pupils,
  n_eleves_uniq, n_sy_taught, entry_sy, eligible_return, returned_next_year, academie, commune, ips, uai.
  Aggregates (facts_scenarios.json): 57.6% of teachers are multi-class (median 2 classes); pupil median work 34.5 min;
  21.7% of pupils continue >60min; reprise 13.3% of pupil-rows; home/evening/weekend 10%.
- SESSIONS (1 row/session, n=738): ${ROOT}/transverse/data/sessions_enriched.csv
  cols: pseudo, arch, scenario, mathadata_id, act_label, n_eleves, date, hour, wd (0=Mon..6=Sun), slot, span_min, sy.
- MASTER (retention/entry detail, n=224): ${ROOT}/transverse/data/master_teachers.csv (pseudo-keyed, SAME pseudonyms as scenarios).
- facts_scenarios.json, facts_typologie.json, facts_investigation.json in ${ROOT}/transverse/data/
- Formation/geo context: ${ROOT}/site-vers-classe/data/cohorts.csv , presentiel_etabs.csv , facts_cross.json
- Raw (pupil-level, teacher = HASH not pseudo — use only for aggregate reprise/home, not case ids): ${ROOT}/usage-capytale/data/usages_enriched.csv

ARCHETYPES: pionnier_intensif, fidele_pluriannuel, explorateur_multi, deployeur_classe, petit_groupe.
SCENARIO definitions (priority order): one_shot (1 session) > soutien_recurrent (>=3 sessions, median<=5, fixed_slot_n>=3) >
  demi_groupe (demigroupe_days>=2 & max_size>=8) > marathon (spread>=120d) > intensif_court (>=8 sessions, spread<90d) >
  deploiement_classe (max_size>=15) > ponctuel_petit (else).

METHOD RULES (non-negotiable):
1. RETENTION only on eligible_return==True (n=101); use returned_next_year. Never include 2025-2026 entrants.
2. Report subgroup n; n<10 = INDICATIVE ONLY, say so. Don't headline a difference on n<10.
3. Don't restate how a scenario/archetype was DEFINED as if it were a finding (flag circularity).
4. Show the actual numbers (counts, rates, dates) you computed. For case studies, give the real session-by-session trajectory (dates, sizes, activities, slots) from sessions_enriched.csv.
5. Session span median is ~7 min and many sessions are tiny — be careful: a 'session' is a reconstructed cluster of pupil activity, not necessarily a full lesson.
`

const FINDING = {
  type:'object', additionalProperties:false,
  required:['question','headline','key_numbers','method','evidence','confidence','caveats','surprising'],
  properties:{
    question:{type:'string'},
    headline:{type:'string', description:'one-sentence answer with the key number'},
    key_numbers:{type:'array', items:{type:'object', additionalProperties:false, required:['label','value'], properties:{label:{type:'string'}, value:{type:'string'}}}},
    method:{type:'string'},
    evidence:{type:'string', description:'raw stats/crosstab OR, for a case study, the sourced session-by-session trajectory'},
    confidence:{type:'string', enum:['high','medium','low']},
    caveats:{type:'array', items:{type:'string'}},
    surprising:{type:'boolean'},
  },
}
const VERDICT = {
  type:'object', additionalProperties:false,
  required:['verdict','corrected_headline','issues','recomputed','notes'],
  properties:{
    verdict:{type:'string', enum:['confirmed','qualified','refuted']},
    corrected_headline:{type:'string'},
    issues:{type:'array', items:{type:'string'}},
    recomputed:{type:'array', items:{type:'object', additionalProperties:false, required:['label','value'], properties:{label:{type:'string'}, value:{type:'string'}}}},
    notes:{type:'string'},
  },
}

const QUESTIONS = [
  { key:'rhythms', q:`Map the temporal rhythms of usage and how they DIFFER by archetype. From sessions_enriched.csv: distribution of slot (matin/aprem/dejeuner/soir/tot_matin), weekday (wd), and span_min. Then cross slot/weekend/evening/span with archetype: do pionniers run more recurring fixed slots and evening/weekend activity than deployeurs? Is deploiement_classe a one-off morning lesson while soutien is a fixed weekly slot? Quantify (e.g. % evening sessions by archetype, median span by scenario).` },
  { key:'scenario_taxonomy', q:`Validate and characterise the 7 usage scenarios as a TAXONOMY. For each scenario give n, archetype mix, median size, median span, spread_days, reprise/home intensity, and (eligible only) return rate. Which scenarios are durable (marathon, soutien_recurrent) vs dead-end (one_shot)? Make explicit any circularity (scenario partly defined by the same metrics). The goal is a clean, defensible scenario gallery.` },
  { key:'soutien_is_pionnier', q:`Test the counter-intuitive claim that RECURRING SMALL-GROUP support (soutien_recurrent: fixed weekly slot, tiny groups) is an INTENSIVE, durable practice — a pionnier signature — not a low-engagement one. Compare soutien_recurrent teachers vs petit_groupe one-shots on n_sessions, spread_days, n_eleves_uniq, n_reprise_pupils, n_home_pupils, return rate. Settle whether 'small groups' splits into two opposite worlds (durable soutien vs abandoned tryout).` },
  { key:'reprise_home', q:`Reprises (pupils returning to the same work >=12h later) and home/evening/weekend activity: are they QUALITY signals? Aggregate counts (facts_scenarios.json: reprise ~13% of pupil-rows, home ~10%). Then per teacher: do teachers whose pupils show reprises/home-work have higher retention or belong to durable archetypes? Report n and rates; flag correlational. Which scenarios concentrate home-work?` },
  { key:'multi_class', q:`SAME class deepened vs MULTIPLE classes deployed — the replication question. 57.6% of teachers are multi-class (n_classes>=2, median 2). Quantify uses_multi_class by archetype and scenario. Is running several classes a durability/intensity signal (cross with archetype, n_sy_taught, and eligible return rate)? Distinguish the deployeur who does ONE class once from the pionnier who replicates across many. How many classes do the top users run? Pick 1 sourced exemplar of broad replication and 1 of single-class depth (reprises on the same group).` },
  { key:'pupil_engagement', q:`Anatomy of pupil engagement WITHIN a session. Pupil median work = 34.5 min, 21.7% continue >60min. Compute med_work_min and continuation_rate by archetype and by scenario. Key contrast to verify: petit_groupe sessions are not just small but SHORT (median pupil work ~6 min) vs ~30 min for deployeur/pionnier/fidele — i.e. tryouts where pupils barely engage. Is per-pupil work duration a quality/depth signal that separates real lessons from dabbles? Report medians + n.` },
  { key:'demi_groupe', q:`Characterise the demi-groupe / dédoublement scenario (>=2 sessions same day, sizable). How many teachers, which establishments/academies, what is the signature (two complementary sessions same day, similar sizes)? Pick 1-2 sourced exemplars (by pseudo) with their same-day session pairs from sessions_enriched.csv. Is it a pionnier practice?` },
  { key:'case_champion', q:`CASE STUDY — the champion (pseudo T186). Reconstruct the full sourced trajectory from sessions_enriched.csv: timeline across school years, activities used (catalog breadth), session sizes, fixed slots, reprises, home-work (101 home pupils), 404 unique pupils over 735 days, 3 years. Tell the story of how a power-user actually operates. What makes them exceptional vs typical? Keep strictly to data; anonymous.` },
  { key:'case_paradox', q:`CASE STUDY — the deployeur paradox. Deep-dive T005 (deployed a full ~42-pupil class in a 4-day burst, eligible, returned_next_year=False) and contrast with T012 (single 36-pupil one-shot, churned). Reconstruct their sourced trajectories. Then characterise the broader 'reached a full class then vanished' pool (deployeur_classe + deploiement_classe, eligible, returned=False): how many, what did their single year look like (sessions, span, activities, reprises)? This embodies why high reach != durability.` },
  { key:'case_made_not_born', q:`CASE STUDY — 'made not born'. From master_teachers.csv + sessions_enriched.csv, find pionnier/fidele teachers who started modestly in year 1 then grew in year 2 (e.g. y1 sessions small, y2 much larger; or added activities/climbed the catalog). Pick 2 sourced exemplars (by pseudo) and reconstruct their year1->year2 trajectory (sessions, pupils, activities). Quantify across the 32 multi-year teachers how many fit 'modest start then grew'.` },
  { key:'case_fidele', q:`CASE STUDY — the quiet backbone (fidele_pluriannuel). Deep-dive 2 fidele exemplars (e.g. T137, T135) showing the pattern: a few small sessions, but recurring every school year across the whole calendar (spread ~330-378 days). Contrast their LOW volume with their HIGH durability. What does 'durable but not intense' look like concretely? Sourced trajectories.` },
  { key:'subcohort_lille', q:`SUB-COHORT — Lille (the durable powerhouse). Why does Lille retain best (52% vs 23%, p=0.016)? Trace Lille teachers: how many, archetype/scenario mix, how many in formed establishments (etab_formed/presentiel_etabs.csv), spread across how many distinct establishments/communes, entry cohorts. Is the edge formation-driven, animation-driven, or concentration-of-pionniers? Be honest about collinearity with archetype.` },
  { key:'subcohort_diffusion', q:`SUB-COHORT — within-establishment diffusion. Using scenarios_teachers.csv group by uai: find establishments with >=2 MathAData teachers. Do colleagues start STAGGERED (a pioneer, then others months later = word-of-mouth diffusion) or SIMULTANEOUSLY (same month = a formation/top-down)? Compute, for multi-teacher establishments, the spread of entry dates. Pick 1-2 sourced establishment exemplars (by commune + pseudos). Does a pioneer pull colleagues? Relate to the earlier NULL that multi-prof does not raise retention.` },
  { key:'subcohort_entry', q:`SUB-COHORT — entry cohorts. Compare the 2023-2024, 2024-2025 and 2025-2026 entry cohorts (entry_sy): size, archetype/scenario mix, median first-year sessions/pupils, and (for the two older, eligible) how they evolved. Is the 2025-26 wave behaving like earlier waves at the same stage (i.e. will it churn the same way), or different? Quantify the growth-by-acquisition pattern (cohort sizes 21 -> 80 -> 123).` },
]

phase('Investigate')
const results = await pipeline(
  QUESTIONS,
  (item) => agent(
    `You are a data analyst mapping HOW MathAData is really used (beyond the retention question already answered). Investigate ONE topic with real pandas. For case studies, reconstruct the actual sourced trajectory. Return a rigorous, number-rich finding.\n\n${DICT}\n\nTOPIC [${item.key}]:\n${item.q}\n\nRun python3 to compute. Verify your counts. Then return the structured finding. Null/ambiguous results are valid — say so. Stay anonymous (pseudonyms only).`,
    { label:`inv:${item.key}`, phase:'Investigate', schema:FINDING, effort:'high' }
  ).then(f => ({ item, finding:f })),
  (prev) => {
    if (!prev || !prev.finding) return null
    return agent(
      `Adversarial verifier. Re-compute the finding INDEPENDENTLY and try to break it. Check: (1) retention censoring (no 2025-26 entrants in any rate); (2) n<10 headlines; (3) circularity (restating a scenario/archetype definition); (4) confounds; (5) arithmetic; (6) for case studies, do the cited trajectory numbers (dates, sizes, totals) actually reproduce from sessions_enriched.csv? (7) anonymity (no de-anon attempt).\n\n${DICT}\n\nFINDING [${prev.item.key}]:\nheadline: ${prev.finding.headline}\nmethod: ${prev.finding.method}\nevidence: ${prev.finding.evidence}\nkey_numbers: ${JSON.stringify(prev.finding.key_numbers)}\ncaveats: ${JSON.stringify(prev.finding.caveats)}\n\nReturn verdict. 'confirmed' if it holds; 'qualified' if numbers right but over-stated (give the headline you'd stand behind); 'refuted' if core claim wrong. recomputed = key numbers as YOU got them.`,
      { label:`ver:${prev.item.key}`, phase:'Verify', schema:VERDICT, effort:'high' }
    ).then(v => ({ key:prev.item.key, finding:prev.finding, verdict:v }))
  }
)

const clean = results.filter(Boolean)
log(`investigated+verified ${clean.length}/${QUESTIONS.length}`)
const confirmed = clean.filter(r => r.verdict && r.verdict.verdict !== 'refuted')
log(`${confirmed.length} stand (non-refuted)`)

phase('Synthesize')
const synth = await agent(
  `You are the lead author extending the MathAData typology dashboard with a NEW layer: usage SCENARIOS + individual case studies + sub-cohort tracking. The retention story ('who returns and why') is already done and must NOT be repeated — your job is to add the richer texture of HOW the tool is used, grounded in the findings below. Prefer each verifier's corrected_headline. Be honest about small-n and circularity. Keep everything anonymous (pseudonyms).\n\nFINDINGS:\n${JSON.stringify(clean.map(r => ({ key:r.key, headline:r.finding.headline, verdict:r.verdict.verdict, corrected:r.verdict.corrected_headline, key_numbers:r.finding.key_numbers, evidence:r.finding.evidence, recomputed:r.verdict.recomputed, caveats:r.finding.caveats, surprising:r.finding.surprising })), null, 1)}\n\nReturn the synthesis: a scenario gallery (each scenario: name, one-line definition, who/how, durability, a number), 3-5 written case studies (anonymous, each a short sourced narrative with the key trajectory numbers), sub-cohort findings (Lille, diffusion, entry cohorts), temporal-rhythm insights, and a short list of charts to build (title + what it plots + which numbers).`,
  { label:'synthesize', phase:'Synthesize', schema:{
    type:'object', additionalProperties:false,
    required:['scenario_gallery','case_studies','subcohorts','rhythms','new_questions_answered','suggested_charts'],
    properties:{
      scenario_gallery:{type:'array', items:{type:'object', additionalProperties:false, required:['scenario','definition','who_how','durability','number'], properties:{scenario:{type:'string'}, definition:{type:'string'}, who_how:{type:'string'}, durability:{type:'string'}, number:{type:'string'}}}},
      case_studies:{type:'array', items:{type:'object', additionalProperties:false, required:['pseudo','title','narrative','key_trajectory'], properties:{pseudo:{type:'string'}, title:{type:'string'}, narrative:{type:'string'}, key_trajectory:{type:'string'}}}},
      subcohorts:{type:'array', items:{type:'object', additionalProperties:false, required:['name','finding','numbers'], properties:{name:{type:'string'}, finding:{type:'string'}, numbers:{type:'string'}}}},
      rhythms:{type:'string'},
      new_questions_answered:{type:'array', items:{type:'string'}},
      suggested_charts:{type:'array', items:{type:'object', additionalProperties:false, required:['title','plots','numbers'], properties:{title:{type:'string'}, plots:{type:'string'}, numbers:{type:'string'}}}},
    },
  }, effort:'high' }
)

return { confirmed_count: confirmed.length, total: clean.length,
  findings: clean.map(r => ({ key:r.key, headline:r.finding.headline, verdict:r.verdict.verdict, corrected:r.verdict.corrected_headline, key_numbers:r.finding.key_numbers, evidence:r.finding.evidence, recomputed:r.verdict.recomputed, surprising:r.finding.surprising, caveats:r.finding.caveats, issues:r.verdict.issues })),
  synthesis: synth }
