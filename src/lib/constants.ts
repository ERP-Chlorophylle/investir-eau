// Climate data by department
export const CLIMATE_DATA: Record<string, { pluie: number; joursPluie: number }> = {
  "07": { pluie: 1066.6, joursPluie: 81.7 },
  "30": { pluie: 684.6, joursPluie: 61.3 },
  "34": { pluie: 639.2, joursPluie: 57.8 },
  "48": { pluie: 788.2, joursPluie: 97.4 },
  "84": { pluie: 648.8, joursPluie: 60.9 },
};

export const CALIBRATED_DEPARTMENTS = ["07", "30", "34", "48", "84"];

// Roof coefficients
export const ROOF_TYPES = [
  { value: "tuile", label: "Tuile", coefficient: 0.9 },
  { value: "ondule", label: "Toit ondulé", coefficient: 0.8 },
  { value: "plat", label: "Toit plat", coefficient: 0.6 },
] as const;

// Default values
export const DEFAULT_ETA = 0.85;
export const DEFAULT_WC_CONSUMPTION = 30.5; // L/jour/personne
export const DEFAULT_CAR_WASH_VOLUME = 200; // L/lavage
export const DEFAULT_WATERING_LITERS = 15; // L/m²/semaine (moyenne)
export const WATERING_WEEKS = 22; // mai -> sept
export const POOL_DEPTH = 1.5; // profondeur moyenne en mètres
export const POOL_APPOINT_PERCENT = 12; // % appoint annuel

// Default form values
export const DEFAULT_PERSONS = 2;
export const DEFAULT_GARDEN_SURFACE = 50;
export const DEFAULT_CAR_WASHES = 2;
export const DEFAULT_POOL_SURFACE = 32; // m² (8x4m)

// Tank market sizes (L)
export const TANK_SIZES = [500, 1000, 2000, 3000, 4000, 5000, 6000, 7500, 10000, 15000, 20000];

// Tank pricing (€ TTC)
export const TANK_PRICING = [
  { maxVolume: 3000, price: 11000 },
  { maxVolume: 10000, price: 19800 },
  { maxVolume: 15000, price: 25000 },
  { maxVolume: 30000, price: 38500 },
];

// Reserve days by option
export const RESERVE_DAYS = {
  eco: 21,
  confort: 35,
  autonomie: 56,
};

// Savings accounts rates (net, December 2025)
export const SAVINGS_ACCOUNTS = [
  { id: "livretA", name: "Livret A", rate: 0.017, ceiling: 22950 },
  { id: "ldds", name: "LDDS", rate: 0.017, ceiling: 12000 },
  { id: "cel", name: "CEL", rate: 0.0088, ceiling: null, note: "1,25% brut - PFU 30%" },
  { id: "pel", name: "PEL", rate: 0.0123, ceiling: null, note: "1,75% brut - PFU 30% (PEL après 2018)" },
];

// Water price inflation
export const WATER_INFLATION = 0.01; // 1% per year

// Minimum water event (mm)
export const MIN_RAIN_EVENT = 10;
