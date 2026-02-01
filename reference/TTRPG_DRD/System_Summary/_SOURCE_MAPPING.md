# Source Mapping — Book Pages & CSVs → Summaries

## Book pages → topics (from 00_FULL_BOOK TOC and structure)

| Pages | Topic | Summary |
|-------|--------|---------|
| 1 | TOC EVEIL / IMMERSION / ESSENTIEL / VIE / SURVIE / POSSESSIONS / COMBAT | Index |
| 3-8 | Ancestral, Territoires, Créatures, Sociétés | 14_Monde |
| 9-10 | Techno-Traditionnalisme, Valeurs, Outils | 14_Monde, 11_Possessions |
| 10-12 | Savoirs, Sanctuaires, Croyances, Cosmologie, Mots, Rildées-astrales | LORE_01, 07_Rilie |
| 13-14 | Révélateurs/Éveilleurs, Rôles, Pouvoirs, Ruines Aïars | 01_Systeme, 16_GM |
| 15-16 | Chance au jet, Niveaux d'échelle, Degrés de fiabilité | 01_Systeme |
| 16-19 | Niv Attribut, Niv Aptitude, Dés CT/MT, Potentiels, Tenter d'agir, 8 Aptitudes/24 Actions/72 Compétences | 03_Attributs |
| 19-21 | Retenter, Succès/Échecs, Astragale | 01_Systeme |
| 21-24 | Explorer, Ruines, Langues, Richesse | 14_Monde, LORE |
| 25-48 | Peuples (Yômmes, Ylfes, Bêstres) | 12_Peuples, LORE_03 |
| 49-53 | Tirage Caractéristiques, Attributs, Récits, Héritages, Raisons d'Éveil | 02_Creation |
| 54-62 | Dés Éduqués/Exprimés, Symbole, Évolution, Marques, Valeurs, Titres | 04_Experience, 13_Valeurs |
| 63+ | Révélation Compétence, Marques, Réalisations, Découvertes | 03_Attributs, 04_Experience |
| 129+ | Temps, Labeurs, Surmenage, Jet Précisé, Temps Éveillés/Assoupis | 08_Temps |
| 135+ | Jet d'Ambiance, Jet de Groupe, Jet d'Audace, Jet Risqué, Jet Sacrifié | 09_Groupe |
| 137+ | Souffrances, DS, Rage, Guérison | 05_Souffrances |
| 161+ | Combat (ordre, clins, actions) | 06_Combat |
| 180+ | Voyage Errant, Surveiller harde | 10_Voyages |
| 183+ | Devises, Qualité/Rareté, Marché, Transport, Équiper, Armes, Armures | 11_Possessions |

## CSV → Summary mapping (key files)

- **01_Systeme_General**: Niveaux_Résultat_Épreuve_Durée_Dégrés, Types_de_Conflits_Objet_gardé_Obstacle_guardien, Résultat_*_Porte-Bonheur*
- **02_Creation**: Tirage_des_Caractéristiques, Attributs_d'Origine*, Caractéristiques_des_Peuples, Attributs_&_Aptitudes_Extrêmes, Raisons_d'Éveil*, Attaches_de_Récit*
- **03_Attributs**: Aptitudes_Actions_Compétences, Attributs_Apt*, Aptitude_Atb*, Découvertes*, Cercle_Initial_*
- **04_Experience**: Niv_Atb_Coût*, Tableau_des_Symboles_Calendaires, Variation_des_Compétences_Éduquées
- **05_Souffrances**: Type_de_Souffrance*, Niv_de_Guérison*, Niv_d'Épreuve_des_8_Souffrances, Niv_de_Traitements*, Traitements_par_*, Infirmités*, Mutilations*
- **06_Combat**: Clins_d'Action_au_Combat, Types_d'Action*, Potentiels*, Cercle_Initial_*, Localisation*, Manœuvres*, Frappes*, Face_d'arme*, ARMES_DE_MÊLÉS*, Armes_*, Matelassage*
- **07_Rilie**: Honorations_Riliques*, Sacrifices_*
- **08_Temps**: 0_Un_*Instant*, +9_Un_Solstice*, Cercles_de_Fréquence, Années_*
- **09_Groupe**: Ambiance_*
- **10_Voyages**: Tableau_des_Rencontres, Montures_*
- **11_Possessions**: All Armes_*, Classe_Matériaux*, Matelassage*, Contenants*, Outils*, Services*, Nourritures*, Délits*, Mutilations*, Niv_de_(Q)_(R)_(U), etc.
- **12_Peuples**: Caractéristiques_des_Peuples, Dispositions_des_Peuples, Moralité_des_Peuples, Modules_*_Caste, Castes_*
- **13_Valeurs**: Tableau_des_Valeurs_de_*, Tableau_des_Socialités, Tableau_des_Dispositions
- **LORE_01-05**: Honorations*, Sacrifices*, Symboles_Calendaires, Âge_*, Niveaux_Étrangetés*

## Audit (gaps/drift to fix in updates)

- **01_Systeme_General**: Verify Niv d'Épreuve range (-5 à +10+), exact 8 types conflits Objet/Obstacle from CSV; add Degrés de fiabilité if in book.
- **02_Creation**: Replace/supplement with CSV data for Tirage, Caractéristiques des Peuples, Raisons d'Éveil, Attaches.
- **03_Attributs**: Verify Aptitude–Attribut links (Atb +3/+2/+1) from CSV; include full cercles from CSVs.
- **05_Souffrances**: DS thresholds and Séquelles from CSV; resistance = passive (Niv only); treatment tables from CSVs.
- **06_Combat**: Clins costs, localisation, manœuvres from CSVs; weapon/armor stats from CSVs.
- **11_Possessions**: Devises (Cordon d'Or, Luciopel, Bovare), Délits/Mutilations from CSVs; full or summarized equipment tables.
- **12_Peuples**: Caractéristiques (Taille/Stature/Gras/Dimorphisme) from CSV; Dispositions table; correct names (Ajoroï, Kh'Ruld, etc.).
- **LORE_01**: Spellings from book (HISM, Ril-cendrée); cycles and attributs for each Rildée-astrale.
- **LORE_03**: Each peuple full description from book; no invented content.

## Terminology (Phase 5.2 – cross-check)

Les résumés utilisent la terminologie du livre de façon cohérente :
- **Révélateur** (RV) : Maître de Jeu.
- **Éveilleur** (EV) : Joueur.
- **Personnage Inspiré** (PI) : personnage joué.
- **Niv** : Niveau (d’Épreuve, de Temps, etc.).
- **dD** : dés discordants (5dD pour Ambiance, etc.).
- **NdT** : Niveau de Temps.
- **DS** : Dés de Souffrance.
- **Ril-cendrée** (avec trait d’union), **Rildée-astrale**, **HISM**, **Éo**, **oÀ**, **ÉoÀ**.
- Références croisées internes : « voir 03_Attributs_Aptitudes_Competences », etc. Les numéros de page livre (ex. « Livre p. 137 ») sont indiqués dans les résumés où pertinent.
