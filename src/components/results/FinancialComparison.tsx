import { TrendingUp, PiggyBank, ArrowUp, ArrowDown, Info } from "lucide-react";
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
        {/* Left: Cuve savings - Blue water themed with falling bills */}
        <div className="relative overflow-hidden rounded-xl border-2 border-primary bg-gradient-to-br from-water-light via-water-light/60 to-background p-6 min-h-[260px]">
          {/* Falling bills animation */}
          <FallingBills />
          
          {/* Decorative tree */}
          <div className="absolute -left-2 -bottom-2 opacity-[0.10]">
            <svg width="120" height="160" viewBox="0 0 120 160" fill="none" className="text-eco-dark">
              {/* Trunk */}
              <rect x="52" y="100" width="16" height="50" rx="3" fill="currentColor" opacity="0.7" />
              {/* Foliage layers */}
              <ellipse cx="60" cy="85" rx="40" ry="30" fill="currentColor" opacity="0.5" />
              <ellipse cx="60" cy="65" rx="32" ry="26" fill="currentColor" opacity="0.6" />
              <ellipse cx="60" cy="48" rx="22" ry="20" fill="currentColor" opacity="0.7" />
            </svg>
          </div>

          {/* Decorative water tank (cuve) */}
          <div className="absolute -right-2 -bottom-1 opacity-[0.10]">
            <svg width="100" height="140" viewBox="0 0 100 140" fill="none" className="text-primary">
              {/* Tank body */}
              <rect x="15" y="30" width="70" height="90" rx="8" fill="currentColor" opacity="0.6" />
              {/* Tank top dome */}
              <path d="M15 38 C15 20, 85 20, 85 38" fill="currentColor" opacity="0.7" />
              {/* Tank lid */}
              <rect x="38" y="16" width="24" height="10" rx="4" fill="currentColor" opacity="0.5" />
              {/* Water level inside */}
              <rect x="20" y="65" width="60" height="50" rx="4" fill="currentColor" opacity="0.3" />
              {/* Pipe */}
              <rect x="80" y="70" width="18" height="6" rx="2" fill="currentColor" opacity="0.5" />
              <rect x="94" y="70" width="6" height="30" rx="2" fill="currentColor" opacity="0.5" />
              {/* Droplet on tank */}
              <path d="M50 50 C50 44, 56 44, 56 50 C56 54, 50 58, 50 58 C50 58, 44 54, 44 50 C44 44, 50 44, 50 50Z" fill="currentColor" opacity="0.4" />
            </svg>
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
            
            <p className="mt-5 text-sm text-muted-foreground">
              Total des économies sur votre facture d'eau sur {horizonAnnees} ans
              (avec +1%/an d'inflation du prix de l'eau)
            </p>
          </div>
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
