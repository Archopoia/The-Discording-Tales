# Index des Descriptions - Feuille de Personnage TDT

Ce dossier contient toutes les descriptions extraites des tooltips de la feuille de personnage HTML.

---

## Structure des Fichiers

### Fichiers Principaux

| Fichier | Description |
|---------|-------------|
| [Attributs.md](./Attributs.md) | Les 8 Attributs (FOR, DEX, AGI, CON, VOL, CRÉ, PER, EMP) |
| [Maux.md](./Maux.md) | Les 8 types de Maux et leurs guérisons |
| [Aptitudes.md](./Aptitudes.md) | Les 8 Aptitudes et leurs liaisons |
| [Armes_Proprietes.md](./Armes_Proprietes.md) | Propriétés des armes (Inertie, Versatilité, Portée) |
| [Regles_Generales.md](./Regles_Generales.md) | Règles générales et mécaniques du système |

### Dossier Maitrises/

Contient les 9 Maîtrises pour chaque Aptitude, avec leurs **Sous-Maîtrises** (orientations) et **Spécialités** :

| Fichier | Aptitude | Attributs | Sous-Maîtrises |
|---------|----------|-----------|----------------|
| [Combat.md](./Maitrises/Combat.md) | Combat | FOR + DEX | À distance (+PER), Adroit (+DEX), Puissant (+FOR) |
| [Mobilite.md](./Maitrises/Mobilite.md) | Mobilité | FOR + CON | Audacieuse (+AGI), Vigoureuse (+CON), Musclée (+FOR) |
| [Aisance.md](./Maitrises/Aisance.md) | Aisance | DEX + AGI | Rusée (+AGI), Délivrante (+FOR), Sauveuse (+AGI) |
| [Habilete.md](./Maitrises/Habilete.md) | Habileté | AGI + CRÉ | Pratique (+DEX), Astucieuse (+PER), Douée (+DEX) |
| [Vitalite.md](./Maitrises/Vitalite.md) | Vitalité | CON + VOL | Fascinante (+EMP), Tenace (+VOL), Endurante (+CON) |
| [Charisme.md](./Maitrises/Charisme.md) | Charisme | EMP + VOL | Éloquent (+VOL), Harmonieux (+EMP), Poétique (+CRÉ) |
| [Vigilance.md](./Maitrises/Vigilance.md) | Vigilance | PER + EMP | Primaire (+PER), Subtile (+CON), Sensible (+CRÉ) |
| [Sagacite.md](./Maitrises/Sagacite.md) | Sagacité | PER + CRÉ | Spéculative (+EMP), Technique (+CRÉ), Essentielle (+VOL) |

---

## Résumé du Système

### Les 8 Attributs
1. **FOR** - Force (Puissance physique)
2. **DEX** - Dextérité (Réflexes, coordination)
3. **AGI** - Agilité (Souplesse, grâce)
4. **CON** - Constitution (Résilience physique)
5. **VOL** - Volonté (Détermination, concentration)
6. **CRÉ** - Créativité (Innovation, mémoire)
7. **PER** - Perspicacité (Perception, intuition)
8. **EMP** - Empathie (Charme, persuasion)

### Les 8 Aptitudes
1. **Combat** (FOR + DEX) - Arts martiaux et armes
2. **Mobilité** (FOR + CON) - Déplacements physiques
3. **Aisance** (DEX + AGI) - Agilité et discrétion
4. **Habileté** (AGI + CRÉ) - Artisanat et techniques
5. **Vitalité** (CON + VOL) - Résistances
6. **Charisme** (EMP + VOL) - Relations sociales
7. **Vigilance** (PER + EMP) - Sens et perception
8. **Sagacité** (PER + CRÉ) - Connaissances

### Les 8 Maux
1. **Fatigues** - Épuisement physique
2. **Blessures** - Dégâts physiques
3. **Inconforts** - Hygiène, température
4. **Disettes** - Faim et soif
5. **Addictions** - Dépendances
6. **Maladies** - Infections et maladies
7. **Insanités** - Chocs psychologiques
8. **Mutismes** - Frustrations sociales

---

## Hiérarchie des Compétences

### Structure par Aptitude

```
APTITUDE (2 Attributs de base)
├── Sous-Maîtrises (3 orientations avec 3ème attribut)
│   ├── Orientation 1 (+Attribut A)
│   ├── Orientation 2 (+Attribut B)
│   └── Orientation 3 (+Attribut C)
└── Maîtrises (9 domaines)
    ├── Maîtrise 1
    │   └── Spécialités (variables)
    ├── Maîtrise 2
    │   └── Spécialités
    └── ... (jusqu'à 9)
```

### Sous-Maîtrises (Orientations)

Les Sous-Maîtrises permettent de jouer avec une moyenne de 3 Attributs plutôt que 2, en ajoutant un 3ème attribut spécifique selon l'orientation choisie.

### Progression des Spécialités

- **2ème Dé** : +1 Spécialité
- **4-5ème Dé** : +1 Spécialité
- **7-8-9ème Dé** : +1 Spécialité
- **11-12-13-14ème Dé** : +1 Spécialité

---

## Notes

Ces descriptions proviennent de la feuille de personnage HTML située dans `VeryOldSheet_Deprecated/HTML.html`. Elles ont été extraites des attributs `title` et `data-tooltip` des éléments HTML.

Dernière extraction : Février 2026
