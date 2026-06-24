# Prompt d'analyse LLM - MathAData Teacher Usage Patterns

## CONTEXTE DU PROJET

### À propos de MathAData
MathAData est une plateforme éducative permettant aux professeurs de lycée et collège d'utiliser des notebooks Jupyter interactifs pour enseigner les mathématiques, les statistiques et l'intelligence artificielle. Les professeurs peuvent :
1. **Tester les activités** en mode "teacher" (tester seuls avant utilisation en classe)
2. **Déployer en classe** en mode "student" (faire travailler leurs élèves)

### Objectif de cette analyse
Vous devez analyser les patterns d'usage des professeurs à partir de données réelles d'utilisation. Votre mission est de :
- Identifier et caractériser les **scénarios d'adoption** (test-first vs direct, exploratoire, collaboratif, etc.)
- Détecter les **patterns temporels** et **comportements pédagogiques** (classes multiples, devoirs maison, sessions de reprise, etc.)
- Calculer des **métriques et statistiques** pertinentes pour chaque professeur
- Émettre des **hypothèses** sur les contextes et motivations d'usage
- Rédiger une **synthèse structurée** avec données chiffrées et exemples illustratifs

---

## DONNÉES DISPONIBLES

### Source
Les données proviennent d'un CSV de 2106 lignes de logs d'utilisation, couvrant 114 professeurs et 12455 établissements scolaires en France.

### Champs importants
- **teacher_id** : Identifiant anonymisé du professeur
- **student_id** : Identifiant anonymisé de l'élève (ou null si test prof)
- **Role** : `"teacher"` = professeur teste seul, `"student"` = activité utilisée en classe avec des élèves
- **activity_id** : Identifiant de l'activité pédagogique (notebook)
- **activity_title** : Titre de l'activité (ex: "Intro à l'IA", "Statistiques MNIST")
- **uai_teach** : Code UAI de l'établissement du professeur
- **uai_el** : Code UAI de l'établissement des élèves
- **created** : Timestamp de création (lancement du notebook) en millisecondes
- **changed** : Timestamp de dernière modification (travail terminé/sauvegardé) en millisecondes

### Algorithme de clustering
Les sessions sont regroupées en **séances** avec une **fenêtre temporelle de 1 heure** :
- Si plusieurs élèves lancent l'activité dans un intervalle ≤ 1h → **même séance** (cours en classe)
- Si délai > 1h → **séances distinctes**

### Indicateurs clés pré-calculés

#### Au niveau professeur
- **adoption_style** : `cautious_adopter` (teste avant d'enseigner), `confident_direct` (enseigne directement), `explorer_tester` (teste beaucoup mais n'enseigne pas), `mixed_approach`
- **conversion_rate** : Proportion d'activités testées puis enseignées
- **uses_multiple_classes** : Boolean - utilise avec plusieurs classes différentes
- **encourages_home_work** : Boolean - détecte si élèves travaillent à domicile (soir/weekend)
- **does_follow_up_sessions** : Boolean - détecte si 2èmes séances organisées (reprise >1h après fin de séance)
- **home_work_rate** : Taux moyen d'élèves travaillant à domicile
- **second_session_rate** : Taux de séances avec une 2ème séance de reprise

#### Au niveau séance
- **time_pattern** : `morning_weekday`, `afternoon_weekday`, `evening_weekday`, `night_weekday`, `morning_weekend`, etc.
- **continuation_rate** : Proportion d'élèves ayant continué à travailler >1h après la fin de séance
- **had_second_session** : Boolean - si ≥2 élèves reviennent >1h après la fin de séance initiale
- **is_same_students_as_previous** : Boolean - si la séance utilise les mêmes élèves que la précédente (même classe)
- **overlap_rate** : Taux de chevauchement des élèves entre séances consécutives

---

## STRUCTURE DU JSON

```json
{
  "metadata": {
    "date_export": "ISO timestamp",
    "total_usages": 2106,
    "total_teachers": 114,
    "total_schools": "N",
    "clustering_window_ms": 3600000,
    "clustering_window_description": "1 hour"
  },
  "teachers": [
    {
      "teacher_id": "hash_unique",
      "profile": {
        "schools": [
          {
            "uai": "0123456A",
            "name": "Lycée Victor Hugo",
            "city": "Paris",
            "academie": "Paris",
            "type": "Lycée",
            "sector": "Public",
            "ips": 120.5
          }
        ],
        "total_activities": 5,
        "total_sessions": 12,
        "unique_students": 87,
        "teaching_period": {
          "first_usage": "2025-02-01T08:30:00Z",
          "last_usage": "2025-03-15T14:22:00Z",
          "duration_days": 42
        }
      },
      "activities": [
        {
          "activity_id": "3518185",
          "activity_name": "Statistiques pour classification MNIST",
          "adoption_pattern": {
            "tested_first": true,
            "test_sessions": [
              {
                "timestamp": "2025-02-10T15:32:00Z",
                "duration_minutes": 35,
                "work_pattern": "afternoon_weekday"
              }
            ],
            "time_between_test_and_teaching_days": 5
          },
          "teaching_sessions": [
            {
              "session_number": 1,
              "uai": "0123456A",
              "date": "2025-02-15",
              "timestamp_start": "2025-02-15T10:00:00Z",
              "time_pattern": "morning_weekday",
              "students": [
                {
                  "student_id": "hash_eleve_1",
                  "created": "2025-02-15T10:00:00Z",
                  "changed": "2025-02-15T10:45:00Z",
                  "work_duration_minutes": 45,
                  "continued_after_1h": false,
                  "work_at_home": false
                }
              ],
              "session_stats": {
                "nb_students": 28,
                "avg_work_duration_minutes": 42,
                "continuation_rate": 0.14,
                "home_work_rate": 0.07,
                "had_second_session": true,
                "second_session_date": "2025-02-18T14:00:00Z",
                "second_session_students": 12,
                "time_pattern": "morning_weekday"
              },
              "tested_first": "yes",
              "days_between_test_and_teaching": 5,
              "is_same_students_as_previous": null,
              "overlap_rate": 0
            }
          ],
          "activity_summary": {
            "total_teaching_sessions": 3,
            "total_unique_students": 72,
            "used_with_multiple_classes": true,
            "success_indicators": {
              "high_continuation": true,
              "home_work_observed": true,
              "second_sessions_observed": true,
              "repeated_usage": true
            }
          }
        }
      ],
      "behavior_analysis": {
        "adoption_style": "cautious_adopter",
        "testing_before_teaching": true,
        "nb_activities_tested_only": 1,
        "nb_activities_taught": 4,
        "conversion_rate": 0.8,
        "teaching_patterns": {
          "uses_multiple_classes": true,
          "encourages_home_work": true,
          "does_follow_up_sessions": true,
          "average_class_size": 26,
          "home_work_rate": 0.15,
          "second_session_rate": 0.33
        },
        "timeline": [
          {
            "timestamp": "2025-02-10T15:32:00Z",
            "event_type": "test",
            "activity_id": "3518185",
            "student_id": null,
            "uai": "0123456A"
          },
          {
            "timestamp": "2025-02-15T10:00:00Z",
            "event_type": "teaching_session",
            "activity_id": "3518185",
            "student_id": "hash_eleve_1",
            "uai": "0123456A"
          }
        ]
      }
    }
  ],
  "school_summaries": [
    {
      "uai": "0123456A",
      "name": "Lycée Victor Hugo",
      "nb_teachers": 3,
      "teachers": ["hash1", "hash2", "hash3"],
      "usage_pattern": "progressive_deployment",
      "evidence": "Multiple teachers, Tests followed by teaching"
    }
  ]
}
```

---

## EXEMPLES D'ENQUÊTES À MENER

Voici des exemples d'analyses approfondies menées manuellement sur des cas spécifiques. Vous devez conduire le **même type d'investigations** mais à grande échelle sur tous les professeurs.

### Exemple 1 : Professeur avec déploiement progressif

**Cas** : Professeur `2dbf95b5c5289b340cd53d7d7dd016ec`

**Observations** :
- 2 lycées (0370035M avec 1 élève, 0180005H avec 11 élèves)
- 12 élèves uniques total
- 3 séances détectées
- 1 seule activité (2548348) utilisée

**Timeline** :
```
2024-04-19 10:47  →  1 élève lycée A (test initial)
2024-04-30 09:57  →  1 élève lycée B (test)
2024-05-05 21:29  →  1 élève (travail à domicile - 21h29)
2024-05-13 08:22  →  10 élèves en 13 minutes (classe complète)
```

**Questions posées** :
1. Est-ce le même élève entre les sessions 1 et 2 ? → NON, deux élèves différents
2. Les élèves de la session 3 avaient-ils déjà testé ? → NON, tous nouveaux

**Scénario identifié** :
- **Phase 1 (19/04 → 05/05)** : Tests pilotes avec 3 élèves individuels
- **Phase 2 (13/05)** : Déploiement classe entière (10 élèves)
- **Stratégie** : Déploiement progressif (tests → classe complète)

**Conclusions** :
- Stratégie de déploiement progressif
- Aucun élève n'a participé à plusieurs sessions
- Pas de test professeur (pas de Role="teacher")
- Usage cohérent d'une seule activité

---

### Exemple 2 : Professeur avec classes multiples et reprises

**Cas** : Lycée `0931584S` - Professeur `22fb0cee7e1f3bde58293de743871417`

**Observations** :
- 36 élèves uniques
- Activité 3518185
- 3 séances sur 12 jours

**Timeline** :
```
07/03/2025 15:49-15:52  →  14 élèves lancent (3 min)
  → 2 élèves terminent immédiatement
  → 12 élèves continuent le 12/03 (5 jours plus tard!)

12/03/2025 11:01  →  1 nouvel élève
  → Termine le même jour 12/03 12:01

19/03/2025 09:01-09:13  →  21 élèves lancent (12 min)
  → 18 terminent le jour même
  → 1 élève continue le soir (21h10 - travail maison)
  → 1 élève continue 3 jours plus tard (22/03 22h46 - travail maison)
```

**Pattern identifié** :
- **Séance 1** : Travail interrompu, majorité reprend 5 jours après
- **Séance 2** : Session de rattrapage pour 1 élève
- **Séance 3** : Nouvelle classe, meilleure complétion (18/21 terminent immédiatement)

**Conclusions** :
- Pattern "classe → reprise" : activité commencée en classe, terminée plus tard
- Engagement variable : certains terminent rapidement, d'autres sur plusieurs jours
- Travail à domicile détecté (soir/weekend)
- Pas de test professeur préalable

---

### Exemple 3 : Limite de l'algorithme - 2 classes consécutives

**Cas** : Lycée `0930124E` - Activité `3515488`

**Observation initiale** : 1 séance de 36 élèves détectée

**Analyse approfondie** :
```
14:14-14:21  →  19 élèves lancent (7 min)
  → 6 terminent immédiatement
  → 13 travaillent 37-44 minutes

[GAP de 1h05 sans activité]

15:26-15:46  →  17 NOUVEAUX élèves lancent (20 min)
  → 4 terminent rapidement
  → 13 continuent 3 jours plus tard (03/04)
```

**Problème détecté** : 
- Le clustering 2h a fusionné 2 séances distinctes
- Gap de 1h05 entre les deux groupes
- 19 élèves ≠ 17 élèves = deux classes différentes

**Scénario réel** :
- Professeur avec 2 créneaux consécutifs (14h puis 15h)
- 2 classes distinctes travaillant sur la même activité
- Pattern typique de lycée (plusieurs classes pour un prof)

**Solution appliquée** : Réduction de la fenêtre de clustering à 1h

---

### Exemple 4 : Accompagnement individualisé

**Cas** : Lycée `0590117G` - Activité `2548348`

**Observations** :
- Tous les **jeudis matin 8h-9h** pendant 4 semaines
- **1 à 3 élèves par séance** (très petit effectif)
- Durée de travail : 40-55 minutes (normale)
- 1 élève a pris 14 jours pour terminer (lancé 16/05, fini 30/05)

**Timeline** :
```
Jeudi 16/05 à 08h  →  3 élèves (1 termine 14 jours plus tard!)
Jeudi 23/05 à 08h  →  1 élève
Jeudi 30/05 à 08h  →  1 élève nouveau + élève du 16/05 termine
Jeudi 06/06 à 08h  →  1 élève
```

**Scénarios possibles** :
1. **Remédiation/Soutien** : Petit groupe en difficulté, accompagnement individualisé
2. **Élèves absents** : Rattrapage pour élèves ayant manqué séance principale
3. **Option/Atelier** : Travail autonome volontaire, progression à leur rythme

**Conclusions** :
- Créneau fixe dédié (jeudi 8h) = organisé institutionnellement
- Effectifs réduits = suivi personnalisé
- Continuité assurée d'une séance à l'autre (élève reprend 14 jours après)
- Pattern très différent des séances "classe entière"

---

### Exemple 5 : Tests enseignants uniquement - Phase d'exploration

**Cas** : Lycée `0601863Z`

**Observations** :
- **0 élève** ayant utilisé la plateforme
- **2 professeurs** ont testé
- **5 activités** testées
- Période : Février à Mars 2025

**Professeur A (22/02/2025)** :
```
15:32  →  Activité 4388355 (modification immédiate = survol)
15:36  →  Activité 3515488 (modification 8 jours plus tard!)
15:47  →  Activité 2548348 (modification immédiate)
17:43  →  Activité 3534169 (modification immédiate)
```
- 4 activités en 2h11
- 3 survols rapides (0min)
- 1 approfondissement (8 jours de travail)

**Professeur B (18-20/03/2025)** :
```
18/03 17:55  →  Activité 2548348 (modification 9 jours plus tard)
19/03 20:09  →  Activité 3534169 (20min de travail)
20/03 09:54  →  Activité 3518185 (modification 7,5 jours plus tard)
```
- 3 activités sur 3 jours
- 1 test rapide (20min)
- 2 tests approfondis (7-9 jours)
- Finitions groupées le 27/03 au soir (22h)

**Patterns identifiés** :
- **Prof A** : Découverte large et rapide (4 activités, survol)
- **Prof B** : Test approfondi et méthodique (3 activités, travail sérieux)
- **Temporalité** :
  - Modifications immédiates (0min) = Simple consultation
  - Modifications longues (7-9 jours) = Travail approfondi avec reprises
  - Modifications courtes (20-35min) = Test complet en une fois

**Hypothèse** :
- **Phase de préparation collective** :
  1. Février : Prof A découvre et teste 4 activités
  2. Mars : Prof B rejoint et teste 3 activités en profondeur
  3. Collaboration : Échange entre collègues (activités communes)
  4. État actuel : Préparation terminée, déploiement non effectué

**Conclusions** :
- Phase d'exploration sans déploiement
- 2 profils complémentaires (découvreur + testeur)
- Collaboration probable (gap 1 mois, activités communes)
- Travail sérieux (modifications longues)
- Pas encore de mise en classe effective

---

## VOTRE MISSION

### 1. Analyse individuelle des professeurs

Pour chaque professeur (ou un échantillon représentatif) :

#### A. Profil et contexte
- Nombre d'établissements (mono vs multi-établissement)
- Type d'établissement (lycée, collège, public, privé, IPS)
- Période d'activité (première/dernière utilisation, durée, intensité)
- Nombre d'activités explorées vs enseignées

#### B. Style d'adoption
- **Cautious adopter** : Teste systématiquement avant d'enseigner
- **Confident direct** : Enseigne directement sans tester
- **Explorer tester** : Teste beaucoup mais n'enseigne pas (exploration)
- **Mixed approach** : Mélange des deux stratégies

Calculez :
- Conversion rate (activités testées → enseignées)
- Délai moyen entre test et enseignement
- Pattern temporel des tests (soir, weekend = préparation à domicile)

#### C. Patterns pédagogiques
- **Classes multiples** : Utilise avec plusieurs groupes d'élèves différents ?
- **Devoirs maison** : Encourage le travail à domicile (soir/weekend) ?
- **Sessions de reprise** : Organise des 2èmes séances (>1h après fin) ?
- **Taille de classe** : Petit groupe (soutien) vs classe entière ?
- **Régularité** : Créneau fixe récurrent vs ponctuel ?

#### D. Scénarios d'usage détectés
Identifiez parmi :
- **Déploiement progressif** : Tests individuels → classe complète
- **Classe unique standard** : 1 séance, 1 classe, terminé
- **Multi-classes** : Même activité avec plusieurs groupes
- **Accompagnement individualisé** : Petits effectifs, créneau dédié récurrent
- **Rattrapage organisé** : Séances de reprise avec élèves différents
- **Exploration pure** : Tests uniquement, pas d'enseignement
- **Collaboration établissement** : Plusieurs profs, même activité, temporalité coordonnée

### 2. Analyse par activité

Pour les activités les plus utilisées :
- Quels profs l'ont testée ? Enseignée ?
- Quel est le taux de conversion test→enseignement ?
- Quels sont les patterns de succès (continuation, home work, 2nd session) ?
- Y a-t-il des différences selon le type d'établissement ?

### 3. Analyse par établissement

Pour les établissements avec plusieurs profs :
- Pattern de déploiement (individuel vs collectif)
- Effet d'entraînement (prof pionnier → adoption par collègues) ?
- Timeline de diffusion (durée entre 1er et dernier prof)
- Coordination (activités communes, périodes similaires)

### 4. Métriques globales à calculer

#### Adoption
- % de profs "cautious" vs "confident" vs "explorer"
- Taux de conversion global test→enseignement
- Délai médian entre test et enseignement

#### Engagement
- % de profs encourageant le travail maison
- % de profs organisant des 2èmes séances
- Taille moyenne de classe par type d'établissement

#### Temporalité
- Périodes préférées (matin, après-midi, soir)
- Jours préférés (semaine, weekend)
- Durée moyenne de travail élève
- Taux de continuation >1h

#### Succès
- Corrélation entre test prof et taux de continuation élève
- Corrélation entre 2ème séance et home work
- Impact du contexte (IPS, type établissement, public/privé)

### 5. Synthèse finale

Rédigez un rapport structuré avec :

#### A. Vue d'ensemble chiffrée
- Nombre total de profs analysés
- Répartition par style d'adoption (%)
- Métriques globales clés

#### B. Typologies de professeurs
Identifiez 4-6 profils types avec :
- Caractéristiques principales
- % de profs correspondants
- Exemple illustratif d'un cas réel
- Hypothèses sur contexte et motivation

#### C. Patterns pédagogiques dominants
Pour chaque pattern :
- Description détaillée
- Prévalence (%)
- Exemple de timeline concrète
- Facteurs favorisant ce pattern

#### D. Insights et découvertes
- Corrélations inattendues
- Limites de l'algorithme détectées
- Cas particuliers intéressants
- Recommandations pour améliorer la plateforme

#### E. Visualisations suggérées
- Graphiques/tableaux les plus pertinents à créer
- Métriques à suivre dans le dashboard

---

## GUIDELINES DE RÉDACTION

### Style
- **Factuel et analytique** : Chiffres précis, exemples concrets
- **Structuré et hiérarchisé** : Sections claires, titres explicites
- **Illustré** : Timelines, tableaux récapitulatifs, exemples de cas
- **Hypothèses explicites** : "Scénario probable", "Hypothèse", "Possibilité"

### Méthodologie
1. **Observer** : Extraire les données pertinentes
2. **Questionner** : Poser des questions comme dans les exemples
3. **Calculer** : Métriques, taux, corrélations
4. **Comparer** : Identifier similitudes et différences
5. **Interpréter** : Émettre des hypothèses de scénarios
6. **Conclure** : Synthèse chiffrée et illustrée

### Format des exemples
Utilisez des timelines visuelles :
```
2024-04-19 10:47  →  1 élève (test)
2024-05-13 08:22  ┐
2024-05-13 08:25  │ Séance en classe
2024-05-13 08:27  │ (10 élèves en 13 min)
2024-05-13 08:35  ┘
```

Utilisez des tableaux comparatifs :
| Critère | Prof A | Prof B | Prof C |
|---------|--------|--------|--------|
| Style | Cautious | Confident | Explorer |
| Conversion | 80% | N/A | 0% |

### Émojis pour structure
- 📊 Vue d'ensemble
- 📅 Timeline
- 🔍 Analyse détaillée
- 💡 Scénarios possibles
- 🎯 Conclusions
- ⚠️ Limites/Problèmes
- ✅ Validations

---

## QUESTIONS SPÉCIFIQUES À INVESTIGUER

### Sur les professeurs
1. Quelle proportion teste avant d'enseigner ? Délai moyen ?
2. Y a-t-il des différences selon le type d'établissement (lycée vs collège, public vs privé, IPS) ?
3. Les profs qui testent ont-ils de meilleurs résultats (continuation, home work) ?
4. Combien de profs n'ont fait que tester sans jamais enseigner ? Pourquoi ?
5. Quelle est la durée typique entre première découverte et déploiement effectif ?

### Sur les séances
1. Quelle est la distribution des tailles de classe ?
2. Quelle proportion de séances génère du travail maison ?
3. Quelle proportion génère des 2èmes séances de reprise ?
4. Y a-t-il corrélation entre taille de classe et taux de continuation ?
5. Les séances du matin ont-elles de meilleurs résultats que l'après-midi ?

### Sur les activités
1. Quelles activités sont les plus testées ? Les plus enseignées ?
2. Y a-t-il des activités "pilotes" (testées par beaucoup mais peu enseignées) ?
3. Quel est le taux de conversion moyen par activité ?
4. Certaines activités favorisent-elles plus le travail maison que d'autres ?

### Sur les établissements
1. Combien d'établissements ont un seul prof vs plusieurs ?
2. Dans les établissements multi-profs, y a-t-il coordination (activités communes, périodes proches) ?
3. Y a-t-il des effets de diffusion (prof pionnier → adoption progressive) ?
4. Quelle est la durée entre premier test et déploiement classe au niveau établissement ?

---

## LIVRABLES ATTENDUS

### Document Markdown structuré contenant :

1. **Executive Summary** (1 page)
   - Chiffres clés
   - 3-5 insights majeurs
   - Recommandations principales

2. **Méthodologie** (0.5 page)
   - Données analysées
   - Méthodes utilisées
   - Limites identifiées

3. **Analyse des professeurs** (4-6 pages)
   - Typologies (4-6 profils types)
   - Distribution des styles d'adoption
   - Exemples illustratifs détaillés
   - Métriques par type

4. **Analyse des patterns pédagogiques** (3-4 pages)
   - Patterns identifiés (déploiement progressif, multi-classes, accompagnement, etc.)
   - Prévalence de chaque pattern
   - Timelines types
   - Facteurs favorisants

5. **Analyse par activité** (2-3 pages)
   - Top activités testées/enseignées
   - Taux de conversion par activité
   - Patterns de succès

6. **Analyse par établissement** (2-3 pages)
   - Mono-prof vs multi-profs
   - Effets de coordination
   - Diffusion temporelle

7. **Insights et découvertes** (2-3 pages)
   - Corrélations intéressantes
   - Cas particuliers
   - Limites de l'algorithme détectées
   - Anomalies ou patterns inattendus

8. **Recommandations** (1-2 pages)
   - Améliorations plateforme
   - Métriques à suivre
   - Visualisations à créer
   - Pistes d'investigation futures

---

## EXEMPLE DE DÉBUT D'ANALYSE ATTENDUE

```markdown
# Analyse des patterns d'usage MathAData - 114 professeurs

## Executive Summary

### Chiffres clés
- **114 professeurs** analysés sur 2106 usages
- **45 profs (39%)** adoptent une stratégie prudente (testent avant d'enseigner)
- **60 profs (53%)** enseignent directement sans test préalable
- **9 profs (8%)** n'ont fait que tester sans jamais déployer en classe
- **Taux de conversion global** : 72% des activités testées sont ensuite enseignées
- **Délai médian test→enseignement** : 7 jours

### Insights majeurs
1. **Deux stratégies dominantes** : Les profs se divisent presque équitablement entre "prudents" (39%) et "confiants" (53%), avec très peu d'explorateurs purs (8%).

2. **Le test paye** : Les profs qui testent avant d'enseigner ont un taux de continuation élève 23% plus élevé (0.42 vs 0.34) et génèrent 2x plus de devoirs maison (18% vs 9%).

3. **Pattern multi-classes émergent** : 34% des profs utilisent la même activité avec plusieurs classes différentes, avec un délai moyen de 8 jours entre les classes.

4. **Accompagnement individualisé sous-estimé** : 12% des séances concernent ≤3 élèves avec créneaux fixes récurrents, suggérant du soutien/rattrapage organisé.

5. **Collaboration établissement rare** : Seulement 8 établissements (12%) montrent des signes de coordination entre profs (activités communes, périodes proches).

### Recommandations principales
[...]
```

---

## RESSOURCES

### Fichiers disponibles
- `mathadata_llm_export.json` : Export structuré avec toutes les données
- Exemples d'analyses dans ce prompt

### Support
N'hésitez pas à :
- Poser des questions sur les données
- Demander des clarifications sur la méthodologie
- Proposer des métriques additionnelles
- Signaler des patterns intéressants ou inattendus

---

**🚀 Vous pouvez maintenant commencer votre analyse !**
