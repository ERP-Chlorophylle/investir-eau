import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Droplets, RefreshCw, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TankOptionCard } from "@/components/results/TankOptionCard";
import { FinancialComparison } from "@/components/results/FinancialComparison";
import { FunMetrics } from "@/components/results/FunMetrics";
import { SimulationInputs, SimulationResults } from "@/lib/calculations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Medal = { rank: 1 | 2 | 3; label: string };

export default function Resultat() {
  const navigate = useNavigate();
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [inputs, setInputs] = useState<SimulationInputs | null>(null);
  const [email, setEmail] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<string>("confort");
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const storedResults = sessionStorage.getItem("simulationResults");
    const storedInputs = sessionStorage.getItem("simulationInputs");
    const storedEmail = sessionStorage.getItem("simulationEmail");

    if (!storedResults || !storedInputs) {
      navigate("/simulateur");
      return;
    }

    setResults(JSON.parse(storedResults));
    setInputs(JSON.parse(storedInputs));
    setEmail(storedEmail || "");
  }, [navigate]);

  const { recommendedOptionType, medalsByOptionType } = useMemo(() => {
    if (!results) {
      return {
        recommendedOptionType: null as string | null,
        medalsByOptionType: {} as Record<string, Medal[]>,
      };
    }

    const investmentCandidates = results.comparisons
      .map((comparison) => {
        const capitalReference =
          typeof comparison.capitalReference === "number" && Number.isFinite(comparison.capitalReference)
            ? comparison.capitalReference
            : comparison.coutCuve ?? 29500;
        const livretA = comparison.livrets.find((livret) => livret.id === "livretA");
        if (!livretA) return null;

        const livretAGain = livretA.valeurFuture - capitalReference;
        const spreadVsLivretA = comparison.economiesCumulees - livretAGain;

        return {
          optionType: comparison.optionType,
          spreadVsLivretA,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => b.spreadVsLivretA - a.spreadVsLivretA);

    const recommended = investmentCandidates[0]?.optionType ?? null;

    const usageCandidates = results.options
      .filter((option) => option.type === "eco" || option.type === "confort")
      .map((option) => ({
        optionType: option.type,
        coverage: Number.isFinite(option.couvertureReelle) ? option.couvertureReelle : 0,
        cost: typeof option.cout === "number" ? option.cout : Number.POSITIVE_INFINITY,
      }))
      .sort((a, b) => {
        if (b.coverage !== a.coverage) return b.coverage - a.coverage;
        return a.cost - b.cost;
      });

    const medalMap: Record<string, Medal[]> = {};
    const pushMedal = (optionType: string | null, medal: Medal) => {
      if (!optionType) return;
      if (!medalMap[optionType]) medalMap[optionType] = [];
      medalMap[optionType].push(medal);
    };

    const investmentWinner = recommended;
    pushMedal(investmentWinner, { rank: 1, label: "Meilleur investissement" });

    const usageWinner = usageCandidates[0]?.optionType ?? null;
    pushMedal(usageWinner, { rank: 2, label: "Meilleur usage" });

    const resilienceWinner = results.options.find((option) => option.type === "extra")?.type ?? null;
    pushMedal(resilienceWinner, { rank: 3, label: "Meilleure résilience" });

    return { recommendedOptionType: recommended, medalsByOptionType: medalMap };
  }, [results]);

  useEffect(() => {
    if (!results) return;
    const fallbackOption = results.options[0]?.type ?? null;
    const optionToSelect = recommendedOptionType ?? fallbackOption;
    if (!optionToSelect) return;
    setSelectedOption(optionToSelect);
  }, [results, recommendedOptionType]);

  useEffect(() => {
    const isMobile = globalThis.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;
    const target = optionRefs.current[selectedOption];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedOption, results]);

  if (!results || !inputs) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-muted/30">
      <Header />

      <main className="flex-1 py-4 md:py-12">
        <div className="container-app">
          <div className="mb-3 flex flex-col gap-2 sm:mb-10 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[clamp(0.92rem,3.1vw,2.25rem)] font-bold leading-tight text-foreground">
                Résultats de la simulation de vos intérêts
              </h1>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 md:mb-8 md:gap-4">
            <div className="rounded-2xl border border-water-medium/40 bg-card p-3 shadow-sm md:p-4">
              <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-water-light/60 px-2 py-0.5 text-[11px] text-muted-foreground md:text-xs">
                <Droplets className="h-3.5 w-3.5 text-water-dark md:h-4 md:w-4" />
                Potentiel récupérable
              </div>
              <p className="flex items-end gap-1 whitespace-nowrap leading-none">
                <span className="text-[clamp(0.95rem,3vw,1.45rem)] font-bold tabular-nums text-foreground">
                  {(results.vSupply / 1000).toFixed(1)}
                </span>
                <span className="pb-[1px] text-[clamp(0.7rem,2vw,0.9rem)] font-semibold text-muted-foreground">m³/an</span>
              </p>
            </div>
            <div className="rounded-2xl border border-eco-medium/40 bg-card p-3 shadow-sm md:p-4">
              <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-eco-light/60 px-2 py-0.5 text-[11px] text-muted-foreground md:text-xs">
                <Droplets className="h-3.5 w-3.5 text-eco-dark md:h-4 md:w-4" />
                Besoin annuel
              </div>
              <p className="flex items-end gap-1 whitespace-nowrap leading-none">
                <span className="text-[clamp(0.95rem,3vw,1.45rem)] font-bold tabular-nums text-foreground">
                  {(results.vDemand / 1000).toFixed(1)}
                </span>
                <span className="pb-[1px] text-[clamp(0.7rem,2vw,0.9rem)] font-semibold text-muted-foreground">m³/an</span>
              </p>
            </div>
          </div>

          <section className="mb-8 md:mb-12">
            <h2 className="mb-3 text-[clamp(1rem,2.6vw,1.5rem)] font-bold text-foreground md:mb-6">Nos recommandations de cuves</h2>

            <div className="mx-0 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-visible px-1 pb-2 pt-3 [scrollbar-width:none] md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0 md:pt-0">
              {results.options.map((option) => {
                const comparison = results.comparisons.find((c) => c.optionType === option.type);
                const capitalReference =
                  typeof comparison?.capitalReference === "number" && Number.isFinite(comparison.capitalReference)
                    ? comparison.capitalReference
                    : comparison?.coutCuve ?? 29500;
                const cuveGain = comparison?.economiesCumulees ?? 0;
                const interestGains = comparison
                  ? [
                      { name: "Cuve", gain: cuveGain },
                      ...comparison.livrets.map((livret) => ({
                        name: livret.name,
                        gain: livret.valeurFuture - capitalReference,
                      })),
                    ].sort((a, b) => b.gain - a.gain)
                  : [];

                return (
                  <div
                    key={option.type}
                    ref={(el) => {
                      optionRefs.current[option.type] = el;
                    }}
                    className="w-[74vw] shrink-0 snap-center md:w-auto md:shrink md:snap-none"
                  >
                    <TankOptionCard
                      option={option}
                      isSelected={selectedOption === option.type}
                      isRecommended={recommendedOptionType === option.type}
                      medals={medalsByOptionType[option.type] ?? []}
                      onClick={() => setSelectedOption(option.type)}
                      interestGains={interestGains}
                    />
                  </div>
                );
              })}
            </div>

            {results.isSupplyLimited && (
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground md:mt-4 md:text-sm">
                <Info className="h-4 w-4 shrink-0" />
                Vos besoins dépassent le potentiel récupérable de votre toiture. La couverture réelle sera limitée.
              </p>
            )}

            <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground md:mt-4">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Ceci est une estimation. Les précipitations varient d'une année à l'autre. Plus la cuve est volumineuse,
              plus vous avez de chances de disposer d'eau pendant les périodes sèches.
            </p>
          </section>

          <section className="mb-8 md:mb-12">
            <h2 className="mb-3 text-[clamp(1rem,2.6vw,1.5rem)] font-bold text-foreground md:mb-6">Comparaison financière : Cuve vs Livrets</h2>
            <Tabs value={selectedOption} onValueChange={setSelectedOption} className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-3">
                <TabsTrigger value="eco">Éco</TabsTrigger>
                <TabsTrigger value="confort">Confort</TabsTrigger>
                <TabsTrigger value="extra">Extra</TabsTrigger>
              </TabsList>
              {results.comparisons.map((comparison) => (
                <TabsContent key={comparison.optionType} value={comparison.optionType}>
                  <FinancialComparison
                    comparison={comparison}
                    horizonAnnees={10}
                    email={email}
                    departement={inputs.departement}
                    surfaceToiture={inputs.surfaceToiture}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </section>

          {(() => {
            const selectedOpt = results.options.find((o) => o.type === selectedOption);
            return selectedOpt ? (
              <section className="mb-8 md:mb-12">
                <FunMetrics volumeAnnuelCouvertLitres={selectedOpt.volumeAnnuelCouvert} />
              </section>
            ) : null;
          })()}

          <div className="flex flex-col items-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/simulateur">
                <RefreshCw className="mr-2 h-4 w-4" />
                Nouvelle simulation
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


