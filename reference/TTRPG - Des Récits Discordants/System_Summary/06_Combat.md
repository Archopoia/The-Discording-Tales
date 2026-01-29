# Système de Combat - Des Récits Discordants

Réf. livre : pages 161+ (Combattre, Ordre d'action, Clins, Types d'actions, Facteurs d'action), 67-71 (Combat, Proactions, Réactions, Niv d'Ébranlement).  
CSV : Clins_d'Action_au_Combat, Types_d'Action_au_Combat, Potentiels_d'Action_au_Combat, Cercle_Initial_* (Mouvement, Perception, Préservation), Localisation_*, Manœuvres_*, Frappes_*, Face_d'arme_*, ARMES_DE_MÊLÉS_*, Armes_* (Poing, Pommeau, Manche, Hast, etc.), Matelassage_*.

## Vue d'Ensemble

Le système de combat fait partie d'un système plus large de **8 Types de Conflits**, chacun lié à une Aptitude. Ce document se concentre sur les règles de **Bataille** (Puissance), mais les autres types de conflits (Infiltration, Artisanat, Prouesse, Corrompre, Énigme, Enquête, Débat) suivent des mécaniques similaires adaptées à leur nature spécifique. Voir `03_Attributs_Aptitudes_Competences.md` et `01_Systeme_General.md` pour les 8 Types de Conflits.

## Concepts Fondamentaux

### Clins
- **Clin** : 1/3 de seconde
- Combat en temps réel, pas en tours
- Tous agissent simultanément

### Clins d'Alerte
- Déterminent qui peut **Proagir** (agir de manière proactive)
- États possibles :
  - **Surpris** : -5 Clins d'Alerte
  - **Alerté** : 0 Clins d'Alerte
  - **Préparé** : +5 Clins d'Alerte
  - **Inattentif** : -3 Clins d'Alerte
  - **Bouleversé** : -10 Clins d'Alerte

### Prendre l'Initiative
- Résout les actions simultanées
- Jet d'[Fluidité] ou attribut approprié

## Règles Fondamentales

1. **Toujours Réagir** sauf si inconscient
2. **Alerté détermine** qui peut Proagir
3. **Proactions accumulent** des Réactions simultanées → Niv d'Ébranlement

## Proactions (livre p. 161+)

Les **Proactions** correspondent aux actions nécessitant plusieurs **Clins d'affilée** (ex. Recharger, Charger ou Décharger une Attaque). Toute Proaction dure un nombre de Clins déterminé (souvent lié à l'inertie de l'arme) ; il faut déclarer et noter à quel Clin elle se réalisera (ex. Proagir au Clin -2 d'une action de 4 Clins → elle se réalise au Clin -6).

### Étapes principales
- **Recharger** : Prendre une munition (carquois) ou l'arme (fourreau) → la mettre en main → encocher si arme à distance.
- **Attaque** : Charger l'arme (bander la corde d'un arc/arbalète, ou votre bras pour javelot/mêlée) puis décharger ; au **dernier Clin** on déclenche le **jet d'Attaque** de l'arme pour déterminer le résultat (dégâts, Succès à dépenser pour localisation/manœuvres, etc.).

### Règles
- Vous pouvez **cumuler** des Réactions **simultanément** au cours d'une même Proaction ; elles s'accumulent en **Niv d'Ébranlement** (négatifs) sur les jets ou totaux liés.
- **Plusieurs Proactions en même temps** : limité par le nombre de membres (ex. ambidextrie). Déclarer les Clins pour chaque Proaction. Les **Niv d'Ébranlement** accumulés par Mouvements et Réactions sont **multipliés** par le nombre de Proactions simultanées (ex. entre Clin 1 et 4 avec 3 Proactions → ×3 ; après Clin 6 → ×1). Si aucun Niv d'Ébranlement, la seconde Proaction en ajoute 1. Si **cibles différentes** par Proaction, multiplier encore par le nombre de cibles (×2 pour 2 cibles, etc.).
- **Armes à distance** : Clins d'Attaque = armement seulement (le tir est instantané). **Armes de mêlée et de jet** : moitié des Clins = armement du bras, moitié = décharge de la frappe.

### Types de Proactions
- **Attaquer** : Frapper, Tirer (coût en Clins selon arme — CSV Clins_d'Action_au_Combat).
- **Déplacer** : Se déplacer (coût en Clins).
- **Manipuler** : Utiliser un objet.
- **Parler** : Communication.

## Réactions

### Types de Réactions

#### Bloquer
- Absorbe les dégâts
- Coût : Niv d'Ébranlement
- Réduit les dégâts reçus

#### Parer
- Redirige l'attaque
- Contre-attaque plus rapide
- Coût : Niv d'Ébranlement

#### Esquiver
- Évite complètement
- Peut inclure mouvement/récupération
- Coût : Niv d'Ébranlement

### Niv d'Ébranlement (livre p. 161+)
- **Accumulé** par les Réactions (Bloquer, Parer, Esquiver, Mouvements) pendant les Clins.
- **Se soustrait** à tout jet effectué lors du Clin concerné (chaque Clin d'une Proaction s'écoule à travers des Réactions qui s'accumulent en Niv d'Ébranlement).
- **Multiplié** par le nombre de Proactions simultanées et par le nombre de cibles visées (voir Proactions).
- Se récupère progressivement (détails selon le livre).

## Mouvements

### Types de Mouvements

#### Déplacer
- **Marcher** : Déplacement normal
- **Courir** : Déplacement rapide
- **Charger** : Attaque en mouvement

#### Déployer
- Étendre la portée
- Utiliser une arme longue

#### Sauter
- Saut vertical ou horizontal
- Peut être combiné avec attaque

#### Tourner
- Changer d'orientation
- Coût minimal

### Coûts en Clins
- Voir tableau "Clins d'Action au Combat"

## Postures

### Offensive
- Bonus aux attaques
- Malus à la défense

### Défensive
- Bonus à la défense
- Malus aux attaques

### Harrassante
- Bonus aux attaques rapides
- Malus à la défense

### Protectrice
- Bonus à la protection d'alliés
- Malus à la mobilité

## Clins d'Action au Combat

### Actions de Base
- **Dégainer** : 1-3 Clins
- **Recharger** : 2-5 Clins
- **Attaquer** : 2-4 Clins
- **Viser** : +1-3 Clins
- **Honoration** : 1-2 Clins

### Actions Spéciales
- **Bloquer** : Réaction
- **Parer** : Réaction
- **Esquiver** : Réaction
- **Déplacer** : 1-3 Clins
- **Sauter** : 1-2 Clins

## Potentiels d'Action

### Dés de Potentiel d'Action
- Gagnés via les niveaux de Compétence
- Dépensés pour actions spéciales
- Régénérés progressivement

## Succès d'Action

### Calcul
- Succès = Résultat du jet - Niv d'Épreuve
- Détermine l'efficacité de l'action

### Effets
- **Attaque** : Dégâts supplémentaires
- **Défense** : Réduction de dégâts
- **Mouvement** : Distance supplémentaire

## Récupération

### Récupération de Niv d'Ébranlement
- Se récupère progressivement
- Actions de récupération disponibles

### Récupération de Potentiel d'Action
- Régénération naturelle
- Peut être accélérée

## Batailles

### Échelle Tactique
- Combat individuel
- Focus sur les actions précises

### Échelle Stratégique
- Combats de groupe
- Commandement et coordination

### Échelle Opérationnelle
- Batailles de grande envergure
- Mouvements de troupes

## Honoration

### Concept
- Actions rituelles ou symboliques
- Peuvent modifier les jets
- Liées à la Rilie

### Utilisation
- Avant/during/après le combat
- Coût en Clins
- Effets variés

