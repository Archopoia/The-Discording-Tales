import { Competence } from './CompetenceData';

/**
 * Mastery Registry
 * Maps each Competence to its array of Mastery names
 * Note: This is a simplified version. The full registry contains hundreds of masteries.
 * For a complete implementation, all masteries from the Godot file should be included.
 */

export const MASTERY_REGISTRY: Record<Competence, string[]> = {
  // Puissance - Frapper
  [Competence.ARME]: [
    "Arme de Poigne",
    "d'Antipôle",
    "de Parade",
    "de Garde",
    "Équilibrées",
    "Flexibles"
  ],
  [Competence.DESARME]: [
    "Coup sans espace",
    "Poings",
    "Pieds",
    "Coude",
    "Genou",
    "Corps"
  ],
  [Competence.IMPROVISE]: [
    "Arme à coupures",
    "à pieds",
    "rondes",
    "de mains",
    "de paume",
    "de lien",
    "Jet d'arme improvisée"
  ],
  
  // Puissance - Neutraliser
  [Competence.LUTTE]: [
    "Saisie",
    "Bousculade",
    "Mise à Terre",
    "Projection",
    "Soumission"
  ],
  [Competence.BOTTES]: [
    "Bloquer",
    "Agrippement",
    "Entravement",
    "Désarmement",
    "Prise d'arme",
    "Retournement d'arme"
  ],
  [Competence.RUSES]: [
    "Enchaînement",
    "Feinter",
    "Contre",
    "Hébétement",
    "Essouffler",
    "Battement",
    "Destruction",
    "Postures",
    "Prises d'arme"
  ],
  
  // Puissance - Tirer
  [Competence.BANDE]: ["Encordage (mettre la corde)", "Surbandé", "en Tirs Courbés", "Tirs multiples"],
  [Competence.PROPULSE]: ["Tirs Rapprochés", "Tirs Longue Distance", "Tirs Imprévisibles", "Tirs sur 360"],
  [Competence.JETE]: ["de Paume", "à Manche", "Rattrapage de jet", "Jets multiples"],
  
  // Aisance - Réagir
  [Competence.FLUIDITE]: ["Réactivité", "Spontanéité", "Rythmique", "Feinter", "Contrer"],
  [Competence.ESQUIVE]: ["Repositionnante", "en Roulade", "Préparée", "Instinctive"],
  [Competence.EVASION]: ["(Dés)Engagement", "Faufilage", "Déliement", "Délivrement"],
  
  // Aisance - Dérober
  [Competence.ESCAMOTAGE]: ["Espionnant", "d'Objets portés", "de Véhicules", "de Créatures"],
  [Competence.ILLUSIONS]: ["Trichantes", "Spectaculaires", "de Diversion", "de Disparition"],
  [Competence.DISSIMULATION]: ["Se cacher", "Cacher des Choses", "Déplacement silencieux", "Embuscades/Filatures"],
  
  // Aisance - Coordonner
  [Competence.GESTUELLE]: ["Danse", "Posture (au combat)", "Pantomime", "Rituelle", "Athlétique", "Improvisée"],
  [Competence.MINUTIE]: ["Délicatesse", "Doigté", "Impact", "Impulsion"],
  [Competence.EQUILIBRE]: ["Stabilisant", "en Sols difficiles", "Funambule", "Jonglage", "Surchargé"],
  
  // Précision - Manier
  [Competence.VISEE]: ["Mécanismes d'armement", "Tir à longue distance", "Tir de soutien", "en Position difficile", "Visée multiple"],
  [Competence.CONDUITE]: ["Propulsion personnelle", "Tirée par créatures", "dans le Risque", "la Terre", "les Liquides", "les Airs", "le Vide", "sur Terrain difficile", "sur Pistes/Rails", "sur Liquides (glisse)"],
  [Competence.HABILETE]: ["Une main", "Deux mains", "Ambidextrie", "Recharge/Réarmement", "Munition en Main", "Parade"],
  
  // Précision - Façonner
  [Competence.DEBROUILLARDISE]: ["Monte de camp", "Orientation", "Allumage/Extinction", "Camouflage"],
  [Competence.BRICOLAGE]: ["Contrefaçon", "Raccommodage", "Amélioration", "Improvisation"],
  [Competence.SAVOIR_FAIRE]: ["Alimentaire", "des Graisses", "du Papier", "des Plantes", "du Textile", "du Cuir", "du Verre", "de la Construction", "des Métaux", "des Richesses", "du Bois", "de la Lutherie", "des Arts plastiques", "des Arts de dessein", "de la Récolte"],
  
  // Précision - Fignoler
  [Competence.ARTIFICES]: ["Amorçage", "Désamorçage", "Enfumants", "Explosifs"],
  [Competence.SECURITE]: ["Dévérouillage", "Verrouillage", "Copie de serrure", "Copie de Clef"],
  [Competence.CASSE_TETES]: ["Nœuds d'Attelage", "de Saisine", "de Coude", "de Boucle", "Épissure de corde", "Casse-têtes", "Craque-coffre", "Puzzles"],
  
  // Athlétisme - Traverser
  [Competence.PAS]: ["Ramper", "Marcher", "Courir", "Charger", "Pédaler"],
  [Competence.GRIMPE]: ["Montagnard", "Glaciaire", "Descendant", "en Rappel", "sur Créature"],
  [Competence.ACROBATIE]: ["Aérienne", "Sauts périlleux", "Chuter", "Contorsionniste"],
  
  // Athlétisme - Efforcer
  [Competence.POID]: ["Tirer & Pousser", "Soulever & Ouvrir", "Porter", "Lancer", "Supporter (Équiper)"],
  [Competence.SAUT]: ["Sans élan", "Précis", "en Longueur", "en Hauteur", "de Paroi", "à la Perche"],
  [Competence.NATATION]: ["Plongeant", "Contre-courant", "de Compétition", "Flotter surplace", "Secourisme", "Bataille immergée"],
  
  // Athlétisme - Manœuvrer
  [Competence.VOL]: ["Planer", "Piquer", "Flotter", "Poussée"],
  [Competence.FOUISSAGE]: ["Viscosité & Liquides", "Sables & Granulaires", "Terres & Gravats", "Roches & Solides"],
  [Competence.CHEVAUCHEMENT]: ["Montée en selle", "Déplacement monté", "Manœuvres montées", "Agissement monté"],
  
  // Charisme - Captiver
  [Competence.SEDUCTION]: ["Attirer", "faire Émouvoir", "faire Admirer", "faire Reconnaître", "Avoir une Faveur", "Subvertir à la Déloyauté"],
  [Competence.MIMETISME]: ["Sons naturels", "Êtres sauvages", "Accents & Dialectes", "Mimique", "Interprétation de rôle", "Déguisement"],
  [Competence.CHANT]: ["de Poitrine", "de Tête/d'Appel", "Diphonique", "Improvisée", "de Mélodie", "en Chœur", "Ventriloque", "Sifflée"],
  
  // Charisme - Convaincre
  [Competence.NEGOCIATION]: ["Marchandage", "Corrompre", "Diplomatie", "Débattre", "Enchèrir", "Renseignement"],
  [Competence.TROMPERIE]: ["Belles-paroles", "Bobards", "Distraire", "Escroquer", "Railleries", "Troller"],
  [Competence.PRESENTATION]: ["Première impression", "Bienséance", "Enseigner", "Réseauter", "Mode", "Rumeurs"],
  
  // Charisme - Interpréter
  [Competence.INSTRUMENTAL]: ["Attirer", "faire Émouvoir", "faire Admirer", "faire Reconnaître", "Avoir une Faveur", "Subvertir à la Déloyauté"],
  [Competence.INSPIRATION]: ["Apaiser", "Captiver", "Éduquer", "Camaraderie", "Festivité", "Fanatisme"],
  [Competence.NARRATION]: ["Fabuleuse & Poétique", "Banalités", "Ragots & Rumeurs", "Propagande", "Plaisanteries", "Énigmes"],
  
  // Détection - Discerner
  [Competence.VISION]: ["Précise & Distante", "Écritures", "Lecture sur lèvre", "Langage corporel"],
  [Competence.ESTIMATION]: ["Valeur des Objets", "des Aptitudes", "des Arts", "de Contrebande", "de Recélage", "Fraude fiscale", "Comptabilité", "Administration"],
  [Competence.TOUCHER]: ["Textures", "Températures", "Lectures à froid", "Reconnaissance aveugle"],
  
  // Détection - Découvrir
  [Competence.INVESTIGATION]: ["Fouille", "Pistage", "Autopsie", "Décryptage", "Profilage", "Découverte", "Prospective"],
  [Competence.GOUT]: ["Du Salé", "De l'Acide", "Du Sucré", "De l'Umami", "De l'Amer", "Culinaires", "Malaises", "Secrétions"],
  [Competence.RESSENTI]: ["Temps & Climat", "Êtres sauvages", "Vérité", "Mentalisme", "Émotions & Motivations", "Se relater"],
  
  // Détection - Dépister
  [Competence.ODORAT]: ["Parfums mélangés", "Airs sains & malsains", "Pistage", "Détection aveugle"],
  [Competence.AUDITION]: ["Écoute & Murmures", "Sons naturels", "Apprentissage du parlé", "Écholocation"],
  [Competence.INTEROCEPTION]: ["Équilibroception", "Proprioception", "Faim", "Soif", "Suffocation", "Empoisonnement", "Émotions", "Temporalité"],
  
  // Réflexion - Concevoir
  [Competence.ARTISANAT]: ["Alimentaire", "des Graisses", "du Papier", "des Plantes", "du Textile", "du Cuir", "du Verre", "de la Construction", "des Métaux", "des Richesses", "du Bois", "de la Lutherie", "des Arts plastiques", "des Arts de dessein", "de la Récolte"],
  [Competence.MEDECINE]: ["Diagnostiquer", "Thérapie", "Premiers soins", "Chirurgie", "Folies", "Poisons/Antipoisons"],
  [Competence.INGENIERIE]: ["Civil", "Mécanique", "Chimique", "Énergique", "Mathématique", "Recherche académique"],
  
  // Réflexion - Acculturer
  [Competence.JEUX]: ["Jeux d'Ambiance", "de Société", "de Hasard", "d'Esprit", "de Rôle", "Guide de jeu", "Arbitrage", "Conceptualisation", "Parier & Défier", "Compétition"],
  [Competence.SOCIETE]: ["Rilique", "Préhistorique", "Folklorique", "Traditionnelle", "Internationale", "Linguistique", "Artistique", "Légale", "Illégale", "Entrepreneurial", "Économique", "des Équipements", "Militaire"],
  [Competence.GEOGRAPHIE]: ["Localités", "Astronomie", "Climats", "Dangers naturels", "Milieux Désertiques", "Humides", "Tempérés", "Habités", "Souterrains", "Aquatiques", "Arboricoles", "Célestes"],
  
  // Réflexion - Acclimater
  [Competence.NATURE]: ["Airs", "Minéraux", "Granulaires", "Eaux", "Neiges", "Arbres", "Herbes", "Racines", "Fungi", "Créatures Volatiles", "Terrestres", "Marines", "Infimes"],
  [Competence.PASTORALISME]: ["Gouvernance", "Pâturage", "Manutention", "Marquage", "Traite", "Tonte", "Élevage", "Croisement", "Abattage", "Dressage"],
  [Competence.AGRONOMIE]: ["Labourage", "Semailles", "Cultivation", "Moisson", "Produits", "Approvisionnement"],
  
  // Domination - Discipliner
  [Competence.COMMANDEMENT]: ["Coup de fouet", "Se jeter à l'eau", "Retourner les poches", "Tirer les ficelles", "Lever les bâtons", "Dans le chaos", "La corde au cou", "Cracher les ordres", "Roi nu", "Duelliste"],
  [Competence.OBEISSANCE]: ["Courber l'échine", "Se plier en quatre", "Lèche-botte", "Sauter sur la grenade", "Bouffer dans la main", "Suivre le troupeau", "Marquer sa chair", "S'adapter", "Mimer la bête"],
  [Competence.OBSTINANCE]: ["Mains propres (Moralité)", "Ambitieuse (Motivation)", "Tête de mule (Personnalité)", "Respectueuse (Socialité)", "Fidèle (Disposition)", "Obsédée (Passion)", "Martyr"],
  
  // Domination - Endurer
  [Competence.GLOUTONNERIE]: ["Capacité d'Aspiration", "Contrôle d'Aspiration", "Capacité d'Inhalation", "Contrôle d'Inhalation", "Capacité d'Expiration", "Contrôle d'Expiration", "Aspiration continue (sans reflux)"],
  [Competence.BEUVERIE]: ["Capacité des Mâchoires", "d'Avalement d'Ingurgitation", "Capacité/Contrôle de Déglutition", "Résistance au textures Visqueuses", "Résistance au textures Granuleuses", "Résistance au textures Épineuses"],
  [Competence.ENTRAILLES]: ["Résistance interne", "aux Inconfort", "à la Saleté", "Capacité d'Absorption cutanée", "d'Estomac", "Pulmonaire", "Vésicale", "Rectale"],
  
  // Domination - Dompter
  [Competence.INTIMIDATION]: ["Par la Force (coup de pression)", "Torture", "Insulte", "Chantage", "Terreur", "Interrogatoire", "Tête-à-tête", "Regard noir", "Voix grave"],
  [Competence.APPRIVOISEMENT]: ["Caresse", "Apaisement", "Friandise", "Main tendue", "Lire par le regard", "Habitude", "Apaiser", "Motiver", "Être Monté & Transporter", "Ordonnée", "à Combattre"],
  [Competence.DRESSAGE]: ["Par Répétition", "Par Fouet", "Par Récompense", "Par Imitation", "en un(e) Bête/Être de jeu", "en un(e) Bête/Être de spectacle", "en un(e) Bête/Être de monte", "en un(e) Bête/Être de travail", "en un(e) Bête/Être de combat", "en un(e) Bête/Être de noblesse", "Marquage", "Esclavage", "Briser l'âme"],
};

export function getMasteries(competence: Competence): string[] {
  return MASTERY_REGISTRY[competence] || [];
}

export function getMasteryCount(competence: Competence): number {
  return getMasteries(competence).length;
}

