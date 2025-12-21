import { TrendingUp, Banknote, Info } from "lucide-react";
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
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground">
          Option {optionLabels[comparison.optionType]}
        </h4>
        {comparison.coutCuve && (
          <span className="text-sm text-muted-foreground">
            Investissement : {comparison.coutCuve.toLocaleString("fr-FR")} €
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Économies cumulées */}
        <div className="rounded-lg bg-eco-light p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-eco-dark" />
            <span className="font-medium text-eco-dark">Économies cumulées</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {comparison.economiesCumulees.toLocaleString("fr-FR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}{" "}
            €
          </p>
          <p className="text-sm text-muted-foreground">sur {horizonAnnees} ans</p>
        </div>

        {/* Livrets */}
        <div className="space-y-3">
          {comparison.livrets.map((livret) => (
            <div
              key={livret.id}
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
            >
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{livret.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {livret.valeurFuture.toLocaleString("fr-FR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}{" "}
                  €
                </p>
                <p
                  className={cn(
                    "text-xs font-medium",
                    livret.ecart > 0 ? "text-eco-dark" : "text-destructive"
                  )}
                >
                  {livret.ecart > 0 ? "+" : ""}
                  {livret.ecart.toLocaleString("fr-FR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}{" "}
                  €
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-water-light p-3 text-sm">
        <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <p className="text-muted-foreground">
          Ce simulateur compare des valeurs cumulées, pas un ROI. L'écart représente
          la différence entre les économies d'eau et la valeur future du placement.
        </p>
      </div>
    </div>
  );
}
