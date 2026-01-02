import { AlertTriangle, Droplets } from "lucide-react";

export function DroughtAlert() {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-gold bg-gradient-to-br from-gold/20 via-gold-light to-gold/10 p-8 shadow-lg">
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 opacity-10">
        <Droplets className="h-40 w-40 text-gold" />
      </div>
      
      <div className="relative z-10 flex items-start gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gold/30 ring-4 ring-gold/20">
          <AlertTriangle className="h-7 w-7 text-gold" />
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">
              Enjeu environnemental
            </p>
            <h3 className="text-xl font-bold text-foreground">
              Contexte sécheresse en France
            </h3>
          </div>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-background/60 backdrop-blur-sm p-4 border border-gold/20">
              <p className="text-3xl font-bold text-gold">1 052</p>
              <p className="text-sm text-muted-foreground">
                communes ont connu des <span className="font-semibold text-foreground">coupures d'eau</span> au plus fort de l'été 2022
              </p>
            </div>
            <div className="rounded-lg bg-background/60 backdrop-blur-sm p-4 border border-gold/20">
              <p className="text-3xl font-bold text-gold">93/96</p>
              <p className="text-sm text-muted-foreground">
                départements en <span className="font-semibold text-foreground">restriction</span>, dont 79 au niveau crise (août 2022)
              </p>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground italic">
            Sources : Bilan sécheresse 2022 / Rapport interministériel
          </p>
        </div>
      </div>
    </div>
  );
}
