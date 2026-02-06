import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Droplets, RefreshCw, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TankOptionCard } from "@/components/results/TankOptionCard";
import { FinancialComparison } from "@/components/results/FinancialComparison";
import { FunMetrics } from "@/components/results/FunMetrics";


import { SimulationResults, SimulationInputs } from "@/lib/calculations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Resultat() {
  const navigate = useNavigate();
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [inputs, setInputs] = useState<SimulationInputs | null>(null);
  const [email, setEmail] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<string>("confort");

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

  if (!results || !inputs) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container-app">
          {/* Header */}
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                Votre simulation
              </h1>
              <p className="mt-2 text-muted-foreground">
                Département {inputs.departement} • Horizon 10 ans •{" "}
                {inputs.prixEau.toFixed(1)} €/m³
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to="/simulateur">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Nouvelle simulation
                </Link>
              </Button>
            </div>
          </div>

          {/* Supply/Demand summary */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Droplets className="h-4 w-4 text-water-dark" />
                Potentiel récupérable
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {(results.vSupply / 1000).toFixed(1)} m³/an
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Droplets className="h-4 w-4 text-eco-dark" />
                Besoin annuel
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {(results.vDemand / 1000).toFixed(1)} m³/an
              </p>
            </div>
          </div>

          {/* Tank options */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-foreground">
              Dimensionnement recommandé
            </h2>
            
            {results.isSupplyLimited && (
              <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 shrink-0" />
                Vos besoins dépassent le potentiel récupérable de votre toiture. La couverture réelle sera limitée.
              </p>
            )}
            
            <div className="grid gap-6 md:grid-cols-3">
              {results.options.map((option) => (
                <TankOptionCard
                  key={option.type}
                  option={option}
                  isSelected={selectedOption === option.type}
                  onClick={() => setSelectedOption(option.type)}
                />
              ))}
            </div>

            {/* Discreet simulation disclaimer */}
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Ceci est une estimation. Les précipitations varient d'une année à l'autre. 
              Plus la cuve est volumineuse, plus vous avez de chances de disposer d'eau pendant les périodes sèches.
            </p>
          </section>

          {/* Fun metrics for selected option */}
          {(() => {
            const selectedOpt = results.options.find(o => o.type === selectedOption);
            return selectedOpt ? (
              <section className="mb-12">
                <FunMetrics
                  volumeAnnuelCouvertLitres={selectedOpt.volumeAnnuelCouvert}
                />
              </section>
            ) : null;
          })()}

          {/* Financial comparison */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-foreground">
              Comparaison financière : Cuve vs Livrets
            </h2>
            <Tabs value={selectedOption} onValueChange={setSelectedOption} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
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
                  />
                </TabsContent>
              ))}
            </Tabs>
          </section>





          {/* Back button */}
          <div className="text-center">
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
