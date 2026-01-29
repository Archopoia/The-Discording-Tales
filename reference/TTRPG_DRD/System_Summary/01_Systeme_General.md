# Système Général - Des Récits Discordants

Réf. livre : pages 15-21 (Chance, Niveaux d'échelle, Degrés de fiabilité, Épreuves, Astragale), 13-14 (Révélateur & Éveilleurs). CSV : Niveaux_Résultat_Épreuve_Durée_Dégrés, Types_de_Conflits_Objet_gardé_Obstacle_guardien.

## Concepts Fondamentaux

### Les Dés Discordants (dD)
- **dD** : Dés à 3 faces : `+`, `0`, `-` (sur D6 : 5-6 = +, 3-4 = 0, 1-2 = -).
- **Chance** : Presque tous les jets utilisent **5 dD** (la « Chance ») pour estimer l’imprévisible et l’environnement.
- **Résultat brut** : Nombre de `+` moins le nombre de `-` → variation de **-5 à +5** (0 = moyenne).
- **Égalité** : Même nombre de `+` et de `-` (résultat 0).

### Niveau (Niv) et Degrés (Dés)
- **Niv** : Nombre ajouté au résultat du jet. Il déplace la portée des résultats possibles (ex. Niv +3 avec 5dD → résultats de -2 à +8). Issu des Aptitudes et des modificateurs (outils, situation, etc.). Le résultat final ne peut jamais dépasser **Niv + 5** de l’Aptitude utilisée (troncature).
- **Degrés (D)** : Dés supplémentaires ajoutés à la Chance (5dD). Issus des Compétences (positifs) ou des Souffrances (négatifs).
  - **Dés positifs** : On garde les **5 plus hauts** parmi (5 + D) dés.
  - **Dés négatifs** : On garde les **5 plus bas** parmi (5 + |D|) dés.
- **Résultat final** : (Somme des 5 dés gardés) + Niv, tronqué si besoin au Niv + 5 de l’Aptitude.

### Équivalence D ⇄ N
Conversion entre Dés et Niv (pour simplifier les jets ou les calculs) :
- 1-2 Dés ⇄ 1 Niv  
- 3-5 Dés ⇄ 2 Niv  
- 6-9 Dés ⇄ 3 Niv  
- 10-14 Dés ⇄ 4 Niv  
- 15+ Dés ⇄ 5 Niv  

(Livre p. 24.)

## Les Épreuves

- **Épreuve Possible** : L’action peut être tentée si le Niv total (Aptitude + modificateurs) est au **maximum à 5 Niv** en dessous ou au-dessus du Niv d’Épreuve.
- **Épreuve extrême (6 à 10 Niv de différence)** : Seul l’**Astragale** (succès ou échec critique) permet de réussir ou d’échouer ; le jet est très (mal)chanceux.
- **Épreuve Impossible** : Au-delà de 10 Niv de différence, l’action est **impossible** (sauf house-rule ou règle spéciale).

### Niveaux d’Épreuve et résultats (CSV : Niveaux_Résultat_Épreuve_Durée_Dégrés)
| Niv | Résultat      | Épreuve              | Durée              | Dégrés typiques |
|-----|---------------|----------------------|--------------------|------------------|
| -5N | Catastrophique| Impossible à rater   | Instantanée        | ...              |
| -4N | Effroyable    | Sauf exception       | Tout de suite      | -20D, ...        |
| -3N | Dramatique    | Presque garanti      | Quasi immédiat     | -15D             |
| -2N | Périlleux     | Ridiculement aisée   | Infiniment rapide  | -10D             |
| -1N | Très nul      | Très facile          | Très courte        | -6D              |
| 0N  | Habituel      | Normale / risquée    | Moyenne            | 0D               |
| +1N à +5N | Bon à Inouï | Plutôt difficile à Presque impossible | Plutôt lente à Quasi interminable | +1D à +15D |
| +6 à +10N | Fantastique à Légendaire | Né de l’imaginaire / Issue des légendes | Chronophage / N’arrivant jamais | +20D, ... |

### Succès et échec
- **Succès** : Résultat final ≥ Niv d’Épreuve.
- **Échec** : Résultat final < Niv d’Épreuve.

## Astragale (Échecs & Succès Critiques)

- **Astragale** : Aléa critique (heureux ou malheureux). Lorsque la règle est utilisée, on lance **toujours la Chance (5 dD) en premier** avant les autres dés.
- **00000** (cinq zéros) : On **relance un dé**. Si le dé donne + ou -, le jet est **Succès** ou **Échec Critique** (on ne lance pas les autres dés). Si le dé donne 0, le jet est normal et on continue.
- **Effet critique** : Succès ou échec **total** de l’action, **doublant** son effet normal (compte comme **+10 ou -10 Niv** d’un coup).
- **Chiffre Porte-Bonheur / Porte-Malheur** : Déterminé par Jets d’Astragale (2 × 5dD) à la création ou par session/saison/pentaine/journée. Dès qu’une face des 5 dD de Chance indique **jusqu’à ce chiffre pur** (suivi de 0 seulement) du signe Porte-Bonheur (+) ou Porte-Malheur (-), c’est aussi l’Astragale.  
  Ex. : Chiffre Porte-Bonheur +3 → les résultats +0000, ++000 ou +++00 = Succès Critique.

(Livre p. 20, 33 ; table Résultat 5 Dés / Porte-Malheur / Porte-Bonheur / Chance d’Astragale.)

## Les 8 Types de Conflits (Gameplay)

Chaque type est lié à une Aptitude. Objet (gardé) = obtenir quelque chose de protégé ; Obstacle (gardien) = passer au-delà d’un obstacle.  
**Source : CSV Types_de_Conflits_Objet_(gardé)_Obstacle_(gardien).**

| Aptitude   | Type de conflit | Objet (gardé) | Obstacle (gardien) | Approche |
|-----------|------------------|----------------|---------------------|----------|
| Puissance | Bataille         | Tuer ou Détruire et prendre l’Objet | Tuer ou Détruire l’Obstacle et passer | Traverser sa voie, frontalement |
| Aisance   | Infiltration     | Voler l’Objet, ici et en discrétion | Se faufiler à travers l’Obstacle | Traverser sa voie, mais indétecté |
| Précision | Artisanat        | Faire abandonner l’Objet | Faire diversion ou leurrer l’Obstacle | Créer une autre voie, par subterfuge |
| Athlétisme| Prouesse         | Prendre de force l’Objet sécurisé | Esquiver ou Surmonter l’Obstacle | Créer une autre voie, par le possible |
| Charisme  | Corrompre        | Troquer l’Objet contre un besoin | Corrompre ou Vaincre l’Obstacle | Diriger sa voie, par ses vices ou intérêts |
| Réflexion | Énigme           | Trouver l’Objet ailleurs qu’ici | Trouver une solution à l’Obstacle | Trouver une autre voie, plus rare |
| Détection | Enquête          | Piller une cachette de l’Objet | Trouver une faille à l’Obstacle | Trouver une autre voie, plus secrète |
| Domination| Débat            | Convaincre de donner l’Objet | Convaincre l’Obstacle d’un passage | Diriger sa voie, par ses motivations ou buts |

**Clé** : Utiliser une « Clé » (outil, savoir, contact, etc.) pour obtenir l’Objet ou passer l’Obstacle dans n’importe quel type de conflit.

Voir `03_Attributs_Aptitudes_Competences.md` pour les 8 Aptitudes et les 72 Compétences.

## Personnages et Rôles

- **PI (Personnage Inspiré)** : Personnage joué ; « inspiré » par un Éveilleur.
- **PNI (Personnage Non-Inspiré)** : Personnage non-joueur.
- **Révélateur (RV, « Hervé »)** : Le **Maître de Jeu** — dévoile l’ordre de l’univers, éprouve les personnages à travers les huit façons d’interagir avec les cordes de la réalité.
- **Éveilleur (EV)** : Les **Joueurs** — insufflent les PI d’un élan volontaire ; chaque joueur est l’Éveilleur de son personnage.

(Livre p. 13.)

## Niveaux et Échelles

### Distinction
- **Distinction** : Somme de tous les Niv d’Attributs du personnage.
- Détermine le Niv de Gouvernance des Titres (voir 13_Valeurs_Traits, 04_Experience_Progression).

### Niveaux de Temps (NdT)
Réf. CSV : 0_Un_(I)nstant_-_Une_Prière... ; Cercles_de_Fréquence.  
Échelle indicative (du plus court au plus long) :
- **Clin** : 1 « tiers-de-seconde » (temps de réaction humanoïde).
- **Souffle** : 1 seconde ou 3 Clins (action libre).
- **Respiration** : 3 secondes ou 10 Clins (action simple).
- **Échange** : 10 s ou 30 Clins ; **Bavardage** : 30 s ou 100 Clins.
- **Instant / Prière** : 1 à 15 minutes (série d’actions ou « Faire 0 »).
- **Heure**, **Veillée**, **Jour**, **Pentaine**, **Héliorée**, **Saison**, **Cycle**, **Soleil**, etc. (voir 08_Temps_Labeurs).

## Types de Jets

### Jet Précisé (Niveau de Temps)
- **« Faire 0 »** : Prendre du temps pour une action complexe = pas de jet, résultat basé sur les niveaux (Livre p. 131).
- Plus de temps = difficulté réduite ; moins de temps = difficulté augmentée.

### Jet Risqué
- Déclarer un seuil d’échec critique en échange d’un bonus (détails en séance selon le Révélateur).

### Jet Sacrifié
- Réussir sur égalité ou échec critique en acceptant une **pénalité**.
- **Sacrifice Aveugle** : En cas d’échec fatal (mort ou échec critique très handicapant), le joueur peut réussir le jet au prix d’un coût déterminé par le Révélateur (ne sait pas à l’avance ce qu’il sacrifie). (Livre p. 11906.)

### Jet de Groupe
- Chaque participant fait un jet ; modifié par l’Ambiance du groupe ; résultats moyennés ou selon la règle de groupe. Voir 09_Groupe_Ambiance.

### Jet d’Audace
- Un seul individu tente une action de groupe avec pénalités (ex. -1 Dé par membre du groupe au-delà de 1). Récompenses potentielles plus élevées. Voir 09_Groupe_Ambiance.

## Perspectives et Récits

- Chaque personnage a un **Récit** unique, qui justifie son existence et ses opportunités.
- Le Récit détermine la Caste et les avantages narratifs ; il peut **doubler les dés de Compétence** dans les situations pertinentes.
- Les préjugés raciaux et les rivalités sociales sont fondamentaux au monde ; les PI sont sujets aux conflits et aux abus selon leur origine, peuple et race. (Livre p. 21-22.)
