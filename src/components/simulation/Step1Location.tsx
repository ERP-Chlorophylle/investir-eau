import { useFormContext } from "react-hook-form";
import { MapPin, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ROOF_TYPES, DEPARTMENT_OPTIONS, CLIMATE_DATA } from "@/lib/constants";
import { SimulationFormData } from "@/lib/validation";

export function Step1Location() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SimulationFormData>();

  const departement = watch("departement");
  const typeToiture = watch("typeToiture");

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
        {/* Département */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Département
          </Label>
          <RadioGroup
            value={departement}
            onValueChange={(value) => setValue("departement", value)}
            className="grid gap-2"
          >
            {DEPARTMENT_OPTIONS.map((dept) => (
              <Label
                key={dept.value}
                htmlFor={`dept-${dept.value}`}
                className={`flex cursor-pointer items-center justify-between rounded-lg border-2 p-3 transition-all ${
                  departement === dept.value
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={dept.value} id={`dept-${dept.value}`} />
                  <span className="font-medium">{dept.label}</span>
                </div>
              </Label>
            ))}
          </RadioGroup>
          {errors.departement && (
            <p className="text-sm text-destructive">{errors.departement.message}</p>
          )}
          {climateData && (
            <div className="text-sm text-muted-foreground mt-2">
              Pluviométrie : <span className="font-medium text-foreground">{climateData.pluie} mm/an</span>
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

      {/* Type de toiture */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Home className="h-4 w-4 text-primary" />
          Type de toiture
        </Label>
        <RadioGroup
          value={typeToiture}
          onValueChange={(value) => setValue("typeToiture", value)}
          className="grid gap-3 sm:grid-cols-2"
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
