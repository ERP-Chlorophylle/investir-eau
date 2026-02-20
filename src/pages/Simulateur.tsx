import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { scrollToElement } from "@/lib/scroll";
import { Stepper } from "@/components/Stepper";
import { Step1Location } from "@/components/simulation/Step1Location";
import { Step2Usages } from "@/components/simulation/Step2Usages";
import { Step3Financial } from "@/components/simulation/Step3Financial";
import { Step4Consent } from "@/components/simulation/Step4Consent";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  SimulationFormData,
} from "@/lib/validation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { SimulationResults } from "@/lib/calculations";

const STEPS = [
  { label: "Toiture" },
  { label: "Usages" },
  { label: "Finances" },
  { label: "Validation" },
];

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema);

export default function Simulateur() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isStep1AutoAdvanceEnabled, setIsStep1AutoAdvanceEnabled] = useState(true);
  const [currentStepFillPercent, setCurrentStepFillPercent] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), []);
  const handleTurnstileExpire = useCallback(() => setTurnstileToken(null), []);

  const methods = useForm<SimulationFormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      departement: "",
      surfaceToiture: 100,
      prixEau: 5,
      wcEnabled: true,
      wcPersonnes: 2,
      jardinEnabled: true,
      jardinSurface: 150,
      autoEnabled: false,
      autoLavagesMois: 2,
      piscineEnabled: true,
      piscineSurface: 32,
      newsletterOptIn: false,
    },
    mode: "onChange",
  });

  const { handleSubmit, trigger, getValues } = methods;
  const [surfaceToiture, typeToiture, rgpdConsent] = methods.watch(["surfaceToiture", "typeToiture", "rgpdConsent"]);

  const showPrevButton = currentStep > 1;
  const showNextButton = currentStep < 4 && (currentStep !== 1 || !isStep1AutoAdvanceEnabled);
  const showSubmitButton = currentStep === 4;
  const showNavigation = showPrevButton || showNextButton || showSubmitButton;

  useEffect(() => {
    if (currentStep !== 1) return;
    if (!isStep1AutoAdvanceEnabled) return;

    const isStep1Filled =
      typeof typeToiture === "string" &&
      typeToiture.length > 0 &&
      typeof surfaceToiture === "number" &&
      Number.isFinite(surfaceToiture) &&
      surfaceToiture >= 10 &&
      surfaceToiture <= 1000;

    if (!isStep1Filled) return;

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep, surfaceToiture, typeToiture, isStep1AutoAdvanceEnabled]);

  useEffect(() => {
    if (currentStep === 1 || currentStep === 2) {
      setCurrentStepFillPercent(0);
      return;
    }
    setCurrentStepFillPercent(70);
  }, [currentStep]);

  const validateCurrentStep = async () => {
    const fieldsToValidate: (keyof SimulationFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate.push("surfaceToiture", "typeToiture");
        break;
      case 2: {
        const values = getValues();
        if (values.wcEnabled) fieldsToValidate.push("wcPersonnes");
        if (values.jardinEnabled) fieldsToValidate.push("jardinSurface");
        if (values.autoEnabled) fieldsToValidate.push("autoLavagesMois");
        if (values.piscineEnabled) fieldsToValidate.push("piscineSurface");

        if (!values.wcEnabled && !values.jardinEnabled && !values.autoEnabled && !values.piscineEnabled) {
          toast({
            title: "Aucun usage selectionne",
            description: "Veuillez selectionner au moins un usage pour continuer.",
            variant: "destructive",
          });
          return false;
        }
        break;
      }
      case 3:
        fieldsToValidate.push("prixEau");
        break;
      case 4:
        fieldsToValidate.push("email", "rgpdConsent");
        break;
    }

    return trigger(fieldsToValidate);
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      if (currentStep === 2) {
        setIsStep1AutoAdvanceEnabled(false);
      }
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Scroll vers le bouton quand le consentement est coché
  useEffect(() => {
    if (rgpdConsent === true && currentStep === 4) {
      const timer = globalThis.setTimeout(() => {
        scrollToElement(submitButtonRef.current);
      }, 300);
      return () => globalThis.clearTimeout(timer);
    }
  }, [rgpdConsent, currentStep]);

  let rightActionButton: JSX.Element = <div />;

  if (showNextButton) {
    rightActionButton = (
      <Button type="button" variant="hero" onClick={handleNext}>
        Suivant
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    );
  } else if (showSubmitButton) {
    rightActionButton = (
      <Button
        ref={submitButtonRef}
        type="submit"
        variant="cta"
        className={rgpdConsent === true ? "animate-bounce-subtle ring-2 ring-primary/50 shadow-lg shadow-primary/25" : ""}
      >
        <Send className="mr-2 h-4 w-4" />
        Voir mon résultat
      </Button>
    );
  }

  const onSubmit = async (data: SimulationFormData) => {
    const { data: results, error: rpcError } = await supabase.rpc("calculate_water_simulation", {
      p_departement: data.departement,
      p_surface_toiture: data.surfaceToiture,
      p_type_toiture: data.typeToiture,
      p_wc_enabled: data.wcEnabled,
      p_wc_personnes: data.wcPersonnes,
      p_jardin_enabled: data.jardinEnabled,
      p_jardin_surface: data.jardinSurface,
      p_auto_enabled: data.autoEnabled,
      p_auto_lavages_mois: data.autoLavagesMois,
      p_piscine_enabled: data.piscineEnabled,
      p_piscine_surface: data.piscineSurface,
      p_prix_eau: data.prixEau,
      p_pluie_annuelle_commune: data.pluieAnnuelleCommune,
    });
    const typedResults = results as unknown as SimulationResults | null;

    if (rpcError || !typedResults) {
      console.error("Erreur calcul simulation:", rpcError);
      toast({
        title: "Erreur de calcul",
        description: "Une erreur est survenue lors de la simulation. Veuillez réessayer.",
        variant: "destructive",
      });
      return;
    }

    sessionStorage.setItem("simulationResults", JSON.stringify(typedResults));
    sessionStorage.setItem("simulationInputs", JSON.stringify(data));
    sessionStorage.setItem("simulationEmail", data.email);
    sessionStorage.setItem("simulationNewsletter", String(data.newsletterOptIn));

    navigate("/resultat");

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      fetch(`${supabaseUrl}/functions/v1/send-simulation-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          departement: data.departement,
          surfaceToiture: data.surfaceToiture,
          typeToiture: data.typeToiture,
          usages: {
            wc: data.wcEnabled,
            wcPersonnes: data.wcPersonnes,
            jardin: data.jardinEnabled,
            jardinSurface: data.jardinSurface,
            auto: data.autoEnabled,
            autoLavagesMois: data.autoLavagesMois,
            piscine: data.piscineEnabled,
            piscineSurface: data.piscineSurface,
          },
          prixEau: data.prixEau,
          pluieAnnuelleCommune: data.pluieAnnuelleCommune,
          vSupply: typedResults.vSupply,
          vDemand: typedResults.vDemand,
          options: typedResults.options,
          comparisons: typedResults.comparisons,
          turnstileToken,
        }),
      }).catch((err) => console.error("Erreur envoi email simulation:", err));
    } catch (err) {
      console.error("Erreur envoi email simulation:", err);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />

      <main className={cn("flex-1 md:py-12", currentStep === 1 ? "py-3" : "py-8")}>
        <div className="container-app">
          <div className="mx-auto max-w-3xl">
            <div className={cn("sticky top-16 z-40 rounded-xl border bg-background/95 p-2 backdrop-blur", currentStep === 1 ? "mb-4" : "mb-10")}>
              <Stepper currentStep={currentStep} steps={STEPS} currentStepFillPercent={currentStepFillPercent} />
            </div>

            <div className={cn("rounded-2xl border bg-card shadow-lg md:p-10", currentStep === 1 ? "p-4" : "p-6")}>
              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                  {currentStep === 1 && <Step1Location onProgressChange={setCurrentStepFillPercent} />}
                  {currentStep === 2 && <Step2Usages onProgressChange={setCurrentStepFillPercent} />}
                  {currentStep === 3 && <Step3Financial />}
                  {currentStep === 4 && (
                    <>
                      <Step4Consent />
                      <TurnstileWidget
                        onVerify={handleTurnstileVerify}
                        onExpire={handleTurnstileExpire}
                      />
                    </>
                  )}

                  {showNavigation && (
                    <div className="mt-10 flex items-center justify-between border-t pt-6">
                      {showPrevButton ? (
                        <Button type="button" variant="outline" onClick={handlePrev}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Precedent
                        </Button>
                      ) : (
                        <div />
                      )}

                      {rightActionButton}
                    </div>
                  )}
                </form>
              </FormProvider>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
