import { TrendingUp, PiggyBank, ArrowUp, ArrowDown, Info, Leaf, Sparkles } from "lucide-react";
import { FinancialComparison as FinancialComparisonType } from "@/lib/calculations";
import { FallingBills } from "./FallingBills";
import { cn } from "@/lib/utils";

interface FinancialComparisonProps {
  comparison: FinancialComparisonType;
  horizonAnnees: number;
}

export function FinancialComparison({ comparison, horizonAnnees }: FinancialComparisonProps) {
  const optionLabels = {
    eco: "Éco",
    confort: "Confort",
    autonomie: "Autonomie",
  };

  // Fun metric: calculate water equivalent
  const litresEconomises = comparison.economiesCumulees / (comparison.coutCuve ? comparison.coutCuve / 1000 : 4);
  const baignoiresEquivalent = Math.round(comparison.economiesCumulees / 3); // ~150L per bath, ~3€ value

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
        {/* Left: Cuve savings - Green nature themed with falling bills */}
        <div className="relative overflow-hidden rounded-xl border-2 border-eco-medium bg-gradient-to-br from-eco-light via-eco-light/60 to-background p-6 min-h-[260px]">
          {/* Falling bills animation */}
          <FallingBills />
          
          {/* Decorative nature elements */}
          <div className="absolute -right-3 -top-3 opacity-[0.08]">
            <Leaf className="h-28 w-28 text-eco-dark" />
          </div>
          <div className="absolute left-4 bottom-6 opacity-[0.06]">
            <Leaf className="h-16 w-16 text-eco-dark -rotate-45" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-eco-medium/30 ring-4 ring-eco-medium/10">
                <TrendingUp className="h-7 w-7 text-eco-dark" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Économies cuve cumulées</p>
                <p className="text-4xl font-bold text-eco-dark">
                  {comparison.economiesCumulees.toLocaleString("fr-FR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })} €
                </p>
              </div>
            </div>
            
            {/* Fun metric */}
            <div className="mt-5 flex items-center gap-2 rounded-lg bg-eco-medium/20 px-4 py-3">
              <Sparkles className="h-5 w-5 text-eco-dark" />
              <p className="text-sm font-medium text-foreground">
                C'est comme offrir <span className="font-bold text-eco-dark">{baignoiresEquivalent} bains</span> gratuits à votre famille ! 🛁
              </p>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground">
              Total des économies sur votre facture d'eau sur {horizonAnnees} ans
              (avec +1%/an d'inflation du prix de l'eau)
            </p>
          </div>
        </div>

        {/* Right: Livrets comparison + Verdict merged */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
              <PiggyBank className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Si vous placiez {comparison.coutCuve?.toLocaleString("fr-FR")} € sur un livret
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {comparison.livrets.map((livret) => {
              const interetsLivret = livret.valeurFuture - (comparison.coutCuve || 0);
              const gainCuve = comparison.economiesCumulees - interetsLivret;
              const cuveGagne = gainCuve > 0;

              return (
                <div
                  key={livret.id}
                  className="rounded-lg bg-muted/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{livret.name}</p>
                      <p className="text-sm text-muted-foreground">
                        +{(livret.valeurFuture - (comparison.coutCuve || 0)).toLocaleString("fr-FR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })} € d'intérêts en {horizonAnnees} ans
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">
                        {livret.valeurFuture.toLocaleString("fr-FR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })} €
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2">
                    <span className={cn(
                      "flex items-center gap-1 text-sm font-semibold",
                      cuveGagne ? "text-eco-dark" : "text-gold"
                    )}>
                      {cuveGagne ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      {cuveGagne ? "Cuve +" : "Livret +"}
                      {Math.abs(gainCuve).toLocaleString("fr-FR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })} €
                    </span>
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      cuveGagne 
                        ? "bg-eco/20 text-eco-dark" 
                        : "bg-gold/20 text-gold"
                    )}>
                      {cuveGagne ? "🚰 Cuve gagnante" : "💰 Livret gagnant"}
                    </span>
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
              <div className="mt-4 rounded-lg bg-eco-light p-4 text-center">
                <p className="text-lg font-bold text-eco-dark">
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
