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

- **Un entonnoir qui se rétrécit à chaque marche.** De **2 715 comptes**, **1 003 (37 %) restent « newsletter only »** et ne deviennent jamais comptes complets ; il reste **1 712 comptes complets**. **631 sont formés** (23 % du total) et **337 (12 %) cliquent un jour vers Capytale**. Côté Capytale, **224 comptes ont enseigné** — dont **163 de vraies classes (≥ 10 élèves)** — pour **5 854 élèves**. ⚠️ Ces 224 (Capytale, anonyme) **ne sont pas un sous-ensemble** des 2 715 (site, nominatif) — 44 % des profs qui enseignent n'ont aucun compte site : le rapport 224/2 715 (~8 %) est un **ordre de grandeur système, pas un taux de conversion**. Les fuites les mieux établies sont en haut (37 % newsletter-only) et au clic Capytale (12 %), et au grain établissement (83 % des UAI du site sans empreinte classe, cf. §5).

- **Le funnel vrai est plus dense que le funnel « toutes dates ».** Sur la cohorte trackable (post-27 nov., 1 003 comptes), **66 % deviennent actifs, 58 % consultent un module, 58 % téléchargent une ressource, 27 % cliquent vers Capytale** — contre 47 / 40 / 41 / 20 % toutes dates. Le clic Capytale est la marche la plus pénalisée par la fenêtre de tracking.

- **Se former est associé à ~2,5× plus de clics vers Capytale** (formés vs non-formés) — effet réel mais mêlé de **récence**, d'**auto-sélection** et d'**endogénéité** (on forme des profs et des établissements déjà acquis).

- **Ce n'est pas le format qui prédit l'aboutissement en classe, c'est la concentration.** Reclassées par *nature* et comptées au **grain établissement distinct**, les cohortes vont de **59 % (13/22 établissements)** pour une formation **établissement-ciblée** (plusieurs collègues d'un même lieu) à **10 % (13/129)** pour une formation **académique de masse** (IREM, journées, 1 prof dispersé) — un **facteur ~6**, alors que les deux sont du présentiel. Toutes les formations de masse sont quasi nulles (Narbonne 1/20, Nîmes 0/9), toutes les concentrées ont de vraies classes (Lille 2024 : 841 élèves). *Base petite (22 établissements) → chiffre = ordre de grandeur ; mais la classification est **confirmée par l'équipe** (Gif, Lille 2024, Calais lycée pro, Amiens sont de vraies formations établissement-ciblées) → direction robuste. Au grain prof, l'établissement-ciblée monte à ~67 %, mais c'est surestimé (compte les collègues d'un même lycée plusieurs fois).* *(Correction v1 : « webinaire > présentiel » reposait sur 147 « anciens formés » comptés à tort comme webinaire.)*

- **Le pré-service strict est minoritaire — et il ne faut pas y agréger les formations ouvertes ratées.** Le **pré-service** au sens strict — **MEEF INSPÉ Paris (13 profs)** — est sans classe ni élèves (**0 % d'usage par construction**) : canal à horizon décalé, pas « présentiel raté ». ⚠️ En revanche la grosse cohorte **ENS_25 (52 profs)** n'en est **pas** : c'était une **formation francilienne ouverte, non ciblée**, pour des **profs en exercice** ; son **0 % d'usage** est un vrai **échec de formation de masse** (non reconduite), à compter comme tel. Le pré-service réel pèse donc ~4 % de l'effort présentiel (≈13/363), pas 20 %.

- **L'endogénéité reste une limite causale forte.** Avec les vraies dates de formation : sur 26 établissements présentiels à usage élève, **9 utilisaient déjà Capytale *avant*** la formation. Quand l'usage suit, il vient en **~27 jours** (médiane). Ne pas créditer le présentiel d'environ un tiers de l'usage observé.

- **L'intention déclarée ne pilote pas l'usage.** 29 validations sur 239 déclarent un module ; **6 intentions sur 99** se réalisent — mais **85 des 93 non réalisées** émanent d'établissements n'ayant déclenché aucun TP. Le goulot est le **passage à l'acte en classe**, pas le choix du module.

- **Deux portes d'entrée disjointes.** Sur **174 établissements** à usage classe Capytale, **77 (44 %) n'ont aucun compte site** déclarant cet UAI : entrées **Capytale-directes**, via l'ENT, contournant le site (borne basse ; borne haute 166). Symétriquement, sur **616 établissements** présents côté site, **509 (83 %) n'ont aucune empreinte classe Capytale**. Les deux populations se recouvrent peu.

- **La porte Capytale-directe est un héritage pré-site.** L'activité **Intro à l'IA**, absente du site (3 clics), marque **42 des 77 UAI directs** (seule activité dans 28). Ces établissements sont plus **anciens et plus petits** (19 élèves/UAI vs 36 pour les UAI présents des deux côtés) ; 34 sur 77 n'ont aucun usage en 2025-2026. C'est la trace des profs précurseurs entrés avant l'essor du site.

- **Le réservoir site-only est un sursis, pas un cimetière.** **380 des 509 UAI site-only (75 %)** ont leur compte le plus récent daté de 2026 ; **142 des 159** établissements site-only formés l'ont été en 2026 ; **148** comptent un compte ayant cliqué vers Capytale sans classe retrouvée. L'IPS moyen (111) est identique à celui des UAI actifs des deux côtés (112) : **la non-conversion n'est pas un effet de milieu social, mais de temps.**

- **La conversion « jusqu'à la classe » se lit en trimestres.** Les cohortes **mûres** (formées avant déc. 2025) convertissent à **46 %** d'établissements à usage élève, contre **22 %** pour les cohortes récentes (2026). Ces dernières remonteront mécaniquement à la rentrée.

- **Croissance par recrutement, pas (encore) par fidélisation.** Rétention prof 2024-25 → 2025-26 de **29,5 %** ; **81,5 % des enseignants 2025-26 sont nouveaux** ; 192 profs n'ont enseigné qu'une seule année (28 deux ans, 4 trois ans). La prochaine bataille est la ré-utilisation en année N+1, mieux portée par l'établissement que par l'individu.

- **L'acquisition est massivement organique, l'emailing entretient.** **66,7 % des sessions référencées** viennent d'un moteur de recherche (Google en tête) ; les campagnes Brevo ne pèsent que **6,1 %** des sessions (canal de relance, pas d'acquisition). Le flux inverse **Capytale → site** (30 utilisateurs) est la signature visible de la porte directe.

- **L'usage se concentre là où la notoriété est diffuse.** La marque rayonne nationalement (Versailles 168 comptes, Lille 151, Paris 141), mais **Lille capte 26 % des élèves Capytale** localisés. Former beaucoup ne garantit pas l'usage : **Montpellier** a le plus gros contingent de formés (79) pour seulement **3,9 élèves/formé**, cinq fois moins que Lille (20,2). Ce qui compte n'est pas le nombre de formés, mais qu'un établissement bascule.

---

## 2. Le pipeline complet, de la notoriété à la classe

Reconstituer le trajet — entendre parler de MathAData, créer un compte, se former, tester sur Capytale, enseigner — fait apparaître un entonnoir net. mathadata.fr compte **2 715 comptes**. La **première fuite est immédiate** : 1 003 (37 %) restent « newsletter only », jamais convertis en compte complet. Restent **1 712 comptes complets**. Sur l'ensemble, **631 sont formés** (23 % du total) — dont 443 sont des comptes complets et 188 restés au statut newsletter-only ; on ne chaîne donc pas naïvement 1 712 → 631 (ce serait double-compter 188 personnes). **337 comptes (12 %) ont cliqué vers Capytale.**

**Changement d'univers — lire le bas de l'entonnoir avec prudence.** Côté Capytale (anonyme, autre population), **224 comptes ont enseigné** — dont **163 de vraies classes (≥ 10 élèves cumulés ; 16 n'ont eu qu'un seul élève)** — pour **5 854 élèves**. Ces 224 ne sont **pas** un sous-ensemble des 2 715 : les deux mondes n'ont **aucun identifiant commun**, et **44 % des profs qui enseignent n'ont aucun compte site** (porte Capytale-directe, §5). Rapporter 224 aux 2 715 (~8 %) **croise deux populations partiellement disjointes** : c'est un **ordre de grandeur système, pas un taux de conversion individuel**. Les seuls taux propres sont *intra-univers* : côté Capytale, 401 comptes engagés → 224 ont enseigné (**56 %**) ; côté site, 2 715 → 337 clics (**12 %**).

Cette lecture « toutes dates » sous-estime le site, car le tracking ne démarre que le 27 novembre 2025. Sur la **cohorte trackable** (1 003 comptes), le funnel est bien plus dense : **66 % actifs, 58 % module vu, 59 % ressource téléchargée, 27 % clic Capytale** — contre 47 / 40 / 41 / 20 % sur l'ensemble. Le clic Capytale est la marche la plus pénalisée par la fenêtre.

Les **délais** montrent une bascule très rapide quand elle a lieu : médiane compte→première action (module, ressource, clic Capytale) de **0 jour** (l'action se fait le jour de l'inscription), mais 9ᵉ décile au-delà de **170 jours** : soit l'enseignant agit tout de suite, soit il revient à la séquence pédagogique suivante. La séquence compte/formation confirme deux portes temporelles : ~**206 comptes créés le jour même de la formation** (dont **90 % en présentiel** — le formateur fait créer le compte séance tenante), ~**185 après**, ~**95 avant** (déjà intéressé). *(Les sous-totaux varient de ±15 selon la convention de comptage au jour ou à la minute ; la part « présentiel le jour même » est, elle, robuste à 186/206.)*

| Marche de l'entonnoir | Effectif | % du total |
|---|---:|---:|
| Comptes créés *(site)* | 2 715 | 100 % |
| Comptes complets *(site)* | 1 712 | 63 % |
| Formés *(site)* | 631 | 23 % |
| Ont cliqué vers Capytale *(site)* | 337 | 12 % |
| *— changement d'univers : Capytale, anonyme —* | | |
| Ont enseigné (≥ 1 élève) | 224 | n.c.\* |
| dont vraie classe (≥ 10 élèves) | 163 | n.c.\* |
| Élèves touchés | 5 854 | — |

> \* *Population Capytale, distincte des comptes site (aucun identifiant commun ; 44 % des profs enseignants n'ont pas de compte site). Aucun « % du total des comptes site » n'est défini pour ces lignes — le ~8 % parfois cité (224/2 715) est un ordre de grandeur système, pas une conversion.*

### Profils de parcours : porte d'entrée × profondeur (côté site)

L'entonnoir ci-dessus compte les marches ; le **croiser** avec la **porte d'entrée** (comment le compte est arrivé) montre *qui décroche, et où*. Sur les 2 715 comptes, trois profondeurs côté site se dessinent — **inactif** (compte, souvent réduit à la newsletter, jamais suivi d'un usage réel), **curieux** (a exploré module/ressource sans cliquer d'activité), **intention-classe** (a cliqué une activité Capytale = le geste qui précède la classe) :

| Porte d'entrée *(site)* | Inactif | Curieux | Intention-classe | Total | % intention |
|---|---:|---:|---:|---:|---:|
| Formé — présentiel | 202 | 66 | 95 | 363 | **26 %** |
| Formé — webinaire | 65 | 26 | 30 | 121 | **25 %** |
| Ancienne vague | 105 | 17 | 25 | 147 | 17 % |
| Spontané *(non formé, compte complet)* | 745 | 337 | 187 | 1 269 | 15 % |
| Newsletter seule | 814 | 1 | 0 | 815 | 0 % |
| **Total** | **1 931 (71 %)** | **447 (16 %)** | **337 (12 %)** | **2 715** | **12 %** |

Trois lectures :

1. **L'effet porte est net.** Une formation présentielle ou en webinaire amène **≈ 25 %** des comptes jusqu'à l'intention-classe, contre **15 %** en spontané et **0 %** en newsletter-seule — la porte de formation **double presque** le passage à l'acte (côté site).
2. **Mais la fuite post-formation domine en absolu.** Sur **631 formés, 481 (76 %) n'atteignent jamais** le clic activité, et **372 restent inactifs** : c'est le grand réservoir « **formé jamais passé en classe** » (cohérent avec le §3 — le *format* de formation pèse moins que la *concentration*).
3. **Le spontané porte le volume.** À lui seul, il fournit **187 intentions-classe** — davantage que les **150** des trois portes formées réunies : la demande organique est l'actif principal, la formation un accélérateur ciblé.

⚠️ **Trois précautions de lecture.** *(a)* La matrice s'arrête à l'**intention** (clic), **côté site** ; l'enseignement réel (les 224) est l'**autre univers** (mur ci-dessus, atteint à 44 % par des profs sans compte site) — **ne pas chaîner ces colonnes vers 224**. *(b)* Les **5 portes** raffinent la seule porte « site-first » : « spontané » et « newsletter seule » sont le détail des **2 084 non-formés** du §3 ; la porte « **Capytale-direct** » (§5) reste *hors* de ce tableau (ces profs n'ont pas de compte site). *(c)* Le niveau « **curieux** » est **sous-capturé avant le 27 nov. 2025** (fenêtre de tracking) ; les cellules robustes sont le **statut formé** et le **clic activité**. *(Les 188 formés également « newsletter-only » sont comptés dans leur porte de formation, colonne Inactif — pas de double-compte.)*

---

## 3. Effet des formations : ce n'est pas le format, c'est la concentration

> *Cette section a été refondue après le chargement des données de formation (`formation-codes` : 45 sessions datées, typées, labellisées ; `formation-redemptions` : 239 validations). On dispose désormais du **type réel** de chaque formation et des **cohortes exactes**, là où le Volet 2 v1 reposait sur un champ déclaratif bruité.*

**Une correction de fond d'abord.** Le Volet 2 v1 concluait « le webinaire convertit mieux que le présentiel (31 % vs 24 %) ». C'était un **artefact de typage** : 147 « anciens formés » (formés avant la mise en place du système de codes le 15/01/2026, type et date réels **inconnus**, regroupés dans deux codes à date factice) étaient comptés à tort comme `webdecouv`, gonflant le webinaire. Avec le **typage réel** (via `trainedFormation` → code), quatre catégories émergent :

| | Non-formés | Présentiel | Webinaire | Ancienne vague |
|---|---:|---:|---:|---:|
| Effectif | 2 084 | 363 | 121 | 147 |
| % clic Capytale *(intention, biaisé tracking)* | 9,0 | **26,2** | 24,8 | 17,0 |
| % actifs sur le site | 26,0 | 45,2 | 46,3 | 28,6 |
| % établissement à usage élève *(robuste)* | 17,8 | 23,4 | **32,4** | 28,6 |
| Ressources / personne *(moyenne)* | 2,1 | 4,0 | **10,2** | 4,6 |

*« Usage élève effectif » = au moins une vraie classe (≥ 1 élève `role=student`), historique Capytale complet 2023-2026, non biaisé par la fenêtre de tracking. Le « % » porte sur les **profs formés à UAI renseigné**, pas sur des établissements distincts (au niveau établissement dédupliqué : 17,8 / 17,1 / 29,5 / 25,8 %). La formation reste associée à un clic Capytale ~2,5× supérieur (effet mêlé de causalité, récence et auto-sélection).*

**Le vrai webinaire converti mieux subsiste — mais sur petite base et n'est pas le moteur.** Le webinaire *genuine* (121 profs, 68 profs-avec-UAI) atterrit en classe à 32,4 % et consulte le plus de ressources (10,2/personne) : il sélectionne des profs déjà décidés. Le présentiel (363) est plus large mais agrège des régimes opposés. Le format, à lui seul, n'explique pas grand-chose.

**Le prédicteur d'aboutissement, c'est la *concentration* de la formation.** En reclassant les cohortes datées par **nature** — qui était dans la salle — et en comptant au **grain établissement distinct** (et non par prof, qui gonfle le taux en comptant plusieurs collègues d'un même lycée comme autant de succès) :

| Nature de la cohorte | Cohortes | Profs | Étab. distincts | Avec classe | **%** |
|---|---:|---:|---:|---:|---:|
| **Établissement-ciblée** *(plusieurs collègues d'un même lieu)* | 6 | 113 | **22** | 13 | **59 %** |
| Distanciel / webinaire | 17 | 121 | 61 | 18 | 30 % |
| Ancienne vague | 2 | 145 | 31 | 8 | 26 % |
| **Académique de masse** *(IREM, Labomaths, journées — 1 prof dispersé)* | 12 | 187 | **126** | 13 | **10 %** |
| Pré-service *(ENS_25, MEEF INSPÉ)* | 2 | 65 | 5 | 0 | **0 %** |

L'écart est d'un **facteur ~6** (59 % vs 10 %), alors que établissement-ciblée et masse sont **toutes deux du présentiel** : la moyenne présentielle agrégée (23,4 %) mélange ces deux régimes. *Toutes* les formations de masse sont quasi nulles (Narbonne 1/20, Nîmes 0/9, Labomaths Aix-Marseille 0/14, IREM Dijon 1/17), *toutes* les concentrées ont de vraies classes — et certaines massivement (la seule cohorte **Lille 2024** = 841 élèves : Pasteur Lille 309, Vinci Calais 410, Woillez Montreuil 122).

> **À manier avec prudence.** (1) Le **grain compte** : au niveau prof, l'établissement-ciblée monte à ~67 % (Gif : 13 profs mais 3 établissements) — surestimé ; le **59 % (13/22) au grain établissement** est plus juste. (2) **Base petite** : 22 établissements seulement pour l'établissement-ciblée. (3) **Classification subjective** (mots-clés ; Calais-LP = 8 LP dispersés, plutôt « réseau »). (4) **Déclaration d'UAI faible** dans 2 cohortes (Lille 6/40 profs, Amiens 1/19) → le taux y repose sur une poignée. La **direction** (concentré ≫ dispersé) est robuste ; le chiffre exact est un **ordre de grandeur sur petite base**.

**Distinguer le pré-service (sans classe) des formations ouvertes ratées.** Le **pré-service au sens strict — MEEF INSPÉ Paris (13 profs)** — est sans classe en responsabilité ni élèves : il ne *peut* pas produire d'usage (**0 % par construction**), et le compter comme « présentiel raté » serait une erreur d'attribution (canal à horizon décalé). ⚠️ **La grosse cohorte ENS_25 (52 profs) n'est PAS du pré-service** : c'était une **formation francilienne ouverte, non ciblée**, suivie par des **profs en exercice** ; son **0 % d'usage** est un véritable **échec de formation de masse** (non reconduite), à compter comme tel et non excusé. Le pré-service réel pèse donc ~4 % de l'effort présentiel (≈13/363), pas 20 %. *(Une 3ᵉ cohorte INSPÉ « continue » convertit, elle, à 100 % sur 2 établissements.)*

**La maturité ne sauve pas les cohortes faibles.** Contre-intuitivement, les deux meilleures cohortes (Gif 32 j, Arpajon 39 j de recul) sont parmi les **plus récentes**, tandis que des cohortes mûres restent basses (Narbonne 88 j → 4 %, St-Brieuc 156 j → 12 %). Cohortes ≥ 60 j : ~20-23 % ; < 60 j : ~30-34 %. Ce n'est ni le format ni le temps écoulé qui prédit l'usage — c'est la nature.

**L'endogénéité reste une limite causale forte.** Avec les vraies dates : sur 26 établissements présentiels à usage élève, **9 utilisaient déjà Capytale *avant* la formation**. La formation ne peut donc pas être créditée d'environ un tiers de l'usage présentiel observé. Quand l'usage suit, il vient en **~27 jours (médiane)**, pas en deux semaines. **Ne pas présenter le présentiel comme causal.**

**Et l'intention déclarée ne pilote rien à court terme.** Sur 239 validations, seules **29 (12 %)** déclarent au moins un module (32 % « pas encore d'idée », 56 % vide), et **6 intentions sur 99** seulement se réalisent (même activité dans l'établissement). Mais le goulot n'est pas le choix du module : **85 des 93 intentions non réalisées émanent d'établissements n'ayant déclenché *aucun* TP Capytale**. Le blocage est le **passage à l'acte en classe**, pas la planification — d'autant que la validation se fait en séance (238/239 dans les 24 h de la formation). Détail parlant : le module **Intro à l'IA**, absent du formulaire (`hiddenOnSite`), est déclaré **0 fois** alors qu'il est la 2ᵉ activité la plus utilisée sur Capytale — l'intention déclarée ne couvre même pas le périmètre réel.

> **⚠️ Mise en cohérence avec la [Typologie](../commons/TYPOLOGIE_PROFILS_2026.md) §III — distinguer *amorçage* et *durabilité*.** Ce que mesure cette section, c'est l'effet de la formation sur l'**aboutissement en classe** (un établissement bascule-t-il en usage élève ?). La formation concentrée y aide nettement (facteur ~6). Mais une analyse de la **rétention année→année** montre que la formation **ne crée pas, par elle-même, des profs qui *reviennent*** : l'écart de retour formés/non-formés (54 % vs 27 %) est un **artefact de composition** (les établissements formés contiennent déjà plus de pionniers/fidèles ; à profil égal, aucun gain). Les deux constats sont compatibles et se complètent : **la formation amorce l'usage là où un collectif local s'en saisit ; la durabilité, elle, se joue sur la *dose de la première année* (≥2 activités, vraie séance), pas sur la formation en tant que telle.**

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

**Formés vs nouveaux : corrélation, pas causalité.** Les formés consultent deux fois plus en profondeur (15,0 vs 8,8 clics/prof), les webinaire le plus (22,1). Mais cette population est **auto-sélectionnée** parmi les plus engagés : l'écart ne mesure pas un effet de la formation. Signal opérationnel en revanche : le **guide de connexion Capytale** — **~74 % de ses lecteurs cliquent aussi un lien Capytale** (co-occurrence, n≈96 ; l'ordre guide → clic n'est pas établi). C'est un bon **marqueur d'intention** du funnel, à manier comme corrélation et non comme preuve de causalité.

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
2. **Le même facteur — la concentration — explique l'aboutissement à toutes les échelles.** Une formation concentrée sur un établissement convertit 5× mieux qu'une journée académique dispersée ; un établissement qui bascule (Lille) pèse plus que des dizaines de formés éparpillés (Montpellier) ; un prof qui forme ses collègues installe l'usage là où un prof isolé l'abandonne. Le facteur commun n'est ni le format de formation ni l'académie : c'est qu'**un collectif local se saisit de l'outil**, contre le ratissage large d'individus dispersés.
3. **Le pic d'inscriptions de janvier et la faible conversion des cohortes 2026 sont le même fait.** Le pic hivernal remplit le haut du funnel d'une population qui, par saisonnalité, ne peut pas encore avoir déployé. Le « creux » 2026 est mécaniquement programmé.
4. **La découverte spontanée se fait sur Capytale, pas sur le site.** 44 % des UAI à usage sans compte site ; flux inverse marginal ; Intro-IA (hors site) marquant 42 UAI directs. Le site est un **canal de préparation et de relance** pour qui connaît déjà MathAData ; l'entrée « froide » passe par le catalogue Capytale et le réseau de pairs.
5. **Le funnel est piloté par la formation, pas par la découverte — la signature est dans les activités.** L'Équation réduite (pivot des formations) talonne la vitrine Stat en utilisateurs distincts cliquant vers Capytale. Le contenu réellement poussé en classe est celui montré en formation, pas celui qui ranke en organique.
6. **Le collège est la démonstration verticale de l'« intérêt sans aboutissement ».** Plus formé que le lycée, sur-représenté en présentiel, concentré à Montpellier — mais 1 seul UAI sur 128 aboutit. Non-passage par **défaut d'offre 6e-3e**, pas de demande.
7. **La profondeur de consultation des formés est de l'auto-sélection, pas un effet causal.** Tout écart formés/non-formés (et webinaire/présentiel) doit être lu comme corrélation.
8. **La rétention au grain établissement est la vraie réserve de croissance.** L'usage migre entre collègues d'un même UAI ; capitaliser sur l'établissement converti rapporte plus que ré-engager le prof individuel — d'autant que 380 UAI site-only sont en sursis, pas en abandon.

---

## 11. Recommandations opérationnelles

1. **Prioriser les formations établissement-ciblées sur les journées de masse.** Le facteur ~6 d'aboutissement (59 % vs 10 % des établissements) est le levier le plus net du rapport — à confirmer sur une base plus large (22 établissements ciblés à ce jour). Former 3-4 collègues d'un même établissement autour d'un projet local convertit massivement mieux que les journées académiques dispersées (IREM, Labomaths) où chaque prof repart seul. Réorienter une part de l'effort « masse » vers le ciblage établissement.
2. **Traiter le pré-service comme un canal distinct, à horizon décalé.** Ne plus diluer le taux présentiel avec ENS_25 / MEEF (20 % de l'effectif présentiel, 0 % d'usage immédiat par construction) : les compter à part, avec un objectif d'engagement et un suivi à T+1 an (première titularisation / premier établissement), pas d'usage classe immédiat.
3. **Déplacer le KPI de l'intention vers le passage à l'acte.** L'intention déclarée (6/99 réalisées) ne pilote rien à court terme. Suivre plutôt le **délai médian formation → 1re séance (~27 j)** et relancer activement, à **J+45**, les profs formés dont l'établissement n'a rien déclenché (85/93 intentions bloquées là). Rendre le module **Intro à l'IA** visible dans le formulaire pour aligner intention et usage réel.
4. **Relancer le réservoir site-only en sursis (~148 établissements à intention non aboutie)** à la **rentrée de septembre** (créneau de déploiement), avec le **guide de connexion Capytale** en avant (74 % de ses lecteurs cliquent aussi vers Capytale — bon marqueur d'intention).
5. **Capitaliser sur la porte Capytale-directe et le réseau de pairs, pas seulement sur le SEO.** Soigner la **fiche catalogue Capytale** (point d'entrée réel des découvreurs), y placer un lien retour, et référencer l'Intro à l'IA sur le site.
6. **Ne pas attribuer l'usage présentiel à la formation sans correction d'endogénéité** (9/26 succès présentiels la précèdent), et **ouvrir ou assumer de fermer la porte collège** (cf. §8) : produire 2-3 activités calées 6e-3e, ou traiter le collège comme canal de prescription.

---

## 12. Drapeaux qualité-données et limites

- **Aucun identifiant commun.** Appariement individuel inféré (46 paires, dont 29 confiance A) ; grain robuste = établissement + cohorte. 2 UAI portent 2 comptes Capytale appariés (attribution prof ambiguë). 11/46 paires ont une causalité inversée (clone avant clic site).
- **Fenêtre de tracking au 27 nov. 2025.** Clics/modules sous-capturés avant ; comparaisons mûres/récentes sur le clic invalides. La conversion établissement (historique complet) n'est pas biaisée.
- **Typage formation réel (depuis le 2ᵉ chargement).** Les 4 catégories (nouveau/présentiel/webinaire/ancienne vague) viennent de `formation-codes` via `trainedFormation`. Les **147 « ancienne vague »** (formés avant le 15/01/2026, 2 codes placeholder à date factice 1984) ont **type et date inconnus** — tout chiffre les concernant est indicatif. Correction par rapport au v1, où ils gonflaient le webinaire.
- **Deux grains à ne pas confondre.** L'effet formation par *type* (§3, tableau du haut) est au **grain prof** (chaque prof formé = une unité). La typologie par *nature* est au **grain établissement distinct** (sinon plusieurs collègues d'un même lycée gonflent le taux : établissement-ciblée 67 % au grain prof → **59 % au grain établissement**). La **base** de l'établissement-ciblée est petite (22 établissements) et 2 cohortes déclarent peu d'UAI (Lille 6/40, Amiens 1/19). Hiérarchie et facteur (~6) robustes ; chiffres = ordres de grandeur.
- **Typologie « nature » subjective.** Établissement-ciblée vs académique-de-masse repose sur une règle (mots-clés + ratio profs/UAI) ; des cas borderline portent une part du facteur → **ordre de grandeur robuste**, pas chiffre exact.
- **Redemptions limitées à 2026 ; intention récente.** Les 239 validations datent toutes du ≥ 15/01/2026 et visent souvent un usage à venir : le 6/99 d'intentions réalisées est plombé par la récence, pas un taux d'échec définitif. Effectifs minces (29 déclarants, 3 réalisateurs).
- **Endogénéité des formations.** On forme des acquis (9/26 établissements présentiel à usage utilisaient déjà Capytale avant). Aucun chiffre n'est un effet causal net ; tout écart mêle causalité, auto-sélection et récence. Le pré-service strict (MEEF/INSPÉ, 0 % par construction) ne doit pas être lu comme un échec ; en revanche la cohorte ENS_25 (52, profs en exercice, formation ouverte non reconduite) en est un.
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
`build_payload_canonical.py` → `compute_cross_facts.py` → `build_formation_cohorts.py` → `match_individuals.py` → `make_charts_volet2.py`, plus deux workflows multi-agents (`workflow_volet2.js` : 8 deep-dives → vérif → synthèse ; `workflow_formation.js` : intégration des données de formation → vérif → « ce qui change »). Le **2ᵉ chargement** a ajouté quatre collections (`formation-codes`, `formation-redemptions`, `modules`, `etablissements`) permettant le **typage formation réel** (§3) et le typage de tous les UAI. Définitions canoniques : **`DEFINITIONS_VOLET2.md`**. Sources de vérité : **`data/facts_cross.json`** (croisement) et **`data/facts_formation.json`** (cohortes/intention) ; cohortes détaillées dans `data/cohorts.csv`. Sorties pseudonymisées : `data/match_candidates.csv` (site = `S####`, Capytale = md5[:8]), `data/capytale_by_uai_*.csv`, `data/presentiel_etabs.csv`.

**Sécurité.** Le snapshot Payload contient des données personnelles : il reste local (gitignore), n'est jamais committé, et aucune sortie versionnée/publiée ne contient nom, prénom ou e-mail. Aucune ré-identification.
