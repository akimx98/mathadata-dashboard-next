# Les deux portes : site-first vs Capytale-direct  [verdict: solide]

## Deux populations qui ne se recouvrent presque pas

Le rapprochement site / Capytale au grain etablissement (UAI) revele deux mondes largement disjoints. Sur les **174 etablissements** ayant un usage classe Capytale documente (grain `uai_teach`), **97 (55,7 %)** abritent au moins un compte site declarant ce meme UAI, mais **77 (44,3 %)** n'en ont aucun : c'est la porte **Capytale-direct**. Symetriquement, sur les **618 etablissements** representes par un compte site, seuls **107 (17,3 %)** laissent une trace Capytale, et **511 (82,7 %)** n'en laissent aucune : c'est la porte **site-only**. Les deux chiffres collent exactement a `facts_cross.json`. Ces populations ne se contredisent pas : ce sont les deux extremites d'un meme tuyau ou peu de profs sont visibles des deux cotes a la fois.

### La porte Capytale-directe : l'empreinte de l'ancienne activite Intro-IA

La signature de cette population est nette. L'activite **Intro a l'IA (2548348)**, absente du site (2 clics seulement, cf. `capytale_clicks_by_activity`), est presente dans **42 des 77** etablissements Capytale-directs et constitue la **seule** activite dans 28 d'entre eux. Elle rassemble **983 eleves** de cette porte. Or sur le site, plus personne ne la trouve : c'est donc un marqueur quasi-pur d'entree par Capytale, souvent par bouche-a-oreille ou par le catalogue Capytale lui-meme, en contournant mathadata.fr. Les plus grosses classes directes confirment le motif : un etablissement de Polynesie (76 eleves), un autre de l'academie de Lille (60 eleves, deux annees), tous centres sur l'Intro-IA et/ou la Stat classification. Cette porte est aussi plus **ancienne et plus petite** par UAI : 34 des 77 etablissements n'ont aucun usage en 2025-2026 (usage purement historique 2023-2025), et la classe moyenne y est de **19,0 eleves** contre **35,7** pour les etablissements presents des deux cotes. Autrement dit, la porte Capytale-directe capte un heritage : des profs precurseurs entres avant l'essor du site, dont une part s'est essoufflee.

### La porte site-only : un reservoir tres recent, pas encore arrive en classe

Les 511 etablissements site-only ne sont pas un cimetiere de comptes inertes : ils sont surtout **trop neufs pour avoir deja deploye**. **380 sur 511 (74 %)** ont leur compte le plus recent date de 2026, et cote formation, **142 des 159** etablissements site-only formes l'ont ete en 2026 (pics janvier, mars, juin). Le signal d'intention est fort : **148** de ces etablissements comptent au moins un compte ayant **clique vers Capytale depuis le site** sans qu'on retrouve la classe correspondante, et **379** sont actifs sur le site. Le delai mediane site -> classe etant nul mais le p90 a ~174 jours (`delays_days`), une fraction substantielle de ces 511 est en sursis de deploiement plutot qu'en abandon. La composition reste massivement metropolitaine (0 hors_lycee, 0 etranger dans le sous-ensemble a UAI valide), **339 lycees / 124 colleges**, IPS moyen **111,0** strictement comparable aux etablissements actifs des deux cotes (**111,6**) : la non-conversion n'est donc pas un effet de milieu social. Les formes representent **181 / 511** (35 %), les nouveaux **330** : beaucoup de comptes spontanes n'ayant pas encore franchi le pas, et une cohorte formee recente qui n'a pas eu le temps.

### Bornes des deux portes

Capytale-direct est une **borne basse** a 77 : un prof peut avoir un compte sans declarer son UAI. En elargissant au grain `uai_el` (etablissements eleves), la porte directe monte a **166 UAI**, borne haute. Site-only est borne haute a 511 sous l'hypothese que l'absence de trace = absence d'usage ; mais les **46 appariements infères** (`match_validation`, dont 29 de confiance A) montrent que des liens existent sous le radar : la part reellement « jamais arrivee en classe » est inferieure a 511. Aucun des 77 UAI directs n'apparait dans les appariements, ce qui renforce leur statut de vraie porte alternative.

## KEY STATS
- Etablissements Capytale-direct (usage classe, aucun compte site): 77 / 174 (44,3 %)  (Borne basse : un prof peut avoir un compte sans declarer son UAI; src: capytale_by_uai_teach moins UAI declares dans payload_users_work ; identique a facts_cross.two_doors.pct_capytale_direct)
- Etablissements site-only (compte site, aucune trace Capytale): 511 / 618 (82,7 %)  (Borne haute : 46 appariements infères montrent des liens caches; src: UAI site moins (uai_teach union uai_el) ; identique a facts_cross.two_doors.pct_site_uai_no_footprint)
- Intro-IA (act 2548348) dans la porte directe: 42 UAI sur 77, dont 28 exclusivement  (Activite hors-site (2 clics site) : marqueur de la porte Capytale-directe; src: comptage des activites parsees dans capytale_by_uai_teach.acts sur l ensemble direct)
- Eleves rattaches a l Intro-IA dans la porte directe: 983 eleves  (Heritage d entree pre-site; src: somme n_pupils des UAI directs touchant 2548348)
- Site-only au compte le plus recent date de 2026: 380 / 511 (74 %)  (Non-conversion majoritairement = pas eu le temps, pas abandon; src: max(acct_month) >= 2026-01 par UAI dans payload_users_work)
- Etablissements site-only formes, dont en 2026: 159 formes, 142 en 2026  (Cohorte formee trop recente pour avoir deploye; src: is_formed=True et fmonth par UAI site-only)
- Site-only avec clic Capytale depuis le site (intention, classe non retrouvee): 148 / 511  (Signal d intention fort, deploiement en sursis; src: clicked_cap=True par UAI site-only dans payload_users_work)
- Taille de classe moyenne : directe vs deux-cotes: 19,0 vs 35,7 eleves  (La porte directe agrege des usages plus petits et plus anciens; src: n_pupils moyen sur 77 directs (1460 el.) vs 97 mixtes (3465 el.))
- IPS moyen : site-only vs actifs deux-cotes: 111,0 vs 111,6  (La non-conversion n est pas un effet de milieu social; src: moyenne etab_ips par UAI (436 vs 105 valeurs))
- Borne haute porte directe (grain eleves uai_el): 166 UAI  (Encadrement 77 (basse) - 166 (haute); src: uai_el moins UAI declares site)

## CASE STUDIES
### Porte directe historique — Intro-IA seule, academie de Lille
Etablissement de l academie de Lille (UAI 0590011S) : 60 eleves repartis sur deux annees scolaires (2024-2025 et 2025-2026), premiere seance des decembre 2024, uniquement sur Intro a l IA (2548348) puis Stat classification. Aucun compte mathadata.fr ne declare cet etablissement. Profil type d entree par Capytale, en amont de l essor du site, qui dure dans le temps sans passer par la porte web.

### Porte directe outre-mer — Polynesie
Etablissement de Polynesie francaise (UAI 9840002E) : 76 eleves, premiere seance juin 2025, trois activites (Intro-IA, Equation reduite, Stat classification). Aucune trace site. Coherent avec la geographie : la Polynesie affiche 139 eleves Capytale pour seulement 3 comptes site (facts_cross.geography), academie ou la porte directe domine nettement.

### Site-first avere — lycee de Calais (forme webinaire)
Lycee polyvalent de Calais, academie de Lille (compte S0022, forme par webinaire). Appariement de confiance A : compte site puis classe Capytale tres etoffee (277 eleves, six activites des fevrier 2025, dont Intro-IA, Equation reduite, Stat classification, Produit scalaire). Illustre le pipeline complet site -> formation -> deploiement large et diversifie.

### Site-only recent en sursis — nouveau compte 2026
Parmi les 511 site-only, profil dominant : compte cree en 2026, actif sur le site (consultation de modules et de ressources), au moins un clic vers Capytale, mais aucune classe Capytale encore retrouvee. Avec un delai p90 site->classe de ~174 jours, ces etablissements relevent du deploiement differe plutot que de l abandon.

## CHART SPECS
- [funnel] Les deux portes au grain etablissement: [{"label":"Capytale usage classe (uai_teach)","total":174,"avec_compte_site":97,"sans_compte_site_DIRECT":77},{"label":"Comptes site (UAI)","total":618,"avec_classe_capytale":107,"sans_classe_SITE_ONLY":511}]
- [hbars] Activites de la porte Capytale-directe (nb d etablissements, 77 UAI): [{"act":"Intro IA (hors-site)","uai":42},{"act":"Stat classification","uai":21},{"act":"Equation reduite","uai":15},{"act":"Challenge IA","uai":8},{"act":"Stat sante foetus","uai":5},{"act":"Droite produit scalaire","uai":4},{"act":"Geometrie reperee","uai":2},{"act":"Challenge BTS/NSI","uai":2}]
- [bars] Anatomie des 511 site-only : pourquoi pas encore en classe: [{"segment":"Compte le plus recent en 2026","uai":380},{"segment":"Actifs sur le site","uai":379},{"segment":"Nouveaux (non formes)","uai":330},{"segment":"Formes","uai":181},{"segment":"Clic Capytale depuis le site (intention)","uai":148},{"segment":"Formes en 2026","uai":142}]

## CORRECTIONS (verif)
- facts_cross.json (champ two_doors.site_uai_with_capytale_usage = 93) est incoherent : 511 + 93 = 604 != 618. La valeur correcte est 107 (511 + 107 = 618), que la prose emploie d ailleurs. A corriger dans facts_cross.json ; le pourcentage 82,7 % et l affirmation #2 restent justes.
- Libelle de l affirmation #4 a preciser : les 983 sont les eleves (distincts) des 42 etablissements directs touchant l Intro-IA, et non les eleves de l activite Intro-IA elle-meme (qui sont 697). Reformuler en 'eleves des etablissements dont l Intro-IA est presente' pour eviter la sur-lecture.
## FLAGS
- Les deux portes sont calculees au grain ETABLISSEMENT (UAI), robuste ; le grain individuel reste infere et n est pas utilise pour les comptages principaux.
- Capytale-direct=77 est une BORNE BASSE (un prof peut avoir un compte sans declarer son UAI). Borne haute 166 au grain uai_el. Ecart a interpreter comme une fourchette, pas une valeur unique.
- Site-only=511 est une BORNE HAUTE : 46 appariements infères (dont 29 confiance A) prouvent l existence de liens site-classe non visibles dans les UAI declares ; la vraie non-conversion est inferieure.
- La recence du site-only (380/511 en 2026, 148 clics Capytale sans classe) reflete en partie la fenetre de tracking ouverte le 27 nov 2025 : l intention cliquee est sur-representee pour les comptes recents et sous-capturee avant. Le statut etablissement (usage Capytale historique 2023-2026) n est lui PAS biaise.
- L activite Intro-IA (2548348) est hors-site : son abondance cote Capytale et son absence cote site (2 clics) la rendent diagnostique de la porte directe, mais elle ne peut pas servir de pont site->Capytale.
- Comptes a exclure (demo c81e728d, hub fondateur Haubourdin cfcd2084, exclude_from_analytics) deja traites en amont dans les tables sources ; non re-verifie ici.