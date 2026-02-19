export interface SimulationInputs {
  departement: string;
  surfaceToiture: number;
  typeToiture: string;
  wcEnabled: boolean;
  wcPersonnes?: number;
  jardinEnabled: boolean;
  jardinSurface?: number;
  autoEnabled: boolean;
  autoLavagesMois?: number;
  piscineEnabled: boolean;
  piscineSurface?: number;
  prixEau: number;
  pluieAnnuelleCommune?: number;
}

export interface TankOption {
  type: "eco" | "confort" | "extra";
  label: string;
  volumeCuveM3: number;
  volumeCuveArrondi: number;
  cout: number | null;
  surDevis?: boolean;
  couvertureCible: number;
  couvertureReelle: number;
  volumeAnnuelCouvert: number;
}

export interface LivretComparison {
  id: string;
  name: string;
  valeurFuture: number;
  ecart: number;
}

export interface FinancialComparison {
  optionType: "eco" | "confort" | "extra";
  economiesCumulees: number;
  coutCuve: number | null;
  capitalReference?: number;
  livrets: LivretComparison[];
}

export interface SimulationResults {
  vSupply: number;
  vDemand: number;
  isSupplyLimited: boolean;
  options: TankOption[];
  comparisons: FinancialComparison[];
}
