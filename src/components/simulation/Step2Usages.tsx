import { useFormContext } from "react-hook-form";
import { Droplets, Flower2, Car, Waves, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { WATERING_INTENSITY } from "@/lib/constants";
import { SimulationFormData } from "@/lib/validation";

export function Step2Usages() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SimulationFormData>();

  const wcEnabled = watch("wcEnabled");
  const jardinEnabled = watch("jardinEnabled");
  const autoEnabled = watch("autoEnabled");
  const piscineEnabled = watch("piscineEnabled");
  const piscineMode = watch("piscineMode");
  const jardinIntensite = watch("jardinIntensite");
  const modeAvance = watch("modeAvance");

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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="wcPersonnes">Nombre de personnes</Label>
                      <Input
                        id="wcPersonnes"
                        type="number"
                        min={1}
                        max={20}
                        placeholder="2"
                        {...register("wcPersonnes", { valueAsNumber: true })}
                      />
                    </div>
                    {modeAvance && (
                      <div className="space-y-2">
                        <Label htmlFor="wcConso">Consommation (L/jour/pers)</Label>
                        <Input
                          id="wcConso"
                          type="number"
                          step="0.1"
                          defaultValue={30.5}
                          {...register("wcConsoParPersonne", { valueAsNumber: true })}
                        />
                      </div>
                    )}
                  </div>
                  {!modeAvance && (
                    <p className="text-sm text-muted-foreground">
                      Base de calcul : 30,5 L/jour/personne
                    </p>
                  )}
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
                      placeholder="50"
                      {...register("jardinSurface", { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Intensité d'arrosage</Label>
                    <RadioGroup
                      value={jardinIntensite}
                      onValueChange={(value) => setValue("jardinIntensite", value)}
                      className="grid gap-2 sm:grid-cols-3"
                    >
                      {WATERING_INTENSITY.map((intensity) => (
                        <Label
                          key={intensity.value}
                          htmlFor={`jardin-${intensity.value}`}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-all ${
                            jardinIntensite === intensity.value
                              ? "border-eco-dark bg-eco-light"
                              : "hover:border-eco-medium"
                          }`}
                        >
                          <RadioGroupItem value={intensity.value} id={`jardin-${intensity.value}`} />
                          <div>
                            <span className="font-medium">{intensity.label}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {intensity.liters} L/m²/sem
                            </span>
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Période : mai à septembre (22 semaines)
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="autoLavages">Lavages par mois</Label>
                      <Input
                        id="autoLavages"
                        type="number"
                        min={1}
                        max={30}
                        placeholder="2"
                        {...register("autoLavagesMois", { valueAsNumber: true })}
                      />
                    </div>
                    {modeAvance && (
                      <div className="space-y-2">
                        <Label htmlFor="autoVolume">Volume par lavage (L)</Label>
                        <Input
                          id="autoVolume"
                          type="number"
                          defaultValue={200}
                          {...register("autoVolumeParLavage", { valueAsNumber: true })}
                        />
                      </div>
                    )}
                  </div>
                  {!modeAvance && (
                    <p className="text-sm text-muted-foreground">
                      Base de calcul : 200 L par lavage
                    </p>
                  )}
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
                      Le dimensionnement concerne l'appoint annuel, pas le remplissage complet d'une piscine.
                    </p>
                  </div>

                  <RadioGroup
                    value={piscineMode}
                    onValueChange={(value) => setValue("piscineMode", value as "appoint" | "volume")}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <Label
                      htmlFor="piscine-appoint"
                      className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-all ${
                        piscineMode === "appoint"
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="appoint" id="piscine-appoint" />
                        <span className="font-medium">Appoint direct</span>
                        <span className="rounded bg-accent/20 px-1.5 py-0.5 text-xs font-medium text-accent">
                          Recommandé
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Je connais mon appoint annuel
                      </span>
                    </Label>

                    <Label
                      htmlFor="piscine-volume"
                      className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-all ${
                        piscineMode === "volume"
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="volume" id="piscine-volume" />
                        <span className="font-medium">Calcul estimé</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Basé sur le volume de la piscine
                      </span>
                    </Label>
                  </RadioGroup>

                  {piscineMode === "appoint" && (
                    <div className="space-y-2 animate-scale-in">
                      <Label htmlFor="piscineAppoint">Appoint annuel (m³/an)</Label>
                      <Input
                        id="piscineAppoint"
                        type="number"
                        step="0.1"
                        min={0.1}
                        placeholder="5"
                        {...register("piscineAppoint", { valueAsNumber: true })}
                      />
                    </div>
                  )}

                  {piscineMode === "volume" && (
                    <div className="grid gap-4 sm:grid-cols-2 animate-scale-in">
                      <div className="space-y-2">
                        <Label htmlFor="piscineVolume">Volume piscine (m³)</Label>
                        <Input
                          id="piscineVolume"
                          type="number"
                          min={1}
                          placeholder="50"
                          {...register("piscineVolume", { valueAsNumber: true })}
                        />
                      </div>
                      {modeAvance && (
                        <div className="space-y-2">
                          <Label htmlFor="piscinePourcent">Appoint annuel (%)</Label>
                          <Input
                            id="piscinePourcent"
                            type="number"
                            min={1}
                            max={50}
                            defaultValue={12}
                            {...register("piscinePourcent", { valueAsNumber: true })}
                          />
                        </div>
                      )}
                      {!modeAvance && (
                        <p className="text-sm text-muted-foreground sm:col-span-2">
                          Base : 12% du volume/an pour l'appoint
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
