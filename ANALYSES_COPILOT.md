# Analyses MathAData - Historique Copilot Chat

## Date : 4 Novembre 2025

### Analyse du professeur `2dbf95b5c5289b340cd53d7d7dd016ec`

#### 📊 Vue d'ensemble
- **2 lycées** : 0370035M (1 élève), 0180005H (11 élèves)
- **12 élèves uniques** au total
- **3 séances** détectées avec clustering temporel 2h
- **Activité** : 2548348 (utilisée de manière consistante)

#### 📅 Timeline des sessions

```
2024-04-19 10:47:17  ed695169ee0bf77296b66a11979925eb  (Lycée 0370035M - Test initial)
2024-04-30 09:57:22  e7724d6b1889360d5ae83b7d041509ec  (Lycée 0180005H - Test 1)
2024-05-05 21:29:20  1bedba9c25b2c05793a5702f1c69ac45  (Test à domicile - 21h29)
2024-05-13 08:22:32  08e92cb631ef97fe3a45073aaabb2634  ┐
2024-05-13 08:25:32  220008743f440b556be9f87cc7cf6782  │
2024-05-13 08:25:47  761bf01e72e97933d7bcad1c28184f8d  │
2024-05-13 08:26:26  d3955a0b0902a67ee4fd24b7f0fbc5a5  │  Séance en classe
2024-05-13 08:26:57  54ff47dcdda5f252cddd937edc006568  │  (10 élèves en 13 min)
2024-05-13 08:27:34  0f62a67c813bbe94d2910b2885ab984f  │
2024-05-13 08:30:48  1d2b301ac6d54c8f5d3ec297a8e64ea4  │
2024-05-13 08:30:57  83ad4097730688f58c68d4a4ab412542  │
2024-05-13 08:35:51  62379102bd28b77ec7094dae7ac0757e  ┘
```

#### 🔍 Analyses clés

**Question 1 : Même élève entre session 1 (30/04) et session 2 (05/05) ?**
- ❌ **NON** - Deux élèves différents
  - Session 1 (30/04) : `e7724d6b1889360d5ae83b7d041509ec`
  - Session 2 (05/05) : `1bedba9c25b2c05793a5702f1c69ac45`

**Question 2 : Élèves de la session 3 (13/05) avaient déjà testé ?**
- ❌ **NON** - Tous les 9 élèves de la session 3 sont **nouveaux**
- Aucun chevauchement avec les sessions précédentes

#### 💡 Scénario d'usage identifié

**Phase 1 - Tests pilotes (19/04 → 05/05)**
1. **19/04** : Test initial avec 1 élève du lycée 0370035M
2. **30/04** : Test avec un autre élève du lycée 0180005H
3. **05/05** : Test à domicile (21h29) avec un 3ème élève

**Phase 2 - Déploiement classe entière (13/05)**
- Séance synchronisée : 9 nouveaux élèves en 13 minutes (08:22-08:35)
- Pattern typique d'une activité en classe

#### 🎯 Conclusions

- **Stratégie de déploiement progressif** : 3 tests individuels → classe complète
- **Aucun élève n'a participé à plusieurs sessions** (12 élèves uniques, 12 sessions)
- **Pas de test professeur** : aucune session avec `Role="teacher"` détectée
- **Usage cohérent** : une seule activité (2548348) utilisée tout au long

---

## Commandes AWK utilisées

```bash
# Extraire tous les élèves avec timestamps
awk -F';' 'NR>1 {
  gsub(/"/, "", $2); gsub(/"/, "", $5); gsub(/"/, "", $6); gsub(/"/, "", $9);
  created=$2; student=$5; role=$6; teacher=$9;
  
  if (teacher == "2dbf95b5c5289b340cd53d7d7dd016ec" && role == "student") {
    print created, student;
  }
}' public/data/mathadata-V2.csv | while read epoch student; do
  date_str=$(date -r "$epoch" '+%Y-%m-%d %H:%M:%S')
  echo "$date_str $student"
done | sort
```

---

## Analyse du lycée 0931584S - Activité 3518185

### 📊 Vue d'ensemble
- **1 professeur** : 22fb0cee7e1f3bde58293de743871417
- **36 élèves uniques**
- **Activité** : 3518185
- **Lycée** : 0931584S

### 📅 Timeline des sessions

#### **Séance 1 : 07/03/2025 (après-midi)**
- **Création** : 07/03/2025 de 15:49 à 15:52 (14 élèves en 3 minutes)
- **Modifications** : 
  - 2 élèves terminent le jour même (15:49-15:53)
  - 12 élèves continuent le **12/03/2025** entre 11:08 et 12:02 (5 jours plus tard)

#### **Séance 2 : 12/03/2025 (matin)**
- **Création** : 12/03/2025 à 11:01 (1 élève)
- **Modification** : 12/03/2025 à 12:01 (même jour)

#### **Séance 3 : 19/03/2025 (matin)**
- **Création** : 19/03/2025 de 09:01 à 09:13 (21 élèves en 12 minutes)
- **Modifications** :
  - 18 élèves terminent le jour même entre 09:05 et 09:26 (20 minutes de travail)
  - 1 élève continue le soir à 21:10 (travail à domicile)
  - 1 élève continue le **22/03/2025** à 22:46 (3 jours plus tard, travail à domicile)

### 📊 Analyse temporelle

**Dates de création (created)**
- **Première session** : 07/03/2025 à 15:49:10
- **Dernière session** : 19/03/2025 à 09:13:07
- **Période totale** : 12 jours (du 7 au 19 mars 2025)

**Dates de modification (changed)**
- **Première modification** : 07/03/2025 à 15:49:40 (immédiate)
- **Dernière modification** : 22/03/2025 à 22:46:50 (travail à domicile)
- **Période totale** : 16 jours (du 7 au 22 mars 2025)

### 🔍 Patterns identifiés

1. **Séance en classe classique (19/03)** : 21 élèves lancent l'activité en 12 minutes
2. **Travail asynchrone** : 12 élèves de la 1ère séance continuent 5 jours plus tard (12/03)
3. **Continuité du travail** : 
   - 2 élèves travaillent à domicile le soir même (21:10)
   - 1 élève reprend 3 jours plus tard à domicile (22:46)
4. **Session rapide vs. session longue** :
   - Certains élèves terminent immédiatement (< 1 minute)
   - D'autres prennent 5 jours avec reprise en classe

### 💡 Scénario d'usage identifié

**Phase 1 - Lancement initial (07/03)**
- Séance en classe : 14 élèves démarrent simultanément
- Travail interrompu : la majorité reprend 5 jours plus tard

**Phase 2 - Session de rattrapage (12/03)**
- Les élèves de la séance 1 finalisent leur travail
- 1 nouvel élève démarre l'activité

**Phase 3 - Nouvelle classe (19/03)**
- Grande séance : 21 élèves (nouvelle cohorte)
- Meilleure complétion : 18/21 terminent le jour même
- Quelques prolongations à domicile

### 🎯 Conclusions

- **3 séances distinctes** sur 12 jours
- **Pattern "classe → reprise"** : activité commencée en classe, terminée plus tard
- **Engagement variable** : certains élèves terminent rapidement, d'autres sur plusieurs jours
- **Travail à domicile** : 2 élèves travaillent le soir/weekend
- **Professeur unique** mais **pas de test préalable** (aucune session role="teacher")

---

## Analyse du lycée 0930124E - Activité 3515488

### 📊 Vue d'ensemble
- **1 professeur** : 7d10577660e3d92685...
- **36 élèves uniques**
- **Activité** : 3515488
- **Lycée** : 0930124E
- **⚠️ Limite de l'algorithme détectée** : 2 séances fusionnées à tort

### 📅 Timeline détaillée

#### **Séance 1 : 31/03/2025 à 14:14-14:21 (7 minutes)**
- **19 élèves** lancent l'activité entre 14:14:25 et 14:21:35
- Lancement synchronisé → **classe en salle informatique**
- Travail effectué :
  - 6 élèves terminent immédiatement (< 1 minute)
  - 13 élèves travaillent entre 37 et 44 minutes (fin ~14:51-14:59)

```
14:14:25  8cd7a7ac3aeff976df31f563b07fee4e  (termine immédiatement)
14:14:42  10e2aa1cca09cc65091196abb4861654  (travaille 43 min)
14:14:42  493a3f95fb5294a905f519b8aa2dbeae  (travaille 44 min)
14:14:53  eeee5e5cd6f10a56eb6b9cbb10e137d8  (travaille 43 min)
14:14:56  2d996bdd056987148a3b5918a86f567d  (travaille 37 min)
14:15:06  6f415f958dd96cbcba560a2eac373dd8  (travaille 38 min)
14:15:15  e94fba39311934bb497c80defb1e3559  (termine immédiatement)
14:15:25  d82562f88560b08461d2ee27cc031105  (termine immédiatement)
14:15:28  96822491cb028f805bfae619f0646f66  (termine immédiatement)
14:15:45  48c6f962233a45628e514a6a665bb6bc  (travaille 37 min)
14:15:53  3a9096f2c9c163f5f0548ebf3da605f1  (travaille 43 min)
14:16:07  14623b719b4ed753b6492587c53eaf6b  (termine immédiatement)
14:17:00  0d3b70a8da7035ba549310964e9af1e6  (travaille 42 min)
14:17:48  99052c7fd2f8d3f396cf6dc9289c28e6  (travaille 34 min)
14:18:07  b0b81f5b246d3f15fbb0a795f2a795d2  (termine immédiatement)
14:18:53  ac228894351681b515f6da018ac76cbc  (termine immédiatement)
14:19:44  c919e6c6d8388c752747006ba36fe8e3  (travaille 39 min)
14:19:53  18621a91834ae942d91afd5f8bb3d0b0  (travaille 7 min)
14:21:35  a2dca43d6265b7e07e8f64282bf1fad8  (termine immédiatement)
```

#### **🔴 GAP de 1h05 sans activité (14:21 → 15:26)**

#### **Séance 2 : 31/03/2025 à 15:26-15:46 (20 minutes)**
- **17 nouveaux élèves** lancent l'activité entre 15:26:58 et 15:46:01
- **Classe différente** (cours suivant, même professeur)
- Travail effectué :
  - 4 élèves terminent immédiatement ou rapidement
  - 13 élèves continuent le **03/04/2025** (3 jours plus tard, entre 13:27 et 21:06)

```
15:26:58  dc4ab21d2e0035a1ec91ba7d02ec51c7  (termine immédiatement)
15:27:28  aec192be56bc0c45e0dee9ce68863c4a  (continue 03/04 14:05)
15:27:59  7ba81d50e0e4c31e3611d845dd58df25  (continue 03/04 13:27)
15:28:06  0a6d97bbb20225356cfe5ba138a77eda  (travaille 41 min)
15:28:19  507e18d0ff5decdf88b90ef93e8697b5  (continue 03/04 14:05)
15:28:25  aa04a077a7abbf689ed315891f01e630  (continue 03/04 14:05)
15:28:46  9fe023ead4866cf313f1d4960b7c71ed  (continue 03/04 14:03)
15:28:54  def0bf8862493503a68e412096b3d602  (continue 03/04 21:06 - soir)
15:29:09  0a7a67ce4e7198e45558be4ed64304c4  (continue 03/04 14:02)
15:29:21  fefc546ed5d8a2961c94feabc50e5ec0  (continue 03/04 14:05)
15:29:22  3445dd57c0ef7af9e1046bbfbb6d7a0d  (continue 03/04 13:37)
15:29:24  5f9b9f0808b0b4c8dee0fac3bf489015  (continue 03/04 14:02)
15:29:29  88879d778c350dc7081a5ce3314e8f8a  (travaille 35 min)
15:29:31  752a35ee7a436a757e9634015a00a9b8  (termine immédiatement)
15:29:33  75cb0657d60975426a894aedaa16a169  (termine immédiatement)
15:34:57  f8a450118e4ed9cb7efbe23bafdc6dc1  (termine immédiatement)
15:46:01  b6aa493a43e85a2ee8174e931d915e00  (travaille 3 min)
```

### 🔍 Pourquoi le clustering les a fusionnées ?

**L'algorithme de clustering 2h** mesure l'écart depuis le **premier lancement du cluster** :
- Premier lancement (séance 1) : **14:14:25**
- Dernier lancement (séance 2) : **15:46:01**
- **Écart total : 1h31 < 2h** ➡️ Les deux séances sont **fusionnées** !

### ⚠️ Problème identifié

L'algorithme ne détecte pas le **gap de 1h05** entre les deux séances :
- Dernier lancement séance 1 : 14:21:35
- Premier lancement séance 2 : 15:26:58
- **Écart : 1h05 sans aucune activité**

### 💡 Scénario réel

**2 classes distinctes sur 2 créneaux consécutifs** :
1. **Classe A (19 élèves)** : Cours de 14h, travail de 14:14 à ~15:00
2. **Classe B (17 élèves)** : Cours de 15h, lancement 15:26-15:46, reprise 3 jours plus tard

**Pattern typique de lycée** : Le professeur utilise 2 créneaux consécutifs pour faire travailler deux classes différentes sur la même activité.

### 🎯 Conclusions

- **En réalité : 2 séances distinctes** (pas 1 séance de 36 élèves)
- **Limite de l'algorithme détectée** : ne détecte pas les gaps significatifs
- **Pattern d'usage courant** : professeur avec plusieurs classes consécutives
- **Comportement différent** :
  - Classe A : majorité termine le jour même
  - Classe B : majorité reprend 3 jours plus tard (travail à domicile + rattrapage)
  - 1 élève travaille à domicile le soir (21:06)

### ✨ Recommandation d'amélioration

Pour mieux détecter ce type de situation, l'algorithme pourrait :
1. **Détecter les gaps** > 45-60 minutes dans le clustering
2. **Segmenter automatiquement** quand un gap est détecté
3. **Analyser la distribution temporelle** des lancements (bimodale = 2 séances)

### ✅ Amélioration appliquée (04/11/2025)

**Modification de l'algorithme de clustering** :
- **Avant** : Fenêtre temporelle de **2 heures** pour regrouper les sessions en séances
- **Après** : Fenêtre temporelle de **1 heure** pour regrouper les sessions en séances

**Impact** :
- Le lycée 0930124E sera maintenant correctement détecté comme **2 séances distinctes** au lieu d'une seule
- Gap de 1h05 entre les deux classes → désormais détecté comme 2 séances séparées
- Meilleure précision pour les professeurs ayant plusieurs classes consécutives

**Fichiers modifiés** :
- `components/Dashboard.tsx` :
  - `getEtablissementStats()` : Clustering 1h pour comptage des séances
  - `globalStats` : Clustering 1h pour statistiques globales  
  - `getClassActivityDetailsForUai()` : Clustering 1h pour affichage des séances par prof
  - `analyzeSeance()` : Détection de 2ème séance et travail prolongé > 1h

**Note** : Le nom de variable `continueApres2h` a été conservé pour la compatibilité, mais détecte maintenant le travail > 1h.

---

## Prochaines analyses possibles

- [ ] Comparer ce pattern avec d'autres professeurs
- [ ] Analyser la répartition géographique (2 lycées)
- [ ] Étudier le taux de réussite/complétion
- [ ] Identifier les patterns temporels (heures de cours)
- [x] ~~Améliorer l'algorithme de clustering (détection de gaps)~~ ✅ **Fait : fenêtre de 1h**

---

## Analyse du lycée 0590117G - Activité "Intro à l'IA" (2548348)

### 📊 Vue d'ensemble
- **Lycée** : 0590117G
- **Activité** : 2548348 "Intro à l'IA : classification de chiffres 2 et 7"
- **Période analysée** : Mai-Juin 2024
- **Pattern identifié** : Travail autonome / Accompagnement individualisé

### 📅 Timeline des séances en mai 2024

#### **Séance 1 - Jeudi 16 mai 2024 (matin)**
```
07:53:20 → Élève 550671a2... (lancé) → modifié 30/05 08:53 ⚠️ (14 jours plus tard!)
07:59:17 → Élève f37ed94f... (lancé) → modifié 16/05 08:54 (55min travail)
08:03:23 → Élève 87e663a8... (lancé) → modifié 16/05 08:55 (51min travail)
```
- **Durée de séance** : 10 minutes (3 élèves)
- **Durée de travail** : ~50-55 minutes pour 2 élèves
- **Cas particulier** : 1 élève continue 14 jours plus tard (20220 minutes!)

#### **Séance 2 - Jeudi 23 mai 2024 (matin)**
```
08:10:40 → Élève a7f74cf2... (lancé) → modifié 23/05 08:54 (43min travail)
```
- **1 seul élève**
- Durée de travail : 43 minutes

#### **Séance 3 - Jeudi 30 mai 2024 (matin)**
```
08:08:27 → Élève f48cedd6... (lancé) → modifié 30/05 08:50 (42min travail)
         + Élève 550671a2... termine son travail du 16/05
```
- **1 élève nouveau** + 1 qui finalise
- Durée de travail : 42 minutes

#### **Séance 4 - Jeudi 6 juin 2024 (matin)**
```
08:06:46 → Élève 778b3627... (lancé) → modifié immédiatement (0min)
```
- **1 élève**, pas de travail enregistré

### 🔍 Patterns identifiés

1. **Horaire constant** : Tous les **jeudis matin**, créneau **8h-9h**
2. **Petits effectifs** : **1 à 3 élèves** par séance
3. **Durée de travail** : ~40-55 minutes (durée typique d'une séance)
4. **Cas extrême** : Un élève (550671a2...) a lancé le 16/05 mais n'a terminé que le 30/05 (**14 jours = 336 heures**)

### 💡 Scénarios d'usage possibles

#### **Scénario A : Remédiation / Soutien**
- Petit groupe d'élèves en difficulté ou en besoin de rattrapage
- Accompagnement individualisé du professeur
- Progression échelonnée sur plusieurs semaines
- Créneau dédié le jeudi matin pour les élèves identifiés

#### **Scénario B : Élèves absents lors de la séance principale**
- Possibilité d'une séance de classe principale en mars (19/03 avec 5 élèves 16h26-17h01)
- Ces élèves de mai sont des **rattrapages individuels**
- Le jeudi matin = créneau officiel de rattrapage au lycée
- Professeur disponible pour accompagnement ponctuel

#### **Scénario C : Option / Atelier facultatif**
- Travail autonome proposé aux élèves volontaires
- Progression à leur rythme individuel
- Accompagnement léger du professeur (présence en salle)
- Initiative d'approfondissement pour élèves intéressés par l'IA

### 🎯 Élément notable : L'élève qui prend 14 jours

**Élève 550671a2b1035847393fe96d9a7715f6** :
- Lance le notebook le **16/05 à 07:53**
- Ne le termine que le **30/05 à 08:53**
- **Durée totale : 336 heures (14 jours)** ⚠️

**Interprétations possibles :**
1. **Notebook laissé ouvert** pendant 2 semaines (peu probable)
2. **Travail intermittent** sans sauvegardes intermédiaires détectées
3. **Reprise lors de la séance suivante** : Le 30/05 correspond exactement à la date de la séance 3
   - **Hypothèse la plus probable** : L'élève n'avait pas terminé le 16/05, et le professeur lui a demandé de finaliser lors de la séance du 30/05. Le système enregistre une seule modification finale.

### 📊 Comparaison avec séances classiques

**Différences avec les séances "classe entière"** :
- ❌ Pas de lancement synchronisé (3 élèves en 10 min vs. 20 élèves en 2 min)
- ❌ Effectifs très réduits (1-3 élèves vs. 15-30 élèves)
- ✅ Durée de travail similaire (~40-55 min)
- ✅ Horaire fixe et récurrent (jeudi matin)

**Similitudes avec travail autonome** :
- ✅ Progression individuelle à différentes dates
- ✅ Reprise possible plusieurs jours après
- ✅ Créneau dédié et prévisible

### 🎯 Conclusions

Le lycée 0590117G utilise l'activité "Intro à l'IA" en **mode accompagnement individuel** sur plusieurs semaines :
- **Créneau fixe** : Jeudi matin 8h-9h pour permettre aux élèves de travailler
- **Effectifs réduits** : 1 à 3 élèves par séance = suivi personnalisé
- **Continuité assurée** : Les élèves peuvent reprendre d'une séance à l'autre
- **Flexibilité temporelle** : Jusqu'à 14 jours pour finaliser le travail

**Usage probable** : Système de **rattrapage organisé** ou **accompagnement personnalisé** pour élèves absents ou en difficulté, avec un créneau dédié hebdomadaire.

### 🔍 Validation avec séance classique antérieure

Pour compléter l'analyse, une séance "classe normale" a été identifiée :
- **19 mars 2024 à 16h26-17h01** : 5 élèves lancent l'activité en quelques secondes
- Durée de travail : 31-34 minutes
- Pattern synchrone typique d'une séance en classe

**Conclusion** : Le lycée 0590117G utilise la même activité dans **deux contextes différents** :
1. **Mars** : Séance de classe standard avec plusieurs élèves
2. **Mai-Juin** : Accompagnement individuel/rattrapage sur créneau dédié

---

## Analyse du lycée 0601863Z - Tests enseignants uniquement

### 📊 Vue d'ensemble
- **0 élève** ayant utilisé MathAData
- **2 professeurs uniques** ont testé les activités
- **5 activités différentes** testées
- **Période** : Février à Mars 2025

### 👥 Professeurs identifiés

**Professeur A** : `4a00ec743cd160ce59b375e9d7e4696a`
**Professeur B** : `bce8cad7949fc4fbc98789c5303a7a3c`

### 📅 Timeline complète des tests

#### **Professeur A - 22 février 2025 (après-midi)**
```
15:32:43 → Activité 4388355 (Séance Python MNIST)
           → Modification immédiate (0min)

15:36:16 → Activité 3515488 (Géométrie du plan - MNIST)
           → Modification 02/03 11:26 (8 jours plus tard = 11270min)

15:47:39 → Activité 2548348 (Intro à l'IA - classification 2 et 7)
           → Modification immédiate (0min)

17:43:28 → Activité 3534169 (Challenge IA MNIST - meilleur pixel)
           → Modification immédiate (0min)
```

#### **Professeur A - 20 mars 2025 (après-midi)**
```
13:22:28 → Activité 3518185 (Statistiques pour classification MNIST)
           → Modification 20/03 13:58 (35min travail)
```

#### **Professeur B - 18-20 mars 2025**
```
18/03 17:55:19 → Activité 2548348 (Intro à l'IA)
                 → Modification 27/03 22:21 (9 jours plus tard = 13225min)

19/03 20:09:02 → Activité 3534169 (Challenge IA MNIST)
                 → Modification 19/03 20:29 (20min travail)

20/03 09:54:59 → Activité 3518185 (Statistiques MNIST)
                 → Modification 27/03 22:35 (7,5 jours plus tard = 10840min)
```

### 🔍 Patterns de travail identifiés

#### **Professeur A - Découverte rapide**
- **Session concentrée** : 22/02 de 15h32 à 17h43 (2h11)
- **4 activités testées** en quelques heures
- **Pattern "survol"** : 3 activités avec modification immédiate (0min)
- **1 activité approfondie** : Géométrie du plan (modification 8 jours après)
- **Retour ponctuel** : 1 mois plus tard (20/03) pour tester Statistiques (35min)

#### **Professeur B - Test approfondi**
- **3 activités testées** sur 3 jours consécutifs (18-20 mars)
- **1 test rapide** : Challenge IA (20min)
- **2 tests approfondis** : Intro IA (9 jours) + Statistiques (7,5 jours)
- **Finition groupée** : Les 2 activités longues terminées le même soir (27/03 ~22h)

### 📊 Activités testées

| ID | Nom | Prof A | Prof B | Durée max |
|---|---|---|---|---|
| **2548348** | Intro à l'IA (2 et 7) | 0min | 13225min (9j) | Long |
| **3515488** | Géométrie du plan | 11270min (8j) | - | Long |
| **3518185** | Statistiques MNIST | 35min | 10840min (7,5j) | Moyen/Long |
| **3534169** | Challenge IA (pixel) | 0min | 20min | Court |
| **4388355** | Séance Python MNIST | 0min | - | Court |

### 💡 Scénarios d'usage identifiés

#### **Scénario A : Phase de découverte (Professeur A - 22/02)**
- **But** : Explorer rapidement plusieurs activités MathAData
- **Méthode** : Lancement rapide (survol) de 4 activités en 2h
- **Sélection** : 1 activité retenue pour approfondissement (Géométrie)
- **Timeline** : Finalisation 8 jours plus tard = temps de réflexion/préparation

#### **Scénario B : Préparation pédagogique (Professeur B - 18-20/03)**
- **But** : Tester en profondeur avant déploiement classe
- **Méthode** : Travail sérieux sur 2-3 activités sélectionnées
- **Pattern** : Lancement initial + travail étalé sur plusieurs jours
- **Finition groupée** : Reprise finale le 27/03 au soir = correction avant mise en classe?

#### **Scénario C : Collaboration entre collègues**
- **Prof A teste** les activités en février → partage avec Prof B
- **Prof B approfondit** en mars les activités recommandées
- **Calendrier** : Gap de 1 mois entre les deux = temps de discussion/décision
- **Activités communes** : Intro IA, Challenge IA, Statistiques

### 🎯 Observations clés

1. **Aucun déploiement élève détecté** 
   - Tests enseignants uniquement = phase d'exploration
   - Possible déploiement prévu après mars 2025

2. **2 styles de test différents**
   - Prof A : Découverte large et rapide (4 activités)
   - Prof B : Test approfondi et méthodique (3 activités)

3. **Temporalité des modifications**
   - **Modifications immédiates** (0min) = Simple consultation/survol
   - **Modifications longues** (7-9 jours) = Travail approfondi avec reprises
   - **Modifications courtes** (20-35min) = Test complet en une fois

4. **Travail en soirée** (Professeur B)
   - Finalisation le 27/03 à 22h21 et 22h35
   - Suggère travail à domicile pour préparation pédagogique

5. **Activités privilégiées**
   - **Intro à l'IA** et **Statistiques MNIST** = testées par les 2 profs
   - **Challenge IA** = testé rapidement (20min max)
   - **Géométrie du plan** = uniquement Prof A (approfondissement)

### 🎓 Hypothèse finale

**Phase de préparation collective** :
1. **Février** : Professeur A découvre MathAData et teste 4 activités
2. **Mars** : Professeur B rejoint et teste 3 activités en profondeur
3. **Collaboration** : Échange entre collègues sur les activités pertinentes
4. **État actuel** : Préparation terminée, déploiement élève non encore effectué

**Possibilités** :
- Déploiement prévu pour avril-mai 2025
- Attente de formation/accompagnement
- Tests pour décision d'équipe (adoption MathAData ou non)
- Projet pilote en cours de construction

### 🎯 Conclusions

- **Phase d'exploration sans déploiement** : Lycée en phase de test/découverte
- **2 profils enseignants complémentaires** : Découvreur rapide + Testeur méthodique
- **Collaboration probable** : Tests espacés d'1 mois avec activités communes
- **Préparation sérieuse** : Modifications longues (7-9j) indiquent travail approfondi
- **Aucune session élève** : Pas encore de mise en classe effective

---

## Prochaines analyses suggérées

- [ ] Analyser d'autres lycées avec pattern "tests enseignants seuls"
- [ ] Identifier les lycées en phase d'exploration vs. déploiement effectif
- [ ] Étudier la corrélation entre durée de test prof et déploiement classe
- [ ] Comparer les activités privilégiées en phase de découverte


