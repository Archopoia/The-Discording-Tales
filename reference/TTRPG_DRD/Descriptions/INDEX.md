# Système TDT - Documentation des Descriptions

Ce dossier contient les descriptions complètes de tous les éléments du système de jeu TDT.

---

## Hiérarchie du Système

```
ATTRIBUTS (8)
    └── APTITUDES (8)
            └── ACTIONS (24 = 3 par Aptitude)
                    └── COMPÉTENCES (72 = 3 par Action)
                            └── MAÎTRISES (variables)
```

### Niveaux de Compétence
- **N0** (0 Dé) : Néophyte
- **N1** (1-2 Dés) : Initié
- **N2** (3-5 Dés) : Disciple
- **N3** (6-9 Dés) : Adepte
- **N4** (10-14 Dés) : Expert
- **N5** (15+ Dés) : Maître

---

## Les 8 Attributs

| Attribut | Nom | Type | Aptitude +3 | Aptitude +2 | Aptitude +1 | Thème |
|----------|-----|------|-------------|-------------|-------------|-------|
| **FOR** | Force | Physique Influant | Puissance | Athlétisme | Domination | Autorité |
| **AGI** | Agilité | Physique Libérant | Aisance | Puissance | Athlétisme | Nature |
| **DEX** | Dextérité | Physique Réagissant | Précision | Aisance | Puissance | Finance |
| **VIG** | Vigueur | Physique Résistant | Athlétisme | Domination | Aisance | Collectivité |
| **EMP** | Empathie | Mental Résistant | Charisme | Réflexion | Détection | Société |
| **PER** | Perception | Mental Réagissant | Détection | Précision | Charisme | Instruction |
| **CRÉ** | Créativité | Mental Libérant | Réflexion | Détection | Précision | Propriété |
| **VOL** | Volonté | Mental Influant | Domination | Charisme | Réflexion | - |

**Détails :** [Attributs.md](./Attributs.md)

---

## Les 8 Peuples Jouables

| Peuple | Races | Fichier |
|--------|-------|---------|
| **Aristois** | Monte-Foudres, Fleuris, Sufflicoles, Ambrés | [Peuples/Aristois.md](./Peuples/Aristois.md) |
| **Griscribes** | Arboricoles, Saute-Brumes, Limnicoles, d'Eau | [Peuples/Griscribes.md](./Peuples/Griscribes.md) |
| **Navillis** | Carmins, Pétricoles, Perces-vagues | [Peuples/Navillis.md](./Peuples/Navillis.md) |
| **Méridiens** | Sylvains, Marche-Rêves, des Monts | [Peuples/Meridiens.md](./Peuples/Meridiens.md) |
| **Ylfes** | 8 races (3 sous-peuples) | [Peuples/Ylfes.md](./Peuples/Ylfes.md) |
| **Iqqars** | Bas-Iqqars, Hauts-Iqqars | [Peuples/Iqqars.md](./Peuples/Iqqars.md) |
| **Slaadéens** | Sablevents, Chante-Neiges, Mangroviens, Rosebrousses, d'Oasis | [Peuples/Slaadeens.md](./Peuples/Slaadeens.md) |
| **Tchalkchaïs** | Elesihin, Ordol, Îohadam, Nuôtarjoy, Ikrayad | [Peuples/Tchalkhchais.md](./Peuples/Tchalkhchais.md) |

**Index complet :** [Peuples/INDEX.md](./Peuples/INDEX.md)

---

## Les 8 Aptitudes et leurs Actions

### 1. Puissance (FOR +3, AGI +2, DEX +1)
**Type de Conflit :** Bataille (Compétition frontale)

| Action | Compétences |
|--------|-------------|
| **Frapper** | [Armé], [Désarmé], [Improvisé] |
| **Neutraliser** | [Lutte], [Bottes], [Ruses] |
| **Tirer** | [Bandé], [Propulsé], [Jeté] |

**Détails :** [Aptitudes/Puissance.md](./Aptitudes/Puissance.md)

---

### 2. Aisance (AGI +3, DEX +2, VIG +1)
**Type de Conflit :** Infiltration (Déjouement fuyant)

| Action | Compétences |
|--------|-------------|
| **Réagir** | [Fluidité], [Esquive], [Évasion] |
| **Dérober** | [Escamotage], [Illusions], [Dissimulation] |
| **Coordonner** | [Gestuelle], [Minutie], [Équilibre] |

**Détails :** [Aptitudes/Aisance.md](./Aptitudes/Aisance.md)

---

### 3. Précision (DEX +3, PER +2, CRÉ +1)
**Type de Conflit :** Artisanat (Solution par subterfuge)

| Action | Compétences |
|--------|-------------|
| **Manier** | [Visée], [Conduite], [Habileté] |
| **Façonner** | [Débrouillardise], [Bricolage], [Savoir-Faire] |
| **Fignoler** | [Artifices], [Sécurité], [Casse-Têtes] |

**Détails :** [Aptitudes/Precision.md](./Aptitudes/Precision.md)

---

### 4. Athlétisme (VIG +3, FOR +2, AGI +1)
**Type de Conflit :** Prouesse (Outrepassement physique)

| Action | Compétences |
|--------|-------------|
| **Traverser** | [Pas], [Grimpe], [Natation] |
| **Efforcer** | [Port], [Saut], [Fouissage] |
| **Manœuvrer** | [Vol], [Acrobatie], [Chevauchement] |

**Détails :** [Aptitudes/Athletisme.md](./Aptitudes/Athletisme.md)

---

### 5. Charisme (EMP +3, VOL +2, PER +1)
**Type de Conflit :** Corrompre (Outrepassement social)

| Action | Compétences |
|--------|-------------|
| **Captiver** | [Séduction], [Mimétisme], [Présentation] |
| **Convaincre** | [Négociation], [Tromperie], [Inspiration] |
| **Interpréter** | [Instrumental], [Chant], [Narration] |

**Détails :** [Aptitudes/Charisme.md](./Aptitudes/Charisme.md)

---

### 6. Détection (PER +3, CRÉ +2, EMP +1)
**Type de Conflit :** Enquête (Déjouement par découverte)

| Action | Compétences |
|--------|-------------|
| **Discerner** | [Vision], [Audition], [Toucher] |
| **Découvrir** | [Investigation], [Estimation], [Ressenti] |
| **Dépister** | [Odorat], [Goût], [Intéroception] |

**Détails :** [Aptitudes/Detection.md](./Aptitudes/Detection.md)

---

### 7. Réflexion (CRÉ +3, EMP +2, VOL +1)
**Type de Conflit :** Énigme (Solution par logique)

| Action | Compétences |
|--------|-------------|
| **Concevoir** | [Artisanat], [Médecine], [Ingénierie] |
| **Acculturer** | [Jeux], [Société], [Géographie] |
| **Acclimater** | [Nature], [Pastoralisme], [Agronomie] |

**Détails :** [Aptitudes/Reflexion.md](./Aptitudes/Reflexion.md)

---

### 8. Domination (VOL +3, VIG +2, FOR +1)
**Type de Conflit :** Débat (Compétition par volonté)

| Action | Compétences |
|--------|-------------|
| **Discipliner** | [Commandement], [Obéissance], [Obstinance] |
| **Endurer** | [Gloutonnerie], [Beuverie], [Entrailles] |
| **Dompter** | [Intimidation], [Apprivoisement], [Dressage] |

**Détails :** [Aptitudes/Domination.md](./Aptitudes/Domination.md)

---

## Légende des Marqueurs

| Marqueur | Signification |
|----------|---------------|
| *(aucun)* | Description confirmée/documentée |
| `[ADAPTÉ]` | Description adaptée d'une source antérieure |
| `[PROBABLE]` | Description probable mais non confirmée |
| `[MANQUANT]` | Pas de description disponible |
| `[NOUVEAU]` | Élément nouveau sans équivalent connu |

---

## Tableau des 72 Compétences

| Aptitude | Action | Compétence 1 | Compétence 2 | Compétence 3 |
|----------|--------|--------------|--------------|--------------|
| Puissance | Frapper | [Armé] | [Désarmé] | [Improvisé] |
| Puissance | Neutraliser | [Lutte] | [Bottes] | [Ruses] |
| Puissance | Tirer | [Bandé] | [Propulsé] | [Jeté] |
| Aisance | Réagir | [Fluidité] | [Esquive] | [Évasion] |
| Aisance | Dérober | [Escamotage] | [Illusions] | [Dissimulation] |
| Aisance | Coordonner | [Gestuelle] | [Minutie] | [Équilibre] |
| Précision | Manier | [Visée] | [Conduite] | [Habileté] |
| Précision | Façonner | [Débrouillardise] | [Bricolage] | [Savoir-Faire] |
| Précision | Fignoler | [Artifices] | [Sécurité] | [Casse-Têtes] |
| Athlétisme | Traverser | [Pas] | [Grimpe] | [Natation] |
| Athlétisme | Efforcer | [Port] | [Saut] | [Fouissage] |
| Athlétisme | Manœuvrer | [Vol] | [Acrobatie] | [Chevauchement] |
| Charisme | Captiver | [Séduction] | [Mimétisme] | [Présentation] |
| Charisme | Convaincre | [Négociation] | [Tromperie] | [Inspiration] |
| Charisme | Interpréter | [Instrumental] | [Chant] | [Narration] |
| Détection | Discerner | [Vision] | [Audition] | [Toucher] |
| Détection | Découvrir | [Investigation] | [Estimation] | [Ressenti] |
| Détection | Dépister | [Odorat] | [Goût] | [Intéroception] |
| Réflexion | Concevoir | [Artisanat] | [Médecine] | [Ingénierie] |
| Réflexion | Acculturer | [Jeux] | [Société] | [Géographie] |
| Réflexion | Acclimater | [Nature] | [Pastoralisme] | [Agronomie] |
| Domination | Discipliner | [Commandement] | [Obéissance] | [Obstinance] |
| Domination | Endurer | [Gloutonnerie] | [Beuverie] | [Entrailles] |
| Domination | Dompter | [Intimidation] | [Apprivoisement] | [Dressage] |

---

*Documentation générée le 4 février 2026*
