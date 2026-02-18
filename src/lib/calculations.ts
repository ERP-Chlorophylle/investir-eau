import {
  CLIMATE_DATA,
  ROOF_TYPES,
  DEFAULT_ETA,
  DEFAULT_WC_CONSUMPTION,
  DEFAULT_CAR_WASH_VOLUME,
  DEFAULT_WATERING_LITERS,
  WATERING_WEEKS,
  POOL_DEPTH,
  POOL_APPOINT_PERCENT,
  TANK_SIZES,
  TANK_PRICING,
  SAVINGS_ACCOUNTS,
  WATER_INFLATION,
  MIN_RAIN_EVENT,
  COVERAGE_OPTIONS,
} from "./constants";

export interface SimulationInputs {
  departement: string;
  surfaceToiture: number;
  typeToiture: string;

  // Usages
  wcEnabled: boolean;
  wcPersonnes?: number;

  jardinEnabled: boolean;
  jardinSurface?: number;

  autoEnabled: boolean;
  autoLavagesMois?: number;

  piscineEnabled: boolean;
  piscineSurface?: number;

  // Financial
  prixEau: number;
}

export interface TankOption {
  type: "eco" | "confort" | "extra";
  label: string;
  couvertureCible: number; // 70, 100 or 110%
  couvertureReelle: number; // Actual coverage percentage based on supply limits
  volumeCuveBrut: number;
  volumeCuveArrondi: number;
  volumeCuveM3: number;
  cout: number | null;
  surDevis: boolean;
  volumeAnnuelCouvert: number; // L/an covered by this tank
}

export interface SimulationResults {
  // Supply & demand
  vSupply: number; // L/an
  vDemand: number; // L/an
  vUse: number; // L/an
  
  // Details
  vWc: number;
  vJardin: number;
  vAuto: number;
  vPiscine: number;

  // Department data
  joursPluie: number;
  pluieAnnuelle: number;

  // Tank options
  options: TankOption[];

  // Financial comparison for each option
  comparisons: FinancialComparison[];

  // Is calibrated
  isCalibrated: boolean;
  
  // Is supply limited (demand > supply)
  isSupplyLimited: boolean;
}

export interface FinancialComparison {
  optionType: "eco" | "confort" | "extra";
  coutCuve: number | null;
  economiesCumulees: number;
  livrets: {
    id: string;
    name: string;
    valeurFuture: number;
    ecart: number;
  }[];
}

export function getDepartementFromCodePostal(cp: string): string | null {
  if (!cp || cp.length < 2) return null;
  return cp.substring(0, 2);
}

export function getRoofCoefficient(type: string): number {
  const roof = ROOF_TYPES.find((r) => r.value === type);
  return roof?.coefficient ?? 0.9;
}

export function calculateSimulation(inputs: SimulationInputs): SimulationResults {
  const dept = inputs.departement;
  const climateData = CLIMATE_DATA[dept];
  const isCalibrated = !!climateData;

  const pluieAnnuelle = climateData?.pluie ?? 700;
  const joursPluie = climateData?.joursPluie ?? 70;

  const cToit = getRoofCoefficient(inputs.typeToiture);
  const eta = DEFAULT_ETA;

  // 1) Supply (L/an)
  const vSupply = pluieAnnuelle * inputs.surfaceToiture * cToit * eta;

  // 2) Demand (L/an)
  let vWc = 0;
  let vJardin = 0;
  let vAuto = 0;
  let vPiscine = 0;

  if (inputs.wcEnabled && inputs.wcPersonnes) {
    vWc = DEFAULT_WC_CONSUMPTION * inputs.wcPersonnes * 365;
  }

  if (inputs.jardinEnabled && inputs.jardinSurface) {
    vJardin = inputs.jardinSurface * DEFAULT_WATERING_LITERS * WATERING_WEEKS;
  }

  if (inputs.autoEnabled && inputs.autoLavagesMois) {
    vAuto = inputs.autoLavagesMois * 12 * DEFAULT_CAR_WASH_VOLUME;
  }

  if (inputs.piscineEnabled && inputs.piscineSurface) {
    // Volume piscine = surface * profondeur moyenne (1.5m)
    const volumePiscine = inputs.piscineSurface * POOL_DEPTH;
    // Appoint = 12% du volume par an
    vPiscine = volumePiscine * (POOL_APPOINT_PERCENT / 100) * 1000;
  }

  const vDemand = vWc + vJardin + vAuto + vPiscine;

  // 3) Usable volume (max possible)
  const vUseMax = Math.min(vSupply, vDemand);
  
  // Check if supply is the limiting factor
  const isSupplyLimited = vDemand > vSupply;

  // 4) Guard rail for rain event
  const vEventMin = MIN_RAIN_EVENT * inputs.surfaceToiture * cToit * eta;

  // 5) Calculate options based on coverage percentages (70%, 100%, 110%)
  const options: TankOption[] = (["eco", "confort", "extra"] as const).map((type) => {
    const coverageConfig = COVERAGE_OPTIONS[type];
    const couvertureCible = coverageConfig.percentage;
    
    // Volume annuel à couvrir = pourcentage des besoins, plafonné par le potentiel récupérable
    const volumeAnnuelCouvertBrut = vDemand * (couvertureCible / 100);
    const volumeAnnuelCouvert = Math.min(volumeAnnuelCouvertBrut, vSupply);
    
    // Taille cuve = environ 1 mois du volume cible de consommation (dimensionnement)
    let volumeCuveBrut = volumeAnnuelCouvertBrut / 12;
    volumeCuveBrut = Math.max(volumeCuveBrut, vEventMin);

    // Round to market size
    let volumeCuveArrondi = TANK_SIZES.find((size) => size >= volumeCuveBrut) ?? 20000;
    const surDevis = volumeCuveBrut > 20000;

    if (surDevis) {
      volumeCuveArrondi = 20000;
    }

    // Get price from exact size
    const cout = surDevis ? null : TANK_PRICING[volumeCuveArrondi] ?? null;

    // Calculate actual coverage percentage
    const couvertureReelle = vDemand > 0 ? Math.round((volumeAnnuelCouvert / vDemand) * 100) : 0;

    return {
      type,
      label: coverageConfig.label,
      couvertureCible,
      couvertureReelle,
      volumeCuveBrut: Math.round(volumeCuveBrut),
      volumeCuveArrondi,
      volumeCuveM3: volumeCuveArrondi / 1000,
      cout,
      surDevis,
      volumeAnnuelCouvert: Math.round(volumeAnnuelCouvert),
    };
  });

  // Ensure "extra" tank is always larger than "confort" tank
  const confortOption = options.find(o => o.type === "confort");
  const extraOption = options.find(o => o.type === "extra");
  if (confortOption && extraOption && extraOption.volumeCuveArrondi <= confortOption.volumeCuveArrondi) {
    // Find next larger tank size
    const nextSize = TANK_SIZES.find(size => size > confortOption.volumeCuveArrondi);
    if (nextSize) {
      extraOption.volumeCuveArrondi = nextSize;
      extraOption.volumeCuveM3 = nextSize / 1000;
      extraOption.cout = TANK_PRICING[nextSize] ?? null;
      extraOption.surDevis = nextSize > 20000;
    }
  }

  // Use the max coverage for global vUse
  const vUse = vUseMax;

  // 6) Financial comparisons (fixed 10 years horizon)
  const horizonAnnees = 10;
  const comparisons: FinancialComparison[] = options.map((option) => {
    const coutCuve = option.cout;
    const m3Substitues = option.volumeAnnuelCouvert / 1000;

    // Cumulated savings
    let economiesCumulees = 0;
    for (let n = 1; n <= horizonAnnees; n++) {
      const prixEauN = inputs.prixEau * Math.pow(1 + WATER_INFLATION, n - 1);
      economiesCumulees += m3Substitues * prixEauN;
    }
    economiesCumulees = Math.round(economiesCumulees * 100) / 100;

    // Savings accounts - filter out those whose ceiling is below the tank cost
    const livrets = SAVINGS_ACCOUNTS
      .filter((account) => {
        if (!coutCuve) return true;
        if (account.ceiling === null) return true;
        return account.ceiling >= coutCuve;
      })
      .map((account) => {
        const valeurFuture = coutCuve
          ? Math.round(coutCuve * Math.pow(1 + account.rate, horizonAnnees) * 100) / 100
          : 0;
        const ecart = Math.round((economiesCumulees - valeurFuture) * 100) / 100;

        return {
          id: account.id,
          name: account.name,
          valeurFuture,
          ecart,
        };
      });

    return {
      optionType: option.type,
      coutCuve,
      economiesCumulees,
      livrets,
    };
  });

  return {
    vSupply: Math.round(vSupply),
    vDemand: Math.round(vDemand),
    vUse: Math.round(vUse),
    vWc: Math.round(vWc),
    vJardin: Math.round(vJardin),
    vAuto: Math.round(vAuto),
    vPiscine: Math.round(vPiscine),
    joursPluie,
    pluieAnnuelle,
    options,
    comparisons,
    isCalibrated,
    isSupplyLimited,
  };
}
