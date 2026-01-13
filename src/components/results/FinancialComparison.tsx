import { TrendingUp, PiggyBank, ArrowUp, ArrowDown, Info, Droplet, Sparkles } from "lucide-react";
import { FinancialComparison as FinancialComparisonType } from "@/lib/calculations";
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
        {/* Left: Cuve savings - Enhanced with fun elements */}
        <div className="relative overflow-hidden rounded-xl border-2 border-primary bg-gradient-to-br from-primary/10 via-water-light to-background p-6">
          {/* Decorative water drops */}
          <div className="absolute -right-4 -top-4 opacity-10">
            <Droplet className="h-24 w-24 text-primary" />
          </div>
          <div className="absolute right-12 top-16 opacity-10">
            <Droplet className="h-12 w-12 text-primary" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 ring-4 ring-primary/10">
                <TrendingUp className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Économies cuve cumulées</p>
                <p className="text-4xl font-bold text-primary">
                  {comparison.economiesCumulees.toLocaleString("fr-FR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })} €
                </p>
              </div>
            </div>
            
            {/* Fun metric */}
            <div className="mt-5 flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-foreground">
                C'est comme offrir <span className="font-bold text-primary">{baignoiresEquivalent} bains</span> gratuits à votre famille ! 🛁
              </p>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground">
              Total des économies sur votre facture d'eau sur {horizonAnnees} ans
              (avec +1%/an d'inflation du prix de l'eau)
            </p>
          </div>
        </div>

        {/* Right: Livrets comparison */}
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
            {comparison.livrets.map((livret) => (
              <div
                key={livret.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{livret.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Valeur après {horizonAnnees} ans
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-foreground">
                    {livret.valeurFuture.toLocaleString("fr-FR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} €
                  </p>
                  <p className="text-sm text-muted-foreground">
                    (intérêts : +{(livret.valeurFuture - (comparison.coutCuve || 0)).toLocaleString("fr-FR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} €)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gains comparison - Redesigned as visual cards */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary/5 to-gold/5 px-6 py-5 border-b">
          <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
            🏆 Verdict : Cuve ou Livret ?
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            Quelle option est la plus rentable sur {horizonAnnees} ans ?
          </p>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {comparison.livrets.map((livret) => {
            const interetsLivret = livret.valeurFuture - (comparison.coutCuve || 0);
            const gainCuve = comparison.economiesCumulees - interetsLivret;
            const cuveGagne = gainCuve > 0;

            return (
              <div
                key={livret.id}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl p-5 text-center transition-all hover:scale-[1.02]",
                  cuveGagne 
                    ? "bg-gradient-to-b from-eco-light to-eco-light/50 border-2 border-eco/30" 
                    : "bg-gradient-to-b from-gold-light to-gold-light/50 border-2 border-gold/30"
                )}
              >
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  vs {livret.name}
                </p>
                <div className={cn(
                  "flex items-center gap-1 mb-2",
                  cuveGagne ? "text-eco-dark" : "text-gold"
                )}>
                  {cuveGagne ? (
                    <ArrowUp className="h-5 w-5" />
                  ) : (
                    <ArrowDown className="h-5 w-5" />
                  )}
                  <span className="text-2xl font-bold">
                    {Math.abs(gainCuve).toLocaleString("fr-FR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} €
                  </span>
                </div>
                <p className={cn(
                  "text-xs font-semibold px-3 py-1 rounded-full",
                  cuveGagne 
                    ? "bg-eco/20 text-eco-dark" 
                    : "bg-gold/20 text-gold"
                )}>
                  {cuveGagne ? "🚰 Cuve gagnante" : "💰 Livret gagnant"}
                </p>
              </div>
            );
          })}
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
