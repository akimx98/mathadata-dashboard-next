# Ressources et contenus : ce que les profs consultent  [verdict: corrections_mineures]

## Le PDF règne, et le « kit clé en main » structure la consultation

Sur les 12 840 clics de ressources journalisés (`consultation_rss`, comptes de test exclus, 712 utilisateurs identifiés), le **PDF représente 80,8 %** des clics (10 381). Les liens interactifs sont minoritaires : Capytale 9,6 % (1 228), Basthon 4,1 % (526), Overleaf 3,2 % (415), diapositives ODP éditables 1,9 % (238). Autrement dit, les profs téléchargent massivement des documents figés (énoncés, diapos, déroulés) avant de toucher au notebook. Ce ratio confirme que le site fonctionne d'abord comme une **bibliothèque de préparation**, et seulement ensuite comme une porte d'entrée vers la classe numérique.

En regroupant par fonction pédagogique, la hiérarchie est nette : **version élève** (4 675 clics, 497 profs) devance les **diapos élève** (2 417 clics, 507 profs), la **version prof** des notebooks (2 054, 324 profs), les **liens Capytale** (1 228, 337), les **diapos prof** (891, 287), Basthon (526), Overleaf (415), le **jeu de cartes MNIST** (277) et le **guide de connexion Capytale** (228, 96 profs). Le prof consulte donc d'abord ce qu'il distribuera à ses élèves, puis son propre déroulé.

## Une activité phare écrase les autres : la vitrine Stat

La séquence **Statistiques (moyenne/histogramme, MNIST)** concentre l'essentiel de la consultation : 2 192 clics rien que sur ses fiches version élève, 1 584 vues de module, et 598 clics sur son lien Capytale (`/web/b/3518185`). C'est cohérent avec son statut de **vitrine** (seule activité accessible sans compte). L'**Équation réduite** (act. 3515488) arrive deuxième sur tous les fronts : 816 clics version élève, 862 vues de module, 237 clics Capytale. Viennent ensuite Stat santé fœtus, Droite/produit scalaire et Milieu/distance.

Détail révélateur du lien site→Capytale : si l'on compte les utilisateurs distincts qui cliquent un lien Capytale depuis le site, **Équation réduite (122) talonne Stat (116)** alors qu'elle pèse beaucoup moins en clics bruts — signe d'un public plus resserré mais décidé, typique d'une activité poussée en **formation de profs**. À l'opposé, l'ancienne **Intro à l'IA (act. 2548348) est quasi invisible** côté site : 3 clics, 2 utilisateurs. Elle n'est pas référencée sur mathadata.fr et ne se trouve que via Capytale : sa « porte » n'existe pas dans le funnel site.

## Le décrochage par séance : on prépare le début, rarement la fin

En suivant les fiches version élève de la séquence Stat MNIST par numéro de séance, on observe une **chute monotone** : 1 124 clics en séance 1 (Introduction), 312 en séance 2, puis 172, 182, 127, 143 et **132 en séance 7** — soit une rétention d'environ **12 %** entre la première et la dernière séance. Tous corpus confondus, la séance 1 capte 2 302 clics contre 134 pour la séance 7. Cela traduit soit un usage partiel (les profs ne mènent que les premières séances), soit une préparation anticipée concentrée sur l'entrée en matière.

## Formés vs nouveaux : la formation crée des consultants assidus

Les profs **formés consultent deux fois plus en profondeur** : 15,0 clics/utilisateur et 8,7 ressources distinctes en moyenne, contre 8,8 clics et 6,4 ressources pour les non-formés. La distinction par type de formation est frappante : les profs issus du **webinaire (webdecouv)** sont les plus boulimiques (22,1 clics/utilisateur, 12,1 ressources distinctes), bien au-delà du **présentiel** (10,6 clics, 6,5 ressources). Le webinaire, à distance, semble pousser à un rapatriement intensif des documents ; le présentiel, où le formateur montre tout, réduit ce besoin. Le mix de types reste proche (PDF ~76-83 % partout), mais la part Capytale est plus forte chez les formés (14,1 % vs 8,2 %), confirmant qu'ils vont plus loin vers la classe.

## Le guide Capytale, marqueur de passage à l'acte

Le **guide de connexion Capytale** (228 clics, 96 profs) est un signal de transition fort : **74 % de ses lecteurs cliquent aussi un lien Capytale**. Qui télécharge le mode d'emploi de connexion s'apprête à amener ses élèves sur la plateforme.

## Vidéos : un contenu très consulté en anonyme

Les vidéos sont massivement vues sans authentification (**1 566 ouvertures anonymes sur 1 858**, 153 visionneurs identifiés seulement). Les plus regardées sont « Les machines à trier des lettres à la Poste » (75), « Les mathématiques au cœur de l'IA » (47), « Les objectifs du projet » (44) et les vidéos de séance. La vidéo outil **« Utiliser les notebook Capytale »** n'enregistre que 16 ouvertures : la prise en main technique passe davantage par le guide PDF que par la vidéo.

## KEY STATS
- Clics ressources journalises (comptes de test exclus): 12 840  (PDF=10381, capytale=1228, basthon=526, overleaf=415, slides_odp=238; src: consultation_rss.json, exclude_from_analytics filtre ; 712 users identifies distincts)
- Part du PDF dans les clics ressources: 80,8 %  (Le site est d'abord une bibliotheque de preparation; src: consultation_rss ctype : 10381/12840)
- Clics fiches 'version eleve' (top categorie): 4 675 clics / 497 profs  (devant diapos eleve (2417), version prof (2054), liens Capytale (1228); src: consultation_rss, file contient 'version_eleve')
- Activite Stat (vitrine) - clics Capytale depuis le site: 598 clics / 116 profs  (Equation reduite 2e : 237 clics mais 122 profs distincts (public resserre 'formation'); src: consultation_rss capytale /web/b/3518185)
- Intro a l'IA (ancienne activite) cote site: 3 clics / 2 profs  (non referencee sur le site ; porte Capytale inexistante dans le funnel; src: consultation_rss capytale /web/b/2548348)
- Retention de consultation seance 1 -> seance 7 (Stat MNIST eleve): ~12 %  (chute monotone ; preparation concentree sur l'entree en matiere; src: version_eleve 2NDE_STAT_moyenne_histogramme_MNIST : 1124 clics seance1, 132 seance7)
- Profondeur de consultation : formes vs nouveaux: 15,0 vs 8,8 clics/prof  (ressources distinctes/prof : 8,7 (formes) vs 6,4 (nouveaux); src: consultation_rss jointe statut users ; 224 formes vs 488 nouveaux)
- Profondeur webinaire vs presentiel (formes): 22,1 vs 10,6 clics/prof  (webdecouv = 12,1 ressources distinctes/prof, le double du presentiel (6,5); src: trainedTypeFormation : 86 webdecouv vs 138 presentiel parmi consultants identifies)
- Guide connexion Capytale -> clic Capytale: 74 %  (marqueur de passage a l'acte vers la classe; src: consultation_rss : 71/96 lecteurs du guide cliquent aussi un lien Capytale)
- Videos : ouvertures anonymes: 1 566 / 1 858  (seulement 153 visionneurs identifies ; 'Utiliser notebook Capytale' = 16 ouvertures; src: events video_view ; user null)

## CASE STUDIES
### Le webinaire produit des 'aspirateurs de ressources'
Les 86 profs formes en webinaire (webdecouv) presents dans le journal de clics cumulent 1 901 clics, soit 22,1 clics et 12,1 ressources distinctes par personne en moyenne - plus du double des profs formes en presentiel (10,6 clics, 6,5 ressources). A distance, sans support physique du formateur, ces enseignants rapatrient systematiquement diapos eleve, fiches version eleve et deroules prof. Le presentiel, ou tout est montre en seance, genere une consultation plus parcimonieuse.

### Equation reduite : l'activite 'de formation' au public resserre
Cote site, l'Equation reduite genere 237 clics Capytale, bien moins que les 598 de la vitrine Stat ; pourtant elle reunit 122 profs distincts contre 116 pour Stat. Cette signature - peu de clics, beaucoup de profs - est celle d'une activite poussee en formation : chaque prof clique une fois, deliberement, apres l'avoir vue en seance. La repartition formes/nouveaux y est equilibree (62/60), conforme a une activite institutionnelle plutot qu'a une trouvaille de curieux.

### Une sequence preparee au debut, rarement jusqu'au bout
Sur la sequence Statistiques MNIST (version eleve), les fiches passent de 1 124 clics en seance 1 (Introduction) a 132 en seance 7 - une retention de 12 %. Le meme effet d'entonnoir s'observe toutes sequences confondues (2 302 clics en seance 1, 134 en seance 7). Soit les profs ne menent que les premieres seances, soit ils preparent d'abord l'entree en matiere et improvisent ou abandonnent la suite. Un signal a recouper avec l'usage Capytale reel en classe.

## CHART SPECS
- [hbars] Clics ressources par categorie pedagogique (consultation_rss, comptes test exclus): [{"label":"Version eleve (fiches)","clics":4675,"profs":497},{"label":"Diapos eleve","clics":2417,"profs":507},{"label":"Version prof (deroule)","clics":2054,"profs":324},{"label":"Liens Capytale","clics":1228,"profs":337},{"label":"Diapos prof","clics":891,"profs":287},{"label":"Basthon","clics":526,"profs":143},{"label":"Overleaf","clics":415,"profs":146},{"label":"Jeu de cartes MNIST","clics":277,"profs":45},{"label":"Guide connexion Capytale","clics":228,"profs":96}]
- [line] Decrochage de consultation par seance - Stat MNIST version eleve: [{"seance":1,"clics":1124},{"seance":2,"clics":312},{"seance":3,"clics":172},{"seance":4,"clics":182},{"seance":5,"clics":127},{"seance":6,"clics":143},{"seance":7,"clics":132}]
- [bars] Profondeur de consultation : effet et type de formation (clics par prof): [{"groupe":"Nouveaux","clics_par_prof":8.8,"ressources_distinctes":6.4},{"groupe":"Formes presentiel","clics_par_prof":10.6,"ressources_distinctes":6.5},{"groupe":"Formes webinaire","clics_par_prof":22.1,"ressources_distinctes":12.1}]
- [hbars] Liens Capytale depuis le site : profs distincts par activite: [{"activite":"Equation reduite","profs":122,"clics":237},{"activite":"Stat classification (vitrine)","profs":116,"clics":598},{"activite":"Stat sante foetus","profs":77,"clics":117},{"activite":"Geometrie reperee","profs":60,"clics":103},{"activite":"Droite produit scalaire","profs":58,"clics":102},{"activite":"Eq cartesienne/vecteur","profs":45,"clics":68},{"activite":"Intro a l'IA (ancienne)","profs":2,"clics":3}]

## CORRECTIONS (verif)
- Affirmation 1 (12 840 clics) : dissocier les denominateurs. 12 840 = clics totaux test exclu, INCLUANT 5 197 clics anonymes ; les '712 users identifies distincts' ne couvrent que 7 643 lignes nominatives. Reformuler en : '12 840 clics, dont 7 643 attribuables a 712 profs identifies'. Tous les sous-totaux par fonction (PDF, version_eleve, etc.) reposent sur le frame 12 840 (anonymes inclus) : a preciser, sinon le lecteur croit a tort que '497 profs' et '4 675 clics' partagent le meme univers d'attribution.
- Affirmation 6 (retention) : remplacer 'chute monotone' par 'globalement decroissante' : s4 (182) > s3 (172) et s6 (143) > s5 (127). Le ~12 % final est correct.
- Affirmation 10 (video notebook Capytale) : corriger '16 ouvertures' en '68 ouvertures (dont 16 par des profs identifies)'. Le 16 est le sous-ensemble identifie, pas le total.
- Affirmations 7 et 8 (profondeur formes/nouveaux, webinaire/presentiel) : chiffres exacts mais endogenes. Ajouter une mise en garde explicite anti-causalite : les profs formes (et a fortiori les inscrits webinaire) sont auto-selectionnes parmi les plus engages ; la difference de profondeur de consultation ne mesure pas un effet de la formation.
- Affirmation 9 (guide->Capytale) : le ratio ~74-75 % tient, mais les effectifs absolus dependent de la definition du 'guide' (201 clics / 89 lecteurs pour le seul Guide_Connexion_Capytale.pdf ; la prose annonce 228/96 en agregeant d'autres guides). Harmoniser la definition et noter qu'aucun ordre temporel guide->clic n'est verifie (correlation intra-prof, pas passage a l'acte demontre).
## FLAGS
- Le tracking consultation_rss demarre le 27 nov 2025 : les profs anciens sont sous-captures cote site. Les 712 consultants identifies ne sont pas un denombrement complet des profs ayant prepare le TP.
- Categorisation des fichiers faite par heuristique sur le chemin ('version_eleve','Diapo','Prof_Diapo','Guide_aide'...). Quelques fichiers rares (web/autre_pdf, 129 clics) ne sont pas finement classes.
- consultation_rss et events.resource_download se recoupent (deux mecanismes de log pour le meme clic) : je n'ai PAS additionne les deux. Les analyses de detail s'appuient sur consultation_rss (source privilegiee du dashboard) ; events n'est utilise que pour le croisement par resourceType et videos.
- Les 'clics Capytale par activite' cote site recalcules ici en utilisateurs distincts (Equation reduite 122, Stat 116, Intro-IA 2) concordent avec capytale_clicks_by_activity de facts_cross.json (122/116/2). Les comptes en clics bruts (Stat 598 > Equation 237) different car facts_cross compte les utilisateurs distincts, pas les clics : pas de contradiction, granularite differente, signalee.
- Videos massivement anonymes (1566/1858 ouvertures sans user) : l'analyse 'qui regarde quoi' est tres partielle ; les comptages par titre melent anonymes et identifies. La duree de visionnage (watchDurationSeconds) est un temps modale ouverte, pas un temps reellement regarde (valeurs aberrantes : 'Objectifs du projet' moyenne 1389 s, onglet laisse ouvert).
- Le decrochage par seance est mesure sur les clics de preparation, pas sur l'usage reel en classe (qui se mesure cote Capytale). Une faible consultation des dernieres seances n'implique pas necessairement leur non-utilisation.