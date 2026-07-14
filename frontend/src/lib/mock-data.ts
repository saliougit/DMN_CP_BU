import type { Document, Faculte, Niveau } from "@/types"

// ─── Niveaux ────────────────────────────────────────────────────────────────

export const MOCK_NIVEAUX: Niveau[] = [
  // Système LMD (toutes facultés sauf ESP Cycle Ingénieur)
  { id: "n1",  nom: "Licence 1", ordre: 1 },
  { id: "n2",  nom: "Licence 2", ordre: 2 },
  { id: "n3",  nom: "Licence 3", ordre: 3 },
  { id: "n4",  nom: "Master 1",  ordre: 4 },
  { id: "n5",  nom: "Master 2",  ordre: 5 },
  { id: "n6",  nom: "Doctorat",  ordre: 6 },
  // Système Ingénieur — ESP Cycle Public uniquement
  { id: "n7",  nom: "DUT 1", ordre: 7 },
  { id: "n8",  nom: "DUT 2", ordre: 8 },  // rapport de stage obligatoire
  { id: "n9",  nom: "DIC 1", ordre: 9 },
  { id: "n10", nom: "DIC 2", ordre: 10 },
  { id: "n11", nom: "DIC 3", ordre: 11 }, // mémoire d'ingénieur de conception
]

export const LMD_NIVEAUX   = MOCK_NIVEAUX.filter((n) => n.ordre <= 6)
export const ESP_ING_NIVEAUX = MOCK_NIVEAUX.filter((n) => n.ordre >= 7)

// Tous les départements ESP ont les deux cycles : Ingénieur (DUT→DIC) + Privé LMD
export function getNiveauxForFiliere(_filiereNom: string, faculteCode?: string): Niveau[] {
  if (faculteCode === "ESP") return MOCK_NIVEAUX  // ING + LMD pour tout l'ESP
  return LMD_NIVEAUX
}

// ─── Facultés et filières — structure officielle UCAD ───────────────────────

export const MOCK_FACULTES: Faculte[] = [
  {
    id: "f1", nom: "Sciences et Techniques", code: "FST",
    filieres: [
      { id: "fi1", nom: "PCSM", faculteId: "f1" },  // Physique Chimie et Sciences de la Matière
      { id: "fi2", nom: "BCGS", faculteId: "f1" },  // Biologie Chimie et Géosciences
      { id: "fi3", nom: "MPI",  faculteId: "f1" },  // Maths Physique et Informatique
    ],
  },
  {
    id: "f2", nom: "École Supérieure Polytechnique", code: "ESP",
    filieres: [
      // Cycle Ingénieur Public (DUT → DIC)
      { id: "fi4", nom: "Génie Mécanique",                    faculteId: "f2" },
      { id: "fi5", nom: "Génie Électrique",                   faculteId: "f2" },
      { id: "fi6", nom: "Génie Civil",                        faculteId: "f2" },
      { id: "fi7", nom: "Génie Informatique",                 faculteId: "f2" },
      { id: "fi8", nom: "Génie Chimique et Biologie Appliquée", faculteId: "f2" },
      // Cycle Privé LMD
      { id: "fi9", nom: "Gestion", faculteId: "f2" },
    ],
  },
  {
    id: "f3", nom: "Médecine, Pharmacie et Odontologie", code: "MÉDECINE",
    filieres: [
      { id: "fi10", nom: "Médecine",    faculteId: "f3" },
      { id: "fi11", nom: "Pharmacie",   faculteId: "f3" },
      { id: "fi12", nom: "Odontologie", faculteId: "f3" },
    ],
  },
  {
    id: "f4", nom: "Sciences Juridiques et Politiques", code: "DROIT",
    filieres: [
      { id: "fi13", nom: "Science Politique", faculteId: "f4" },
      { id: "fi14", nom: "Droit Public",      faculteId: "f4" },
      { id: "fi15", nom: "Droit Privé",       faculteId: "f4" },
      { id: "fi16", nom: "Histoire du Droit", faculteId: "f4" },
    ],
  },
  {
    id: "f5", nom: "Sciences Économiques et de Gestion", code: "FASEG",
    filieres: [
      { id: "fi17", nom: "Analyses et Politiques Économiques", faculteId: "f5" },
      { id: "fi18", nom: "Gestion",                            faculteId: "f5" },
      { id: "fi19", nom: "Techniques Quantitatives",           faculteId: "f5" },
    ],
  },
  {
    id: "f6", nom: "Sciences de l'Éducation", code: "FASTEF",
    filieres: [], // départements non spécifiés — à compléter
  },
  {
    id: "f7", nom: "Lettres et Sciences Humaines", code: "FLSH",
    filieres: [
      { id: "fi20", nom: "Histoire",        faculteId: "f7" },
      { id: "fi21", nom: "Géographie",      faculteId: "f7" },
      { id: "fi22", nom: "Philosophie",     faculteId: "f7" },
      { id: "fi23", nom: "Sociologie",      faculteId: "f7" },
      { id: "fi24", nom: "Psychologie",     faculteId: "f7" },
      { id: "fi25", nom: "Linguistique",    faculteId: "f7" },
      { id: "fi26", nom: "Lettres Modernes", faculteId: "f7" },
      { id: "fi27", nom: "Langues Romanes", faculteId: "f7" },
      { id: "fi28", nom: "Anglais",         faculteId: "f7" },
      { id: "fi29", nom: "Russe",           faculteId: "f7" },
      { id: "fi30", nom: "Allemand",        faculteId: "f7" },
      { id: "fi31", nom: "Portugais",       faculteId: "f7" },
      { id: "fi32", nom: "Arabe",           faculteId: "f7" },
    ],
  },
  {
    id: "f8", nom: "Bibliothéconomie et Sciences de l'Information", code: "EBAD",
    filieres: [], // département unique non spécifié — à compléter
  },
]

// ─── Documents de démonstration ────────────────────────────────────────────

const PDF_DEMO = "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf"

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: "1",
    titre: "Impact du financement islamique sur le développement économique au Sénégal",
    auteur: "Moussa Diallo",
    type: "memoire_master",
    statut: "approuve",
    faculte: "Sciences Économiques et de Gestion",
    filiere: "Analyses et Politiques Économiques",
    niveau: "Master 2",
    annee: 2023,
    directeur: "Prof. Abdoulaye Mbaye",
    resume: "Analyse des instruments de financement islamique et leur impact sur l'inclusion financière au Sénégal. Étude des mécanismes de mourabaha, moucharaka et waqf.",
    motsCles: ["Finance islamique", "Développement économique", "Sénégal", "Waqf"],
    pages: 87,
    fichierUrl: PDF_DEMO,
    soumisParId: "u1", soumisLe: "2023-06-15", approuveLe: "2023-06-20", approuveParId: "admin1",
  },
  {
    id: "2",
    titre: "L'éducation coranique et son intégration dans le système éducatif formel sénégalais",
    auteur: "Aïssatou Ndiaye",
    type: "these_doctorat",
    statut: "approuve",
    faculte: "Sciences de l'Éducation",
    filiere: "",
    niveau: "Doctorat",
    annee: 2022,
    directeur: "Prof. Mamadou Sall",
    resume: "Étude comparative entre l'enseignement traditionnel coranique (daara) et l'éducation formelle. Analyse des complémentarités et des défis d'intégration.",
    motsCles: ["Éducation coranique", "Daara", "Système éducatif", "Intégration"],
    pages: 312,
    fichierUrl: PDF_DEMO,
    soumisParId: "u2", soumisLe: "2022-09-10", approuveLe: "2022-09-25", approuveParId: "admin1",
  },
  {
    id: "3",
    titre: "Les fondements juridiques du waqf en droit sénégalais contemporain",
    auteur: "Ibrahima Sow",
    type: "memoire_licence",
    statut: "approuve",
    faculte: "Sciences Juridiques et Politiques",
    filiere: "Droit Privé",
    niveau: "Licence 3",
    annee: 2023,
    directeur: "Dr. Fatou Ba",
    resume: "Analyse de la place du waqf dans le droit sénégalais. Étude des textes législatifs et de la jurisprudence relative aux biens de mainmorte islamique.",
    motsCles: ["Waqf", "Droit islamique", "Sénégal", "Biens de mainmorte"],
    pages: 54,
    fichierUrl: PDF_DEMO,
    soumisParId: "u3", soumisLe: "2023-05-01", approuveLe: "2023-05-10", approuveParId: "admin1",
  },
  {
    id: "4",
    titre: "Philosophie mouride et modernité : relecture de la pensée de Cheikh Ahmadou Bamba",
    auteur: "Serigne Touba Mbacké",
    type: "these_doctorat",
    statut: "approuve",
    faculte: "Lettres et Sciences Humaines",
    filiere: "Philosophie",
    niveau: "Doctorat",
    annee: 2021,
    directeur: "Prof. Souleymane Bachir Diagne",
    resume: "Exploration de la pensée philosophique et spirituelle de Cheikh Ahmadou Bamba. Analyse des concepts de travail, d'éducation et de résistance non-violente.",
    motsCles: ["Mouridisme", "Cheikh Ahmadou Bamba", "Philosophie", "Modernité"],
    pages: 428,
    fichierUrl: PDF_DEMO,
    soumisParId: "u4", soumisLe: "2021-03-15", approuveLe: "2021-04-02", approuveParId: "admin1",
  },
  {
    id: "5",
    titre: "Application des algorithmes de machine learning dans le diagnostic médical",
    auteur: "Fatima Zahra Kane",
    type: "memoire_master",
    statut: "approuve",
    faculte: "Sciences et Techniques",
    filiere: "MPI",
    niveau: "Master 2",
    annee: 2023,
    directeur: "Dr. Oumar Thiongane",
    resume: "Implémentation et évaluation d'algorithmes de classification (Random Forest, SVM, réseau de neurones) pour le diagnostic de maladies tropicales à partir de données cliniques.",
    motsCles: ["Machine learning", "Diagnostic médical", "Intelligence artificielle", "Santé"],
    pages: 98,
    fichierUrl: PDF_DEMO,
    soumisParId: "u5", soumisLe: "2023-07-20", approuveLe: "2023-07-30", approuveParId: "admin1",
  },
  {
    id: "6",
    titre: "Microfinance et autonomisation économique des femmes en milieu rural sénégalais",
    auteur: "Rokhaya Diop",
    type: "memoire_master",
    statut: "approuve",
    faculte: "Sciences Économiques et de Gestion",
    filiere: "Analyses et Politiques Économiques",
    niveau: "Master 1",
    annee: 2022,
    directeur: "Dr. Cheikh Tidiane Fall",
    resume: "Évaluation de l'impact des programmes de microfinance sur l'autonomisation économique et sociale des femmes dans les zones rurales du Sénégal.",
    motsCles: ["Microfinance", "Genre", "Développement rural", "Autonomisation"],
    pages: 76,
    fichierUrl: PDF_DEMO,
    soumisParId: "u6", soumisLe: "2022-11-05", approuveLe: "2022-11-15", approuveParId: "admin1",
  },
  {
    id: "7",
    titre: "Histoire des Mourides au Sénégal : de la fondation de Touba à nos jours",
    auteur: "El Hadji Mbaye",
    type: "these_doctorat",
    statut: "approuve",
    faculte: "Lettres et Sciences Humaines",
    filiere: "Histoire",
    niveau: "Doctorat",
    annee: 2020,
    directeur: "Prof. Mamadou Diouf",
    resume: "Histoire complète de la confrérie mouride depuis sa fondation par Cheikh Ahmadou Bamba en 1883 jusqu'aux développements contemporains, incluant l'expansion internationale.",
    motsCles: ["Histoire", "Mouridisme", "Touba", "Confrérie"],
    pages: 534,
    fichierUrl: PDF_DEMO,
    soumisParId: "u7", soumisLe: "2020-06-30", approuveLe: "2020-07-15", approuveParId: "admin1",
  },
  {
    id: "8",
    titre: "Le code de la famille sénégalais face aux dispositions du droit musulman",
    auteur: "Mariama Bâ Diallo",
    type: "memoire_master",
    statut: "approuve",
    faculte: "Sciences Juridiques et Politiques",
    filiere: "Droit Privé",
    niveau: "Master 2",
    annee: 2023,
    directeur: "Prof. Aminata Sow Fall",
    resume: "Analyse comparative entre le code de la famille sénégalais issu du droit civil français et les dispositions du droit musulman concernant le mariage, le divorce et l'héritage.",
    motsCles: ["Droit de la famille", "Droit islamique", "Code civil", "Mariage"],
    pages: 112,
    fichierUrl: PDF_DEMO,
    soumisParId: "u8", soumisLe: "2023-04-12", approuveLe: "2023-04-22", approuveParId: "admin1",
  },
  {
    id: "9",
    titre: "Didactique du wolof : méthodes d'enseignement de la langue nationale",
    auteur: "Pape Demba Thiam",
    type: "memoire_licence",
    statut: "approuve",
    faculte: "Sciences de l'Éducation",
    filiere: "",
    niveau: "Licence 3",
    annee: 2022,
    directeur: "Dr. Ndéye Coumba Mbodj",
    resume: "Proposition de méthodes innovantes pour l'enseignement du wolof en tant que langue nationale dans le cadre scolaire formel sénégalais.",
    motsCles: ["Wolof", "Didactique", "Langue nationale", "Enseignement"],
    pages: 63,
    fichierUrl: PDF_DEMO,
    soumisParId: "u9", soumisLe: "2022-06-05", approuveLe: "2022-06-15", approuveParId: "admin1",
  },
  {
    id: "10",
    titre: "Traitement des maladies tropicales par la phytothérapie traditionnelle sénégalaise",
    auteur: "Dr. Abdou Lahad Mbow",
    type: "these_doctorat",
    statut: "approuve",
    faculte: "Médecine, Pharmacie et Odontologie",
    filiere: "Pharmacie",
    niveau: "Doctorat",
    annee: 2021,
    directeur: "Prof. Youssou Ndour",
    resume: "Inventaire et analyse des plantes médicinales utilisées en médecine traditionnelle sénégalaise pour le traitement du paludisme, de la tuberculose et d'autres maladies tropicales.",
    motsCles: ["Phytothérapie", "Médecine traditionnelle", "Maladies tropicales", "Sénégal"],
    pages: 287,
    fichierUrl: PDF_DEMO,
    soumisParId: "u10", soumisLe: "2021-09-20", approuveLe: "2021-10-05", approuveParId: "admin1",
  },
  {
    id: "11",
    titre: "Modélisation mathématique de la propagation des épidémies en Afrique subsaharienne",
    auteur: "Thierno Oumar Barry",
    type: "memoire_master",
    statut: "approuve",
    faculte: "Sciences et Techniques",
    filiere: "MPI",
    niveau: "Master 2",
    annee: 2022,
    directeur: "Dr. Seydou Traoré",
    resume: "Développement et analyse de modèles mathématiques SIR/SEIR adaptés aux spécificités épidémiologiques de l'Afrique subsaharienne, avec application au COVID-19 et au paludisme.",
    motsCles: ["Modélisation", "Épidémiologie", "Mathématiques", "Afrique subsaharienne"],
    pages: 89,
    fichierUrl: PDF_DEMO,
    soumisParId: "u11", soumisLe: "2022-03-10", approuveLe: "2022-03-20", approuveParId: "admin1",
  },
  {
    id: "12",
    titre: "La solidarité dans la pensée économique islamique : zakât, sadaqa et waqf",
    auteur: "Cheikh Ahmed Tidiane Sy",
    type: "memoire_master",
    statut: "approuve",
    faculte: "Sciences Économiques et de Gestion",
    filiere: "Analyses et Politiques Économiques",
    niveau: "Master 1",
    annee: 2023,
    directeur: "Prof. Babacar Diagne",
    resume: "Étude des instruments de solidarité économique en islam (zakât, sadaqa, waqf) et leur potentiel pour réduire les inégalités et financer le développement dans les pays musulmans.",
    motsCles: ["Zakât", "Sadaqa", "Économie islamique", "Solidarité"],
    pages: 71,
    fichierUrl: PDF_DEMO,
    soumisParId: "u12", soumisLe: "2023-01-15", approuveLe: "2023-01-25", approuveParId: "admin1",
  },
  {
    id: "13",
    titre: "L'impact de l'intelligence artificielle sur l'enseignement supérieur au Sénégal",
    auteur: "Fatou Kiné Dieng",
    type: "memoire_master",
    statut: "en_attente",
    faculte: "Sciences et Techniques",
    filiere: "MPI",
    niveau: "Master 2",
    annee: 2024,
    directeur: "Dr. Mamadou Diallo",
    resume: "Analyse des opportunités et défis de l'intégration de l'IA dans les universités sénégalaises.",
    motsCles: ["Intelligence artificielle", "Éducation", "Sénégal", "Innovation"],
    pages: 95,
    fichierUrl: PDF_DEMO,
    soumisParId: "u5", soumisLe: "2024-09-15",
  },
  {
    id: "14",
    titre: "Le rôle de la femme dans le développement économique selon la pensée islamique",
    auteur: "Ndèye Fatou Diop",
    type: "memoire_master",
    statut: "en_attente",
    faculte: "Sciences Économiques et de Gestion",
    filiere: "Analyses et Politiques Économiques",
    niveau: "Master 1",
    annee: 2024,
    directeur: "Prof. Abdoulaye Mbaye",
    resume: "Étude du rôle économique de la femme à travers les principes de l'économie islamique.",
    motsCles: ["Femme", "Développement économique", "Islam", "Émancipation"],
    pages: 78,
    fichierUrl: PDF_DEMO,
    soumisParId: "u6", soumisLe: "2024-09-18",
  },
  {
    id: "15",
    titre: "Méthodes d'enseignement du Coran dans les daara modernes au Sénégal",
    auteur: "Serigne Moustapha Guèye",
    type: "these_doctorat",
    statut: "en_attente",
    faculte: "Sciences de l'Éducation",
    filiere: "",
    niveau: "Doctorat",
    annee: 2024,
    directeur: "Prof. Mamadou Sall",
    resume: "Thèse sur l'évolution des méthodes pédagogiques dans les écoles coraniques sénégalaises contemporaines.",
    motsCles: ["Daara", "Éducation coranique", "Pédagogie", "Sénégal"],
    pages: 345,
    fichierUrl: PDF_DEMO,
    soumisParId: "u14", soumisLe: "2024-09-02",
  },
]

// ─── Recherche ──────────────────────────────────────────────────────────────

export function searchDocuments(
  query: string,
  filters: { type?: string; faculte?: string; niveau?: string; filiere?: string; annee?: number } = {}
): Document[] {
  const q = query.toLowerCase().trim()

  return MOCK_DOCUMENTS.filter((doc) => {
    if (doc.statut !== "approuve") return false
    if (
      q &&
      !doc.titre.toLowerCase().includes(q) &&
      !doc.auteur.toLowerCase().includes(q) &&
      !doc.resume?.toLowerCase().includes(q) &&
      !doc.motsCles.some((k) => k.toLowerCase().includes(q)) &&
      !doc.faculte.toLowerCase().includes(q)
    ) return false

    if (filters.type    && doc.type    !== filters.type)    return false
    if (filters.faculte && doc.faculte !== filters.faculte) return false
    if (filters.filiere && doc.filiere !== filters.filiere) return false
    if (filters.niveau  && doc.niveau  !== filters.niveau)  return false
    if (filters.annee   && doc.annee   !== filters.annee)   return false

    return true
  })
}
