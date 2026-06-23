# Le pipeline complet, de la notoriete a la classe  [verdict: corrections_mineures]

## Un entonnoir qui se rétrécit fortement à chaque marche

Reconstituer le trajet d'un enseignant — entendre parler de MathAData, créer un compte, se former, tester sur Capytale, puis enseigner à des élèves — fait apparaître un entonnoir net. Le site mathadata.fr compte **2 724 comptes**. La première fuite est immédiate : **1 003 comptes (37 %) restent « newsletter only »**, jamais convertis en compte complet. Restent **1 721 comptes complets (63,2 %)**. Parmi eux, **638 sont formés (23,4 % du total de départ, 37 % des comptes complets)**, **337 ont cliqué vers Capytale (12,4 % du total)**, et côté Capytale **224 enseignants ont effectivement mené le TP devant des élèves** (volet 1), pour **5 854 élèves touchés**. Chaque marche divise grossièrement le flux : la conversion compte→classe de bout en bout est de l'ordre de **8 %**.

Cette lecture « toutes dates » sous-estime cependant l'usage du site, car le tracking des clics et vues de modules ne démarre que le **27 novembre 2025** (garde-fou). Sur la **cohorte trackable** (1 006 comptes créés après cette date), le funnel site est bien plus dense : **66,4 % deviennent actifs**, **57,7 % consultent un module**, **58,4 % téléchargent une ressource** et **27,4 % cliquent vers Capytale** — contre respectivement 46,7 %, 40,3 %, 41,3 % et 19,6 % sur l'ensemble. Le clic Capytale, lui, est largement sous-capturé avant fin novembre : c'est la marche la plus pénalisée par la fenêtre de tracking.

## Intention (site) versus aboutissement (classe) : deux mesures à ne pas confondre

Tout ce qui se passe sur le site relève de l'**intention** (consulter, télécharger, cliquer vers Capytale). L'**usage réel** ne se lit que côté Capytale, et seul le grain établissement (UAI) y est robuste, car l'historique Capytale complet (2023–2026) n'est pas biaisé par la fenêtre de tracking. C'est pourquoi le proxy « arrivé en classe » retenu est *pct_uai_capytale_usage* : la part des comptes (à UAI connu) dont l'établissement présente un usage élève avéré.

Les délais montrent une bascule très rapide quand elle a lieu : la médiane compte→premier module, compte→première ressource et compte→clic Capytale est de **0 jour** (l'action se fait le jour de l'inscription), mais le **9e décile dépasse 170 jours** : soit l'enseignant agit tout de suite, soit il revient seulement à la séquence pédagogique suivante. La séquence compte/formation confirme deux portes d'entrée : sur les dates exploitables, **235 comptes sont créés le jour même de la formation**, **180 après** (la formation a déclenché le compte) et **71 avant** (déjà intéressé, le compte précède la formation).

## L'effet formation : réel sur l'intention, plus net en webinaire sur l'aboutissement

Se former multiplie l'engagement. Les formés cliquent vers Capytale **2,6 fois plus** que les non-formés (**23,5 % contre 9,0 %**) et téléchargent **2,6 fois plus de ressources** (5,28 vs 2,05 clics ressource en moyenne). Surtout, distinguer les types de formation est instructif. Le **présentiel** maximise l'intention immédiate (**26,0 % de clic Capytale**), mais le **webinaire** débouche davantage sur un usage en classe (**31,4 % d'établissements avec usage élève, contre 23,6 % en présentiel** et 17,8 % chez les non-formés) et génère le plus de téléchargements de ressources (**7,04** en moyenne). Lecture prudente : les webinaires touchent souvent des profs déjà motivés et auto-sélectionnés ; le présentiel ratisse plus large (formations d'établissement entières), d'où une dilution. La cohorte des établissements ayant reçu une formation présentielle le confirme : sur **154 établissements**, seuls **27 (17,5 %)** montrent un usage Capytale, et **17 (11 %)** un usage postérieur à la formation.

## La porte Capytale-directe : une part importante échappe au site

Le pipeline n'est pas linéaire. Au grain établissement, sur **174 UAI** ayant un usage Capytale enseignant, **77 (44,3 %) n'ont aucun compte site déclarant cet UAI** : ce sont des entrées « Capytale-directes », via l'ENT, sans passer par mathadata.fr (borne basse, car un prof peut avoir un compte sans renseigner l'UAI). À l'inverse, sur **618 UAI déclarés côté site, 82,7 % n'ont aucune empreinte Capytale élève** : l'intention site ne se transforme pas en classe pour la grande majorité. L'activité « Équation réduite » (3515488), pivot des formations, est la plus cliquée (122 utilisateurs), devant la vitrine « Stat classification » (116) — signature claire d'un funnel piloté par la formation plus que par la découverte spontanée.

## KEY STATS
- Conversion compte→classe (bout-en-bout): ~8 %  (; src: 224 enseignants ayant enseigné (facts_teachers.json) / 2724 comptes (facts_cross.overview). 224/2724=8,2%)
- Comptes restés newsletter-only (1re fuite): 1 003 / 2 724 (37 %)  (; src: facts_cross.overview.newsletter_only / accounts_total)
- Comptes complets → formés: 638 / 1 721 (37,1 %)  (; src: facts_cross.overview.formed_total / full_accounts)
- Clic Capytale, cohorte trackable vs toutes dates: 27,4 % vs 19,6 %  (; src: facts_cross.site_funnel.trackable_cohort.capytale_rate vs all_full_accounts.capytale_rate ; tracking depuis 2025-11-27)
- Lift formation sur le clic Capytale: x2,6 (23,5 % vs 9,0 %)  (; src: facts_cross.formation_effect : forme_all.pct_clicked_cap / nouveau.pct_clicked_cap = 23,5/9,0)
- Aboutissement en classe : webinaire > présentiel: 31,4 % vs 23,6 % (vs 17,8 % non-formés)  (; src: facts_cross.formation_effect.*.pct_uai_capytale_usage (proxy UAI usage élève, historique Capytale complet))
- Médiane compte→1re action: 0 jour (P90 > 170 j)  (; src: facts_cross.delays_days : to_module/to_resource/to_capytale p50=0, p90 174-195 j)
- Entrées Capytale-directes (sans compte site): 77 / 174 UAI (44,3 %)  (; src: facts_cross.two_doors : capytale_uai_no_site_account / capytale_uai_teach)
- UAI site sans empreinte classe Capytale: 511 / 618 (82,7 %)  (; src: facts_cross.two_doors : site_uai_no_capytale_footprint / site_uai_total)
- Établissements formés en présentiel avec usage Capytale: 27 / 154 (17,5 %) ; 17 postérieurs (11 %)  (; src: facts_cross.presentiel_etabs)

## CASE STUDIES
### La porte du site puis la classe (présentiel, Lattes)
Compte site formé en présentiel (académie de Montpellier, lycée polyvalent à Lattes, UAI 0341794R) apparié avec confiance élevée à un compte Capytale enseignant. Trajet complet observé : compte → formation présentielle → clic vers Capytale → usage élève dans l'établissement. Cas-type du pipeline « par le site » qui aboutit en classe.

### La porte Capytale-directe (Lyon 2e)
Établissement de l'académie de Lyon (lycée général et technologique, UAI 0690023A) avec usage Capytale enseignant avéré, mais dont le compte site associé est de statut « nouveau » (non formé). Illustre les 44 % d'UAI qui arrivent à l'usage par l'ENT/Capytale sans s'appuyer sur la formation — pipeline court-circuité.

### Cohorte de formation à fort taux d'aboutissement (janv. 2025, webinaire)
Cohorte webinaire de janvier 2025 : 37 formés, 19 à UAI connu, dont 7 établissements (36,8 %) avec usage élève et 10 clics Capytale. Contraste avec la cohorte présentielle de sept. 2025 (53 formés, 0 établissement avec usage observé) : le présentiel de masse en rentrée se traduit moins vite en classe que le webinaire auto-sélectionné.

## CHART SPECS
- [funnel] Entonnoir complet : de la notoriété à la classe (toutes dates): [{"etape":"Comptes créés","n":2724,"pct_total":100.0},{"etape":"Comptes complets","n":1721,"pct_total":63.2},{"etape":"Formés","n":638,"pct_total":23.4},{"etape":"Clic vers Capytale","n":337,"pct_total":12.4},{"etape":"Ont enseigné (Capytale, v1)","n":224,"pct_total":8.2}]
- [grouped] Effet formation par type : intention (clic Capytale) vs aboutissement (usage classe UAI): [{"groupe":"Non formés","clic_capytale_pct":9.0,"usage_classe_uai_pct":17.8},{"groupe":"Formés présentiel","clic_capytale_pct":26.0,"usage_classe_uai_pct":23.6},{"groupe":"Formés webinaire","clic_capytale_pct":20.4,"usage_classe_uai_pct":31.4}]
- [grouped] Funnel site : cohorte trackable (post-27/11) vs toutes dates: [{"etape":"Actif","toutes_dates_pct":46.7,"trackable_pct":66.4},{"etape":"Module vu","toutes_dates_pct":40.3,"trackable_pct":57.7},{"etape":"Ressource téléchargée","toutes_dates_pct":41.3,"trackable_pct":58.4},{"etape":"Clic Capytale","toutes_dates_pct":19.6,"trackable_pct":27.4}]

## CORRECTIONS (verif)
- INCOHERENCE ARITHMETIQUE sur 'Comptes complets -> formés = 638/1721 (37,1%)'. Le numérateur 638 (statut forme/mentor) inclut 188 comptes flaggés newsletter_only=true, qui sont DANS le bucket des 1003 newsletter-only, PAS dans les 1721 comptes complets. Seuls 450 des 638 formés sont des comptes complets. Le ratio 638/1721 mélange donc un numérateur partiellement hors-denominateur. Chiffres propres : formés parmi comptes complets = 450/1721 = 26,1% ; ou formés / total = 638/2724 = 23,4%. Le '37% des comptes complets' du funnel est invalide ; le '23,4% du total' est correct. La même incohérence affecte la narration de l'entonnoir (1003 fuite -> 1721 -> 638 formés double-compte 188 personnes).
- INCOHERENCE INTERNE dans two_doors (non chiffrée comme erreur mais à signaler) : la moitié 'Capytale-direct' utilise comme empreinte Capytale les 174 UAI distincts de uai_teach, tandis que la moitié 'site sans empreinte' utilise une empreinte plus large (279 UAI = tout UAI apparaissant côté Capytale, teach OU él). Chaque chiffre publié se reproduit isolément, mais les deux portes ne reposent pas sur la même définition d'empreinte, ce qui nuit à la comparabilité.
- NUANCE sur le total 2724 : le README indique 9 comptes exclude_from_analytics à exclure. facts_cross et toutes les affirmations utilisent 2724 (sans exclusion). Impact négligeable sur les taux mais à harmoniser.
- PRECISION 'clicked_capytale=337' : la valeur dépend de la définition (events resourceType=capytale=306 ; events url~capytale=325 ; rss capytale=341 ; union events+rss=360). La table de travail fige 337 via une définition intermédiaire non documentée. Tous les chiffres restent dans la fourchette ~19-21% ; le 19,6% publié est défendable mais la définition mériterait d'être explicitée.
## FLAGS
- Garde-fou tracking : clics/modules/clics-Capytale captés seulement depuis le 27 nov 2025. Les taux 'toutes dates' du funnel site sous-estiment l'usage des comptes antérieurs ; la cohorte trackable (post-27/11, n=1006) est la mesure propre. Le clic Capytale est la marche la plus pénalisée.
- La marche '224 ont enseigné / 5854 élèves' provient du volet 1 (côté Capytale, anonyme) et N'EST PAS un sous-ensemble strict des 337 cliqueurs site : les deux mondes n'ont pas d'identifiant commun. La conversion bout-en-bout ~8% (224/2724) mélange donc deux sources et est une approximation de cadrage, pas un chaînage individuel.
- Appariement individuel site↔Capytale inféré (UAI+activité+timing) et partiel : 46 matches validés, dont seulement 16,4% des cliqueurs site à UAI connu appariés (match_validation.json). Les études de cas individuelles sont à confiance signalée ; privilégier le grain établissement et cohorte.
- two_doors borne basse : 'Capytale-direct' (77 UAI sans compte site) surestime potentiellement la porte directe car un prof peut avoir un compte sans déclarer son UAI. Inversement les 82,7% d'UAI site sans empreinte peuvent masquer un usage sous un autre UAI.
- Effet formation possiblement confondu par auto-sélection : les inscrits webinaire sont souvent déjà motivés, le présentiel ratisse des établissements entiers (dilution). Le différentiel webinaire>présentiel sur l'aboutissement classe est un signal, pas une preuve causale.
- Sentinelle bidon de date de formation ('1984-01-01') et 152 comptes sans date propre dans la séquence compte/formation : les sous-totaux same_day/before/after portent sur les dates exploitables uniquement.
- Comptes à exclure déjà retirés en amont (démo c81e728d, exclude_from_analytics=9) selon la méthodo ; non re-vérifié dans ce recalcul.