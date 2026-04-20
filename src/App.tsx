import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Truck, AlertTriangle, 
  Calculator, FileText, Plus, Edit, Trash2, Search,
  Download, CheckCircle, AlertCircle, Package, Target,
  FileCheck, TrendingUp, ClipboardList, Activity
} from 'lucide-react';

// ============================================================================
// TYPES ET INTERFACES ENHANCED
// ============================================================================

interface Equipement {
  ref: string;
  type: string;
  age: string;
  ageNum: number;
  ageMax: number;
  statut: 'Actif' | 'HS' | 'Inactif' | 'Réformé' | 'Opérationnel' | 'Limité';
  observations: string[];
  inspections: Inspection[];
  // Nouveaux champs pour analyse détaillée
  numeroSerie?: string;
  localisation?: string;
  dateMiseEnService?: string;
  utiliteOperationnelle: string;
  nbVolsParJour: number;
  fonctionCritique: boolean;
  impactSecurite: number;
  impactAvion: number;
  impactPonctualite: number;
  impactFinancier: number;
  impactEnvironnemental: boolean;
  impactEnvironnementalDesc?: string;
  conformiteReglementaire: string[];
}

interface Inspection {
  id: string;
  refEquipement: string;
  date: string;
  statutConformite: 'Conforme' | 'Non Conforme' | 'Critique';
  observations: string[];
  inspecteur: string;
}

interface RisqueEnhanced {
  id: string;
  ref: string;
  type: string;
  age: string;
  ageNum: number;
  ageMax: number;
  vetuste: number;
  statut: string;
  utilite: string;
  nbVolsJour: number;
  fonctionCritique: boolean;
  observation: string;
  danger: string;
  risque: string;
  dommage: string;
  impactSecurite: number;
  impactAvion: number;
  impactPonctualite: number;
  impactFinancier: number;
  impactEnvironnemental: boolean;
  conformiteReglementaire: string;
  gravite: number;
  probabilite: number;
  detectabilite: number;
  scoreBase: number;
  coefficientVols: number;
  scoreAjuste: number;
  niveau: string;
  couleur: string;
  prioriteAuto: 'P1' | 'P2' | 'P3' | 'P4';
  decisionStrategique: string;
}

interface ActionPlanEnhanced {
  id: string;
  ref: string;
  type: string;
  observation: string;
  danger: string;
  risque: string;
  dommage: string;
  action: string;
  priorite: 'P1' | 'P2' | 'P3' | 'P4';
  echeance: string;
  responsable: string;
  budget: number;
  statut: 'Non démarré' | 'En cours' | 'En attente pièce' | 'En attente validation' | 'Résolu' | 'Clôturé';
  commentaires: string;
  dateCreation: string;
  historique: ModificationHistory[];
}

interface ModificationHistory {
  date: string;
  champ: string;
  ancienneValeur: string;
  nouvelleValeur: string;
  utilisateur: string;
}

interface ChecklistItem {
  id: string;
  category: string;
  question: string;
  conforme: boolean | null;
  commentaire: string;
}

// ============================================================================
// DONNÉES MOCK - INVENTAIRE COMPLET GSE ENHANCED
// ============================================================================

const TYPES_EQUIPEMENT = [
  { nom: 'Air Start Unit', ageMax: 10, utilite: 'Démarrage moteurs avion', impactOperationnel: 'Élevé', impactSecurite: 'Élevé', nbVolsMoyen: 15 },
  { nom: 'Push Back', ageMax: 10, utilite: 'Repoussage avion', impactOperationnel: 'Critique', impactSecurite: 'Élevé', nbVolsMoyen: 20 },
  { nom: 'Tracteur De Piste', ageMax: 5, utilite: 'Remorquage avion', impactOperationnel: 'Critique', impactSecurite: 'Élevé', nbVolsMoyen: 18 },
  { nom: 'Tapis Bagage', ageMax: 10, utilite: 'Chargement bagages', impactOperationnel: 'Élevé', impactSecurite: 'Moyen', nbVolsMoyen: 25 },
  { nom: 'Groupe Electrogène', ageMax: 10, utilite: 'Alimentation électrique avion', impactOperationnel: 'Élevé', impactSecurite: 'Élevé', nbVolsMoyen: 20 },
  { nom: 'Bus Passagers', ageMax: 5, utilite: 'Transport passagers', impactOperationnel: 'Élevé', impactSecurite: 'Élevé', nbVolsMoyen: 30 },
  { nom: 'Escabeaux Autotractes', ageMax: 5, utilite: 'Accès avion pour personnel', impactOperationnel: 'Moyen', impactSecurite: 'Élevé', nbVolsMoyen: 12 },
  { nom: 'Belt Loader', ageMax: 8, utilite: 'Chargement bagages en soute', impactOperationnel: 'Élevé', impactSecurite: 'Moyen', nbVolsMoyen: 25 },
  { nom: 'Plateforme 3.5T', ageMax: 8, utilite: 'Chargement fret', impactOperationnel: 'Moyen', impactSecurite: 'Moyen', nbVolsMoyen: 10 },
  { nom: 'Plateforme 7T', ageMax: 8, utilite: 'Chargement fret lourd', impactOperationnel: 'Moyen', impactSecurite: 'Moyen', nbVolsMoyen: 8 },
  { nom: 'Plateforme 14T', ageMax: 8, utilite: 'Chargement fret très lourd', impactOperationnel: 'Moyen', impactSecurite: 'Élevé', nbVolsMoyen: 5 },
  { nom: 'Camion PMR', ageMax: 7, utilite: 'Transport personnes à mobilité réduite', impactOperationnel: 'Moyen', impactSecurite: 'Élevé', nbVolsMoyen: 15 },
  { nom: 'Ravitailleur Eau', ageMax: 10, utilite: 'Remplissage eau avion', impactOperationnel: 'Faible', impactSecurite: 'Faible', nbVolsMoyen: 20 },
  { nom: 'Vide Toilettes', ageMax: 10, utilite: 'Vidange toilettes avion', impactOperationnel: 'Faible', impactSecurite: 'Moyen', nbVolsMoyen: 20 },
  { nom: 'Escaliers Tractés', ageMax: 7, utilite: 'Accès passagers avion', impactOperationnel: 'Moyen', impactSecurite: 'Élevé', nbVolsMoyen: 18 },
];

const DONNEES_INITIALES: Equipement[] = [
  {
    ref: '2239', type: 'Air Start Unit', age: '17 ans', ageNum: 17, ageMax: 10, statut: 'Actif',
    observations: ['Non conforme (Age dépassé)', 'Extincteur non étiqueté', 'Dégradation et sous-pression des pneumatiques', 'Macaron expiré'],
    inspections: [], utiliteOperationnelle: 'Démarrage moteurs avion', nbVolsParJour: 15, fonctionCritique: true,
    impactSecurite: 4, impactAvion: 4, impactPonctualite: 4, impactFinancier: 50000,
    impactEnvironnemental: false, conformiteReglementaire: ['OACI', 'IATA']
  },
  {
    ref: '2231', type: 'Air Start Unit', age: '21 ans', ageNum: 21, ageMax: 10, statut: 'Actif',
    observations: ['Non conforme (Age dépassé)', 'Extincteur non étiqueté', 'Sous-pression des pneumatiques', 'Macaron expiré'],
    inspections: [], utiliteOperationnelle: 'Démarrage moteurs avion', nbVolsParJour: 15, fonctionCritique: true,
    impactSecurite: 4, impactAvion: 4, impactPonctualite: 4, impactFinancier: 50000,
    impactEnvironnemental: false, conformiteReglementaire: ['OACI', 'IATA']
  },
  {
    ref: '6690', type: 'Push Back', age: '7 ans', ageNum: 7, ageMax: 10, statut: 'Actif',
    observations: ['Fauteuil du conducteur dégradé', 'Nécessité de nettoyage', 'Dégradation des pneumatiques risque : perte de contrôle', 'Macaron expiré'],
    inspections: [], utiliteOperationnelle: 'Repoussage avion', nbVolsParJour: 18, fonctionCritique: true,
    impactSecurite: 4, impactAvion: 5, impactPonctualite: 5, impactFinancier: 100000,
    impactEnvironnemental: false, conformiteReglementaire: ['OACI', 'IATA', 'DGAC']
  },
  {
    ref: '6682', type: 'Push Back', age: '14 ans', ageNum: 14, ageMax: 10, statut: 'Inactif',
    observations: ['Réformé'], inspections: [], utiliteOperationnelle: 'Repoussage avion', nbVolsParJour: 0, fonctionCritique: false,
    impactSecurite: 0, impactAvion: 0, impactPonctualite: 0, impactFinancier: 0,
    impactEnvironnemental: false, conformiteReglementaire: []
  },
  {
    ref: '6696', type: 'Push Back', age: '1 mois', ageNum: 0.08, ageMax: 10, statut: 'HS',
    observations: ['Dégradation pneumatiques', 'Macaron expiré', 'Hors Service (fuites d\'huiles)'],
    inspections: [], utiliteOperationnelle: 'Repoussage avion', nbVolsParJour: 0, fonctionCritique: true,
    impactSecurite: 5, impactAvion: 5, impactPonctualite: 5, impactFinancier: 150000,
    impactEnvironnemental: true, impactEnvironnementalDesc: 'Fuite huile - pollution sol', conformiteReglementaire: ['OACI', 'IATA', 'DGAC']
  },
  {
    ref: '6109', type: 'Tracteur De Piste', age: '10 ans', ageNum: 10, ageMax: 5, statut: 'Actif',
    observations: ['Non conforme (Age dépassé)', 'Peinture dégradée', 'Essuies Glaces Hors Service', 'Manque rétroviseurs', 'Absence des feux', 'Macaron expiré'],
    inspections: [], utiliteOperationnelle: 'Remorquage avion', nbVolsParJour: 16, fonctionCritique: true,
    impactSecurite: 4, impactAvion: 4, impactPonctualite: 4, impactFinancier: 80000,
    impactEnvironnemental: false, conformiteReglementaire: ['OACI', 'IATA', 'DGAC']
  },
  {
    ref: '6170', type: 'Tracteur De Piste', age: '7 ans', ageNum: 7, ageMax: 5, statut: 'HS',
    observations: ['Non conforme (Age dépassé)', 'Fuite d\'huile', 'Flexible hydraulique HS', 'Hors Service'],
    inspections: [], utiliteOperationnelle: 'Remorquage avion', nbVolsParJour: 0, fonctionCritique: true,
    impactSecurite: 5, impactAvion: 4, impactPonctualite: 4, impactFinancier: 100000,
    impactEnvironnemental: true, impactEnvironnementalDesc: 'Fuite huile hydraulique', conformiteReglementaire: ['OACI', 'IATA', 'DGAC']
  },
  {
    ref: '6045', type: 'Tracteur De Piste', age: '2 ans', ageNum: 2, ageMax: 5, statut: 'Actif',
    observations: ['Peinture Dégradée', 'Manque rétroviseurs', 'Extincteur non étiqueté', 'Absence des feux', 'Macaron expiré'],
    inspections: [], utiliteOperationnelle: 'Remorquage avion', nbVolsParJour: 16, fonctionCritique: true,
    impactSecurite: 3, impactAvion: 3, impactPonctualite: 3, impactFinancier: 30000,
    impactEnvironnemental: false, conformiteReglementaire: ['OACI', 'IATA', 'DGAC']
  },
  {
    ref: '6028', type: 'Tracteur De Piste', age: 'Neuf', ageNum: 0, ageMax: 5, statut: 'Actif',
    observations: ['Electrique', 'Nouveau'], inspections: [], utiliteOperationnelle: 'Remorquage avion', nbVolsParJour: 16, fonctionCritique: true,
    impactSecurite: 1, impactAvion: 1, impactPonctualite: 1, impactFinancier: 0,
    impactEnvironnemental: false, conformiteReglementaire: ['OACI', 'IATA', 'DGAC']
  },
  {
    ref: '6818', type: 'Tapis Bagage', age: '11 ans', ageNum: 11, ageMax: 10, statut: 'Actif',
    observations: ['Non conforme (Age dépassé)', 'Fuite d\'huile', 'Bandes de protection dégradées', 'Macaron expiré'],
    inspections: [], utiliteOperationnelle: 'Chargement bagages', nbVolsParJour: 25, fonctionCritique: false,
    impactSecurite: 3, impactAvion: 2, impactPonctualite: 4, impactFinancier: 40000,
    impactEnvironnemental: true, impactEnvironnementalDesc: 'Fuite huile', conformiteReglementaire: ['IATA']
  },
  {
    ref: '6834', type: 'Tapis Bagage', age: '4 ans', ageNum: 4, ageMax: 10, statut: 'Actif',
    observations: ['Manque rétroviseurs', 'Extincteur non étiqueté', 'État du pneu dégradé', 'Macaron expiré'],
    inspections: [], utiliteOperationnelle: 'Chargement bagages', nbVolsParJour: 25, fonctionCritique: false,
    impactSecurite: 3, impactAvion: 2, impactPonctualite: 3, impactFinancier: 20000,
    impactEnvironnemental: false, conformiteReglementaire: ['IATA']
  },
  {
    ref: '6793', type: 'Tapis Bagage', age: '13 ans', ageNum: 13, ageMax: 10, statut: 'Actif',
    observations: ['Non conforme (Age dépassé)', 'Gyrophare Hors Service', 'Risque de rupture tapis', 'Macaron expiré'],
    inspections: [], utiliteOperationnelle: 'Chargement bagages', nbVolsParJour: 25, fonctionCritique: false,
    impactSecurite: 4, impactAvion: 2, impactPonctualite: 4, impactFinancier: 50000,
    impactEnvironnemental: false, conformiteReglementaire: ['IATA']
  },
  {
    ref: '2108', type: 'Groupe Electrogène', age: '10 ans', ageNum: 10, ageMax: 10, statut: 'Actif',
    observations: ['Non conforme (Age dépassé)', 'Peinture dégradée', 'Macaron expiré'],
    inspections: [], utiliteOperationnelle: 'Alimentation électrique avion', nbVolsParJour: 20, fonctionCritique: true,
    impactSecurite: 3, impactAvion: 3, impactPonctualite: 3, impactFinancier: 25000,
    impactEnvironnemental: false, conformiteReglementaire: ['OACI', 'IATA']
  },
  {
    ref: '2134', type: 'Groupe Electrogène', age: '3 ans', ageNum: 3, ageMax: 10, statut: 'Actif',
    observations: ['Gyrophare Hors Service', 'Extincteur non conforme', 'Macaron expiré'],
    inspections: [], utiliteOperationnelle: 'Alimentation électrique avion', nbVolsParJour: 20, fonctionCritique: true,
    impactSecurite: 3, impactAvion: 3, impactPonctualite: 3, impactFinancier: 20000,
    impactEnvironnemental: false, conformiteReglementaire: ['OACI', 'IATA']
  },
  {
    ref: '2055', type: 'Groupe Electrogène', age: '14 ans', ageNum: 14, ageMax: 10, statut: 'HS',
    observations: ['Non conforme (Age dépassé)', 'Fuites huile', 'Hors Service'],
    inspections: [], utiliteOperationnelle: 'Alimentation électrique avion', nbVolsParJour: 0, fonctionCritique: true,
    impactSecurite: 4, impactAvion: 4, impactPonctualite: 4, impactFinancier: 60000,
    impactEnvironnemental: true, impactEnvironnementalDesc: 'Fuite huile', conformiteReglementaire: ['OACI', 'IATA']
  },
  {
    ref: '1049', type: 'Bus Passagers', age: '2 ans', ageNum: 2, ageMax: 5, statut: 'Actif',
    observations: ['Feux antibrouillard hors service', 'Macaron expiré'],
    inspections: [], utiliteOperationnelle: 'Transport passagers', nbVolsParJour: 30, fonctionCritique: false,
    impactSecurite: 3, impactAvion: 1, impactPonctualite: 3, impactFinancier: 15000,
    impactEnvironnemental: false, conformiteReglementaire: ['DGAC']
  },
  {
    ref: '1098', type: 'Bus Passagers', age: '4 ans', ageNum: 4, ageMax: 5, statut: 'HS',
    observations: ['Pneu dégradé', 'HORS SERVICE (Besoin pièce)'],
    inspections: [], utiliteOperationnelle: 'Transport passagers', nbVolsParJour: 0, fonctionCritique: false,
    impactSecurite: 4, impactAvion: 1, impactPonctualite: 3, impactFinancier: 25000,
    impactEnvironnemental: false, conformiteReglementaire: ['DGAC']
  },
  {
    ref: '4656', type: 'Escabeaux Autotractes', age: '11 ans', ageNum: 11, ageMax: 5, statut: 'Actif',
    observations: ['Non conforme (Age dépassé)', 'Fauteuil dégradé', 'Pneu dégradé', 'Macaron expiré'],
    inspections: [], utiliteOperationnelle: 'Accès avion pour personnel', nbVolsParJour: 12, fonctionCritique: false,
    impactSecurite: 4, impactAvion: 2, impactPonctualite: 2, impactFinancier: 30000,
    impactEnvironnemental: false, conformiteReglementaire: ['IATA']
  },
  {
    ref: '4679', type: 'Escabeaux Autotractes', age: '4 ans', ageNum: 4, ageMax: 5, statut: 'Actif',
    observations: ['Macaron expiré'], inspections: [], utiliteOperationnelle: 'Accès avion pour personnel', nbVolsParJour: 12, fonctionCritique: false,
    impactSecurite: 2, impactAvion: 1, impactPonctualite: 2, impactFinancier: 5000,
    impactEnvironnemental: false, conformiteReglementaire: ['IATA']
  },
  {
    ref: '4626', type: 'Escabeaux Autotractes', age: '14 ans', ageNum: 14, ageMax: 5, statut: 'Actif',
    observations: ['Non conforme (Age dépassé)', 'Gard-corp non conforme', 'Macaron expiré'],
    inspections: [], utiliteOperationnelle: 'Accès avion pour personnel', nbVolsParJour: 12, fonctionCritique: false,
    impactSecurite: 5, impactAvion: 2, impactPonctualite: 2, impactFinancier: 40000,
    impactEnvironnemental: false, conformiteReglementaire: ['IATA']
  },
];

// ============================================================================
// CHECKLISTS PAR TYPE D'ÉQUIPEMENT
// ============================================================================

const CHECKLISTS_CONFIG: Record<string, ChecklistItem[]> = {
  'Push Back': [
    { id: 'pb1', category: 'Documents', question: 'Certificat de conformité à jour', conforme: null, commentaire: '' },
    { id: 'pb2', category: 'Documents', question: 'Macaron valide', conforme: null, commentaire: '' },
    { id: 'pb3', category: 'Documents', question: 'Carnet de maintenance à jour', conforme: null, commentaire: '' },
    { id: 'pb4', category: 'Sécurité', question: 'Extincteur présent et conforme', conforme: null, commentaire: '' },
    { id: 'pb5', category: 'Sécurité', question: 'Gyrophare fonctionnel', conforme: null, commentaire: '' },
    { id: 'pb6', category: 'Sécurité', question: 'Avertisseur sonore OK', conforme: null, commentaire: '' },
    { id: 'pb7', category: 'Mécanique', question: 'Pneumatiques en bon état', conforme: null, commentaire: '' },
    { id: 'pb8', category: 'Mécanique', question: 'Freins conformes', conforme: null, commentaire: '' },
    { id: 'pb9', category: 'Mécanique', question: 'Pas de fuite d\'huile', conforme: null, commentaire: '' },
    { id: 'pb10', category: 'Mécanique', question: 'Système hydraulique OK', conforme: null, commentaire: '' },
    { id: 'pb11', category: 'Cabine', question: 'Fauteuil conducteur en bon état', conforme: null, commentaire: '' },
    { id: 'pb12', category: 'Cabine', question: 'Rétroviseurs présents', conforme: null, commentaire: '' },
    { id: 'pb13', category: 'Cabine', question: 'Essuie-glaces fonctionnels', conforme: null, commentaire: '' },
    { id: 'pb14', category: 'Structure', question: 'Peinture en bon état', conforme: null, commentaire: '' },
    { id: 'pb15', category: 'Structure', question: 'Pas de corrosion visible', conforme: null, commentaire: '' },
    { id: 'pb16', category: 'Signalisation', question: 'Feux avant/arrière OK', conforme: null, commentaire: '' },
    { id: 'pb17', category: 'Signalisation', question: 'Marquages visibles', conforme: null, commentaire: '' },
    { id: 'pb18', category: 'Propreté', question: 'Équipement propre', conforme: null, commentaire: '' },
  ],
  'Air Start Unit': [
    { id: 'as1', category: 'Documents', question: 'Certificat de conformité à jour', conforme: null, commentaire: '' },
    { id: 'as2', category: 'Documents', question: 'Macaron valide', conforme: null, commentaire: '' },
    { id: 'as3', category: 'Sécurité', question: 'Extincteur présent et conforme', conforme: null, commentaire: '' },
    { id: 'as4', category: 'Sécurité', question: 'Arrêt d\'urgence fonctionnel', conforme: null, commentaire: '' },
    { id: 'as5', category: 'Mécanique', question: 'Pneumatiques en bon état', conforme: null, commentaire: '' },
    { id: 'as6', category: 'Mécanique', question: 'Compresseur conforme', conforme: null, commentaire: '' },
    { id: 'as7', category: 'Mécanique', question: 'Flexibles en bon état', conforme: null, commentaire: '' },
    { id: 'as8', category: 'Électrique', question: 'Tableau électrique OK', conforme: null, commentaire: '' },
    { id: 'as9', category: 'Structure', question: 'Peinture en bon état', conforme: null, commentaire: '' },
    { id: 'as10', category: 'Signalisation', question: 'Feux et gyrophares OK', conforme: null, commentaire: '' },
  ],
  'Tracteur De Piste': [
    { id: 'tp1', category: 'Documents', question: 'Certificat de conformité à jour', conforme: null, commentaire: '' },
    { id: 'tp2', category: 'Documents', question: 'Macaron valide', conforme: null, commentaire: '' },
    { id: 'tp3', category: 'Sécurité', question: 'Extincteur présent et conforme', conforme: null, commentaire: '' },
    { id: 'tp4', category: 'Sécurité', question: 'Gyrophare fonctionnel', conforme: null, commentaire: '' },
    { id: 'tp5', category: 'Mécanique', question: 'Pneumatiques en bon état', conforme: null, commentaire: '' },
    { id: 'tp6', category: 'Mécanique', question: 'Freins conformes', conforme: null, commentaire: '' },
    { id: 'tp7', category: 'Mécanique', question: 'Pas de fuite d\'huile', conforme: null, commentaire: '' },
    { id: 'tp8', category: 'Mécanique', question: 'Barre de remorquage OK', conforme: null, commentaire: '' },
    { id: 'tp9', category: 'Cabine', question: 'Fauteuil conducteur en bon état', conforme: null, commentaire: '' },
    { id: 'tp10', category: 'Cabine', question: 'Rétroviseurs présents', conforme: null, commentaire: '' },
    { id: 'tp11', category: 'Structure', question: 'Peinture en bon état', conforme: null, commentaire: '' },
    { id: 'tp12', category: 'Signalisation', question: 'Feux avant/arrière OK', conforme: null, commentaire: '' },
  ],
  'Tapis Bagage': [
    { id: 'tb1', category: 'Documents', question: 'Certificat de conformité à jour', conforme: null, commentaire: '' },
    { id: 'tb2', category: 'Documents', question: 'Macaron valide', conforme: null, commentaire: '' },
    { id: 'tb3', category: 'Sécurité', question: 'Extincteur présent et conforme', conforme: null, commentaire: '' },
    { id: 'tb4', category: 'Sécurité', question: 'Arrêts d\'urgence fonctionnels', conforme: null, commentaire: '' },
    { id: 'tb5', category: 'Mécanique', question: 'Pneumatiques en bon état', conforme: null, commentaire: '' },
    { id: 'tb6', category: 'Mécanique', question: 'Tapis en bon état', conforme: null, commentaire: '' },
    { id: 'tb7', category: 'Mécanique', question: 'Motorisation conforme', conforme: null, commentaire: '' },
    { id: 'tb8', category: 'Structure', question: 'Bandes de protection OK', conforme: null, commentaire: '' },
    { id: 'tb9', category: 'Structure', question: 'Peinture en bon état', conforme: null, commentaire: '' },
    { id: 'tb10', category: 'Signalisation', question: 'Feux et gyrophares OK', conforme: null, commentaire: '' },
  ],
  'Groupe Electrogène': [
    { id: 'ge1', category: 'Documents', question: 'Certificat de conformité à jour', conforme: null, commentaire: '' },
    { id: 'ge2', category: 'Documents', question: 'Macaron valide', conforme: null, commentaire: '' },
    { id: 'ge3', category: 'Sécurité', question: 'Extincteur présent et conforme', conforme: null, commentaire: '' },
    { id: 'ge4', category: 'Sécurité', question: 'Arrêt d\'urgence fonctionnel', conforme: null, commentaire: '' },
    { id: 'ge5', category: 'Électrique', question: 'Câbles en bon état', conforme: null, commentaire: '' },
    { id: 'ge6', category: 'Électrique', question: 'Prises conformes', conforme: null, commentaire: '' },
    { id: 'ge7', category: 'Mécanique', question: 'Moteur conforme', conforme: null, commentaire: '' },
    { id: 'ge8', category: 'Mécanique', question: 'Pas de fuite', conforme: null, commentaire: '' },
    { id: 'ge9', category: 'Structure', question: 'Peinture en bon état', conforme: null, commentaire: '' },
    { id: 'ge10', category: 'Signalisation', question: 'Signalisation OK', conforme: null, commentaire: '' },
  ],
  'Bus Passagers': [
    { id: 'bp1', category: 'Documents', question: 'Certificat de conformité à jour', conforme: null, commentaire: '' },
    { id: 'bp2', category: 'Documents', question: 'Macaron valide', conforme: null, commentaire: '' },
    { id: 'bp3', category: 'Documents', question: 'Assurance à jour', conforme: null, commentaire: '' },
    { id: 'bp4', category: 'Sécurité', question: 'Extincteur présent et conforme', conforme: null, commentaire: '' },
    { id: 'bp5', category: 'Sécurité', question: 'Issues de secours OK', conforme: null, commentaire: '' },
    { id: 'bp6', category: 'Mécanique', question: 'Pneumatiques en bon état', conforme: null, commentaire: '' },
    { id: 'bp7', category: 'Mécanique', question: 'Freins conformes', conforme: null, commentaire: '' },
    { id: 'bp8', category: 'Mécanique', question: 'Éclairage OK', conforme: null, commentaire: '' },
    { id: 'bp9', category: 'Intérieur', question: 'Sièges en bon état', conforme: null, commentaire: '' },
    { id: 'bp10', category: 'Intérieur', question: 'Propreté intérieure', conforme: null, commentaire: '' },
  ],
  'Escabeaux Autotractes': [
    { id: 'ea1', category: 'Documents', question: 'Certificat de conformité à jour', conforme: null, commentaire: '' },
    { id: 'ea2', category: 'Documents', question: 'Macaron valide', conforme: null, commentaire: '' },
    { id: 'ea3', category: 'Sécurité', question: 'Garde-corps conformes', conforme: null, commentaire: '' },
    { id: 'ea4', category: 'Sécurité', question: 'Système anti-chute OK', conforme: null, commentaire: '' },
    { id: 'ea5', category: 'Mécanique', question: 'Pneumatiques en bon état', conforme: null, commentaire: '' },
    { id: 'ea6', category: 'Mécanique', question: 'Système de levage OK', conforme: null, commentaire: '' },
    { id: 'ea7', category: 'Structure', question: 'Marches en bon état', conforme: null, commentaire: '' },
    { id: 'ea8', category: 'Structure', question: 'Peinture en bon état', conforme: null, commentaire: '' },
    { id: 'ea9', category: 'Signalisation', question: 'Signalisation OK', conforme: null, commentaire: '' },
  ],
};

// ============================================================================
// FONCTIONS UTILITAIRES ENHANCED
// ============================================================================

const genererId = () => Math.random().toString(36).substr(2, 9);

const formatDate = (date: Date) => date.toLocaleDateString('fr-FR', { 
  day: '2-digit', month: '2-digit', year: 'numeric' 
});

const getStatutConformite = (equipement: Equipement): 'Conforme' | 'Non Conforme' | 'Critique' => {
  if (equipement.statut === 'HS' || equipement.statut === 'Réformé') return 'Critique';
  if (equipement.observations.length === 0) return 'Conforme';
  
  const obsCritiques = equipement.observations.filter(o => 
    o.toLowerCase().includes('fuite') || o.toLowerCase().includes('hydraulique') || 
    o.toLowerCase().includes('frein') || o.toLowerCase().includes('hors service')
  );
  
  if (obsCritiques.length > 0) return 'Critique';
  return 'Non Conforme';
};

const calculerCoefficientVols = (nbVols: number): number => {
  if (nbVols <= 3) return 1;
  if (nbVols <= 10) return 1.2;
  if (nbVols <= 20) return 1.5;
  return 2;
};

const analyserDangerRisqueDommage = (observation: string): { danger: string; risque: string; dommage: string } => {
  const obs = observation.toLowerCase();
  
  if (obs.includes('pneu') || obs.includes('pneumatique')) {
    return {
      danger: 'Pneumatiques usés/dégradés',
      risque: 'Perte de contrôle, éclatement',
      dommage: 'Collision avion, blessure personnel'
    };
  }
  if (obs.includes('fuite') || obs.includes('huile') || obs.includes('hydraulique')) {
    return {
      danger: 'Fuite de fluide hydraulique/carburant',
      risque: 'Perte de fonction, incendie, pollution',
      dommage: 'Immobilisation équipement, pollution sol, incendie'
    };
  }
  if (obs.includes('extincteur')) {
    return {
      danger: 'Extincteur non conforme ou absent',
      risque: 'Impossibilité d\'éteindre un départ de feu',
      dommage: 'Incendie non maîtrisé, dégâts matériels majeurs'
    };
  }
  if (obs.includes('frein')) {
    return {
      danger: 'Système de freinage défaillant',
      risque: 'Perte de contrôle, collision',
      dommage: 'Collision avion, blessures graves'
    };
  }
  if (obs.includes('macaron')) {
    return {
      danger: 'Certification expirée',
      risque: 'Non-conformité réglementaire',
      dommage: 'Sanction DGAC, immobilisation administrative'
    };
  }
  if (obs.includes('age') || obs.includes('dépassé')) {
    return {
      danger: 'Vétusté équipement dépassée',
      risque: 'Défaillance mécanique accrue',
      dommage: 'Panne inopinée, retard vols'
    };
  }
  if (obs.includes('garde-corps') || obs.includes('gard-corp') || obs.includes('chute')) {
    return {
      danger: 'Protection hauteur non conforme',
      risque: 'Chute de hauteur',
      dommage: 'Blessures graves, décès'
    };
  }
  if (obs.includes('feu') || obs.includes('gyrophare') || obs.includes('éclairage')) {
    return {
      danger: 'Signalisation lumineuse défaillante',
      risque: 'Non-visibilité, collision',
      dommage: 'Collision au sol, incident sécurité'
    };
  }
  
  return {
    danger: 'Anomalie détectée',
    risque: 'Dégradation progressive',
    dommage: 'Réduction disponibilité'
  };
};

const calculerCriticiteEnhanced = (equipement: Equipement, observation: string): RisqueEnhanced => {
  const obs = observation.toLowerCase();
  let G = 3, P = 3, D = 3;

  if (obs.includes('pneu') || obs.includes('frein') || obs.includes('perte de contrôle')) {
    G = 4; P = 4; D = 2;
  } else if (obs.includes('extincteur') || obs.includes('feu')) {
    G = 5; P = 3; D = 2;
  } else if (obs.includes('fuite') || obs.includes('huile') || obs.includes('hydraulique')) {
    G = 4; P = 4; D = 3;
  } else if (obs.includes('macaron') || obs.includes('peinture')) {
    G = 2; P = 4; D = 1;
  } else if (obs.includes('âge') || obs.includes('age') || obs.includes('dépassé')) {
    G = 3; P = 4; D = 2;
  } else if (obs.includes('garde-corps') || obs.includes('gard-corp') || obs.includes('chute') || obs.includes('hauteur')) {
    G = 5; P = 3; D = 2;
  } else if (obs.includes('electrique') || obs.includes('électrique') || obs.includes('câble')) {
    G = 4; P = 3; D = 2;
  } else if (obs.includes('hydraulique')) {
    G = 4; P = 4; D = 3;
  }

  const vetuste = equipement.ageMax > 0 ? Math.round((equipement.ageNum / equipement.ageMax) * 100) : 0;
  const scoreBase = G * P * D;
  const coefficientVols = calculerCoefficientVols(equipement.nbVolsParJour);
  const scoreAjuste = Math.round(scoreBase * coefficientVols);
  
  let niveau = 'Acceptable 🟢';
  let couleur = '#22c55e';
  let prioriteAuto: 'P1' | 'P2' | 'P3' | 'P4' = 'P4';

  if (scoreAjuste >= 81) { 
    niveau = 'Inacceptable ⚫'; 
    couleur = '#000000'; 
    prioriteAuto = 'P1';
  } else if (scoreAjuste >= 61) { 
    niveau = 'Critique 🔴'; 
    couleur = '#ef4444'; 
    prioriteAuto = 'P1';
  } else if (scoreAjuste >= 41) { 
    niveau = 'Préoccupant 🟠'; 
    couleur = '#f97316'; 
    prioriteAuto = 'P2';
  } else if (scoreAjuste >= 21) { 
    niveau = 'Tolérable 🟡'; 
    couleur = '#eab308'; 
    prioriteAuto = 'P3';
  } else {
    prioriteAuto = 'P4';
  }

  const { danger, risque, dommage } = analyserDangerRisqueDommage(observation);
  
  let decisionStrategique = 'Surveiller';
  if (scoreAjuste >= 81 || equipement.statut === 'HS') decisionStrategique = 'Remplacer immédiatement';
  else if (scoreAjuste >= 61) decisionStrategique = 'Réparer en urgence';
  else if (vetuste > 100) decisionStrategique = 'Planifier remplacement';
  else if (scoreAjuste >= 41) decisionStrategique = 'Maintenance corrective';

  const conformiteReg = equipement.conformiteReglementaire.length > 0 
    ? equipement.conformiteReglementaire.join(', ') 
    : 'Non spécifié';

  return {
    id: genererId(),
    ref: equipement.ref,
    type: equipement.type,
    age: equipement.age,
    ageNum: equipement.ageNum,
    ageMax: equipement.ageMax,
    vetuste,
    statut: equipement.statut,
    utilite: equipement.utiliteOperationnelle,
    nbVolsJour: equipement.nbVolsParJour,
    fonctionCritique: equipement.fonctionCritique,
    observation,
    danger,
    risque,
    dommage,
    impactSecurite: equipement.impactSecurite,
    impactAvion: equipement.impactAvion,
    impactPonctualite: equipement.impactPonctualite,
    impactFinancier: equipement.impactFinancier,
    impactEnvironnemental: equipement.impactEnvironnemental,
    conformiteReglementaire: conformiteReg,
    gravite: G,
    probabilite: P,
    detectabilite: D,
    scoreBase,
    coefficientVols,
    scoreAjuste,
    niveau,
    couleur,
    prioriteAuto,
    decisionStrategique
  };
};

const genererActionEnhanced = (equipement: Equipement, observation: string, risque: RisqueEnhanced): ActionPlanEnhanced => {
  const obs = observation.toLowerCase();
  const today = formatDate(new Date());
  
  let action = 'Maintenance préventive';
  let echeance = 'M+1';
  let budget = 500;
  
  if (obs.includes('macaron')) { 
    action = 'Passage visite technique'; 
    echeance = 'J+7'; 
    budget = 1500; 
  }
  if (obs.includes('pneu')) { 
    action = 'Remplacement pneumatiques'; 
    echeance = 'J+3'; 
    budget = 4000; 
  }
  if (obs.includes('extincteur')) { 
    action = 'Remplacement/recharge extincteur'; 
    echeance = 'J+3'; 
    budget = 800; 
  }
  if (obs.includes('fuite') || obs.includes('huile')) { 
    action = 'Diagnostic + réparation circuit'; 
    echeance = 'J+5'; 
    budget = 5000; 
  }
  if (obs.includes('frein')) { 
    action = 'Contrôle et réparation freins'; 
    echeance = 'J+1'; 
    budget = 3000; 
  }
  if (obs.includes('garde-corps') || obs.includes('gard-corp')) { 
    action = 'Réparation garde-corps'; 
    echeance = 'J+3'; 
    budget = 2000; 
  }
  if (obs.includes('age') || obs.includes('dépassé')) { 
    action = 'Planification remplacement'; 
    echeance = 'M+6'; 
    budget = 50000; 
  }
  if (obs.includes('feu') || obs.includes('gyrophare')) { 
    action = 'Remplacement éclairage'; 
    echeance = 'J+7'; 
    budget = 1000; 
  }
  if (obs.includes('hydraulique')) { 
    action = 'Réparation système hydraulique'; 
    echeance = 'J+5'; 
    budget = 8000; 
  }
  if (obs.includes('electrique')) { 
    action = 'Contrôle installation électrique'; 
    echeance = 'J+7'; 
    budget = 2500; 
  }

  const { danger, risque: risqueEvent, dommage } = analyserDangerRisqueDommage(observation);

  return {
    id: genererId(),
    ref: equipement.ref,
    type: equipement.type,
    observation,
    danger,
    risque: risqueEvent,
    dommage,
    action,
    priorite: risque.prioriteAuto,
    echeance,
    responsable: 'Maintenance',
    budget,
    statut: 'Non démarré',
    commentaires: '',
    dateCreation: today,
    historique: [{
      date: today,
      champ: 'Création',
      ancienneValeur: '-',
      nouvelleValeur: 'Action créée automatiquement',
      utilisateur: 'Système'
    }]
  };
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function App() {
  // États principaux
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [equipements, setEquipements] = useState<Equipement[]>(DONNEES_INITIALES);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [actionsPlan, setActionsPlan] = useState<ActionPlanEnhanced[]>([]);
  const [risques, setRisques] = useState<RisqueEnhanced[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tous');
  const [filterStatut, setFilterStatut] = useState('Tous');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // États pour les formulaires
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEquipement, setSelectedEquipement] = useState<Equipement | null>(null);
  const [newEquipement, setNewEquipement] = useState<Partial<Equipement>>({});
  
  // États pour les calculateurs
  const [capacityInputs, setCapacityInputs] = useState({
    volsQuotidiens: 150,
    tempsIntervention: 15,
    dureeExploitation: 16,
    coefSecurite: 1.5,
    typeEquipement: 'Push Back'
  });

  // États pour modification action
  const [editingAction, setEditingAction] = useState<ActionPlanEnhanced | null>(null);

  // Initialiser les inspections, risques et actions au chargement
  useEffect(() => {
    const today = formatDate(new Date());
    const newInspections: Inspection[] = [];
    const newRisques: RisqueEnhanced[] = [];
    const newActions: ActionPlanEnhanced[] = [];

    equipements.forEach(eq => {
      if (eq.observations.length > 0) {
        const inspection: Inspection = {
          id: genererId(),
          refEquipement: eq.ref,
          date: today,
          statutConformite: getStatutConformite(eq),
          observations: [...eq.observations],
          inspecteur: 'Système'
        };
        newInspections.push(inspection);

        eq.observations.forEach(obs => {
          const risque = calculerCriticiteEnhanced(eq, obs);
          newRisques.push(risque);
          
          const action = genererActionEnhanced(eq, obs, risque);
          newActions.push(action);
        });
      }
    });

    setInspections(newInspections);
    setRisques(newRisques);
    setActionsPlan(newActions);
  }, []);

  // ============================================================================
  // CALCULS ET STATISTIQUES ENHANCED
  // ============================================================================

  const stats = useMemo(() => {
    const total = equipements.length;
    const actifs = equipements.filter(e => e.statut === 'Actif' || e.statut === 'Opérationnel').length;
    const hs = equipements.filter(e => e.statut === 'HS').length;
    const inactifs = equipements.filter(e => e.statut === 'Inactif' || e.statut === 'Réformé').length;
    
    const conformes = equipements.filter(e => (e.statut === 'Actif' || e.statut === 'Opérationnel') && e.observations.length === 0).length;
    const nonConformes = inspections.filter(i => i.statutConformite === 'Non Conforme').length;
    const critiques = inspections.filter(i => i.statutConformite === 'Critique').length;
    
    const tauxConformite = actifs > 0 ? Math.round((conformes / actifs) * 100) : 0;
    const ageMoyen = Math.round(equipements.reduce((acc, e) => acc + e.ageNum, 0) / total);
    const depassementAge = equipements.filter(e => e.ageNum > e.ageMax).length;
    
    // Nouveaux indicateurs
    const indiceVetuste = Math.round(equipements.reduce((acc, e) => acc + (e.ageMax > 0 ? (e.ageNum / e.ageMax) * 100 : 0), 0) / total);
    const tauxDisponibilite = total > 0 ? Math.round((actifs / total) * 100) : 0;
    const equipementsCritiques = risques.filter(r => r.scoreAjuste >= 61).length;
    const coutTotalRisques = equipements.reduce((acc, e) => acc + e.impactFinancier, 0);
    const totalVolsImpactes = equipements.filter(e => e.statut !== 'Actif').reduce((acc, e) => acc + e.nbVolsParJour, 0);
    
    return { 
      total, actifs, hs, inactifs, conformes, nonConformes, critiques, 
      tauxConformite, ageMoyen, depassementAge, indiceVetuste, tauxDisponibilite,
      equipementsCritiques, coutTotalRisques, totalVolsImpactes
    };
  }, [equipements, inspections, risques]);

  const equipementsFiltres = useMemo(() => {
    return equipements.filter(e => {
      const matchSearch = e.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'Tous' || e.type === filterType;
      const matchStatut = filterStatut === 'Tous' || e.statut === filterStatut;
      return matchSearch && matchType && matchStatut;
    });
  }, [equipements, searchTerm, filterType, filterStatut]);

  // Données pour les graphiques
  const statutData = useMemo(() => [
    { name: 'Actif', value: stats.actifs, color: '#22c55e' },
    { name: 'HS', value: stats.hs, color: '#ef4444' },
    { name: 'Inactif', value: stats.inactifs, color: '#6b7280' }
  ], [stats]);



  const criticiteParNiveau = useMemo(() => {
    const levels = ['Acceptable 🟢', 'Tolérable 🟡', 'Préoccupant 🟠', 'Critique 🔴', 'Inacceptable ⚫'];
    return levels.map(niveau => ({
      niveau,
      count: risques.filter(r => r.niveau === niveau).length
    }));
  }, [risques]);

  const nonConformitesParType = useMemo(() => {
    const counts: Record<string, number> = {};
    equipements.forEach(e => {
      if (e.observations.length > 0) {
        counts[e.type] = (counts[e.type] || 0) + e.observations.length;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [equipements]);



  const actionsParPriorite = useMemo(() => {
    return ['P1', 'P2', 'P3', 'P4'].map(p => ({
      priorite: p,
      count: actionsPlan.filter(a => a.priorite === p).length,
      budget: actionsPlan.filter(a => a.priorite === p).reduce((acc, a) => acc + a.budget, 0)
    }));
  }, [actionsPlan]);

  // ============================================================================
  // FONCTIONS D'ACTION
  // ============================================================================

  const ajouterEquipement = () => {
    if (newEquipement.ref && newEquipement.type) {
      const typeInfo = TYPES_EQUIPEMENT.find(t => t.nom === newEquipement.type);
      const equip: Equipement = {
        ref: newEquipement.ref,
        type: newEquipement.type,
        age: newEquipement.age || 'N/A',
        ageNum: parseFloat(newEquipement.age || '0') || 0,
        ageMax: typeInfo?.ageMax || 10,
        statut: (newEquipement.statut as any) || 'Actif',
        observations: [],
        inspections: [],
        utiliteOperationnelle: typeInfo?.utilite || 'Non spécifié',
        nbVolsParJour: typeInfo?.nbVolsMoyen || 10,
        fonctionCritique: typeInfo?.impactOperationnel === 'Critique',
        impactSecurite: typeInfo?.impactSecurite === 'Élevé' ? 4 : 3,
        impactAvion: 3,
        impactPonctualite: 3,
        impactFinancier: 10000,
        impactEnvironnemental: false,
        conformiteReglementaire: ['IATA']
      };
      setEquipements([...equipements, equip]);
      setShowAddModal(false);
      setNewEquipement({});
    }
  };

  const modifierEquipement = () => {
    if (selectedEquipement && newEquipement.statut) {
      setEquipements(equipements.map(e => 
        e.ref === selectedEquipement.ref 
          ? { ...e, statut: newEquipement.statut as any, age: newEquipement.age || e.age }
          : e
      ));
      setShowEditModal(false);
      setSelectedEquipement(null);
      setNewEquipement({});
    }
  };

  const supprimerEquipement = (ref: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet équipement ?')) {
      setEquipements(equipements.filter(e => e.ref !== ref));
    }
  };

  const modifierAction = (action: ActionPlanEnhanced, champ: string, valeur: any) => {
    const today = formatDate(new Date());
    const updatedAction = { ...action, [champ]: valeur };
    
    // Ajouter à l'historique
    updatedAction.historique = [
      ...action.historique,
      {
        date: today,
        champ,
        ancienneValeur: action[champ as keyof ActionPlanEnhanced]?.toString() || '',
        nouvelleValeur: valeur?.toString() || '',
        utilisateur: 'Utilisateur'
      }
    ];
    
    setActionsPlan(actionsPlan.map(a => a.id === action.id ? updatedAction : a));
    setEditingAction(null);
  };

  const genererRapportPDF = (type: string) => {
    const doc = new jsPDF();
    const today = formatDate(new Date());

    // Page de garde professionnelle
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.text('RAPPORT COMPLET D\'AUDIT GSE', 105, 25, { align: 'center' });
    doc.setFontSize(18);
    doc.text('Plateforme Digitale d\'Audit Aéroportuaire', 105, 40, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Ground Support Equipment - Analyse Complète', 105, 52, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Généré le ${today}`, 105, 58, { align: 'center' });
    
    // Pied de page
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text('Document confidentiel - Usage interne', 105, 290, { align: 'center' });

    if (type === 'audit' || type === 'complet') {
      // SOMMAIRE
      doc.addPage();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('SOMMAIRE', 14, 10);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      const sommaire = [
        '1. Sommaire Exécutif - KPIs Principaux',
        '2. Inventaire Détaillé des Équipements',
        '3. Analyse Danger - Risque - Dommage',
        '4. Analyse de Criticité (G × P × D)',
        '5. Impact sur les Vols et Opérations',
        '6. Plan d\'Action Priorisé',
        '7. Capacité Opérationnelle',
        '8. Recommandations Stratégiques',
        '9. Annexes - Conformité Réglementaire'
      ];
      sommaire.forEach((item, i) => {
        doc.text(item, 14, 30 + (i * 10));
      });

      // PAGE 1: TABLEAU DE BORD COMPLET AVEC TOUS LES KPIS
      doc.addPage();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('1. TABLEAU DE BORD - INDICATEURS CLÉS', 14, 10);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      let yPos = 30;
      
      // Titre section KPIs principaux
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 INDICATEURS PRINCIPAUX', 14, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 12;
      
      // KPIs en grille 2 colonnes
      doc.setFontSize(11);
      doc.text(`• Total Équipements: ${stats.total}`, 20, yPos);
      doc.text(`• Taux de Conformité: ${stats.tauxConformite}%`, 110, yPos);
      yPos += 8;
      doc.text(`• Taux de Disponibilité: ${stats.tauxDisponibilite}%`, 20, yPos);
      doc.text(`• Indice de Vétusté Moyen: ${stats.indiceVetuste}%`, 110, yPos);
      yPos += 8;
      doc.text(`• Équipements HS: ${stats.hs}`, 20, yPos);
      doc.text(`• Équipements Critiques: ${stats.equipementsCritiques}`, 110, yPos);
      yPos += 8;
      doc.text(`• Impact Financier Total: ${stats.coutTotalRisques.toLocaleString()} MAD`, 20, yPos);
      doc.text(`• Vols Impactés/Jour: ${stats.totalVolsImpactes}`, 110, yPos);
      yPos += 8;
      doc.text(`• Équipements Âge Dépassé: ${stats.depassementAge}`, 20, yPos);
      doc.text(`• Non-Conformités: ${stats.nonConformes}`, 110, yPos);
      yPos += 15;
      
      // Répartition par statut
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('📈 RÉPARTITION PAR STATUT', 14, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 10;
      
      const statsParStatut = {
        'Actif': equipements.filter(e => e.statut === 'Actif').length,
        'HS': equipements.filter(e => e.statut === 'HS').length,
        'Inactif': equipements.filter(e => e.statut === 'Inactif').length
      };
      
      doc.text(`🟢 Actif: ${statsParStatut.Actif} équipements`, 20, yPos);
      doc.text(`🔴 HS: ${statsParStatut.HS} équipements`, 80, yPos);
      doc.text(`⚫ Inactif: ${statsParStatut.Inactif} équipements`, 140, yPos);
      yPos += 15;
      
      // Répartition par niveau de criticité
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('⚠️ RÉPARTITION PAR NIVEAU DE CRITICITÉ', 14, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 10;
      
      const niveauxCount = {
        'Inacceptable ⚫': risques.filter(r => r.scoreAjuste >= 81).length,
        'Critique 🔴': risques.filter(r => r.scoreAjuste >= 61 && r.scoreAjuste < 81).length,
        'Préoccupant 🟠': risques.filter(r => r.scoreAjuste >= 41 && r.scoreAjuste < 61).length,
        'Tolérable 🟡': risques.filter(r => r.scoreAjuste >= 21 && r.scoreAjuste < 41).length,
        'Acceptable 🟢': risques.filter(r => r.scoreAjuste < 21).length
      };
      
      let xPos = 20;
      Object.entries(niveauxCount).forEach(([niveau, count]) => {
        doc.text(`${niveau}: ${count} risques`, xPos, yPos);
        xPos += 45;
        if (xPos > 150) { xPos = 20; yPos += 8; }
      });
      yPos += 15;
      
      // Budget par priorité
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('💰 BUDGET ESTIMÉ PAR PRIORITÉ', 14, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 10;
      
      doc.text(`• Priorité P1 (Urgent): ${actionsParPriorite.find(p => p.priorite === 'P1')?.budget.toLocaleString() || 0} MAD`, 20, yPos);
      yPos += 8;
      doc.text(`• Priorité P2 (Important): ${actionsParPriorite.find(p => p.priorite === 'P2')?.budget.toLocaleString() || 0} MAD`, 20, yPos);
      yPos += 8;
      doc.text(`• Priorité P3 (Secondaire): ${actionsParPriorite.find(p => p.priorite === 'P3')?.budget.toLocaleString() || 0} MAD`, 20, yPos);
      yPos += 8;
      const budgetTotal = actionsParPriorite.reduce((sum, p) => sum + p.budget, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`• BUDGET TOTAL: ${budgetTotal.toLocaleString()} MAD`, 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 15;
      
      // Top 5 équipements les plus critiques
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('🔴 TOP 5 ÉQUIPEMENTS LES PLUS CRITIQUES', 14, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 10;
      
      const topCritiques = risques.sort((a, b) => b.scoreAjuste - a.scoreAjuste).slice(0, 5);
      topCritiques.forEach((r, i) => {
        doc.text(`${i + 1}. ${r.ref} (${r.type}) - Score: ${r.scoreAjuste} - ${r.niveau}`, 20, yPos + (i * 7));
      });

      // PAGE 2: INVENTAIRE DÉTAILLÉ AVEC UTILITÉ
      doc.addPage();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('2. INVENTAIRE DÉTAILLÉ DES ÉQUIPEMENTS', 14, 10);
      
      autoTable(doc, {
        startY: 20,
        head: [['Réf', 'Type', 'Utilité', 'Âge', 'Vétusté%', 'Statut', 'Vols/j', 'Fonct. Critique', 'Conformité']],
        body: equipements.map(e => [
          e.ref, 
          e.type, 
          e.utiliteOperationnelle.substring(0, 20),
          e.age, 
          e.ageMax > 0 ? Math.round((e.ageNum / e.ageMax) * 100) + '%' : 'N/A',
          e.statut, 
          e.nbVolsParJour.toString(),
          e.fonctionCritique ? 'OUI' : 'NON',
          getStatutConformite(e)
        ]),
        theme: 'grid',
        styles: { fontSize: 7 },
        headStyles: { fillColor: [37, 99, 235] }
      });

      // PAGE 3+: ANALYSE DANGER - RISQUE - DOMMAGE COMPLÈTE
      doc.addPage();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('3. ANALYSE DANGER - RISQUE - DOMMAGE', 14, 10);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.text('Différence claire: DANGER (source) → RISQUE (événement) → DOMMAGE (conséquence)', 14, 22);
      
      autoTable(doc, {
        startY: 28,
        head: [['Réf', 'Type', 'Utilité', 'Danger', 'Risque', 'Dommage', 'Score']],
        body: risques.sort((a, b) => b.scoreAjuste - a.scoreAjuste).map(r => [
          r.ref,
          r.type,
          r.utilite.substring(0, 15),
          r.danger.substring(0, 25),
          r.risque.substring(0, 25),
          r.dommage.substring(0, 25),
          r.scoreAjuste.toString()
        ]),
        theme: 'striped',
        styles: { fontSize: 7 },
        headStyles: { fillColor: [37, 99, 235] }
      });

      // PAGE 4+: ANALYSE DE CRITICITÉ G×P×D
      doc.addPage();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('4. ANALYSE DE CRITICITÉ (G × P × D)', 14, 10);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.text('Formule: Score Base = G × P × D | Score Ajusté = Score Base × Coefficient Vols', 14, 22);
      
      autoTable(doc, {
        startY: 28,
        head: [['Réf', 'Type', 'Utilité', 'G', 'P', 'D', 'Score Base', 'Coef Vols', 'Score Ajusté', 'Niveau']],
        body: risques.sort((a, b) => b.scoreAjuste - a.scoreAjuste).map(r => [
          r.ref,
          r.type,
          r.utilite.substring(0, 15),
          r.gravite.toString(),
          r.probabilite.toString(),
          r.detectabilite.toString(),
          r.scoreBase.toString(),
          r.coefficientVols.toString(),
          r.scoreAjuste.toString(),
          r.niveau.split(' ')[0]
        ]),
        theme: 'striped',
        styles: { fontSize: 7 },
        headStyles: { fillColor: [37, 99, 235] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 9) {
            const niveau = data.cell.raw ? data.cell.raw.toString() : '';
            if (niveau.includes('Inacceptable')) data.cell.styles.textColor = [0, 0, 0];
            else if (niveau.includes('Critique')) data.cell.styles.textColor = [239, 68, 68];
            else if (niveau.includes('Préoccupant')) data.cell.styles.textColor = [249, 115, 22];
            else if (niveau.includes('Tolérable')) data.cell.styles.textColor = [234, 179, 8];
            else data.cell.styles.textColor = [34, 197, 94];
          }
        }
      });

      // PAGE 5+: IMPACT SUR LES VOLS ET OPÉRATIONS
      doc.addPage();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('5. IMPACT SUR LES VOLS ET OPÉRATIONS', 14, 10);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      let yImpact = 30;
      
      doc.text('📊 Impact Multidimensionnel par Équipement:', 14, yImpact);
      yImpact += 12;
      
      autoTable(doc, {
        startY: yImpact,
        head: [['Réf', 'Type', 'Utilité', 'Vols/j', 'Impact Sécur.', 'Impact Avion', 'Impact Ponct.', 'Impact Fin. (MAD)']],
        body: equipements.filter(e => e.statut !== 'Actif' || e.observations.length > 0).map(e => [
          e.ref,
          e.type,
          e.utiliteOperationnelle.substring(0, 15),
          e.nbVolsParJour.toString(),
          e.impactSecurite.toString() + '/5',
          e.impactAvion.toString() + '/5',
          e.impactPonctualite.toString() + '/5',
          e.impactFinancier.toLocaleString()
        ]),
        theme: 'grid',
        styles: { fontSize: 7 },
        headStyles: { fillColor: [37, 99, 235] }
      });

      // PAGE 6+: PLAN D'ACTION PRIORISÉ COMPLET
      doc.addPage();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('6. PLAN D\'ACTION PRIORISÉ', 14, 10);
      
      autoTable(doc, {
        startY: 20,
        head: [['Réf', 'Type', 'Danger', 'Action', 'Priorité', 'Échéance', 'Resp.', 'Budget', 'Statut']],
        body: actionsPlan.sort((a, b) => {
          const order = { 'P1': 1, 'P2': 2, 'P3': 3, 'P4': 4 };
          return order[a.priorite] - order[b.priorite];
        }).map(a => [
          a.ref, 
          a.type,
          a.danger.substring(0, 20),
          a.action.substring(0, 25), 
          a.priorite, 
          a.echeance,
          a.responsable.substring(0, 15),
          a.budget.toLocaleString(),
          a.statut
        ]),
        theme: 'striped',
        styles: { fontSize: 7 },
        headStyles: { fillColor: [37, 99, 235] }
      });

      // PAGE 7+: CAPACITÉ OPÉRATIONNELLE
      doc.addPage();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('7. CAPACITÉ OPÉRATIONNELLE', 14, 10);
      
      const result = calculCapacite();
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      let yCap = 30;
      
      doc.text(`Type d'équipement analysé: ${capacityInputs.typeEquipement}`, 14, yCap);
      yCap += 10;
      doc.text(`Nombre de vols quotidiens: ${capacityInputs.volsQuotidiens}`, 14, yCap);
      yCap += 10;
      doc.text(`Temps moyen intervention: ${capacityInputs.tempsIntervention} min`, 14, yCap);
      yCap += 10;
      doc.text(`Durée exploitation: ${capacityInputs.dureeExploitation} heures`, 14, yCap);
      yCap += 10;
      doc.text(`Coefficient de sécurité: ${capacityInputs.coefSecurite}`, 14, yCap);
      yCap += 15;
      
      doc.setFontSize(13);
      doc.text(`📊 DEMANDE CALCULÉE: ${result.demande.toFixed(1)} heures`, 14, yCap);
      yCap += 10;
      doc.text(`📈 CAPACITÉ DISPONIBLE: ${result.capacite.toFixed(1)} heures`, 14, yCap);
      yCap += 10;
      doc.text(`🎯 TAUX D'UTILISATION: ${result.taux.toFixed(1)}%`, 14, yCap);
      yCap += 15;
      
      doc.setFontSize(14);
      const verdictColor: [number, number, number] = result.verdict.color === '#22c55e' ? [34, 197, 94] : 
                          result.verdict.color === '#eab308' ? [234, 179, 8] : [239, 68, 68];
      doc.setTextColor(verdictColor[0], verdictColor[1], verdictColor[2]);
      doc.text(`VERDICT: ${result.verdict.text}`, 14, yCap);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      yCap += 15;
      doc.text('Seuils: <70% = Capacité suffisante ✅ | 70-90% = Zone tension ⚠️ | >90% = Capacité insuffisante ❌', 14, yCap);

      // PAGE 8+: RECOMMANDATIONS STRATÉGIQUES
      doc.addPage();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('8. RECOMMANDATIONS STRATÉGIQUES', 14, 10);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      const recommandations = [
        `1. ⚠️ ${stats.equipementsCritiques} équipements critiques nécessitent une intervention IMMÉDIATE`,
        `2. 💰 Budget estimé actions P1: ${actionsParPriorite.find(p => p.priorite === 'P1')?.budget.toLocaleString() || 0} MAD`,
        `3. 💰 Budget estimé actions P2: ${actionsParPriorite.find(p => p.priorite === 'P2')?.budget.toLocaleString() || 0} MAD`,
        `4. 📅 ${stats.depassementAge} équipements ont dépassé leur durée de vie contractuelle`,
        `5. 📊 Taux de disponibilité actuel: ${stats.tauxDisponibilite}% (Objectif: 95%)`,
        `6. ✈️ Impact potentiel sur ${stats.totalVolsImpactes} vols/jour si équipements HS non réparés`,
        `7. 🔄 Indice de vétusté moyen: ${stats.indiceVetuste}% - Plan de renouvellement recommandé`,
        `8. 🎯 Priorité: Traiter les équipements avec score criticité > 61 en premier`,
        `9. 📋 Mettre en place suivi hebdomadaire des actions P1 et P2`,
        `10. 🔍 Audit complet à renouveler dans 3 mois`
      ];
      
      recommandations.forEach((rec, i) => {
        doc.text(rec, 14, 30 + (i * 8));
      });

      // PAGE 9+: CONFORMITÉ RÉGLEMENTAIRE
      doc.addPage();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('9. CONFORMITÉ RÉGLEMENTAIRE', 14, 10);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      let yReg = 30;
      doc.text('Référentiels appliqués:', 14, yReg);
      yReg += 8;
      doc.text('- OACI Annexe 14: Aérodromes', 20, yReg);
      yReg += 8;
      doc.text('- IATA AHM (Airport Handling Manual)', 20, yReg);
      yReg += 8;
      doc.text('- IATA IGOM (Ground Operations Manual)', 20, yReg);
      yReg += 8;
      doc.text('- ISO 45001: Santé et sécurité au travail', 20, yReg);
      yReg += 8;
      doc.text('- DGAC Locale: Réglementation nationale', 20, yReg);
      yReg += 15;
      
      doc.text('Équipements par conformité:', 14, yReg);
      yReg += 10;
      
      autoTable(doc, {
        startY: yReg,
        head: [['Réf', 'Type', 'Conformité Réglementaire', 'Statut']],
        body: equipements.map(e => [
          e.ref,
          e.type,
          e.conformiteReglementaire.length > 0 ? e.conformiteReglementaire.join(', ') : 'Non spécifié',
          getStatutConformite(e)
        ]),
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] }
      });

      // PAGE FINALE: SIGNATURE ET VALIDATION
      doc.addPage();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('VALIDATION ET SIGNATURE', 14, 10);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.text('Ce rapport a été généré automatiquement par la Plateforme GSE Audit Pro', 14, 40);
      doc.text(`Date de génération: ${today}`, 14, 55);
      doc.text('', 14, 70);
      doc.text('_________________________________________', 14, 90);
      doc.text('Responsable Maintenance', 14, 95);
      doc.text('', 14, 110);
      doc.text('_________________________________________', 14, 130);
      doc.text('Chef de Département Operations', 14, 135);
      doc.text('', 14, 150);
      doc.text('_________________________________________', 14, 170);
      doc.text('Direction Aéroportuaire', 14, 175);
    }

    if (type === 'capacite') {
      doc.addPage();
      doc.setFontSize(18);
      doc.text('Analyse Capacité Opérationnelle', 14, 20);
      
      const result = calculCapacite();
      
      doc.setFontSize(12);
      doc.text(`Type d'équipement: ${capacityInputs.typeEquipement}`, 14, 35);
      doc.text(`Nombre de vols quotidiens: ${capacityInputs.volsQuotidiens}`, 14, 45);
      doc.text(`Temps moyen intervention: ${capacityInputs.tempsIntervention} min`, 14, 55);
      doc.text(`Durée exploitation: ${capacityInputs.dureeExploitation} heures`, 14, 65);
      doc.text(`Coefficient de sécurité: ${capacityInputs.coefSecurite}`, 14, 75);
      doc.text(``, 14, 85);
      doc.text(`Demande calculée: ${result.demande.toFixed(1)} heures`, 14, 95);
      doc.text(`Capacité disponible: ${result.capacite.toFixed(1)} heures`, 14, 105);
      doc.text(`Taux d'utilisation: ${result.taux.toFixed(1)}%`, 14, 115);
      doc.text(`Verdict: ${result.verdict.text}`, 14, 125);
    }

    doc.save(`RAPPORT_COMPLET_GSE_${today.replace(/\//g, '-')}.pdf`);
  };

  const exporterExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Sheet Inventaire
    const inventoryData = equipements.map(e => ({
      Référence: e.ref,
      Type: e.type,
      Âge: e.age,
      'Âge Max': e.ageMax,
      'Vétusté %': e.ageMax > 0 ? Math.round((e.ageNum / e.ageMax) * 100) : 0,
      Statut: e.statut,
      Utilité: e.utiliteOperationnelle,
      'Nb Vols/j': e.nbVolsParJour,
      'Fonction Critique': e.fonctionCritique ? 'Oui' : 'Non',
      'Nb Observations': e.observations.length,
      Conformité: getStatutConformite(e)
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inventoryData), 'Inventaire');
    
    // Sheet Analyse Risques
    const risquesData = risques.map(r => ({
      Référence: r.ref,
      Type: r.type,
      Âge: r.age,
      'Vétusté %': r.vetuste,
      Danger: r.danger,
      Risque: r.risque,
      Dommage: r.dommage,
      'Impact Sécurité': r.impactSecurite,
      'Impact Avion': r.impactAvion,
      'Impact Ponctualité': r.impactPonctualite,
      'Impact Financier': r.impactFinancier,
      Gravité: r.gravite,
      Probabilité: r.probabilite,
      Détectabilité: r.detectabilite,
      'Score Base': r.scoreBase,
      'Coef Vols': r.coefficientVols,
      'Score Ajusté': r.scoreAjuste,
      Niveau: r.niveau,
      Priorité: r.prioriteAuto,
      'Décision Stratégique': r.decisionStrategique
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(risquesData), 'Analyse Risques');
    
    // Sheet Plan d'Action
    const actionsData = actionsPlan.map(a => ({
      Référence: a.ref,
      Type: a.type,
      Observation: a.observation,
      Danger: a.danger,
      Risque: a.risque,
      Dommage: a.dommage,
      Action: a.action,
      Priorité: a.priorite,
      Échéance: a.echeance,
      Responsable: a.responsable,
      Budget: a.budget,
      Statut: a.statut,
      Commentaires: a.commentaires
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(actionsData), 'Plan d\'Action');
    
    // Sheet Historique Modifications
    const historiqueData: any[] = [];
    actionsPlan.forEach(a => {
      a.historique.forEach(h => {
        historiqueData.push({
          'ID Action': a.id,
          Référence: a.ref,
          Date: h.date,
          Champ: h.champ,
          'Ancienne Valeur': h.ancienneValeur,
          'Nouvelle Valeur': h.nouvelleValeur,
          Utilisateur: h.utilisateur
        });
      });
    });
    if (historiqueData.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(historiqueData), 'Historique');
    }
    
    XLSX.writeFile(wb, `audit_gse_complet_${formatDate(new Date()).replace(/\//g, '-')}.xlsx`);
  };

  // ============================================================================
  // CALCUL CAPACITÉ OPÉRATIONNELLE
  // ============================================================================

  const calculCapacite = () => {
    const demande = (capacityInputs.volsQuotidiens * capacityInputs.tempsIntervention) / 60;
    const equipementsActifs = equipements.filter(e => 
      e.type === capacityInputs.typeEquipement && (e.statut === 'Actif' || e.statut === 'Opérationnel')
    ).length;
    const capacite = equipementsActifs * capacityInputs.dureeExploitation;
    const taux = capacite > 0 ? (demande / capacite) * 100 * capacityInputs.coefSecurite : 0;
    
    let verdict = { text: 'Capacité suffisante ✅', color: '#22c55e' };
    if (taux >= 70 && taux < 90) verdict = { text: 'Zone de tension ⚠️', color: '#f59e0b' };
    if (taux >= 90) verdict = { text: 'Capacité insuffisante ❌', color: '#ef4444' };
    
    return { demande, capacite, taux, equipementsActifs, verdict };
  };

  const capaciteResult = calculCapacite();

  // ============================================================================
  // RENDER
  // ============================================================================

  const renderSidebar = () => (
    <div className={`fixed left-0 top-0 h-full bg-slate-900 text-white transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Truck className="w-8 h-8 text-blue-400" />
          {sidebarOpen && (
            <div>
              <span className="font-bold text-lg block">GSE Audit Pro</span>
              <span className="text-xs text-slate-400">Plateforme Digitale</span>
            </div>
          )}
        </div>
      </div>
      
      <nav className="mt-4">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { id: 'inventory', icon: Package, label: 'Inventaire' },
          { id: 'compliance', icon: FileCheck, label: 'Conformité' },
          { id: 'risks', icon: AlertTriangle, label: 'Analyse Risques' },
          { id: 'capacity', icon: Calculator, label: 'Capacité' },
          { id: 'action', icon: Target, label: 'Plan d\'Action' },
          { id: 'reports', icon: FileText, label: 'Rapports' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors ${
              currentPage === item.id ? 'bg-blue-600' : ''
            }`}
          >
            <item.icon className="w-5 h-5" />
            {sidebarOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="absolute bottom-4 left-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded">
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">📊 Tableau de Bord Stratégique</h1>
        <div className="flex gap-2">
          <button onClick={() => genererRapportPDF('audit')} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700">
            <Download className="w-4 h-4" /> Rapport PDF
          </button>
          <button onClick={exporterExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>
      
      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Taux de Conformité</p>
              <p className="text-3xl font-bold text-slate-800">{stats.tauxConformite}%</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Taux Disponibilité</p>
              <p className="text-3xl font-bold text-slate-800">{stats.tauxDisponibilite}%</p>
            </div>
            <Activity className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Équipements Critiques</p>
              <p className="text-3xl font-bold text-slate-800">{stats.equipementsCritiques}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Indice Vétusté</p>
              <p className="text-3xl font-bold text-slate-800">{stats.indiceVetuste}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* KPIs Secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-slate-500 text-sm">Équipements Actifs</p>
          <p className="text-2xl font-bold text-slate-800">{stats.actifs} / {stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-slate-500 text-sm">Équipements HS</p>
          <p className="text-2xl font-bold text-red-600">{stats.hs}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-slate-500 text-sm">Impact Financier</p>
          <p className="text-2xl font-bold text-slate-800">{stats.coutTotalRisques.toLocaleString()} MAD</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-slate-500 text-sm">Vols Impactés/j</p>
          <p className="text-2xl font-bold text-orange-600">{stats.totalVolsImpactes}</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Répartition des Statuts</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statutData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {statutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Niveaux de Criticité</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={criticiteParNiveau} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="niveau" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Non-Conformités par Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={nonConformitesParType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Actions par Priorité</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={actionsParPriorite}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priorite" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertes Prioritaires */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">⚠️ Alertes Prioritaires - Équipements Critiques</h3>
        <div className="space-y-2">
          {risques.filter(r => r.scoreAjuste >= 61).slice(0, 8).map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded border border-red-200">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div className="flex-1">
                <span className="font-semibold">{r.ref}</span> ({r.type}): {r.observation}
                <div className="text-xs text-slate-600 mt-1">
                  Danger: {r.danger} | Risque: {r.risque} | Dommage: {r.dommage}
                </div>
              </div>
              <span className="text-sm font-semibold px-2 py-1 rounded" style={{ backgroundColor: r.couleur, color: 'white' }}>
                {r.scoreAjuste} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">📋 Inventaire & Inspection</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" /> Ajouter
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="Tous">Tous les types</option>
            {TYPES_EQUIPEMENT.map(t => (
              <option key={t.nom} value={t.nom}>{t.nom}</option>
            ))}
          </select>
          <select 
            value={filterStatut} 
            onChange={(e) => setFilterStatut(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="Actif">Actif</option>
            <option value="HS">HS</option>
            <option value="Inactif">Inactif</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Réf</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Âge</th>
                <th className="px-4 py-3 text-left">Vétusté</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Utilité</th>
                <th className="px-4 py-3 text-left">Vols/j</th>
                <th className="px-4 py-3 text-left">Conformité</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipementsFiltres.map(e => (
                <tr key={e.ref} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{e.ref}</td>
                  <td className="px-4 py-3">{e.type}</td>
                  <td className="px-4 py-3">{e.age}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      e.ageMax > 0 && (e.ageNum / e.ageMax) * 100 > 100 ? 'bg-red-100 text-red-800' : 'bg-slate-100'
                    }`}>
                      {e.ageMax > 0 ? Math.round((e.ageNum / e.ageMax) * 100) : 0}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      e.statut === 'Actif' ? 'bg-green-100 text-green-800' :
                      e.statut === 'HS' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {e.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{e.utiliteOperationnelle}</td>
                  <td className="px-4 py-3">{e.nbVolsParJour}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      getStatutConformite(e) === 'Conforme' ? 'bg-green-100 text-green-800' :
                      getStatutConformite(e) === 'Critique' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatutConformite(e)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setSelectedEquipement(e); setNewEquipement({ statut: e.statut, age: e.age }); setShowEditModal(true); }}
                        className="p-1 hover:bg-blue-100 rounded"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button 
                        onClick={() => supprimerEquipement(e.ref)}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">➕ Ajouter un équipement</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Référence"
                value={newEquipement.ref || ''}
                onChange={(e) => setNewEquipement({ ...newEquipement, ref: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
              />
              <select
                value={newEquipement.type || ''}
                onChange={(e) => setNewEquipement({ ...newEquipement, type: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="">Sélectionner un type</option>
                {TYPES_EQUIPEMENT.map(t => (
                  <option key={t.nom} value={t.nom}>{t.nom}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Âge (ex: 5 ans)"
                value={newEquipement.age || ''}
                onChange={(e) => setNewEquipement({ ...newEquipement, age: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
              />
              <select
                value={newEquipement.statut || 'Actif'}
                onChange={(e) => setNewEquipement({ ...newEquipement, statut: e.target.value as any })}
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="Actif">Actif</option>
                <option value="HS">HS</option>
                <option value="Inactif">Inactif</option>
              </select>
              <div className="flex gap-2">
                <button onClick={ajouterEquipement} className="flex-1 bg-blue-600 text-white py-2 rounded-lg">
                  Ajouter
                </button>
                <button onClick={() => { setShowAddModal(false); setNewEquipement({}); }} className="flex-1 bg-slate-200 py-2 rounded-lg">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedEquipement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">✏️ Modifier {selectedEquipement.ref}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <p className="text-slate-600">{selectedEquipement.type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Âge</label>
                <input
                  type="text"
                  value={newEquipement.age || selectedEquipement.age}
                  onChange={(e) => setNewEquipement({ ...newEquipement, age: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Statut</label>
                <select
                  value={newEquipement.statut || selectedEquipement.statut}
                  onChange={(e) => setNewEquipement({ ...newEquipement, statut: e.target.value as any })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="Actif">Actif</option>
                  <option value="HS">HS</option>
                  <option value="Inactif">Inactif</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={modifierEquipement} className="flex-1 bg-blue-600 text-white py-2 rounded-lg">
                  Mettre à jour
                </button>
                <button onClick={() => { setShowEditModal(false); setSelectedEquipement(null); }} className="flex-1 bg-slate-200 py-2 rounded-lg">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCompliance = () => {
    const [selectedType, setSelectedType] = useState('Push Back');
    const [selectedRef, setSelectedRef] = useState('');
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

    useEffect(() => {
      const base = CHECKLISTS_CONFIG[selectedType] || CHECKLISTS_CONFIG['Push Back'];
      setChecklist(base.map(item => ({ ...item })));
    }, [selectedType]);

    const updateChecklistItem = (id: string, field: keyof ChecklistItem, value: any) => {
      setChecklist(checklist.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ));
    };

    const conformiteScore = checklist.filter(i => i.conforme === true).length;
    const total = checklist.length;
    const pourcentage = total > 0 ? Math.round((conformiteScore / total) * 100) : 0;

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-800">✅ Conformité Réglementaire</h1>

        {/* Référentiels */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📚 Référentiels Intégrés</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['OACI Annexe 14', 'IATA AHM', 'IATA IGOM', 'ISO 45001', 'DGAC Locale', 'Normes Constructeurs'].map(ref => (
              <div key={ref} className="bg-slate-50 p-3 rounded text-center text-sm font-medium">
                {ref}
              </div>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex gap-4 mb-6">
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border rounded-lg px-4 py-2"
            >
              {Object.keys(CHECKLISTS_CONFIG).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select 
              value={selectedRef}
              onChange={(e) => setSelectedRef(e.target.value)}
              className="border rounded-lg px-4 py-2"
            >
              <option value="">Sélectionner un équipement</option>
              {equipements.filter(e => e.type === selectedType).map(e => (
                <option key={e.ref} value={e.ref}>{e.ref}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span>Score de conformité</span>
              <span className="font-bold">{pourcentage}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all ${pourcentage >= 80 ? 'bg-green-500' : pourcentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${pourcentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {checklist.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded">
                <span className="flex-1 text-sm">{item.question}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateChecklistItem(item.id, 'conforme', true)}
                    className={`px-3 py-1 rounded ${item.conforme === true ? 'bg-green-500 text-white' : 'bg-slate-200'}`}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => updateChecklistItem(item.id, 'conforme', false)}
                    className={`px-3 py-1 rounded ${item.conforme === false ? 'bg-red-500 text-white' : 'bg-slate-200'}`}
                  >
                    ✗
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vérifications automatiques */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">🔍 Vérifications Automatiques</h3>
          <div className="space-y-3">
            {equipements.filter(e => e.ageNum > e.ageMax).map(e => (
              <div key={e.ref} className="flex items-center gap-3 p-3 bg-orange-50 rounded border border-orange-200">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <span><strong>{e.ref}</strong> ({e.type}): Âge dépassé ({e.ageNum} ans / {e.ageMax} ans max)</span>
              </div>
            ))}
            {equipements.filter(e => e.observations.some(o => o.toLowerCase().includes('macaron'))).map(e => (
              <div key={e.ref} className="flex items-center gap-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span><strong>{e.ref}</strong>: Macaron expiré détecté</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderRisks = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">⚠️ Analyse de Risques Détaillée</h1>

      {/* Explication G×P×D */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Méthode G × P × D avec Coefficient Vols</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 p-4 rounded">
            <h4 className="font-semibold text-red-700">Gravité (G)</h4>
            <p className="text-sm text-slate-600">Impact potentiel de l'incident</p>
            <p className="text-xs text-slate-500 mt-2">1-5: Faible à Catastrophique</p>
          </div>
          <div className="bg-orange-50 p-4 rounded">
            <h4 className="font-semibold text-orange-700">Probabilité (P)</h4>
            <p className="text-sm text-slate-600">Fréquence d'occurrence</p>
            <p className="text-xs text-slate-500 mt-2">1-5: Rare à Certain</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded">
            <h4 className="font-semibold text-yellow-700">Détectabilité (D)</h4>
            <p className="text-sm text-slate-600">Facilité de détection</p>
            <p className="text-xs text-slate-500 mt-2">1-5: Certaine à Impossible</p>
          </div>
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-semibold text-blue-700">Coefficient Vols</h4>
            <p className="text-sm text-slate-600">Impact du trafic</p>
            <p className="text-xs text-slate-500 mt-2">1-3 vols: 1.0 | 20+ vols: 2.0</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-slate-50 rounded">
          <p className="font-mono text-center">
            <strong>Score Base = G × P × D</strong> | <strong>Score Ajusté = Score Base × Coefficient Vols</strong>
          </p>
        </div>
      </div>

      {/* Tableau complet analyse risques */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-slate-50 border-b">
          <h3 className="text-lg font-semibold">📋 Analyse Complète Danger - Risque - Dommage</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">Réf</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Utilité</th>
                <th className="px-3 py-2 text-left">Âge</th>
                <th className="px-3 py-2 text-left">Vétusté</th>
                <th className="px-3 py-2 text-left">Danger</th>
                <th className="px-3 py-2 text-left">Risque</th>
                <th className="px-3 py-2 text-left">Dommage</th>
                <th className="px-3 py-2 text-center">G</th>
                <th className="px-3 py-2 text-center">P</th>
                <th className="px-3 py-2 text-center">D</th>
                <th className="px-3 py-2 text-center">Score</th>
                <th className="px-3 py-2 text-center">Coef</th>
                <th className="px-3 py-2 text-center">Ajusté</th>
                <th className="px-3 py-2 text-left">Niveau</th>
              </tr>
            </thead>
            <tbody>
              {risques.sort((a, b) => b.scoreAjuste - a.scoreAjuste).map((r, i) => (
                <tr key={i} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium">{r.ref}</td>
                  <td className="px-3 py-2">{r.type}</td>
                  <td className="px-3 py-2 text-xs italic text-slate-600">{r.utilite}</td>
                  <td className="px-3 py-2">{r.age}</td>
                  <td className="px-3 py-2">{r.vetuste}%</td>
                  <td className="px-3 py-2 text-xs">{r.danger}</td>
                  <td className="px-3 py-2 text-xs">{r.risque}</td>
                  <td className="px-3 py-2 text-xs">{r.dommage}</td>
                  <td className="px-3 py-2 text-center">{r.gravite}</td>
                  <td className="px-3 py-2 text-center">{r.probabilite}</td>
                  <td className="px-3 py-2 text-center">{r.detectabilite}</td>
                  <td className="px-3 py-2 text-center font-semibold">{r.scoreBase}</td>
                  <td className="px-3 py-2 text-center">{r.coefficientVols}</td>
                  <td className="px-3 py-2 text-center font-bold" style={{ color: r.couleur }}>{r.scoreAjuste}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: r.couleur, color: 'white' }}>
                      {r.niveau}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">🔥 Heatmap Criticité par Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {Array.from(new Set(risques.map(r => r.type))).map(type => (
            <div key={type} className="space-y-1">
              <p className="text-xs font-semibold text-center mb-2">{type}</p>
              {['Acceptable 🟢', 'Tolérable 🟡', 'Préoccupant 🟠', 'Critique 🔴', 'Inacceptable ⚫'].map(niveau => {
                const count = risques.filter(r => r.type === type && r.niveau === niveau).length;
                const colors: Record<string, string> = {
                  'Acceptable 🟢': '#22c55e',
                  'Tolérable 🟡': '#eab308',
                  'Préoccupant 🟠': '#f97316',
                  'Critique 🔴': '#ef4444',
                  'Inacceptable ⚫': '#000000'
                };
                return (
                  <div 
                    key={niveau} 
                    className="h-6 rounded flex items-center justify-center text-xs text-white font-semibold"
                    style={{ backgroundColor: count > 0 ? colors[niveau] : '#e5e7eb' }}
                  >
                    {count > 0 ? count : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <span>🟢 Acceptable</span>
          <span>🟡 Tolérable</span>
          <span>🟠 Préoccupant</span>
          <span>🔴 Critique</span>
          <span>⚫ Inacceptable</span>
        </div>
      </div>
    </div>
  );

  const renderCapacity = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">🧮 Capacité Opérationnelle</h1>

      {/* Formulaire */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📝 Paramètres de Calcul</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre de vols quotidiens</label>
            <input
              type="number"
              value={capacityInputs.volsQuotidiens}
              onChange={(e) => setCapacityInputs({ ...capacityInputs, volsQuotidiens: parseInt(e.target.value) || 0 })}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Temps moyen intervention (min)</label>
            <input
              type="number"
              value={capacityInputs.tempsIntervention}
              onChange={(e) => setCapacityInputs({ ...capacityInputs, tempsIntervention: parseInt(e.target.value) || 0 })}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Durée exploitation (heures)</label>
            <input
              type="number"
              value={capacityInputs.dureeExploitation}
              onChange={(e) => setCapacityInputs({ ...capacityInputs, dureeExploitation: parseInt(e.target.value) || 0 })}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type d'équipement</label>
            <select
              value={capacityInputs.typeEquipement}
              onChange={(e) => setCapacityInputs({ ...capacityInputs, typeEquipement: e.target.value })}
              className="w-full border rounded-lg px-4 py-2"
            >
              {TYPES_EQUIPEMENT.map(t => (
                <option key={t.nom} value={t.nom}>{t.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Coefficient de sécurité</label>
            <input
              type="number"
              step="0.1"
              value={capacityInputs.coefSecurite}
              onChange={(e) => setCapacityInputs({ ...capacityInputs, coefSecurite: parseFloat(e.target.value) || 1 })}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-500 text-sm">Demande (heures)</p>
          <p className="text-3xl font-bold text-slate-800">{capaciteResult.demande.toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-500 text-sm">Capacité (heures)</p>
          <p className="text-3xl font-bold text-slate-800">{capaciteResult.capacite.toFixed(1)}</p>
          <p className="text-xs text-slate-500">{capaciteResult.equipementsActifs} équipements actifs</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-500 text-sm">Taux d'utilisation</p>
          <p className="text-3xl font-bold" style={{ color: capaciteResult.verdict.color }}>{capaciteResult.taux.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-500 text-sm">Verdict</p>
          <p className="text-lg font-bold" style={{ color: capaciteResult.verdict.color }}>{capaciteResult.verdict.text}</p>
        </div>
      </div>

      {/* Jauge visuelle */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Taux d'Utilisation</h3>
        <div className="relative pt-6">
          <div className="w-full bg-slate-200 rounded-full h-8">
            <div 
              className={`h-8 rounded-full transition-all ${
                capaciteResult.taux < 70 ? 'bg-green-500' : 
                capaciteResult.taux < 90 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(capaciteResult.taux, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>0%</span>
            <span>70%</span>
            <span>90%</span>
            <span>100%+</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div className="p-3 bg-green-50 rounded">
            <p className="text-green-700 font-semibold">&lt; 70%</p>
            <p className="text-xs text-slate-600">Capacité suffisante ✅</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded">
            <p className="text-yellow-700 font-semibold">70-90%</p>
            <p className="text-xs text-slate-600">Zone de tension ⚠️</p>
          </div>
          <div className="p-3 bg-red-50 rounded">
            <p className="text-red-700 font-semibold">&gt; 90%</p>
            <p className="text-xs text-slate-600">Capacité insuffisante ❌</p>
          </div>
        </div>
      </div>

      {/* Recommandations */}
      {capaciteResult.taux >= 70 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-orange-800">⚠️ Recommandations</h3>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            {capaciteResult.taux >= 90 ? (
              <>
                <li>Capacité insuffisante - Risque de retard des vols</li>
                <li>Considérer la location d'équipements temporaires</li>
                <li>Accélérer les réparations des équipements HS</li>
                <li>Évaluer l'achat de nouveaux équipements</li>
              </>
            ) : (
              <>
                <li>Zone de tension - Surveiller l'évolution du trafic</li>
                <li>Planifier la maintenance en dehors des pics</li>
                <li>Prévoir des équipements de backup</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );

  const renderActionPlan = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">🎯 Plan d'Action Dynamique</h1>
        <button onClick={exporterExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
          <Download className="w-4 h-4" /> Export Excel
        </button>
      </div>

      {/* Résumé par priorité */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {actionsParPriorite.map(p => (
          <div key={p.priorite} className={`bg-white rounded-lg shadow p-4 border-l-4 ${
            p.priorite === 'P1' ? 'border-red-500' :
            p.priorite === 'P2' ? 'border-orange-500' :
            p.priorite === 'P3' ? 'border-yellow-500' : 'border-green-500'
          }`}>
            <p className="text-slate-500 text-sm">Priorité {p.priorite}</p>
            <p className="text-2xl font-bold">{p.count} actions</p>
            <p className="text-sm text-slate-600">Budget: {p.budget.toLocaleString()} MAD</p>
          </div>
        ))}
      </div>

      {/* Tableau actions modifiables */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-slate-50 border-b">
          <h3 className="text-lg font-semibold">📋 Actions Correctives - Modifiables</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">Réf</th>
                <th className="px-3 py-2 text-left">Danger/Risque/Dommage</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Priorité</th>
                <th className="px-3 py-2 text-left">Échéance</th>
                <th className="px-3 py-2 text-left">Responsable</th>
                <th className="px-3 py-2 text-left">Budget</th>
                <th className="px-3 py-2 text-left">Statut</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {actionsPlan.sort((a, b) => {
                const prioOrder = { 'P1': 0, 'P2': 1, 'P3': 2, 'P4': 3 };
                return prioOrder[a.priorite] - prioOrder[b.priorite];
              }).map((action, i) => (
                <tr key={i} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium">{action.ref}</td>
                  <td className="px-3 py-2 text-xs">
                    <div className="text-red-600">⚠️ {action.danger}</div>
                    <div className="text-orange-600">🔶 {action.risque}</div>
                    <div className="text-slate-600">⚫ {action.dommage}</div>
                  </td>
                  <td className="px-3 py-2">{action.action}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      action.priorite === 'P1' ? 'bg-red-100 text-red-800' :
                      action.priorite === 'P2' ? 'bg-orange-100 text-orange-800' :
                      action.priorite === 'P3' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {action.priorite}
                    </span>
                  </td>
                  <td className="px-3 py-2">{action.echeance}</td>
                  <td className="px-3 py-2">{action.responsable}</td>
                  <td className="px-3 py-2">{action.budget.toLocaleString()} MAD</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      action.statut === 'Résolu' || action.statut === 'Clôturé' ? 'bg-green-100 text-green-800' :
                      action.statut === 'En cours' ? 'bg-blue-100 text-blue-800' :
                      action.statut.includes('attente') ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {action.statut}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setEditingAction(action)}
                      className="p-1 hover:bg-blue-100 rounded"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal modification action */}
      {editingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">✏️ Modifier Action - {editingAction.ref}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Action Corrective</label>
                <input
                  type="text"
                  value={editingAction.action}
                  onChange={(e) => setEditingAction({ ...editingAction, action: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priorité</label>
                <select
                  value={editingAction.priorite}
                  onChange={(e) => setEditingAction({ ...editingAction, priorite: e.target.value as any })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="P1">P1 - Urgente</option>
                  <option value="P2">P2 - Haute</option>
                  <option value="P3">P3 - Moyenne</option>
                  <option value="P4">P4 - Basse</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Échéance</label>
                <input
                  type="text"
                  value={editingAction.echeance}
                  onChange={(e) => setEditingAction({ ...editingAction, echeance: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Responsable</label>
                <input
                  type="text"
                  value={editingAction.responsable}
                  onChange={(e) => setEditingAction({ ...editingAction, responsable: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Budget Estimé (MAD)</label>
                <input
                  type="number"
                  value={editingAction.budget}
                  onChange={(e) => setEditingAction({ ...editingAction, budget: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Statut</label>
                <select
                  value={editingAction.statut}
                  onChange={(e) => setEditingAction({ ...editingAction, statut: e.target.value as any })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="Non démarré">Non démarré</option>
                  <option value="En cours">En cours</option>
                  <option value="En attente pièce">En attente pièce</option>
                  <option value="En attente validation">En attente validation</option>
                  <option value="Résolu">Résolu</option>
                  <option value="Clôturé">Clôturé</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Commentaires</label>
              <textarea
                value={editingAction.commentaires}
                onChange={(e) => setEditingAction({ ...editingAction, commentaires: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
                rows={3}
              />
            </div>

            {/* Historique */}
            {editingAction.historique.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">📜 Historique des Modifications</label>
                <div className="max-h-32 overflow-y-auto bg-slate-50 rounded p-2">
                  {editingAction.historique.map((h, i) => (
                    <div key={i} className="text-xs py-1 border-b last:border-0">
                      <span className="text-slate-500">{h.date}</span> - {h.champ}: {h.ancienneValeur} → {h.nouvelleValeur} ({h.utilisateur})
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <button 
                onClick={() => modifierAction(editingAction, 'action', editingAction.action)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
              >
                Enregistrer
              </button>
              <button 
                onClick={() => setEditingAction(null)}
                className="flex-1 bg-slate-200 py-2 rounded-lg"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">📄 Rapports Professionnels</h1>

      {/* Types de rapports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => genererRapportPDF('audit')}>
          <FileText className="w-12 h-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Rapport Audit Complet</h3>
          <p className="text-sm text-slate-600 mb-4">Inventaire, conformité, criticité, plan d'action</p>
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg">Générer PDF</button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => genererRapportPDF('capacite')}>
          <Calculator className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Rapport Capacité</h3>
          <p className="text-sm text-slate-600 mb-4">Analyse capacité vs demande opérationnelle</p>
          <button className="w-full bg-green-600 text-white py-2 rounded-lg">Générer PDF</button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={exporterExcel}>
          <Download className="w-12 h-12 text-purple-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Export Excel Complet</h3>
          <p className="text-sm text-slate-600 mb-4">Toutes les données avec onglets structurés</p>
          <button className="w-full bg-purple-600 text-white py-2 rounded-lg">Exporter</button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <ClipboardList className="w-12 h-12 text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Rapport Non-Conformités</h3>
          <p className="text-sm text-slate-600 mb-4">Liste détaillée des NC avec criticité</p>
          <button className="w-full bg-orange-600 text-white py-2 rounded-lg">Générer PDF</button>
        </div>
      </div>

      {/* Contenu des rapports */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📑 Structure des Rapports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Rapport Audit Complet</h4>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li>Page de garde professionnelle</li>
              <li>Sommaire exécutif avec KPIs</li>
              <li>Inventaire détaillé avec vétusté</li>
              <li>Tableau Danger/Risque/Dommage</li>
              <li>Analyse de criticité G×P×D</li>
              <li>Plan d'action priorisé</li>
              <li>Recommandations stratégiques</li>
              <li>Annexes techniques</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Export Excel</h4>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li>Onglet: Inventaire complet</li>
              <li>Onglet: Analyse Risques détaillée</li>
              <li>Onglet: Plan d'Action</li>
              <li>Onglet: Historique modifications</li>
              <li>Formules automatisées</li>
              <li>Mise en forme conditionnelle</li>
              <li>Tableaux croisés dynamiques</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Statistiques pour rapports */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Données Incluses dans les Rapports</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded">
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-slate-600">Équipements</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded">
            <p className="text-3xl font-bold text-purple-600">{risques.length}</p>
            <p className="text-sm text-slate-600">Risques analysés</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded">
            <p className="text-3xl font-bold text-orange-600">{actionsPlan.length}</p>
            <p className="text-sm text-slate-600">Actions planifiées</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded">
            <p className="text-3xl font-bold text-green-600">{stats.tauxConformite}%</p>
            <p className="text-sm text-slate-600">Conformité</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard': return renderDashboard();
      case 'inventory': return renderInventory();
      case 'compliance': return renderCompliance();
      case 'risks': return renderRisks();
      case 'capacity': return renderCapacity();
      case 'action': return renderActionPlan();
      case 'reports': return renderReports();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {renderSidebar()}
      
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
