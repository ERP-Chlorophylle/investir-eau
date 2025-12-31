import { TrendingUp, PiggyBank, ArrowUp, ArrowDown, Info } from "lucide-react";
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
        {/* Left: Cuve savings */}
        <div className="rounded-xl border-2 border-primary bg-gradient-to-br from-water-light to-background p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Économies cuve cumulées</p>
              <p className="text-3xl font-bold text-primary">
                {comparison.economiesCumulees.toLocaleString("fr-FR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })} €
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Total des économies sur votre facture d'eau sur {horizonAnnees} ans
            (avec +1%/an d'inflation du prix de l'eau)
          </p>
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

      {/* Gains comparison table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="bg-muted/50 px-6 py-4 border-b">
          <h4 className="font-semibold text-foreground">
            🏆 Résultat : Cuve vs chaque livret
          </h4>
          <p className="text-sm text-muted-foreground">
            Différence entre les économies de la cuve et les intérêts du livret
          </p>
        </div>

        <div className="divide-y">
          {comparison.livrets.map((livret) => {
            const interetsLivret = livret.valeurFuture - (comparison.coutCuve || 0);
            const gainCuve = comparison.economiesCumulees - interetsLivret;
            const cuveGagne = gainCuve > 0;

            return (
              <div
                key={livret.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground">
                    Cuve vs {livret.name}
                  </span>
                </div>
                <div className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 font-semibold",
                  cuveGagne 
                    ? "bg-eco-light text-eco-dark" 
                    : "bg-destructive/10 text-destructive"
                )}>
                  {cuveGagne ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                  <span>
                    {cuveGagne ? "+" : ""}
                    {gainCuve.toLocaleString("fr-FR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} €
                  </span>
                  <span className="text-sm font-normal">
                    {cuveGagne ? "en faveur de la cuve" : "en faveur du livret"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-lg bg-water-light/50 p-4 text-sm">
        <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
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
