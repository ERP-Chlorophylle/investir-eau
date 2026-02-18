import { useEffect, useRef, useState } from "react";
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

export default function Resultat() {
  const navigate = useNavigate();
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [inputs, setInputs] = useState<SimulationInputs | null>(null);
  const [email, setEmail] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<string>("confort");
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
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

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;
    const target = optionRefs.current[selectedOption];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedOption, results]);

  if (!results || !inputs) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container-app">
          <div className="mb-6 flex flex-col gap-3 sm:mb-10 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="whitespace-nowrap text-[clamp(0.92rem,3.1vw,2.25rem)] font-bold text-foreground">
                Votre simulation d'économie potentielle
              </h1>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 md:mb-10 md:gap-4">
            <div className="rounded-xl border bg-card p-3 md:p-5">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground md:text-sm">
                <Droplets className="h-3.5 w-3.5 text-water-dark md:h-4 md:w-4" />
                <span className="leading-tight">Potentiel récupérable</span>
              </div>
              <p className="mt-1 text-[clamp(0.88rem,2.8vw,1.5rem)] font-bold text-foreground">
                {(results.vSupply / 1000).toFixed(1)} m³/an
              </p>
            </div>
            <div className="rounded-xl border bg-card p-3 md:p-5">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground md:text-sm">
                <Droplets className="h-3.5 w-3.5 text-eco-dark md:h-4 md:w-4" />
                <span className="leading-tight">Besoin annuel</span>
              </div>
              <p className="mt-1 text-[clamp(0.88rem,2.8vw,1.5rem)] font-bold text-foreground">
                {(results.vDemand / 1000).toFixed(1)} m³/an
              </p>
            </div>
          </div>

          <section className="mb-8 md:mb-12">
            <h2 className="mb-3 text-[clamp(1rem,2.6vw,1.5rem)] font-bold text-foreground md:mb-6">Dimensionnement recommandé</h2>

            {results.isSupplyLimited && (
              <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 shrink-0" />
                Vos besoins dépassent le potentiel récupérable de votre toiture. La couverture réelle sera limitée.
              </p>
            )}

            <div className="-mx-2 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-visible px-2 pb-2 pt-3 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0 md:pt-0">
              {results.options.map((option) => {
                const comparison = results.comparisons.find((c) => c.optionType === option.type);
                const capitalReference =
                  typeof comparison?.capitalReference === "number" && Number.isFinite(comparison.capitalReference)
                    ? comparison.capitalReference
                    : comparison?.coutCuve ?? 20000;
                const interestGains = comparison
                  ? [
                      { name: "Cuve", gain: comparison.economiesCumulees },
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
                      onClick={() => setSelectedOption(option.type)}
                      interestGains={interestGains}
                    />
                  </div>
                );
              })}
            </div>

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
