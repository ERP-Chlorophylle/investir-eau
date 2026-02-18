import { test } from "@playwright/test";

const mockInputs = {
  departement: "34",
  surfaceToiture: 100,
  typeToiture: "pente",
  pluieAnnuelleCommune: 650,
  wcEnabled: true,
  wcPersonnes: 2,
  jardinEnabled: true,
  jardinSurface: 150,
  autoEnabled: false,
  autoLavagesMois: 2,
  piscineEnabled: true,
  piscineSurface: 32,
  prixEau: 4.2,
};

const mockResults = {
  vSupply: 49725,
  vDemand: 76120,
  vUse: 49725,
  vWc: 22265,
  vJardin: 49500,
  vAuto: 0,
  vPiscine: 4355,
  joursPluie: 58,
  pluieAnnuelle: 650,
  options: [
    {
      type: "eco",
      label: "Essentiel (80%)",
      couvertureCible: 80,
      couvertureReelle: 80,
      volumeCuveBrut: 5075,
      volumeCuveArrondi: 6000,
      volumeCuveM3: 6,
      cout: 15000,
      surDevis: false,
      volumeAnnuelCouvert: 60896,
    },
    {
      type: "confort",
      label: "Confort (100%)",
      couvertureCible: 100,
      couvertureReelle: 100,
      volumeCuveBrut: 6343,
      volumeCuveArrondi: 7500,
      volumeCuveM3: 7.5,
      cout: 17000,
      surDevis: false,
      volumeAnnuelCouvert: 76120,
    },
    {
      type: "extra",
      label: "Sérénité + (110%)",
      couvertureCible: 110,
      couvertureReelle: 110,
      volumeCuveBrut: 6978,
      volumeCuveArrondi: 10000,
      volumeCuveM3: 10,
      cout: 19800,
      surDevis: false,
      volumeAnnuelCouvert: 83732,
    },
  ],
  comparisons: [
    {
      optionType: "eco",
      coutCuve: 15000,
      capitalReference: 15000,
      economiesCumulees: 2800,
      livrets: [
        { id: "livretA", name: "Livret A", valeurFuture: 17588, ecart: 212 },
        { id: "ldds", name: "LDDS", valeurFuture: 17588, ecart: 212 },
        { id: "cel", name: "CEL", valeurFuture: 16373, ecart: 1427 },
        { id: "pel", name: "PEL", valeurFuture: 16950, ecart: 850 },
      ],
    },
    {
      optionType: "confort",
      coutCuve: 17000,
      capitalReference: 17000,
      economiesCumulees: 3500,
      livrets: [
        { id: "livretA", name: "Livret A", valeurFuture: 19930, ecart: 570 },
        { id: "ldds", name: "LDDS", valeurFuture: 19930, ecart: 570 },
        { id: "cel", name: "CEL", valeurFuture: 18556, ecart: 1944 },
        { id: "pel", name: "PEL", valeurFuture: 19210, ecart: 1290 },
      ],
    },
    {
      optionType: "extra",
      coutCuve: 19800,
      capitalReference: 19800,
      economiesCumulees: 3900,
      livrets: [
        { id: "livretA", name: "Livret A", valeurFuture: 23219, ecart: 481 },
        { id: "ldds", name: "LDDS", valeurFuture: 23219, ecart: 481 },
        { id: "cel", name: "CEL", valeurFuture: 21616, ecart: 2084 },
        { id: "pel", name: "PEL", valeurFuture: 22378, ecart: 1322 },
      ],
    },
  ],
  isCalibrated: true,
  isSupplyLimited: true,
};

test("screenshot simulateur", async ({ page }, testInfo) => {
  await page.goto("/simulateur");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `test-results/simulateur-${testInfo.project.name}.png`, fullPage: true });
});

test("screenshot resultat", async ({ page }, testInfo) => {
  await page.addInitScript(
    ({ results, inputs, email }) => {
      window.sessionStorage.setItem("simulationResults", JSON.stringify(results));
      window.sessionStorage.setItem("simulationInputs", JSON.stringify(inputs));
      window.sessionStorage.setItem("simulationEmail", email);
    },
    { results: mockResults, inputs: mockInputs, email: "demo@example.com" }
  );

  await page.goto("/resultat");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `test-results/resultat-${testInfo.project.name}.png`, fullPage: true });
});
