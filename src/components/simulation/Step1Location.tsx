import { useFormContext } from "react-hook-form";
import { MapPin, Home, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ROOF_TYPES, CALIBRATED_DEPARTMENTS, CLIMATE_DATA } from "@/lib/constants";
import { getDepartementFromCodePostal } from "@/lib/calculations";
import { SimulationFormData } from "@/lib/validation";

export function Step1Location() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SimulationFormData>();

  const codePostal = watch("codePostal");
  const typeToiture = watch("typeToiture");

  const departement = getDepartementFromCodePostal(codePostal);
  const isCalibrated = departement ? CALIBRATED_DEPARTMENTS.includes(departement) : true;
  const climateData = departement ? CLIMATE_DATA[departement] : null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Localisation & Toiture</h2>
        <p className="mt-2 text-muted-foreground">
          Indiquez votre situation géographique et les caractéristiques de votre toiture
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Code postal */}
        <div className="space-y-2">
          <Label htmlFor="codePostal" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Code postal
          </Label>
          <Input
            id="codePostal"
            placeholder="34000"
            maxLength={5}
            {...register("codePostal")}
          />
          {errors.codePostal && (
            <p className="text-sm text-destructive">{errors.codePostal.message}</p>
          )}
          {departement && (
            <div className="text-sm text-muted-foreground">
              <p>Département : <span className="font-medium text-foreground">{departement}</span></p>
              {climateData && (
                <p className="mt-1">
                  Pluviométrie : <span className="font-medium text-foreground">{climateData.pluie} mm/an</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Surface toiture */}
        <div className="space-y-2">
          <Label htmlFor="surfaceToiture" className="flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            Surface de toiture collectée (m²)
          </Label>
          <Input
            id="surfaceToiture"
            type="number"
            placeholder="100"
            {...register("surfaceToiture", { valueAsNumber: true })}
          />
          {errors.surfaceToiture && (
            <p className="text-sm text-destructive">{errors.surfaceToiture.message}</p>
          )}
        </div>
      </div>

      {/* Warning for non-calibrated departments */}
      {departement && !isCalibrated && (
        <div className="flex items-start gap-3 rounded-lg border border-gold/50 bg-gold-light p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-gold" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Zone non calibrée</p>
            <p className="text-muted-foreground">
              Ce simulateur est calibré pour les départements 07, 30, 34, 48 et 84.
              Les résultats sont indicatifs.
            </p>
          </div>
        </div>
      )}

      {/* Type de toiture */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Home className="h-4 w-4 text-primary" />
          Type de toiture
        </Label>
        <RadioGroup
          value={typeToiture}
          onValueChange={(value) => setValue("typeToiture", value)}
          className="grid gap-3 sm:grid-cols-3"
        >
          {ROOF_TYPES.map((roof) => (
            <Label
              key={roof.value}
              htmlFor={roof.value}
              className={`flex cursor-pointer items-center justify-between rounded-lg border-2 p-4 transition-all ${
                typeToiture === roof.value
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value={roof.value} id={roof.value} />
                <span className="font-medium">{roof.label}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Coef. {roof.coefficient}
              </span>
            </Label>
          ))}
        </RadioGroup>
        {errors.typeToiture && (
          <p className="text-sm text-destructive">{errors.typeToiture.message}</p>
        )}
      </div>
    </div>
  );
}
