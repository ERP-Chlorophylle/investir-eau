import { useFormContext } from "react-hook-form";
import { Droplets, Flower2, Car, Waves, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DEFAULT_PERSONS, 
  DEFAULT_GARDEN_SURFACE, 
  DEFAULT_CAR_WASHES, 
  DEFAULT_POOL_SURFACE,
  DEFAULT_WC_CONSUMPTION,
  DEFAULT_CAR_WASH_VOLUME,
  DEFAULT_WATERING_LITERS,
  WATERING_WEEKS,
  POOL_DEPTH,
  POOL_APPOINT_PERCENT,
} from "@/lib/constants";
import { SimulationFormData } from "@/lib/validation";
import { useEffect } from "react";

export function Step2Usages() {
  const {
    register,
    watch,
    setValue,
  } = useFormContext<SimulationFormData>();

  const wcEnabled = watch("wcEnabled");
  const jardinEnabled = watch("jardinEnabled");
  const autoEnabled = watch("autoEnabled");
  const piscineEnabled = watch("piscineEnabled");

  // Set default values when checkboxes are enabled
  useEffect(() => {
    if (wcEnabled && !watch("wcPersonnes")) {
      setValue("wcPersonnes", DEFAULT_PERSONS);
    }
  }, [wcEnabled, setValue, watch]);

  useEffect(() => {
    if (jardinEnabled && !watch("jardinSurface")) {
      setValue("jardinSurface", DEFAULT_GARDEN_SURFACE);
    }
  }, [jardinEnabled, setValue, watch]);

  useEffect(() => {
    if (autoEnabled && !watch("autoLavagesMois")) {
      setValue("autoLavagesMois", DEFAULT_CAR_WASHES);
    }
  }, [autoEnabled, setValue, watch]);

  useEffect(() => {
    if (piscineEnabled && !watch("piscineSurface")) {
      setValue("piscineSurface", DEFAULT_POOL_SURFACE);
    }
  }, [piscineEnabled, setValue, watch]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Usages de l'eau</h2>
        <p className="mt-2 text-muted-foreground">
          Sélectionnez les usages que vous souhaitez alimenter avec l'eau de pluie
        </p>
      </div>

      <div className="grid gap-6">
        {/* WC */}
        <div className="rounded-xl border-2 p-5 transition-all hover:border-primary/30">
          <div className="flex items-start gap-4">
            <Checkbox
              id="wcEnabled"
              checked={wcEnabled}
              onCheckedChange={(checked) => setValue("wcEnabled", !!checked)}
              className="mt-1"
            />
            <div className="flex-1 space-y-4">
              <Label htmlFor="wcEnabled" className="flex cursor-pointer items-center gap-2 text-lg font-semibold">
                <Droplets className="h-5 w-5 text-primary" />
                Toilettes
              </Label>
              
              {wcEnabled && (
                <div className="space-y-3 animate-scale-in">
                  <div className="space-y-2">
                    <Label htmlFor="wcPersonnes">Nombre de personnes</Label>
                    <Input
                      id="wcPersonnes"
                      type="number"
                      min={1}
                      max={20}
                      {...register("wcPersonnes", { valueAsNumber: true })}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Base de calcul : {DEFAULT_WC_CONSUMPTION} L/jour/personne
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Jardin */}
        <div className="rounded-xl border-2 p-5 transition-all hover:border-primary/30">
          <div className="flex items-start gap-4">
            <Checkbox
              id="jardinEnabled"
              checked={jardinEnabled}
              onCheckedChange={(checked) => setValue("jardinEnabled", !!checked)}
              className="mt-1"
            />
            <div className="flex-1 space-y-4">
              <Label htmlFor="jardinEnabled" className="flex cursor-pointer items-center gap-2 text-lg font-semibold">
                <Flower2 className="h-5 w-5 text-eco-dark" />
                Jardin
              </Label>
              
              {jardinEnabled && (
                <div className="space-y-4 animate-scale-in">
                  <div className="space-y-2">
                    <Label htmlFor="jardinSurface">Surface arrosée (m²)</Label>
                    <Input
                      id="jardinSurface"
                      type="number"
                      min={1}
                      {...register("jardinSurface", { valueAsNumber: true })}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Base : {DEFAULT_WATERING_LITERS} L/m²/semaine × {WATERING_WEEKS} semaines (mai → sept)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Auto */}
        <div className="rounded-xl border-2 p-5 transition-all hover:border-primary/30">
          <div className="flex items-start gap-4">
            <Checkbox
              id="autoEnabled"
              checked={autoEnabled}
              onCheckedChange={(checked) => setValue("autoEnabled", !!checked)}
              className="mt-1"
            />
            <div className="flex-1 space-y-4">
              <Label htmlFor="autoEnabled" className="flex cursor-pointer items-center gap-2 text-lg font-semibold">
                <Car className="h-5 w-5 text-muted-foreground" />
                Lavage voiture
              </Label>
              
              {autoEnabled && (
                <div className="space-y-3 animate-scale-in">
                  <div className="space-y-2">
                    <Label htmlFor="autoLavages">Lavages par mois</Label>
                    <Input
                      id="autoLavages"
                      type="number"
                      min={1}
                      max={30}
                      {...register("autoLavagesMois", { valueAsNumber: true })}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Base de calcul : {DEFAULT_CAR_WASH_VOLUME} L par lavage
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Piscine */}
        <div className="rounded-xl border-2 p-5 transition-all hover:border-primary/30">
          <div className="flex items-start gap-4">
            <Checkbox
              id="piscineEnabled"
              checked={piscineEnabled}
              onCheckedChange={(checked) => setValue("piscineEnabled", !!checked)}
              className="mt-1"
            />
            <div className="flex-1 space-y-4">
              <Label htmlFor="piscineEnabled" className="flex cursor-pointer items-center gap-2 text-lg font-semibold">
                <Waves className="h-5 w-5 text-water-dark" />
                Piscine
              </Label>
              
              {piscineEnabled && (
                <div className="space-y-4 animate-scale-in">
                  <div className="flex items-start gap-2 rounded-lg bg-water-light p-3">
                    <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Le dimensionnement concerne l'appoint annuel, pas le remplissage complet.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="piscineSurface">Surface de la piscine (m²)</Label>
                    <Input
                      id="piscineSurface"
                      type="number"
                      min={1}
                      max={200}
                      {...register("piscineSurface", { valueAsNumber: true })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ex : piscine 8×4m = 32 m²
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Calcul : surface × {POOL_DEPTH}m (profondeur) × {POOL_APPOINT_PERCENT}% appoint/an
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
