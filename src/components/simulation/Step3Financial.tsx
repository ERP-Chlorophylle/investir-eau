import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Euro, MapPin, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SimulationFormData } from "@/lib/validation";

type CommuneSuggestion = {
  label: string;
  city: string;
  postcode: string;
  citycode: string;
};

type CommuneRates = {
  city: string;
  aep: number | null;
  ac: number | null;
  acEstimated: boolean;
};

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizePrice(value: number): number {
  return Math.round(value * 100) / 100;
}

async function fetchCommuneSuggestions(input: string): Promise<CommuneSuggestion[]> {
  const response = await fetch(
    `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(input)}&type=municipality&limit=8`
  );
  if (!response.ok) return [];

  const json = await response.json();
  const features = Array.isArray(json.features) ? json.features : [];

  return features
    .map((feature: any) => {
      const p = feature?.properties;
      if (!p?.citycode || !p?.label) return null;
      return {
        label: p.label,
        city: p.city ?? p.name ?? p.label,
        postcode: p.postcode ?? "",
        citycode: p.citycode,
      } as CommuneSuggestion;
    })
    .filter(Boolean) as CommuneSuggestion[];
}

async function fetchLatestIndicator(codeInsee: string, typeService: "AEP" | "AC", indicatorCode: string): Promise<number | null> {
  const url = `https://hubeau.eaufrance.fr/api/v0/indicateurs_services/communes?code_commune=${encodeURIComponent(
    codeInsee
  )}&type_service=${typeService}&size=200&format=json`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const json = await response.json();
  const rows = Array.isArray(json.data) ? json.data : [];
  const sortedRows = rows
    .filter((row) => typeof row?.annee === "number")
    .sort((a, b) => (b.annee as number) - (a.annee as number));

  for (const row of sortedRows) {
    const value = toNumberOrNull(row?.indicateurs?.[indicatorCode]);
    if (value !== null) return value;
  }

  return null;
}

function getDepartmentCode(codeInsee: string): string {
  if (codeInsee.startsWith("97") || codeInsee.startsWith("98")) return codeInsee.slice(0, 3);
  return codeInsee.slice(0, 2);
}

async function fetchDepartmentAverageAc(codeInsee: string): Promise<number | null> {
  const codeDepartement = getDepartmentCode(codeInsee);
  const url = `https://hubeau.eaufrance.fr/api/v0/indicateurs_services/communes?code_departement=${encodeURIComponent(
    codeDepartement
  )}&type_service=AC&size=500&format=json`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const json = await response.json();
  const rows = Array.isArray(json.data) ? json.data : [];
  const candidates = rows
    .map((row: any) => ({
      year: typeof row?.annee === "number" ? row.annee : null,
      value: toNumberOrNull(row?.indicateurs?.["D204.0"]),
    }))
    .filter((row: { year: number | null; value: number | null }) => row.year !== null && row.value !== null) as {
    year: number;
    value: number;
  }[];

  if (candidates.length === 0) return null;

  const latestYear = Math.max(...candidates.map((row) => row.year));
  const latestValues = candidates.filter((row) => row.year === latestYear).map((row) => row.value);
  if (latestValues.length === 0) return null;

  const avg = latestValues.reduce((sum, value) => sum + value, 0) / latestValues.length;
  return normalizePrice(avg);
}

export function Step3Financial() {
  const { watch, setValue } = useFormContext<SimulationFormData>();
  const currentYear = new Date().getFullYear();

  const prixEau = watch("prixEau") ?? 5;
  const [communeQuery, setCommuneQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CommuneSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [apiMessage, setApiMessage] = useState<string>("");
  const [includeSanitation, setIncludeSanitation] = useState(true);
  const [communeRates, setCommuneRates] = useState<CommuneRates | null>(null);
  const isSelectingSuggestionRef = useRef(false);
  const sanitationCardRef = useRef<HTMLDivElement | null>(null);
  const shouldShowApiMessage =
    apiMessage.length > 0 && !apiMessage.startsWith("Tarif ");
  const hasSanitationData = communeRates?.ac !== null && communeRates?.ac !== undefined;

  useEffect(() => {
    const value = communeQuery.trim();
    if (isSelectingSuggestionRef.current) {
      isSelectingSuggestionRef.current = false;
      return;
    }

    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await fetchCommuneSuggestions(value);
        setSuggestions(results);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [communeQuery]);

  const handleSelectSuggestion = async (suggestion: CommuneSuggestion) => {
    isSelectingSuggestionRef.current = true;
    setCommuneQuery(suggestion.label);
    setSuggestions([]);
    setApiMessage("");
    setIsLoadingPrice(true);

    try {
      const prixAep = await fetchLatestIndicator(suggestion.citycode, "AEP", "D102.0");
      let prixAc = await fetchLatestIndicator(suggestion.citycode, "AC", "D204.0");
      let acEstimated = false;
      if (prixAc === null) {
        prixAc = await fetchDepartmentAverageAc(suggestion.citycode);
        acEstimated = prixAc !== null;
      }

      if (prixAep === null && prixAc === null) {
        setApiMessage(`Tarif non disponible pour ${suggestion.city}.`);
        return;
      }

      setCommuneRates({
        city: suggestion.city,
        aep: prixAep,
        ac: prixAc,
        acEstimated,
      });

      const total = includeSanitation ? (prixAep ?? 0) + (prixAc ?? 0) : prixAep ?? 0;
      const finalPrice = normalizePrice(total > 0 ? total : prixEau);
      setValue("prixEau", finalPrice, { shouldValidate: true, shouldDirty: true });
      setApiMessage(`Tarif détecté pour ${suggestion.city} : ${finalPrice.toFixed(2)} €/m³`);
    } catch {
      setApiMessage("Erreur lors de la récupération du tarif.");
    } finally {
      setIsLoadingPrice(false);
    }
  };

  useEffect(() => {
    if (!communeRates) return;
    const base = communeRates.aep ?? 0;
    const assainissement = communeRates.ac;
    const selected = includeSanitation ? base + (assainissement ?? 0) : base;
    if (selected <= 0) return;

    const finalPrice = normalizePrice(selected);
    setValue("prixEau", finalPrice, { shouldValidate: true, shouldDirty: true });
    setApiMessage(
      `Tarif ${includeSanitation ? "avec" : "sans"} assainissement pour ${communeRates.city} : ${finalPrice.toFixed(2)} €/m³`
    );
  }, [includeSanitation, communeRates, setValue]);

  useEffect(() => {
    if (!communeRates) return;
    const timer = window.setTimeout(() => {
      sanitationCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [communeRates]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Prix de l'eau</h2>
        <p className="mt-2 text-muted-foreground">
          Indiquez votre commune pour connaître le tarif réel ({currentYear})
        </p>
      </div>

      <div className="mx-auto max-w-lg space-y-8">
        <div className={`space-y-4 rounded-xl border bg-card p-6 ${!communeRates ? "ring-2 ring-primary/70 bg-primary/5" : ""}`}>
          <Label htmlFor="commune-search" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Commune
          </Label>

          <div className="relative">
            <Input
              id="commune-search"
              type="text"
              placeholder="Ex : Lyon"
              value={communeQuery}
              onChange={(e) => setCommuneQuery(e.target.value)}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-background shadow-lg">
                {suggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.citycode}-${suggestion.label}`}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectSuggestion(suggestion);
                    }}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {isSearching && "Recherche des communes..."}
            {isLoadingPrice && (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Récupération du tarif...
              </span>
            )}
            {!isSearching && !isLoadingPrice && shouldShowApiMessage && apiMessage}
          </p>
        </div>

        <div
          ref={sanitationCardRef}
          className={`space-y-4 rounded-xl border bg-card p-6 ${
            communeRates ? "ring-2 ring-primary/70 bg-primary/5" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Euro className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Assainissement collectif ?</h3>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className={`rounded-md border px-3 py-1 text-xs ${
                  !includeSanitation ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background"
                }`}
                onClick={() => setIncludeSanitation(false)}
                disabled={!communeRates}
              >
                Sans assainissement
              </button>
              <button
                type="button"
                className={`rounded-md border px-3 py-1 text-xs ${
                  includeSanitation ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background"
                }`}
                onClick={() => setIncludeSanitation(true)}
                disabled={!communeRates}
              >
                Avec assainissement
              </button>
            </div>
            {communeRates?.acEstimated && (
              <p className="text-xs text-muted-foreground">
                Estimation assainissement basée sur la moyenne départementale Hub’Eau.
              </p>
            )}
            {communeRates && !hasSanitationData && !communeRates.acEstimated && (
              <p className="text-xs text-muted-foreground">
                Donnée assainissement non disponible pour cette commune.
              </p>
            )}

            {communeRates ? (
              <div className="rounded-lg bg-primary/10 px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground">Tarif appliqué</p>
                <p className="text-2xl font-bold text-primary">{prixEau.toFixed(2)} €/m³</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Choisissez une commune pour afficher le tarif.</p>
            )}
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">+1% par an d'inflation appliquée</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

