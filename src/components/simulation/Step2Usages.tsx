import { useFormContext } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { Droplets, Flower2, Car, Waves, Info, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  DEFAULT_GARDEN_SURFACE,
  DEFAULT_POOL_SURFACE,
  DEFAULT_CAR_WASHES,
  DEFAULT_WC_CONSUMPTION,
  DEFAULT_CAR_WASH_VOLUME,
  DEFAULT_WATERING_LITERS,
  WATERING_WEEKS,
  POOL_DEPTH,
  POOL_APPOINT_PERCENT,
} from "@/lib/constants";
import { SimulationFormData } from "@/lib/validation";

interface Step2UsagesProps {
  onProgressChange?: (progressPercent: number) => void;
}

export function Step2Usages({ onProgressChange }: Step2UsagesProps) {
  const { register, watch, setValue } = useFormContext<SimulationFormData>();
  const [hasWcInteracted, setHasWcInteracted] = useState(false);
  const [isWcStableForNextStep, setIsWcStableForNextStep] = useState(false);
  const [hasJardinInteracted, setHasJardinInteracted] = useState(false);
  const [isJardinConfirmed, setIsJardinConfirmed] = useState(false);
  const [isJardinStableForNextStep, setIsJardinStableForNextStep] = useState(false);
  const [isPiscineConfirmed, setIsPiscineConfirmed] = useState(false);
  const [hasPiscineInteracted, setHasPiscineInteracted] = useState(false);
  const [isPiscineStableForNextStep, setIsPiscineStableForNextStep] = useState(false);
  const [hasAutoInteracted, setHasAutoInteracted] = useState(false);

  const wcEnabled = watch("wcEnabled");
  const wcPersonnes = watch("wcPersonnes") ?? 2;
  const jardinEnabled = watch("jardinEnabled");
  const jardinSurface = watch("jardinSurface");
  const piscineEnabled = watch("piscineEnabled");
  const piscineSurface = watch("piscineSurface");
  const autoEnabled = watch("autoEnabled");
  const autoLavagesMois = watch("autoLavagesMois");

  const wcDone =
    !wcEnabled ||
    (typeof wcPersonnes === "number" && Number.isFinite(wcPersonnes) && wcPersonnes >= 1 && wcPersonnes <= 20);
  const jardinDone =
    !jardinEnabled ||
    (typeof jardinSurface === "number" && Number.isFinite(jardinSurface) && jardinSurface >= 1);
  const piscineDone =
    !piscineEnabled ||
    (typeof piscineSurface === "number" && Number.isFinite(piscineSurface) && piscineSurface >= 1);
  const autoDone =
    !autoEnabled ||
    (typeof autoLavagesMois === "number" && Number.isFinite(autoLavagesMois) && autoLavagesMois >= 1 && autoLavagesMois <= 30);

  const wcReadyForNextStep = !wcEnabled || (wcDone && isWcStableForNextStep);
  const jardinReadyForNextStep = !jardinEnabled || (jardinDone && (isJardinConfirmed || isJardinStableForNextStep));
  const piscineReadyForNextStep = !piscineEnabled || (piscineDone && (isPiscineConfirmed || isPiscineStableForNextStep));
  const autoReadyForNextStep = !autoEnabled || (autoDone && hasAutoInteracted);
  const shouldGuideAutoAfterPiscine = piscineReadyForNextStep && !hasAutoInteracted;

  const activeUsage = !wcReadyForNextStep
    ? "wc"
    : !jardinReadyForNextStep
      ? "jardin"
      : !piscineReadyForNextStep
        ? "piscine"
        : shouldGuideAutoAfterPiscine || !autoReadyForNextStep
          ? "auto"
          : null;

  const isWcLocked = false;
  const isJardinLocked = activeUsage === "wc";
  const isPiscineLocked = activeUsage === "wc" || activeUsage === "jardin";
  const isAutoLocked = activeUsage === "wc" || activeUsage === "jardin" || activeUsage === "piscine";

  const previousActiveUsageRef = useRef<typeof activeUsage>(activeUsage);
  const wcSectionRef = useRef<HTMLDivElement>(null);
  const jardinSectionRef = useRef<HTMLDivElement>(null);
  const piscineSectionRef = useRef<HTMLDivElement>(null);
  const autoSectionRef = useRef<HTMLDivElement>(null);

  const scrollToWithHeaderOffset = (element: HTMLElement | null) => {
    if (!element) return;
    const header = document.querySelector("header");
    const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 0;
    const viewportHeight = window.innerHeight;
    const elementHeight = element.offsetHeight;
    const centerOffset = (viewportHeight - headerHeight - elementHeight) / 2;
    const top = element.getBoundingClientRect().top + window.scrollY - headerHeight - Math.max(8, centerOffset);
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  useEffect(() => {
    if (wcEnabled && watch("wcPersonnes") === undefined) {
      setValue("wcPersonnes", 2);
    }
  }, [wcEnabled, setValue, watch]);

  useEffect(() => {
    if (jardinEnabled && watch("jardinSurface") === undefined) {
      setValue("jardinSurface", DEFAULT_GARDEN_SURFACE);
      setIsJardinConfirmed(false);
      setIsJardinStableForNextStep(false);
    }
  }, [jardinEnabled, setValue, watch]);

  useEffect(() => {
    if (piscineEnabled && watch("piscineSurface") === undefined) {
      setValue("piscineSurface", DEFAULT_POOL_SURFACE);
      setIsPiscineConfirmed(false);
    }
  }, [piscineEnabled, setValue, watch]);

  useEffect(() => {
    if (autoEnabled && !watch("autoLavagesMois")) {
      setValue("autoLavagesMois", DEFAULT_CAR_WASHES);
    }
  }, [autoEnabled, setValue, watch]);

  useEffect(() => {
    if (!wcEnabled) {
      setIsWcStableForNextStep(true);
      return;
    }

    if (!hasWcInteracted || !wcDone) {
      setIsWcStableForNextStep(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsWcStableForNextStep(true);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [wcEnabled, hasWcInteracted, wcDone, wcPersonnes]);

  useEffect(() => {
    if (!jardinEnabled) {
      setIsJardinStableForNextStep(true);
      return;
    }

    if (!hasJardinInteracted || !jardinDone) {
      setIsJardinStableForNextStep(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsJardinStableForNextStep(true);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [jardinEnabled, hasJardinInteracted, jardinDone, jardinSurface]);

  useEffect(() => {
    if (!piscineEnabled) return;
    if (typeof piscineSurface !== "number" || !Number.isFinite(piscineSurface)) return;
    if (piscineSurface > 0) return;

    setValue("piscineEnabled", false);
    setValue("piscineSurface", undefined);
    setIsPiscineConfirmed(false);
    setIsPiscineStableForNextStep(false);
  }, [piscineEnabled, piscineSurface, setValue]);

  useEffect(() => {
    if (!piscineEnabled) {
      setIsPiscineStableForNextStep(true);
      return;
    }

    if (!hasPiscineInteracted || !piscineDone) {
      setIsPiscineStableForNextStep(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsPiscineStableForNextStep(true);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [piscineEnabled, hasPiscineInteracted, piscineDone, piscineSurface]);

  useEffect(() => {
    const previous = previousActiveUsageRef.current;

    if (activeUsage === null || previous === activeUsage) {
      previousActiveUsageRef.current = activeUsage;
      return;
    }

    const refs = {
      wc: wcSectionRef,
      jardin: jardinSectionRef,
      piscine: piscineSectionRef,
      auto: autoSectionRef,
    } as const;

    scrollToWithHeaderOffset(refs[activeUsage].current);
    previousActiveUsageRef.current = activeUsage;
  }, [activeUsage]);

  useEffect(() => {
    if (!wcReadyForNextStep) return;

    const timer = window.setTimeout(() => {
      scrollToWithHeaderOffset(jardinSectionRef.current);
    }, 50);

    return () => window.clearTimeout(timer);
  }, [wcReadyForNextStep]);

  useEffect(() => {
    if (!jardinReadyForNextStep) return;

    const timer = window.setTimeout(() => {
      scrollToWithHeaderOffset(piscineSectionRef.current);
    }, 50);

    return () => window.clearTimeout(timer);
  }, [jardinReadyForNextStep]);

  useEffect(() => {
    if (activeUsage !== "piscine") return;

    const timer = window.setTimeout(() => {
      scrollToWithHeaderOffset(piscineSectionRef.current);
    }, 60);

    return () => window.clearTimeout(timer);
  }, [activeUsage]);

  useEffect(() => {
    if (!piscineReadyForNextStep) return;

    const timer = window.setTimeout(() => {
      scrollToWithHeaderOffset(autoSectionRef.current);
    }, 50);

    return () => window.clearTimeout(timer);
  }, [piscineReadyForNextStep]);

  useEffect(() => {
    const totalSteps = autoEnabled ? 4 : 3;
    let completedSteps = 0;
    if (wcReadyForNextStep) completedSteps += 1;
    if (jardinReadyForNextStep) completedSteps += 1;
    if (piscineReadyForNextStep) completedSteps += 1;
    if (autoEnabled && autoReadyForNextStep) completedSteps += 1;
    const progress = Math.round((completedSteps / totalSteps) * 100);
    onProgressChange?.(progress);
  }, [
    autoEnabled,
    autoReadyForNextStep,
    wcReadyForNextStep,
    jardinReadyForNextStep,
    piscineReadyForNextStep,
    onProgressChange,
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Usages de l'eau</h2>
        <p className="mt-2 text-muted-foreground">Selectionnez les usages que vous souhaitez alimenter avec l'eau de pluie</p>
      </div>

      <div className="grid gap-6">
        <div
          ref={wcSectionRef}
          className={cn(
            "rounded-xl border-2 p-5 transition-all hover:border-primary/30",
            activeUsage === "wc" && "ring-2 ring-primary/70 bg-primary/5",
            isWcLocked && "pointer-events-none opacity-50"
          )}
        >
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
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setHasWcInteracted(true);
                          setIsWcStableForNextStep(false);
                          setValue("wcPersonnes", Math.max(1, wcPersonnes - 1));
                        }}
                        disabled={wcPersonnes <= 1}
                      >
                        -
                      </Button>
                      <div id="wcPersonnes" className="flex h-10 min-w-16 items-center justify-center rounded-md border bg-background px-4 font-semibold">
                        {wcPersonnes === 0 ? <Users className="h-4 w-4 text-muted-foreground" /> : wcPersonnes}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setHasWcInteracted(true);
                          setIsWcStableForNextStep(false);
                          setValue("wcPersonnes", Math.min(20, wcPersonnes + 1));
                        }}
                        disabled={wcPersonnes >= 20}
                      >
                        +
                      </Button>
                      <Button
                        type="button"
                        variant="hero"
                        onClick={() => {
                          setHasWcInteracted(true);
                          setIsWcStableForNextStep(true);
                        }}
                      >
                        Valider
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Base de calcul : {DEFAULT_WC_CONSUMPTION} L/jour/personne</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          ref={jardinSectionRef}
          className={cn(
            "rounded-xl border-2 p-5 transition-all hover:border-primary/30",
            activeUsage === "jardin" && "ring-2 ring-primary/70 bg-primary/5",
            isJardinLocked && "pointer-events-none opacity-50"
          )}
        >
          <div className="flex items-start gap-4">
            <Checkbox
              id="jardinEnabled"
              checked={jardinEnabled}
              onCheckedChange={(checked) => {
                setValue("jardinEnabled", !!checked);
                setIsJardinConfirmed(false);
              }}
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
                    <div className="flex max-w-[220px] items-center gap-2">
                      <div className="flex h-10 w-28 items-center justify-center rounded-md border border-input bg-background px-2">
                        <input
                          id="jardinSurface"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          className="w-10 border-0 bg-transparent p-0 text-right text-sm outline-none placeholder:text-muted-foreground [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          {...register("jardinSurface", {
                            valueAsNumber: true,
                            onChange: () => {
                              setHasJardinInteracted(true);
                              setIsJardinConfirmed(false);
                              setIsJardinStableForNextStep(false);
                            },
                          })}
                          onFocus={() => {
                            setHasJardinInteracted(true);
                            setIsJardinConfirmed(false);
                            setIsJardinStableForNextStep(false);
                            setValue("jardinSurface", undefined, { shouldValidate: true });
                          }}
                        />
                        <span className="ml-0.5 text-xs text-muted-foreground">m²</span>
                      </div>
                      <Button
                        type="button"
                        variant="hero"
                        size="icon"
                        disabled={!jardinDone}
                        onClick={() => {
                          setHasJardinInteracted(true);
                          setIsJardinConfirmed(true);
                          setIsJardinStableForNextStep(true);
                          window.setTimeout(() => {
                            scrollToWithHeaderOffset(piscineSectionRef.current);
                          }, 60);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Base : {DEFAULT_WATERING_LITERS} L/m²/semaine x {WATERING_WEEKS} semaines ( de mai à septembre)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          ref={piscineSectionRef}
          className={cn(
            "rounded-xl border-2 p-5 transition-all hover:border-primary/30",
            activeUsage === "piscine" && "ring-2 ring-primary/70 bg-primary/5",
            isPiscineLocked && "pointer-events-none opacity-50"
          )}
        >
          <div className="flex items-start gap-4">
            <Checkbox
              id="piscineEnabled"
              checked={piscineEnabled}
              onCheckedChange={(checked) => {
                setValue("piscineEnabled", !!checked);
                setIsPiscineConfirmed(false);
                setIsPiscineStableForNextStep(false);
                setHasPiscineInteracted(true);
              }}
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
                    <div className="flex max-w-[220px] items-center gap-2">
                      <div className="flex h-10 w-28 items-center justify-center rounded-md border border-input bg-background px-2">
                        <input
                          id="piscineSurface"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={200}
                          className="w-10 border-0 bg-transparent p-0 text-right text-sm outline-none placeholder:text-muted-foreground [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          {...register("piscineSurface", {
                            valueAsNumber: true,
                            onChange: () => {
                              setHasPiscineInteracted(true);
                              setIsPiscineConfirmed(false);
                              setIsPiscineStableForNextStep(false);
                            },
                          })}
                          onFocus={() => {
                            setHasPiscineInteracted(true);
                            setIsPiscineConfirmed(false);
                            setIsPiscineStableForNextStep(false);
                            setValue("piscineSurface", undefined, { shouldValidate: true });
                          }}
                        />
                        <span className="ml-0.5 text-xs text-muted-foreground">m²</span>
                      </div>
                      <Button
                        type="button"
                        variant="hero"
                        size="icon"
                        disabled={!piscineDone}
                        onClick={() => {
                          setIsPiscineConfirmed(true);
                          window.setTimeout(() => {
                            scrollToWithHeaderOffset(autoSectionRef.current);
                          }, 60);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Ex : piscine 8x4m = 32 m²</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Calcul : surface x {POOL_DEPTH}m (profondeur) x {POOL_APPOINT_PERCENT}% appoint/an
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          ref={autoSectionRef}
          className={cn(
            "rounded-xl border-2 p-5 transition-all hover:border-primary/30",
            activeUsage === "auto" && "ring-2 ring-primary/70 bg-primary/5",
            isAutoLocked && "pointer-events-none opacity-50"
          )}
        >
          <div className="flex items-start gap-4">
            <Checkbox
              id="autoEnabled"
              checked={autoEnabled}
              onCheckedChange={(checked) => {
                const isChecked = !!checked;
                setValue("autoEnabled", isChecked);
                setHasAutoInteracted(true);
              }}
              className="mt-1"
            />
            <div className="flex-1 space-y-4">
              <Label htmlFor="autoEnabled" className="flex cursor-pointer items-center gap-2 text-lg font-semibold">
                <Car className="h-5 w-5 text-muted-foreground" />
                Lavage voiture
              </Label>

              {autoEnabled && (
                <div className="space-y-3 animate-scale-in text-center">
                  <div className="space-y-2">
                    <Label htmlFor="autoLavages">Lavages par mois</Label>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setHasAutoInteracted(true);
                          setValue("autoLavagesMois", Math.max(1, (autoLavagesMois ?? DEFAULT_CAR_WASHES) - 1));
                        }}
                        disabled={(autoLavagesMois ?? DEFAULT_CAR_WASHES) <= 1}
                      >
                        -
                      </Button>
                      <div
                        id="autoLavages"
                        className="flex h-10 min-w-16 items-center justify-center rounded-md border bg-background px-4 font-semibold"
                      >
                        {autoLavagesMois ?? DEFAULT_CAR_WASHES}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setHasAutoInteracted(true);
                          setValue("autoLavagesMois", Math.min(30, (autoLavagesMois ?? DEFAULT_CAR_WASHES) + 1));
                        }}
                        disabled={(autoLavagesMois ?? DEFAULT_CAR_WASHES) >= 30}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Base de calcul : {DEFAULT_CAR_WASH_VOLUME} L par lavage</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
