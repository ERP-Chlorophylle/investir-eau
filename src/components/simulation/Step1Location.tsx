import { useFormContext } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { Check, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ROOF_TYPES } from "@/lib/constants";
import { SimulationFormData } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { scrollToElement } from "@/lib/scroll";

interface Step1LocationProps {
  onProgressChange?: (progressPercent: number) => void;
}

export function Step1Location({ onProgressChange }: Step1LocationProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SimulationFormData>();

  const surfaceToiture = watch("surfaceToiture");
  const typeToiture = watch("typeToiture");
  const [isSurfaceConfirmed, setIsSurfaceConfirmed] = useState(false);
  const [hasSurfaceChanged, setHasSurfaceChanged] = useState(false);
  const isSurfaceValid =
    typeof surfaceToiture === "number" &&
    Number.isFinite(surfaceToiture) &&
    surfaceToiture >= 10 &&
    surfaceToiture <= 1000;

  const activeField = !isSurfaceConfirmed ? "surface" : !typeToiture ? "toiture" : null;
  const previousActiveFieldRef = useRef<typeof activeField>(activeField);
  const surfaceSectionRef = useRef<HTMLDivElement>(null);
  const toitureSectionRef = useRef<HTMLDivElement>(null);

  const isToitureLocked = activeField === "surface";

  const surfaceRegister = register("surfaceToiture", { valueAsNumber: true });

  useEffect(() => {
    if (isSurfaceConfirmed) return;
    if (!hasSurfaceChanged) return;
    if (!isSurfaceValid) return;

    const timer = globalThis.setTimeout(() => {
      setIsSurfaceConfirmed(true);
    }, 1500);

    return () => globalThis.clearTimeout(timer);
  }, [isSurfaceConfirmed, hasSurfaceChanged, isSurfaceValid, surfaceToiture]);

  useEffect(() => {
    const previousActiveField = previousActiveFieldRef.current;

    if (previousActiveField === "surface" && activeField === "toiture") {
      scrollToElement(toitureSectionRef.current);
    }

    previousActiveFieldRef.current = activeField;
  }, [activeField]);

  useEffect(() => {
    const progress = !isSurfaceConfirmed ? 0 : !typeToiture ? 50 : 100;
    onProgressChange?.(progress);
  }, [isSurfaceConfirmed, typeToiture, onProgressChange]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Caractéristiques de votre toit</h2>
        <p className="mt-2 text-muted-foreground">
          Pour connaitre son potentiel de collecte
        </p>
      </div>

      <div className="grid gap-6">
        {/* Surface toiture */}
        <div
          ref={surfaceSectionRef}
          className={cn(
            "space-y-2 rounded-xl p-3 transition-all",
            activeField === "surface" && "ring-2 ring-primary/70 bg-primary/5"
          )}
        >
          <Label htmlFor="surfaceToiture" className="flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            Surface de toiture collectée (m²)
          </Label>
          <div className="mx-auto flex max-w-[220px] items-center justify-center gap-2">
            <div className="flex h-10 w-28 items-center justify-center rounded-md border border-input bg-background px-2">
              <input
                id="surfaceToiture"
                type="number"
                inputMode="numeric"
                placeholder="100"
                className="w-10 border-0 bg-transparent p-0 text-right text-sm outline-none placeholder:text-muted-foreground [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                {...surfaceRegister}
                onChange={(e) => {
                  surfaceRegister.onChange(e);
                  setHasSurfaceChanged(true);
                  setIsSurfaceConfirmed(false);
                }}
                onFocus={() => {
                  setIsSurfaceConfirmed(false);
                  setValue("surfaceToiture", undefined, { shouldValidate: true });
                }}
              />
              <span className="ml-0.5 text-xs text-muted-foreground">m²</span>
            </div>
            <Button
              type="button"
              variant="hero"
              size="icon"
              disabled={!isSurfaceValid}
              onClick={() => {
                setHasSurfaceChanged(true);
                setIsSurfaceConfirmed(true);
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
          {errors.surfaceToiture && (
            <p className="text-sm text-destructive">{errors.surfaceToiture.message}</p>
          )}
        </div>
      </div>

      {/* Type de toiture */}
      <div
        ref={toitureSectionRef}
        className={cn(
          "space-y-3 rounded-xl p-3 transition-all",
          activeField === "toiture" && "ring-2 ring-primary/70 bg-primary/5",
          isToitureLocked && "pointer-events-none opacity-50"
        )}
      >
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

