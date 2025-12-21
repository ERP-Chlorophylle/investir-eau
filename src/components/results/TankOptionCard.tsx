import { Droplets, TrendingUp, Shield } from "lucide-react";
import { TankOption } from "@/lib/calculations";
import { cn } from "@/lib/utils";

interface TankOptionCardProps {
  option: TankOption;
  vSupply: number;
  vDemand: number;
  vUse: number;
}

const OPTION_CONFIG: Record<string, { icon: typeof Droplets; title: string; subtitle: string; cardClass: string; iconClass: string; badgeClass: string; featured?: boolean }> = {
  eco: {
    icon: Droplets,
    title: "Éco",
    subtitle: "Investissement minimal",
    cardClass: "result-card-eco",
    iconClass: "text-eco-dark",
    badgeClass: "bg-eco-light text-eco-dark",
  },
  confort: {
    icon: TrendingUp,
    title: "Confort",
    subtitle: "Équilibre optimal",
    cardClass: "result-card-confort",
    iconClass: "text-primary",
    badgeClass: "bg-water-light text-primary",
    featured: true,
  },
  autonomie: {
    icon: Shield,
    title: "Autonomie",
    subtitle: "Sécurité maximale",
    cardClass: "result-card-autonomie",
    iconClass: "text-gold",
    badgeClass: "bg-gold-light text-gold",
  },
};

export function TankOptionCard({ option, vSupply, vDemand, vUse }: TankOptionCardProps) {
  const config = OPTION_CONFIG[option.type];
  const Icon = config.icon;

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
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-muted-foreground">Réserve</p>
            <p className="text-lg font-semibold">{option.joursReserve} jours</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-muted-foreground">Couverture</p>
            <p className="text-lg font-semibold">{option.couverture}%</p>
          </div>
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

        {/* Dimensioning info */}
        <p className="text-center text-xs text-muted-foreground">
          Dimensionné par {option.dimensionnePar === "ressource" ? "la ressource" : "la demande"}
        </p>
      </div>
    </div>
  );
}
