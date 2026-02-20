import { useEffect, useState } from "react";
import { Droplets, Home, PiggyBank, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TransitionScreenProps {
  onComplete: () => void;
  /** Durée en ms de la barre de progression (défaut: 5000ms) */
  duration?: number;
}

const AVANTAGES = [
  {
    icon: Droplets,
    text: "La garantie d'avoir toujours de l'eau chez soi",
    delay: "400ms",
    iconClass: "text-primary",
    bgClass: "bg-primary/15",
  },
  {
    icon: Home,
    text: "Valoriser sa maison",
    delay: "800ms",
    iconClass: "text-eco-dark",
    bgClass: "bg-eco-light",
  },
  {
    icon: PiggyBank,
    text: "Faire des économies par rapport à un livret si l'argent dort à la banque",
    delay: "1200ms",
    iconClass: "text-gold",
    bgClass: "bg-gold-light",
  },
];

export function TransitionScreen({ onComplete, duration = 4000 }: Readonly<TransitionScreenProps>) {
  const [progress, setProgress] = useState(0);
  const isReady = progress >= 100;

  useEffect(() => {
    const start = Date.now();
    const interval = globalThis.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        globalThis.clearInterval(interval);
      }
    }, 30);

    return () => {
      globalThis.clearInterval(interval);
    };
  }, [duration]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <div className="mx-auto max-w-lg px-6 text-center">
        {/* Icône animée */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-pulse">
          <Droplets className="h-10 w-10 text-primary" />
        </div>

        {/* Titre */}
        <h2 className="text-xl font-bold text-foreground sm:text-2xl animate-fade-in">
          {isReady
            ? "Les résultats de la simulation sont prêts !"
            : "Nous calculons le potentiel d'une cuve selon vos caractéristiques…"}
        </h2>

        {/* Barre de progression */}
        <div className="mx-auto mt-6 h-2 w-64 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Avantages */}
        <div className="mt-10 space-y-4 text-left">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Une cuve c'est :
          </p>
          {AVANTAGES.map((avantage) => (
            <div
              key={avantage.text}
              className="flex items-start gap-4 rounded-xl border bg-card p-4 opacity-0 animate-slide-up shadow-sm"
              style={{ animationDelay: avantage.delay, animationFillMode: "forwards" }}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${avantage.bgClass}`}>
                <avantage.icon className={`h-5 w-5 ${avantage.iconClass}`} />
              </div>
              <p className="text-sm font-medium text-foreground sm:text-base">
                {avantage.text}
              </p>
            </div>
          ))}
        </div>

        {/* Bouton CTA — apparaît quand la barre est complète */}
        <div className={`mt-8 transition-all duration-500 ${isReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
          <Button variant="cta" size="lg" onClick={onComplete} className="animate-bounce-subtle">
            Voir mes résultats
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
