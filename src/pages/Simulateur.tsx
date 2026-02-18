import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
import { calculateSimulation, SimulationInputs } from "@/lib/calculations";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();
  const { toast } = useToast();

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
  const [surfaceToiture, typeToiture] = methods.watch(["surfaceToiture", "typeToiture"]);

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

    return trigger(fieldsToValidate as any);
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

  const onSubmit = async (data: SimulationFormData) => {
    const inputs: SimulationInputs = {
      departement: data.departement,
      surfaceToiture: data.surfaceToiture,
      typeToiture: data.typeToiture,
      pluieAnnuelleCommune: data.pluieAnnuelleCommune,
      wcEnabled: data.wcEnabled,
      wcPersonnes: data.wcPersonnes,
      jardinEnabled: data.jardinEnabled,
      jardinSurface: data.jardinSurface,
      autoEnabled: data.autoEnabled,
      autoLavagesMois: data.autoLavagesMois,
      piscineEnabled: data.piscineEnabled,
      piscineSurface: data.piscineSurface,
      prixEau: data.prixEau,
    };

    const results = calculateSimulation(inputs);

    sessionStorage.setItem("simulationResults", JSON.stringify(results));
    sessionStorage.setItem("simulationInputs", JSON.stringify(inputs));
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
          departement: inputs.departement,
          surfaceToiture: inputs.surfaceToiture,
          typeToiture: inputs.typeToiture,
          usages: {
            wc: inputs.wcEnabled,
            wcPersonnes: inputs.wcPersonnes,
            jardin: inputs.jardinEnabled,
            jardinSurface: inputs.jardinSurface,
            auto: inputs.autoEnabled,
            autoLavagesMois: inputs.autoLavagesMois,
            piscine: inputs.piscineEnabled,
            piscineSurface: inputs.piscineSurface,
          },
          prixEau: inputs.prixEau,
          pluieAnnuelleCommune: inputs.pluieAnnuelleCommune,
          vSupply: results.vSupply,
          vDemand: results.vDemand,
          options: results.options.map((o) => ({
            type: o.type,
            label: o.label,
            volumeCuveM3: o.volumeCuveM3,
            cout: o.cout,
            couvertureReelle: o.couvertureReelle,
            volumeAnnuelCouvert: o.volumeAnnuelCouvert,
          })),
          comparisons: results.comparisons.map((c) => ({
            optionType: c.optionType,
            economiesCumulees: c.economiesCumulees,
            coutCuve: c.coutCuve,
            livrets: c.livrets.map((livret) => ({
              id: livret.id,
              name: livret.name,
              valeurFuture: livret.valeurFuture,
              ecart: livret.ecart,
            })),
          })),
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
                  {currentStep === 4 && <Step4Consent />}

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

                      {showNextButton ? (
                        <Button type="button" variant="hero" onClick={handleNext}>
                          Suivant
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : showSubmitButton ? (
                        <Button type="submit" variant="cta">
                          <Send className="mr-2 h-4 w-4" />
                          Voir mon resultat
                        </Button>
                      ) : (
                        <div />
                      )}
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
