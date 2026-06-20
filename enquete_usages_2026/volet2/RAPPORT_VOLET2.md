# Du site à la classe

### Reconstituer le pipeline enseignant de MathAData (mathadata.fr × Capytale) et mesurer l'effet des formations

*Volet 2 de l'enquête usages — extraction du 20 juin 2026. Croise le parcours amont nominatif (mathadata.fr, snapshot Payload) avec l'usage en classe anonyme (Capytale, déjà analysé au Volet 1). Tous les chiffres sont calculés depuis `facts_cross.json` (source de vérité du croisement), `facts.json` / `facts_teachers.json` (Volet 1, historique Capytale complet 2023-2026) et la table de travail des comptes site (PII exclue). Chaque affirmation a fait l'objet d'un recalcul indépendant (vérification adversariale) ; les corrections retenues et les limites sont consolidées en fin de document.*

---

## Note de lecture (à lire avant les chiffres)

Quatre garde-fous conditionnent toute interprétation :

1. **Deux mondes sans clé commune.** Les comptes Capytale sont des identifiants ENT anonymisés ; les comptes mathadata.fr sont nominatifs. Le seul lien direct est **le pont des clics** : un lien `capytale2.ac-paris.fr/web/b/<id>` cliqué sur le site correspond exactement à l'activité Capytale `mathadata_id=<id>`. Mais ce lien s'arrête au clic — le clonage ENT en aval reste anonyme. **L'appariement individuel est donc inféré** (UAI + activité + timing), partiel, et réservé au bonus §8. Les conclusions robustes sont au grain **établissement (UAI)** et **cohorte de formation**.

2. **Deux horloges décalées d'un trimestre.** Les *inscriptions* suivent les temps forts de communication (pic d'hiver) ; l'*usage en classe* suit le calendrier pédagogique (pic de printemps). Ne jamais lire une cohorte récente comme un échec : elle n'a pas encore eu son créneau de déploiement.

3. **Fenêtre de tracking ouverte le 27 novembre 2025.** Les clics, vues de module et téléchargements ne sont captés qu'à partir de cette date. Tout taux d'« activité site » ou de « clic Capytale » sur les comptes antérieurs est **sous-capturé, pas absent**. Le funnel site propre se lit sur la **cohorte trackable** (comptes créés après le 27 nov.). En revanche, la conversion au grain établissement s'appuie sur l'**historique Capytale complet 2023-2026** et n'est, elle, **pas biaisée** : c'est le socle de toute affirmation « jusqu'à la classe ».

4. **« Intention » (site) ≠ « aboutissement » (classe).** Tout ce qui se passe sur le site — consulter, télécharger, cliquer vers Capytale — est de l'intention. L'usage réel ne se lit que côté Capytale, au grain établissement.

> *Convention : 9 comptes `exclude_from_analytics` et le compte démo Capytale sont exclus ; le hub fondateur de Haubourdin (compte « 0 », 404 élèves) est isolé comme nœud historique, pas comme prof local. Population : **2 715 comptes site**.*

---

## 1. Résumé exécutif

- **Un entonnoir qui se rétrécit à chaque marche.** De **2 715 comptes**, **1 003 (37 %) restent « newsletter only »** et ne deviennent jamais comptes complets ; il reste **1 712 comptes complets**. **631 sont formés** (23 % du total), **337 (12 %) cliquent un jour vers Capytale**, et côté Capytale **224 enseignants** mènent réellement le TP devant des élèves (Volet 1), pour **5 854 élèves**. La conversion compte→classe de bout en bout est de l'ordre de **8 %**. La déperdition n'est pas à l'acquisition : elle est tout en bas, au passage en classe.

- **Le funnel vrai est plus dense que le funnel « toutes dates ».** Sur la cohorte trackable (post-27 nov., 1 003 comptes), **66 % deviennent actifs, 58 % consultent un module, 58 % téléchargent une ressource, 27 % cliquent vers Capytale** — contre 47 / 40 / 41 / 20 % toutes dates. Le clic Capytale est la marche la plus pénalisée par la fenêtre de tracking.

- **Se former double l'intention.** Les formés cliquent vers Capytale **2,6× plus** que les non-formés (**23,5 % vs 9,0 %**) et téléchargent **2,6× plus de ressources** (5,3 vs 2,1 clics/personne). Effet réel — mais mêlé de **récence** et d'**endogénéité** (on forme des profs et des établissements déjà acquis).

- **Présentiel et webinaire ne convertissent pas au même endroit.** Le **présentiel** maximise l'entrée dans l'outil (**26 % de clic Capytale, 45 % d'actifs**) ; le **webinaire** maximise l'aboutissement en classe (**31 % d'établissements à usage élève effectif, contre 24 % en présentiel et 18 % chez les non-formés**) et l'approfondissement (**22 ressources/personne** chez ses consultants, vs 11 en présentiel). Le présentiel amorce large, le webinaire approfondit un noyau auto-sélectionné.

- **L'endogénéité du présentiel est mesurable.** Sur **152 établissements** formés en présentiel, seuls **26 (17 %)** montrent un usage Capytale et **17 (11 %)** un usage *postérieur* à la formation. Et **10 des 27 établissements à usage utilisaient déjà Capytale avant** la formation : une partie du « rendement » présentiel est un terrain déjà conquis. Quand l'usage suit, il vient vite (**médiane ≈ 2 semaines**) : le présentiel déclenche un test rapide, ou rien.

- **Deux portes d'entrée disjointes.** Sur **174 établissements** à usage classe Capytale, **77 (44 %) n'ont aucun compte site** déclarant cet UAI : entrées **Capytale-directes**, via l'ENT, contournant le site (borne basse ; borne haute 166). Symétriquement, sur **616 établissements** présents côté site, **509 (83 %) n'ont aucune empreinte classe Capytale**. Les deux populations se recouvrent peu.

- **La porte Capytale-directe est un héritage pré-site.** L'activité **Intro à l'IA**, absente du site (3 clics), marque **42 des 77 UAI directs** (seule activité dans 28). Ces établissements sont plus **anciens et plus petits** (19 élèves/UAI vs 36 pour les UAI présents des deux côtés) ; 34 sur 77 n'ont aucun usage en 2025-2026. C'est la trace des profs précurseurs entrés avant l'essor du site.

- **Le réservoir site-only est un sursis, pas un cimetière.** **380 des 509 UAI site-only (75 %)** ont leur compte le plus récent daté de 2026 ; **142 des 159** établissements site-only formés l'ont été en 2026 ; **148** comptent un compte ayant cliqué vers Capytale sans classe retrouvée. L'IPS moyen (111) est identique à celui des UAI actifs des deux côtés (112) : **la non-conversion n'est pas un effet de milieu social, mais de temps.**

- **La conversion « jusqu'à la classe » se lit en trimestres.** Les cohortes **mûres** (formées avant déc. 2025) convertissent à **46 %** d'établissements à usage élève, contre **22 %** pour les cohortes récentes (2026). Ces dernières remonteront mécaniquement à la rentrée.

- **Croissance par recrutement, pas (encore) par fidélisation.** Rétention prof 2024-25 → 2025-26 de **29,5 %** ; **81,5 % des enseignants 2025-26 sont nouveaux** ; 192 profs n'ont enseigné qu'une seule année (28 deux ans, 4 trois ans). La prochaine bataille est la ré-utilisation en année N+1, mieux portée par l'établissement que par l'individu.

- **L'acquisition est massivement organique, l'emailing entretient.** **66,7 % des sessions référencées** viennent d'un moteur de recherche (Google en tête) ; les campagnes Brevo ne pèsent que **6,1 %** des sessions (canal de relance, pas d'acquisition). Le flux inverse **Capytale → site** (30 utilisateurs) est la signature visible de la porte directe.

- **L'usage se concentre là où la notoriété est diffuse.** La marque rayonne nationalement (Versailles 168 comptes, Lille 151, Paris 141), mais **Lille capte 26 % des élèves Capytale** localisés. Former beaucoup ne garantit pas l'usage : **Montpellier** a le plus gros contingent de formés (79) pour seulement **3,9 élèves/formé**, cinq fois moins que Lille (20,2). Ce qui compte n'est pas le nombre de formés, mais qu'un établissement bascule.

---

## 2. Le pipeline complet, de la notoriété à la classe

Reconstituer le trajet — entendre parler de MathAData, créer un compte, se former, tester sur Capytale, enseigner — fait apparaître un entonnoir net. mathadata.fr compte **2 715 comptes**. La **première fuite est immédiate** : 1 003 (37 %) restent « newsletter only », jamais convertis en compte complet. Restent **1 712 comptes complets**. Sur l'ensemble, **631 sont formés** (23 % du total) — dont 443 sont des comptes complets et 188 restés au statut newsletter-only ; on ne chaîne donc pas naïvement 1 712 → 631 (ce serait double-compter 188 personnes). **337 comptes (12 %) ont cliqué vers Capytale** ; et côté Capytale, **224 enseignants** ont mené le TP devant des élèves (Volet 1), pour **5 854 élèves**. Chaque marche divise grossièrement le flux : **conversion compte→classe de bout en bout ≈ 8 %**.

Cette lecture « toutes dates » sous-estime le site, car le tracking ne démarre que le 27 novembre 2025. Sur la **cohorte trackable** (1 003 comptes), le funnel est bien plus dense : **66 % actifs, 58 % module vu, 59 % ressource téléchargée, 27 % clic Capytale** — contre 47 / 40 / 41 / 20 % sur l'ensemble. Le clic Capytale est la marche la plus pénalisée par la fenêtre.

Les **délais** montrent une bascule très rapide quand elle a lieu : médiane compte→première action (module, ressource, clic Capytale) de **0 jour** (l'action se fait le jour de l'inscription), mais 9ᵉ décile au-delà de **170 jours** : soit l'enseignant agit tout de suite, soit il revient à la séquence pédagogique suivante. La séquence compte/formation confirme deux portes temporelles : ~**206 comptes créés le jour même de la formation** (dont **90 % en présentiel** — le formateur fait créer le compte séance tenante), ~**185 après**, ~**95 avant** (déjà intéressé). *(Les sous-totaux varient de ±15 selon la convention de comptage au jour ou à la minute ; la part « présentiel le jour même » est, elle, robuste à 186/206.)*

| Marche de l'entonnoir | Effectif | % du total |
|---|---:|---:|
| Comptes créés | 2 715 | 100 % |
| Comptes complets | 1 712 | 63 % |
| Formés | 631 | 23 % |
| Ont cliqué vers Capytale | 337 | 12 % |
| Ont enseigné à des élèves *(Capytale, V1)* | 224 | 8 % |
| Élèves touchés *(Capytale, V1)* | 5 854 | — |

---

## 3. Effet des formations sur l'usage (présentiel vs webinaire)

C'est le cœur analytique. Les comptes formés se distinguent fortement sur tous les indicateurs : 9,0 % de clic Capytale et 26,0 % d'activité site chez les non-formés ; **23,5 %** et **41,1 %** chez les formés — un facteur **2,6** sur le clic. Mais cet écart mêle effet causal, **récence** (formés sur-représentés dans la fenêtre de tracking) et **endogénéité** (on forme des acquis).

**Le présentiel convertit vers le clic, le webinaire vers l'engagement profond.** Le présentiel domine l'entrée dans l'outil (**26,0 % de clic, 45 % d'actifs**, contre 20,4 % et 36 % en webinaire). Mais le webinaire produit un usage bien plus intense côté ressources : **7,0 clics/personne contre 4,0**, et **22 ressources distinctes en moyenne chez ses consultants contre 11 en présentiel**. Cohérent avec son recrutement : seuls **38 % des webinaire déclarent un UAI contre 59 % en présentiel** — le webinaire agrège des individus isolés et motivés, le présentiel des établissements ciblés.

**L'aboutissement « jusqu'à la classe » inverse le classement** — et c'est l'indicateur le plus robuste, fondé sur l'historique Capytale complet : **31,4 % des webinaire** (à UAI connu) sont dans un établissement à usage élève effectif, contre **23,6 % en présentiel** et **17,8 % non-formés**. Le webinaire, en sélectionnant des profs déjà engagés, atterrit plus souvent là où des élèves utilisent réellement le TP. *(« Usage élève effectif » = au moins une vraie classe — au moins un élève `role=student` — pas un usage intense.)*

**L'endogénéité du présentiel est substantielle.** Sur **152 établissements** formés en présentiel, **26 (17 %)** ont un usage Capytale et **17 (11 %)** un usage *postérieur* à la formation. Surtout, **10 des 27 établissements à usage utilisaient déjà Capytale avant** : le présentiel est partiellement alloué à des terrains déjà conquis, ce qui gonfle le taux brut. Quand l'usage suit, il vient vite : **délai médian ≈ 2 semaines** entre la formation et la première séance.

**Lecture honnête du rendement.** Le présentiel est l'outil d'**amorçage** (large couverture, conversion rapide ou nulle, un tiers de l'effet affiché = auto-sélection, rendement classe modeste à 11 %). Le webinaire est l'outil d'**approfondissement** (rate la marge des indécis, mais ceux qu'il touche vont le plus loin). Les deux sont **complémentaires, pas substituables**. Une part de l'avantage « classe » du webinaire tient aussi à ce que ses gros bataillons (janv.-nov. 2025) ont eu le temps de déployer, là où le présentiel récent (pics 2026) n'a pas encore eu son créneau — un effet de maturité, pas seulement de format.

| | Non-formés | Présentiel | Webinaire |
|---|---:|---:|---:|
| Effectif | 2 084 | 364 | 266 |
| % clic Capytale *(intention, biaisé tracking)* | 9,0 | 26,0 | 20,4 |
| % actifs sur le site | 26,0 | 45 | 36 |
| % établissement à usage élève *(robuste)* | 17,8 | 23,6 | **31,4** |
| Ressources/personne *(moyenne)* | 2,1 | 4,0 | **7,0** |
| Déclaration d'UAI | — | 59 % | 38 % |

---

## 4. Temporalité, cohortes et rétention

**Deux saisonnalités.** Les *inscriptions* explosent en janvier 2026 (**975 comptes** sur le seul mois, dont 784 newsletter-only) ; l'*usage en classe* suit le calendrier pédagogique — séances Capytale au pic en **mai (70) et mars (51)**, creux total l'été (août nul, septembre 3), concentrées en milieu de semaine. Le TP MathAData est un objet de fin d'année scolaire, déployé une fois le programme avancé. Le « creux » de conversion des cohortes 2026 et le pic d'inscriptions hivernal sont **le même phénomène vu de deux bouts**.

**La conversion se mesure en trimestres.** Les cohortes **mûres** (formées avant déc. 2025, > 6 mois de recul) convertissent à **46,5 %** d'établissements à usage élève ; les cohortes **récentes** (2026) à **22,0 %** seulement. Les promotions 2026-03/04/06 affichent des taux planchers (3-5 %) qui remonteront mécaniquement à la rentrée. À l'autre bout, la cohorte présentiel mûre d'octobre 2024 (40 profs, > 18 mois de recul) convertit à **66,7 %** : c'est l'étalon pour projeter les cohortes immatures.

**La rétention est la vraie réserve de croissance.** La trajectoire d'usage est ascendante — **146 → 1 943 → 3 783 élèves distincts** par année scolaire (forte montée initiale puis doublement). Mais la fidélisation pluriannuelle reste fragile : **192 profs n'ont enseigné qu'une seule année** (28 deux ans, 4 trois ans), rétention prof 2024-25 → 2025-26 de **29,5 %**, et **81,5 % des enseignants 2025-26 sont nouveaux**. Le dispositif croît par recrutement. Signal positif : les profs qui restent **diversifient** (le hub de Haubourdin couvre 7 activités sur 3 ans ; Géométrie repérée passe de 2 à 400 élèves en un an). La rétention au grain **établissement** est plus solide que la rétention prof — l'usage migre entre collègues d'un même UAI. *(La rétention prof anonyme sous-estime la continuité : un changement de compte ENT apparaît comme un nouveau prof.)*

---

## 5. Les deux portes : site-first vs Capytale-direct

Le rapprochement au grain établissement révèle deux mondes largement disjoints. Sur **174 établissements** à usage classe Capytale (`uai_teach`), **97 (56 %)** abritent un compte site déclarant le même UAI, **77 (44 %)** n'en ont aucun : la **porte Capytale-directe**. Symétriquement, sur **616 établissements** côté site, **107 (17 %)** laissent une trace Capytale, **509 (83 %)** aucune : la **porte site-only**. (511+107 = 618 dans les chiffres bruts ; 509+107 = 616 après exclusion des 9 comptes test.)

**La porte Capytale-directe = l'empreinte de l'ancienne Intro-IA.** Cette activité, absente du site (3 clics), est présente dans **42 des 77** UAI directs (seule activité dans 28). Ces établissements sont plus **anciens et plus petits** : 34 sur 77 n'ont aucun usage en 2025-2026, classe moyenne **19 élèves** contre **36** pour les UAI présents des deux côtés. La porte directe capte un **héritage** : profs précurseurs entrés par le catalogue Capytale ou le bouche-à-oreille, avant l'essor du site, dont une part s'est essoufflée. Borne basse 77 (grain `uai_teach`), borne haute **166** (grain `uai_el`).

**La porte site-only = un réservoir très récent, en sursis de déploiement.** **380 des 509 (75 %)** ont leur compte le plus récent en 2026 ; **142 des 159** établissements site-only formés l'ont été en 2026 ; **148** comptent un compte ayant cliqué vers Capytale sans classe retrouvée ; **379** sont actifs sur le site. Composition métropolitaine, **339 lycées / 124 collèges**, IPS moyen **111** identique aux actifs des deux côtés (112) : **la non-conversion n'est pas un effet de milieu social, mais de temps.** Borne haute 509 : les 46 appariements inférés prouvent des liens cachés sous le radar — la part « jamais arrivée en classe » est inférieure.

---

## 6. Géographie croisée et canaux de découverte

**Une notoriété diffuse, un usage concentré.** Les comptes site se répartissent assez uniformément (Versailles 168, Lille 151, Paris 141, Montpellier 114) ; les ~5 081 élèves Capytale rattachés à une académie sont, eux, **fortement concentrés** : Lille en capte **26 %**, le trio Lille-Versailles-Paris **47 %**. Le ratio **élèves par enseignant formé** révèle un écart d'un facteur dix : Créteil 23,7, Toulouse 22,4, **Lille 20,2** à un extrême ; **Montpellier 3,9** (79 formés, 307 élèves), Dijon 3,9, Aix-Marseille 2,0, Rennes 1,8 à l'autre. **Former beaucoup ne garantit pas l'usage ; ce qui compte est qu'un établissement bascule.** Le cas **Étranger** (67 comptes, 13 formés, **0 élève**) est une limite de modèle : Capytale, plateforme de l'Éducation nationale, est inaccessible hors de France — l'engagement y reste captif du site.

**L'organique domine, l'emailing entretient.** Sur les sessions à référent identifiable, **66,7 % proviennent d'un moteur de recherche** (Google en tête). Les campagnes Brevo pèsent **6,1 %** (canal d'entretien, pas d'acquisition) ; YouTube 4,3 %, réseaux sociaux 1,5 % restent marginaux comme portes d'entrée. Le canal **institutionnel/messagerie** (ac-*, Magistère, apps.education : 7,5 %) est le proxy le plus proche du bouche-à-oreille de formation. Le **flux inverse Capytale → site** (254 sessions, **30 utilisateurs**) matérialise la porte directe. Chez les formés, le premier contact « direct/inconnu » grimpe (lien transmis en formation) — mais c'est en partie un artefact d'absence de référent, à ne pas sur-interpréter.

---

## 7. Ressources et contenus : ce que les profs consultent

**Le site est d'abord une bibliothèque de préparation.** Sur ~12 840 clics ressources (dont 7 643 attribuables à 712 profs identifiés, le reste anonyme), le **PDF représente 81 %** ; les liens interactifs sont minoritaires (Capytale 9,6 %, Basthon 4,1 %, Overleaf 3,2 %). Le prof télécharge d'abord ce qu'il distribuera (**version élève** : 4 675 clics), puis son propre déroulé (version prof : 2 054).

**Une activité phare écrase les autres.** La séquence **Statistiques (vitrine, seule accessible sans compte)** concentre l'essentiel (2 192 clics version élève, 598 clics Capytale). Détail révélateur du pont site→Capytale en **utilisateurs distincts** : l'**Équation réduite (122) talonne la vitrine Stat (116)** alors qu'elle pèse beaucoup moins en clics bruts — signature d'une activité poussée en **formation de profs** (public resserré mais décidé). À l'opposé, l'**Intro à l'IA est quasi invisible** côté site (3 clics) : sa porte n'existe pas dans le funnel site.

**On prépare le début, rarement la fin.** Les fiches version élève de la séquence Stat décroissent fortement : **1 124 clics en séance 1, 132 en séance 7** (rétention ~12 %). Soit usage partiel, soit préparation concentrée sur l'entrée en matière (à recouper avec l'usage réel en classe).

**Formés vs nouveaux : corrélation, pas causalité.** Les formés consultent deux fois plus en profondeur (15,0 vs 8,8 clics/prof), les webinaire le plus (22,1). Mais cette population est **auto-sélectionnée** parmi les plus engagés : l'écart ne mesure pas un effet de la formation. Signal opérationnel net en revanche : le **guide de connexion Capytale** — **~74 % de ses lecteurs cliquent aussi un lien Capytale**. Qui télécharge le mode d'emploi s'apprête à amener ses élèves sur la plateforme : c'est le marqueur de passage à l'acte le plus fiable du funnel.

---

## 8. Collège : réconciliation site × Capytale

Le Volet 1 laissait une tension (collège « marginal » côté KPI prof, mais lourd parmi les testeurs en formation). Le jeu nominatif tranche : **le collège est un public de formation et d'intérêt, pas un public de classe.**

**Le collège existe comme public, et est sur-formé.** 145 comptes site sont rattachés à un collège (591 à un lycée). Ils sont **plus formés que les lycées** (56,6 % vs 37,9 %), presque toujours en présentiel (71 sur 82 formés). La table présentiel recense **60 collèges** pour 93 lycées — le collège pèse **39 %** des établissements touchés par une formation en établissement.

**Mais la conversion en classe est quasi nulle.** Sur **128 UAI collège** déclarés côté site, **un seul** porte un usage élève réel (23 élèves) ; sur 60 collèges formés en présentiel, **un seul** — et c'est le même établissement (Collège César Franck, Paris 2e). À comparer aux ~3 592 élèves Capytale en lycée (92 UAI). **L'explication est structurelle** : les clics collège évitent le catalogue calé 2nde (**5 % vs 39 % au lycée**) et restent sur la vitrine Stat (41 %) et l'Équation réduite (30 %, activité de formation). Les profs de collège testent la partie IA/statistique transversale, séduisante en formation, mais **ne trouvent pas de TP aligné sur leur programme (6e-3e)**.

**Géographie : un effet animateur.** **Montpellier capte 48 des 145 comptes collège** (37 formés), loin devant Paris (13) et Versailles (11) — la signature d'un réseau collège mobilisé en formation présentielle, sans traduction en usage élève. Le collège illustre donc le scénario « intérêt sans aboutissement » : un funnel qui s'effondre à la dernière marche **par défaut d'offre, pas de demande**.

---

## 9. Appariement individuel (bonus) — études de cas et validation

> **À valider.** Conformément au cadrage retenu (calibrer sur le pionnier + heuristiques, puis valider), voici les cas reconstitués. L'appariement est **inféré** (UAI + activité + timing), jamais certifié.

**46 paires** site ↔ Capytale (16,4 % des 280 cliqueurs site à UAI connu) : **29 de confiance A** (timing clic→clone serré), **17 de confiance B** (unicité UAI 1:1). Sur ces 46 : **tous ont testé**, **31 (67 %) ont atteint une classe** (1 071 élèves), 18 ont réutilisé (≥2 séances), 10 ont diffusé ≥2 activités, 3 sur deux années.

**Trois drapeaux de fiabilité, honnêtes :**
- **11 des 46 comptes ont cloné sur Capytale *avant* de cliquer depuis le site** (7 avant même d'avoir créé leur compte) : pour un quart des paires, **la flèche « site → classe » est inversée** — le prof était déjà sur Capytale, le site est un canal de *retour*.
- **2 UAI portent chacun deux comptes Capytale appariés** (Orsay, Hazebrouck) : l'établissement est certain, l'attribution au bon collègue ne l'est pas.
- La confiance B (1:1 sans corroboration temporelle) est plus exposée aux faux positifs, surtout sur petits établissements.

**Cinq cas contrastés (pseudonymisés ; je peux te donner le nom exact depuis le mapping local pour vérification) :**

| Réf. | Établissement (commune, acad.) | Profil | Chaîne observée |
|---|---|---|---|
| **A** | Lycée, Le Vigan (Montpellier) | Présentiel, conf. A | Compte créé **le jour de la formation** (09/04/2026), clic ressource + clic Capytale dans la même minute, clone « Équation réduite » le jour même. 0 élève encore (classes attendues à la rentrée). *Effet « même-jour » du présentiel.* |
| **B** | Lycée Blaise Pascal, Orsay (Versailles) | Webinaire, conf. A | Pipeline complet et diversifié : 45 clics ressources, 3 clones (Stat fœtus, Intro-IA, Géométrie repérée), **65 élèves** sur 5 séances en janvier 2026. *Drapeau : 2ᵉ compte Capytale sur cet UAI.* |
| **C** | Lycée, Poissy (Versailles) | **Non formé**, conf. A | Entré par « Équation réduite », **60 élèves** sur 5 séances (jan.-juin 2026). 1er clone le 13/01/2026, **avant** le clic site (19/05) : déjà utilisateur Capytale autonome. *Le prof productif que la formation n'a pas touché.* |
| **D** | Lycée J.-B. Corot, Douai (Lille) | Webinaire, conf. B | Le ré-useur le plus dense : **99 élèves**, 9 séances sur **deux années**, alternant Stat et Équation réduite. *Usage installé dans la durée.* |
| **E** | Collège privé, Ciboure (Bordeaux) | Webinaire, conf. B | Chaîne complète mais **3 élèves** sur 2 séances. *Limite de l'appariement au collège : effectifs minuscules, faux positif coûteux.* |

Profil-type du prof qui va au bout : un **clic ressource suivi d'un clic Capytale le même jour** (12 des 29 paires A clonent le jour même), une **activité ancrée en 2nde** (Équation réduite, Stat), une **diffusion en 2-3 séances de demi-groupe** (classe médiane 13 élèves). Pour les plus engagés, le « pipeline » est en réalité un **aller-retour** site ↔ Capytale. L'individuel **confirme** le scénario, il ne le **mesure** pas.

---

## 10. Insights transverses

1. **La déperdition est concentrée sur le dernier sas, pas répartie.** Le site convertit bien jusqu'au compte et même jusqu'à la formation, mais s'effondre au passage en classe (83 % des UAI site sans empreinte Capytale). C'est le croisement funnel site × usage établissement qui localise la fuite tout en bas.
2. **L'inversion intention/aboutissement se rejoue à deux échelles.** Présentiel = beaucoup de clics, peu de classes ; webinaire = l'inverse. Montpellier = beaucoup de formés, peu d'élèves ; Lille = l'inverse. Le facteur commun n'est ni le format ni l'académie : c'est **l'auto-sélection d'un noyau déjà décidé** vs le ratissage large d'indécis.
3. **Le pic d'inscriptions de janvier et la faible conversion des cohortes 2026 sont le même fait.** Le pic hivernal remplit le haut du funnel d'une population qui, par saisonnalité, ne peut pas encore avoir déployé. Le « creux » 2026 est mécaniquement programmé.
4. **La découverte spontanée se fait sur Capytale, pas sur le site.** 44 % des UAI à usage sans compte site ; flux inverse marginal ; Intro-IA (hors site) marquant 42 UAI directs. Le site est un **canal de préparation et de relance** pour qui connaît déjà MathAData ; l'entrée « froide » passe par le catalogue Capytale et le réseau de pairs.
5. **Le funnel est piloté par la formation, pas par la découverte — la signature est dans les activités.** L'Équation réduite (pivot des formations) talonne la vitrine Stat en utilisateurs distincts cliquant vers Capytale. Le contenu réellement poussé en classe est celui montré en formation, pas celui qui ranke en organique.
6. **Le collège est la démonstration verticale de l'« intérêt sans aboutissement ».** Plus formé que le lycée, sur-représenté en présentiel, concentré à Montpellier — mais 1 seul UAI sur 128 aboutit. Non-passage par **défaut d'offre 6e-3e**, pas de demande.
7. **La profondeur de consultation des formés est de l'auto-sélection, pas un effet causal.** Tout écart formés/non-formés (et webinaire/présentiel) doit être lu comme corrélation.
8. **La rétention au grain établissement est la vraie réserve de croissance.** L'usage migre entre collègues d'un même UAI ; capitaliser sur l'établissement converti rapporte plus que ré-engager le prof individuel — d'autant que 380 UAI site-only sont en sursis, pas en abandon.

---

## 11. Recommandations opérationnelles

1. **Relancer le réservoir site-only en sursis (~148 établissements à intention non aboutie),** à la **rentrée de septembre** (créneau de déploiement), en mettant en avant le **guide de connexion Capytale** (74 % de ses lecteurs cliquent ensuite vers Capytale — le meilleur marqueur de passage à l'acte).
2. **Arbitrer l'allocation du présentiel : sortir des terrains déjà conquis.** Prioriser les établissements **vierges d'usage Capytale** (mesurable a priori), et **combiner** les formats — présentiel pour amorcer large, webinaire pour approfondir le noyau motivé — plutôt que les opposer.
3. **Ouvrir (ou assumer de fermer) la porte collège.** Soit **produire 2-3 activités explicitement collège** (proportionnalité, stats 4e/3e, repérage) pour transformer l'intérêt existant ; soit **assumer le collège comme canal de prescription** et cesser d'en mesurer le ROI à l'aune de la conversion élève. Le statu quo gaspille un contingent de formés réel (Montpellier).
4. **Capitaliser sur la porte Capytale-directe et le réseau de pairs, pas seulement sur le SEO.** Soigner la **fiche catalogue Capytale** (point d'entrée réel des découvreurs), y placer un lien retour vers les ressources, et **référencer l'Intro à l'IA** sur le site pour la réintégrer au funnel mesurable.
5. **Instrumenter la conversion au bon grain et au bon moment.** Piloter l'effet formation sur le **proxy établissement-historique-complet** (non biaisé), et **ré-évaluer les cohortes 2026 à la rentrée**, où leur conversion réelle deviendra lisible. Ne jamais comparer cohortes mûres et récentes sur le clic.

---

## 12. Drapeaux qualité-données et limites

- **Aucun identifiant commun.** Appariement individuel inféré (46 paires, dont 29 confiance A) ; grain robuste = établissement + cohorte. 2 UAI portent 2 comptes Capytale appariés (attribution prof ambiguë). 11/46 paires ont une causalité inversée (clone avant clic site).
- **Fenêtre de tracking au 27 nov. 2025.** Clics/modules sous-capturés avant ; comparaisons mûres/récentes sur le clic invalides. La conversion établissement (historique complet) n'est pas biaisée.
- **Endogénéité des formations.** On forme des acquis (10/27 établissements présentiel à usage utilisaient déjà Capytale avant). Aucun chiffre n'est un effet causal net ; tout écart mêle causalité, auto-sélection et récence.
- **Funnel : ne pas double-compter.** 188 des 631 formés sont newsletter-only : formés = 23 % du total, 26 % des comptes complets ; ne pas enchaîner 1 712 → 631.
- **Deux portes, deux définitions d'empreinte.** Capytale-direct (77, grain `uai_teach`, borne haute 166) ; site-only (509, empreinte `uai_teach`∪`uai_el`). Comparabilité à manier avec prudence.
- **`clicked_capytale = 337`** dépend de la définition (rss `/web/b/` ; events `resourceType=capytale` = 306 ; union 360). Tous les taux restent dans ~19-21 %.
- **Géographie : niveaux absolus = bornes basses** (seule la fraction à académie/UAI connu est localisée ; ~5 081 élèves localisés ≠ 5 854 du total). Ratios robustes, niveaux indicatifs. « élèves/formé » divise par les formés à académie renseignée (~454) ; borne basse tous formés ≈ 8.
- **Volumes Capytale = lignes/affectations** (clones), pas nécessairement élèves distincts : 146 / 1 943 / 3 783 distincts par année. Séances reconstruites par regroupement activité×date (294 séances datées), jamais par `assignment_id`.
- **Vidéos massivement anonymes** (1 566/1 858 ouvertures sans user) : analyse « qui regarde quoi » partielle. La durée de visionnage n'est pas un temps réellement regardé.
- **Le « 1 collège sur 60 » et le « 1 sur 128 » désignent le même établissement** (Paris 0752248L) — un seul signal, pas deux preuves.
- **Compte démo et hub fondateur (Haubourdin, 404 élèves) exclus/isolés** : le poids de Lille est en partie cet héritage, pas une diffusion site ordinaire.

---

## 13. Méthode, fichiers et reproductibilité

Pipeline dédié dans `enquete_usages_2026/volet2/` :
`build_payload_canonical.py` → `compute_cross_facts.py` → `match_individuals.py` → `make_charts_volet2.py`, plus `workflow_volet2.js` (orchestration multi-agents : 8 deep-dives → vérification adversariale → synthèse). Définitions canoniques : **`DEFINITIONS_VOLET2.md`**. Source de vérité des chiffres : **`data/facts_cross.json`**. Sorties pseudonymisées : `data/match_candidates.csv` (site = `S####`, Capytale = md5[:8]), `data/capytale_by_uai_*.csv`, `data/presentiel_etabs.csv`.

**Sécurité.** Le snapshot Payload contient des données personnelles : il reste local (gitignore), n'est jamais committé, et aucune sortie versionnée/publiée ne contient nom, prénom ou e-mail. Aucune ré-identification.
