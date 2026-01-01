import { Droplets, TrendingUp, Shield } from "lucide-react";
import { TankOption } from "@/lib/calculations";
import { cn } from "@/lib/utils";

interface TankOptionCardProps {
  option: TankOption;
  vSupply: number;
  vDemand: number;
}

const OPTION_CONFIG: Record<string, { icon: typeof Droplets; title: string; subtitle: string; cardClass: string; iconClass: string; badgeClass: string; featured?: boolean }> = {
  eco: {
    icon: Droplets,
    title: "Essentiel",
    subtitle: "70% des besoins",
    cardClass: "result-card-eco",
    iconClass: "text-eco-dark",
    badgeClass: "bg-eco-light text-eco-dark",
  },
  confort: {
    icon: TrendingUp,
    title: "Confort",
    subtitle: "85% des besoins",
    cardClass: "result-card-confort",
    iconClass: "text-primary",
    badgeClass: "bg-water-light text-primary",
    featured: true,
  },
  autonomie: {
    icon: Shield,
    title: "Autonomie",
    subtitle: "100% des besoins",
    cardClass: "result-card-autonomie",
    iconClass: "text-gold",
    badgeClass: "bg-gold-light text-gold",
  },
};

export function TankOptionCard({ option, vSupply, vDemand }: TankOptionCardProps) {
  const config = OPTION_CONFIG[option.type];
  const Icon = config.icon;

  // Calculate actual coverage (limited by supply)
  const actualCoverage = vDemand > 0 
    ? Math.round((option.volumeAnnuelCouvert / vDemand) * 100) 
    : 0;
  const isLimitedBySupply = option.volumeAnnuelCouvert < vDemand * (option.couvertureCible / 100);

  return (
    <div
      className={cn(
        "result-card relative",
        config.cardClass,
        config.featured && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {config.featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Recommandé
          </span>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-lg p-2", config.badgeClass)}>
            <Icon className={cn("h-6 w-6", config.iconClass)} />
          </div>
          <div>
            <h3 className="text-xl font-bold">{config.title}</h3>
            <p className="text-sm text-muted-foreground">{config.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Volume */}
        <div className="text-center">
          <p className="text-4xl font-bold text-foreground">
            {option.volumeCuveArrondi.toLocaleString("fr-FR")} L
          </p>
          <p className="text-sm text-muted-foreground">
            soit {option.volumeCuveM3} m³
          </p>
        </div>

        {/* Stats */}
        <div className="space-y-2 text-sm">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Couverture des besoins</span>
              <span className="text-lg font-semibold">{actualCoverage}%</span>
            </div>
            {isLimitedBySupply && (
              <p className="text-xs text-gold mt-1">
                Objectif {option.couvertureCible}% non atteint (ressource insuffisante)
              </p>
            )}
          </div>
        </div>

        {/* Volume annuel couvert */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            {(option.volumeAnnuelCouvert / 1000).toFixed(1)} m³/an économisés
          </p>
          {isLimitedBySupply && (
            <p className="text-xs text-gold mt-1">
              Limité par la ressource disponible
            </p>
          )}
        </div>

        {/* Price */}
        <div className="border-t pt-4">
          {option.surDevis ? (
            <p className="text-center text-lg font-semibold text-muted-foreground">
              Sur devis
            </p>
          ) : option.cout ? (
            <p className="text-center">
              <span className="text-2xl font-bold text-foreground">
                {option.cout.toLocaleString("fr-FR")} €
              </span>
              <span className="text-sm text-muted-foreground"> TTC installé</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
