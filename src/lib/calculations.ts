import {
  CLIMATE_DATA,
  ROOF_TYPES,
  DEFAULT_WC_CONSUMPTION,
  DEFAULT_CAR_WASH_VOLUME,
  WATERING_WEEKS,
  WATERING_INTENSITY,
  TANK_SIZES,
  TANK_PRICING,
  RESERVE_DAYS,
  SAVINGS_ACCOUNTS,
  WATER_INFLATION,
  MIN_RAIN_EVENT,
} from "./constants";

export interface SimulationInputs {
  codePostal: string;
  departement: string;
  surfaceToiture: number;
  typeToiture: string;
  eta: number;
  pluieOverride?: number;

  // Usages
  wcEnabled: boolean;
  wcPersonnes?: number;
  wcConsoParPersonne: number;

  jardinEnabled: boolean;
  jardinSurface?: number;
  jardinIntensite?: string;

  autoEnabled: boolean;
  autoLavagesMois?: number;
  autoVolumeParLavage: number;

  piscineEnabled: boolean;
  piscineMode?: "appoint" | "volume";
  piscineAppoint?: number;
  piscineVolume?: number;
  piscinePourcent?: number;

  // Financial
  prixEau: number;
  horizonAnnees: number;
}

export interface TankOption {
  type: "eco" | "confort" | "autonomie";
  label: string;
  joursReserve: number;
  volumeCuveBrut: number;
  volumeCuveArrondi: number;
  volumeCuveM3: number;
  cout: number | null;
  surDevis: boolean;
  dimensionnePar: "ressource" | "demande";
  couverture: number;
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
  kDep: number;
  joursPluie: number;
  pluieAnnuelle: number;

  // Tank options
  options: TankOption[];

  // Financial comparison for each option
  comparisons: FinancialComparison[];

  // Is calibrated
  isCalibrated: boolean;
}

export interface FinancialComparison {
  optionType: "eco" | "confort" | "autonomie";
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

export function getWateringLiters(intensity: string): number {
  const watering = WATERING_INTENSITY.find((w) => w.value === intensity);
  return watering?.liters ?? 15;
}

export function calculateSimulation(inputs: SimulationInputs): SimulationResults {
  const dept = inputs.departement;
  const climateData = CLIMATE_DATA[dept];
  const isCalibrated = !!climateData;

  const pluieAnnuelle = inputs.pluieOverride ?? climateData?.pluie ?? 700;
  const joursPluie = climateData?.joursPluie ?? 70;

  const cToit = getRoofCoefficient(inputs.typeToiture);
  const eta = inputs.eta;

  // 1) Supply (L/an)
  const vSupply = pluieAnnuelle * inputs.surfaceToiture * cToit * eta;

  // 2) Demand (L/an)
  let vWc = 0;
  let vJardin = 0;
  let vAuto = 0;
  let vPiscine = 0;

  if (inputs.wcEnabled && inputs.wcPersonnes) {
    vWc = inputs.wcConsoParPersonne * inputs.wcPersonnes * 365;
  }

  if (inputs.jardinEnabled && inputs.jardinSurface && inputs.jardinIntensite) {
    const litersPerWeek = getWateringLiters(inputs.jardinIntensite);
    vJardin = inputs.jardinSurface * litersPerWeek * WATERING_WEEKS;
  }

  if (inputs.autoEnabled && inputs.autoLavagesMois) {
    vAuto = inputs.autoLavagesMois * 12 * inputs.autoVolumeParLavage;
  }

  if (inputs.piscineEnabled) {
    if (inputs.piscineMode === "appoint" && inputs.piscineAppoint) {
      vPiscine = inputs.piscineAppoint * 1000;
    } else if (inputs.piscineMode === "volume" && inputs.piscineVolume && inputs.piscinePourcent) {
      vPiscine = inputs.piscineVolume * (inputs.piscinePourcent / 100) * 1000;
    }
  }

  const vDemand = vWc + vJardin + vAuto + vPiscine;

  // 3) Usable volume
  const vUse = Math.min(vSupply, vDemand);
  const dimensionnePar: "ressource" | "demande" = vUse === vSupply ? "ressource" : "demande";

  // 4) Drought coefficient
  const kDep = 1 + Math.max(0, (100 - joursPluie) / 200);

  // 5) Guard rail for rain event
  const vEventMin = MIN_RAIN_EVENT * inputs.surfaceToiture * cToit * eta;

  // 6) Calculate options
  const options: TankOption[] = (["eco", "confort", "autonomie"] as const).map((type) => {
    const jBase = RESERVE_DAYS[type];
    const joursReserve = Math.round(jBase * kDep);

    let volumeCuveBrut = vUse * (joursReserve / 365);
    volumeCuveBrut = Math.max(volumeCuveBrut, vEventMin);

    // Round to market size
    let volumeCuveArrondi = TANK_SIZES.find((size) => size >= volumeCuveBrut) ?? 20000;
    const surDevis = volumeCuveBrut > 20000;

    if (surDevis) {
      volumeCuveArrondi = 20000;
    }

    // Get price
    const pricing = TANK_PRICING.find((p) => volumeCuveArrondi <= p.maxVolume);
    const cout = surDevis ? null : pricing?.price ?? null;

    const couverture = vDemand > 0 ? (vUse / vDemand) * 100 : 0;

    return {
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      joursReserve,
      volumeCuveBrut: Math.round(volumeCuveBrut),
      volumeCuveArrondi,
      volumeCuveM3: volumeCuveArrondi / 1000,
      cout,
      surDevis,
      dimensionnePar,
      couverture: Math.round(couverture * 10) / 10,
    };
  });

  // 7) Financial comparisons
  const comparisons: FinancialComparison[] = options.map((option) => {
    const coutCuve = option.cout;
    const m3Substitues = vUse / 1000;

    // Cumulated savings
    let economiesCumulees = 0;
    for (let n = 1; n <= inputs.horizonAnnees; n++) {
      const prixEauN = inputs.prixEau * Math.pow(1 + WATER_INFLATION, n - 1);
      economiesCumulees += m3Substitues * prixEauN;
    }
    economiesCumulees = Math.round(economiesCumulees * 100) / 100;

    // Savings accounts
    const livrets = SAVINGS_ACCOUNTS.map((account) => {
      const valeurFuture = coutCuve
        ? Math.round(coutCuve * Math.pow(1 + account.rate, inputs.horizonAnnees) * 100) / 100
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
    kDep: Math.round(kDep * 100) / 100,
    joursPluie,
    pluieAnnuelle,
    options,
    comparisons,
    isCalibrated,
  };
}
