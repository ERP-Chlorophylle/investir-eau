import { useFormContext } from "react-hook-form";
import { Euro, Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SimulationFormData } from "@/lib/validation";

export function Step3Financial() {
  const { watch, setValue } = useFormContext<SimulationFormData>();

  const prixEau = watch("prixEau") ?? 5;
  const horizonAnnees = watch("horizonAnnees") ?? 10;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Prix de l'eau & Horizon</h2>
        <p className="mt-2 text-muted-foreground">
          Configurez les paramètres financiers de votre simulation
        </p>
      </div>

      <div className="mx-auto max-w-lg space-y-8">
        {/* Prix de l'eau */}
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Euro className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Prix de l'eau</h3>
              <p className="text-sm text-muted-foreground">
                Eau + assainissement
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Prix actuel</Label>
              <span className="text-2xl font-bold text-primary">
                {prixEau.toFixed(1)} €/m³
              </span>
            </div>
            <Slider
              value={[prixEau]}
              onValueChange={([value]) => setValue("prixEau", value)}
              min={5}
              max={15}
              step={0.5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 €/m³</span>
              <span>15 €/m³</span>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">+1% par an</span> d'inflation
              appliquée au prix de l'eau
            </p>
          </div>
        </div>

        {/* Horizon */}
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Horizon de comparaison</h3>
              <p className="text-sm text-muted-foreground">
                Durée de projection
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Durée</Label>
              <span className="text-2xl font-bold text-accent">
                {horizonAnnees} ans
              </span>
            </div>
            <Slider
              value={[horizonAnnees]}
              onValueChange={([value]) => setValue("horizonAnnees", value)}
              min={5}
              max={20}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 ans</span>
              <span>20 ans</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
