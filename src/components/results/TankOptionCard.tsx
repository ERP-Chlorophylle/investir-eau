import { Droplets, TrendingUp, Sparkles } from "lucide-react";
import { TankOption } from "@/lib/calculations";
import { cn } from "@/lib/utils";

const OPTION_CONFIG: Record<string, { icon: typeof Droplets; title: string; cardClass: string; iconClass: string; badgeClass: string; featured?: boolean }> = {
  eco: {
    icon: Droplets,
    title: "Essentiel",
    cardClass: "result-card-eco",
    iconClass: "text-eco-dark",
    badgeClass: "bg-eco-light text-eco-dark",
  },
  confort: {
    icon: TrendingUp,
    title: "Confort",
    cardClass: "result-card-confort",
    iconClass: "text-primary",
    badgeClass: "bg-water-light text-primary",
    featured: true,
  },
  extra: {
    icon: Sparkles,
    title: "Sérénité +",
    cardClass: "result-card-extra",
    iconClass: "text-purple",
    badgeClass: "bg-purple-light text-purple",
  },
};

interface TankOptionCardProps {
  option: TankOption;
  isSelected?: boolean;
  onClick?: () => void;
  interestGains?: { name: string; gain: number }[];
}

export function TankOptionCard({ option, isSelected, onClick, interestGains = [] }: TankOptionCardProps) {
  const config = OPTION_CONFIG[option.type];
  const Icon = config.icon;
  const mobileInterestGains = interestGains.slice(0, 4);

  return (
    <div
      onClick={onClick}
      className={cn(
        "result-card relative w-full cursor-pointer overflow-visible p-3 md:p-6",
        config.cardClass,
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {config.featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Recommandé
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-1">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <div className={cn("rounded-lg p-1.5 md:p-2", config.badgeClass)}>
            <Icon className={cn("h-4 w-4 md:h-6 md:w-6", config.iconClass)} />
          </div>
          <h3 className="truncate whitespace-nowrap text-[clamp(0.95rem,2.4vw,1.25rem)] font-bold leading-tight">
            {config.title}
          </h3>
        </div>
      </div>

      <div className="mt-3 space-y-3 md:mt-6 md:space-y-4">
        {/* Volume */}
        <div className="text-center">
          <p className="text-[clamp(1.35rem,4.6vw,2.2rem)] font-bold leading-tight text-foreground">
            <span className="break-words [overflow-wrap:anywhere]">{option.volumeCuveArrondi.toLocaleString("fr-FR")}</span> L
          </p>
          <p className="text-[clamp(0.72rem,1.9vw,0.875rem)] text-muted-foreground">
            soit {option.volumeCuveM3} m³
          </p>
        </div>

        {/* Stats */}
        <div className="rounded-lg bg-muted/50 p-2 md:p-3">
          <div className="flex items-center justify-between gap-1 text-[clamp(0.72rem,1.8vw,0.9rem)]">
            <span className="text-muted-foreground md:hidden">Couverture</span>
            <span className="hidden text-muted-foreground md:inline">Couverture des besoins</span>
            <span className="whitespace-nowrap text-[clamp(0.95rem,2.8vw,1.125rem)] font-semibold leading-none">
              {option.couvertureReelle ?? option.couvertureCible}%
            </span>
          </div>
        </div>

        {/* Volume annuel couvert */}
        <div className="text-center text-[clamp(0.72rem,1.9vw,0.9rem)] text-muted-foreground">
          <p>
            <span className="md:hidden">{(option.volumeAnnuelCouvert / 1000).toFixed(1)} m³/an</span>
            <span className="hidden md:inline">{(option.volumeAnnuelCouvert / 1000).toFixed(1)} m³/an économisés</span>
          </p>
        </div>

        {/* Price */}
        <div className="border-t pt-3 md:pt-4">
          {option.surDevis ? (
            <p className="text-center text-[clamp(1.2rem,2.6vw,1.9rem)] font-semibold text-muted-foreground">
              Sur devis
            </p>
          ) : option.cout ? (
            <p className="text-center">
              <span className="text-[clamp(1.15rem,3.4vw,1.4rem)] font-bold text-foreground">
                <span className="break-words [overflow-wrap:anywhere]">{option.cout.toLocaleString("fr-FR")}</span> €
              </span>
              <span className="hidden text-[clamp(10px,1.2vw,0.875rem)] text-muted-foreground md:inline"> TTC installé</span>
            </p>
          ) : null}
        </div>

        {interestGains.length > 0 && (
          <div className="rounded-lg border bg-background/80 p-2 md:p-3">
            <p className="mb-1 text-[clamp(9px,1.1vw,0.75rem)] font-semibold uppercase tracking-wide text-muted-foreground md:mb-2">
              <span className="md:hidden">Top gains</span>
              <span className="hidden md:inline">Gains d'intérêts</span>
            </p>
            <div className="space-y-1 md:hidden">
              {mobileInterestGains.map((row) => (
                <div key={row.name} className="flex items-center justify-between gap-2 text-[clamp(9px,1.05vw,0.75rem)]">
                  <span className="text-muted-foreground">{row.name}</span>
                  <span className={cn("font-semibold tabular-nums", row.gain >= 0 ? "text-primary" : "text-destructive")}>
                    {row.gain >= 0 ? "+" : ""}
                    {Math.round(row.gain).toLocaleString("fr-FR")} €
                  </span>
                </div>
              ))}
            </div>
            <div className="hidden space-y-1.5 md:block">
              {interestGains.map((row) => (
                <div key={row.name} className="flex items-center justify-between gap-2 text-[clamp(10px,1.05vw,0.9rem)]">
                  <span className="text-muted-foreground">{row.name}</span>
                  <span className={cn("font-semibold tabular-nums", row.gain >= 0 ? "text-primary" : "text-destructive")}>
                    {row.gain >= 0 ? "+" : ""}
                    {Math.round(row.gain).toLocaleString("fr-FR")} €
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

