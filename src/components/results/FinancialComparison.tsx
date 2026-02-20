import { PiggyBank, ArrowUp, ArrowDown, Info } from "lucide-react";
import { FinancialComparison as FinancialComparisonType } from "@/lib/calculations";
import { cn } from "@/lib/utils";

interface FinancialComparisonProps {
  comparison: FinancialComparisonType;
  horizonAnnees: number;
  email: string;
  departement?: string;
  surfaceToiture?: number;
}

export function FinancialComparison({ comparison, horizonAnnees }: Readonly<FinancialComparisonProps>) {



  const capitalReference =
    typeof comparison.capitalReference === "number" && Number.isFinite(comparison.capitalReference)
      ? comparison.capitalReference
      : (comparison.coutCuve ?? 29500);
  const investmentLabel = comparison.coutCuve
    ? `${comparison.coutCuve.toLocaleString("fr-FR")} \u20ac`
    : `${capitalReference.toLocaleString("fr-FR")} \u20ac (base Sur devis)`;

  return (
    <div className="space-y-6">

      <div className="grid gap-6">

        <div className="rounded-xl border bg-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
              <PiggyBank className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Avec un investissement de {investmentLabel}, que gagnez-vous en {horizonAnnees} ans ?
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {comparison.livrets.map((livret) => {
              const interetsLivret = livret.valeurFuture - capitalReference;
              const gainCuve = comparison.economiesCumulees - interetsLivret;
              const cuveGagne = gainCuve > 0;

              return (
                <div key={livret.id} className="rounded-lg border bg-muted/30 p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">🚰 Cuve</p>
                      <p className="text-xl font-bold text-eco-dark">
                        +
                        {comparison.economiesCumulees.toLocaleString("fr-FR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })} €
                      </p>
                      <p className="text-xs text-muted-foreground">d'économies d'eau</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">💰 {livret.name}</p>
                      <p className="text-xl font-bold text-destructive/70">
                        +
                        {interetsLivret.toLocaleString("fr-FR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })} €
                      </p>
                      <p className="text-xs text-muted-foreground">d'intérêts</p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "mt-3 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-semibold",
                      cuveGagne ? "bg-primary/10 text-primary" : "bg-gold/10 text-gold"
                    )}
                  >
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

          {(() => {
            const allCuveWins = comparison.livrets.every((livret) => {
              const interets = livret.valeurFuture - capitalReference;
              return comparison.economiesCumulees - interets > 0;
            });
            const allLivretsWin = comparison.livrets.every((livret) => {
              const interets = livret.valeurFuture - capitalReference;
              return comparison.economiesCumulees - interets < 0;
            });

            if (allCuveWins) {
              return (
                <div className="mt-4 rounded-lg bg-primary/10 p-4 text-center">
                  <p className="text-lg font-bold text-primary">🏆 La banque perd.</p>
                </div>
              );
            }

            if (allLivretsWin) {
              return (
                <div className="mt-4 space-y-2 rounded-lg border border-amber-500/30 bg-amber-50 p-4 text-center dark:bg-amber-950/20">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    💰 Financièrement, investir dans une cuve sera moins avantageux que de laisser dormir votre argent sur un livret.
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    En revanche, un livret ne vous garantit pas d'avoir toujours de l'eau chez vous en cas de restriction ou de sécheresse. 🚰
                  </p>
                </div>
              );
            }

            return null;
          })()}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4 text-sm">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="text-muted-foreground">
          <p>
            <strong>Note :</strong> Ce simulateur compare les valeurs cumulées sur la période choisie. Les économies
            d'eau sont calculées avec une inflation de +1%/an. Les livrets sont calculés avec les taux nets de
            décembre 2025.
          </p>
        </div>
      </div>
    </div>
  );
}
