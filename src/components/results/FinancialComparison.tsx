import { TrendingUp, PiggyBank, ArrowUp, ArrowDown, Info, Droplet } from "lucide-react";
import { FinancialComparison as FinancialComparisonType } from "@/lib/calculations";
import { FallingBills } from "./FallingBills";
import { DroughtAlert } from "./DroughtAlert";
import { QuoteForm } from "./QuoteForm";
import { cn } from "@/lib/utils";

interface FinancialComparisonProps {
  comparison: FinancialComparisonType;
  horizonAnnees: number;
  email: string;
  departement?: string;
  surfaceToiture?: number;
}

export function FinancialComparison({ comparison, horizonAnnees, email, departement, surfaceToiture }: FinancialComparisonProps) {
  const optionLabels = {
    eco: "Essentiel",
    confort: "Confort",
    extra: "Serenite +",
  };




  return (
    <div className="space-y-6">
      {/* Header with investment info */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Option {optionLabels[comparison.optionType]}
            </h3>
            <p className="text-sm text-muted-foreground">
              Comparaison sur {horizonAnnees} ans
            </p>
          </div>
          {comparison.coutCuve && (
            <div className="rounded-lg bg-muted px-4 py-2 text-center sm:text-right">
              <p className="text-sm text-muted-foreground">Investissement initial</p>
              <p className="text-xl font-bold text-foreground">
                {comparison.coutCuve.toLocaleString("fr-FR")} €
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main comparison grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Compact cuve savings + Drought alert */}
        <div className="flex flex-col gap-6">
          {/* Cuve savings - Blue water themed with falling bills */}
          <div className="relative overflow-hidden rounded-xl border-2 border-primary bg-gradient-to-br from-water-light via-water-light/60 to-background p-5">
            <FallingBills />
            <div className="absolute -right-3 -top-3 opacity-[0.08]">
              <Droplet className="h-20 w-20 text-primary" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 ring-4 ring-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Économies cuve cumulées</p>
                  <p className="text-3xl font-bold text-primary">
                    {comparison.economiesCumulees.toLocaleString("fr-FR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} €
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Sur {horizonAnnees} ans (inflation eau +1%/an)
              </p>
            </div>
          </div>

          {/* Drought alert */}
          <DroughtAlert />

          {/* Quote form */}
          <QuoteForm
            email={email}
            selectedOption={comparison.optionType}
            economiesCumulees={comparison.economiesCumulees}
            coutCuve={comparison.coutCuve}
            departement={departement}
            surfaceToiture={surfaceToiture}
          />
        </div>

        {/* Right: Livrets comparison - Simplified face-to-face */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
              <PiggyBank className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Avec un investissement de {comparison.coutCuve?.toLocaleString("fr-FR")} €, que gagnez-vous en {horizonAnnees} ans ?
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {comparison.livrets.map((livret) => {
              const interetsLivret = livret.valeurFuture - (comparison.coutCuve || 0);
              const gainCuve = comparison.economiesCumulees - interetsLivret;
              const cuveGagne = gainCuve > 0;

              return (
                <div key={livret.id} className="rounded-lg border bg-muted/30 p-4">
                  {/* Face-to-face comparison */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">🚰 Cuve</p>
                      <p className="text-xl font-bold text-eco-dark">
                        +{comparison.economiesCumulees.toLocaleString("fr-FR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })} €
                      </p>
                      <p className="text-xs text-muted-foreground">d'économies d'eau</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">💰 {livret.name}</p>
                      <p className="text-xl font-bold text-destructive/70">
                        +{interetsLivret.toLocaleString("fr-FR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })} €
                      </p>
                      <p className="text-xs text-muted-foreground">d'intérêts</p>
                    </div>
                  </div>

                  {/* Verdict line */}
                  <div className={cn(
                    "mt-3 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-semibold",
                    cuveGagne 
                      ? "bg-primary/10 text-primary" 
                      : "bg-gold/10 text-gold"
                  )}>
                    {cuveGagne ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    La cuve rapporte {Math.abs(gainCuve).toLocaleString("fr-FR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} € {cuveGagne ? "de plus" : "de moins"} que le {livret.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Final verdict */}
          {(() => {
            const allCuveWins = comparison.livrets.every((livret) => {
              const interets = livret.valeurFuture - (comparison.coutCuve || 0);
              return comparison.economiesCumulees - interets > 0;
            });
            return allCuveWins ? (
              <div className="mt-4 rounded-lg bg-primary/10 p-4 text-center">
                <p className="text-lg font-bold text-primary">
                  🏆 La banque perd.
                </p>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4 text-sm">
        <Info className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
        <div className="text-muted-foreground">
          <p>
            <strong>Note :</strong> Ce simulateur compare les valeurs cumulées sur la période choisie. 
            Les économies d'eau sont calculées avec une inflation de +1%/an. 
            Les livrets sont calculés avec les taux nets de décembre 2025.
          </p>
        </div>
      </div>
    </div>
  );
}

