import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
const STEPS = [
  { label: "Localisation" },
  { label: "Usages" },
  { label: "Finances" },
  { label: "Validation" },
];

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema);

export default function Simulateur() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  const methods = useForm<SimulationFormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      prixEau: 5,
      wcEnabled: true,
      wcPersonnes: 2,
      jardinEnabled: true,
      jardinSurface: 150,
      autoEnabled: true,
      autoLavagesMois: 2,
      piscineEnabled: true,
      piscineSurface: 32,
      newsletterOptIn: false,
    },
    mode: "onChange",
  });

  const { handleSubmit, trigger, getValues } = methods;

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof SimulationFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["departement", "surfaceToiture", "typeToiture"];
        break;
      case 2:
        // Validate usage fields based on what's enabled
        const values = getValues();
        if (values.wcEnabled) fieldsToValidate.push("wcPersonnes");
        if (values.jardinEnabled) fieldsToValidate.push("jardinSurface");
        if (values.autoEnabled) fieldsToValidate.push("autoLavagesMois");
        if (values.piscineEnabled) fieldsToValidate.push("piscineSurface");
        // At least one usage must be enabled
        if (!values.wcEnabled && !values.jardinEnabled && !values.autoEnabled && !values.piscineEnabled) {
          toast({
            title: "Aucun usage sélectionné",
            description: "Veuillez sélectionner au moins un usage pour continuer.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 3:
        fieldsToValidate = ["prixEau"];
        break;
      case 4:
        fieldsToValidate = ["email", "rgpdConsent"];
        break;
    }

    const result = await trigger(fieldsToValidate as any);
    return result;
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
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onSubmit = async (data: SimulationFormData) => {
    const inputs: SimulationInputs = {
      departement: data.departement,
      surfaceToiture: data.surfaceToiture,
      typeToiture: data.typeToiture,

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

    // Store results and navigate
    sessionStorage.setItem("simulationResults", JSON.stringify(results));
    sessionStorage.setItem("simulationInputs", JSON.stringify(inputs));
    sessionStorage.setItem("simulationEmail", data.email);
    sessionStorage.setItem("simulationNewsletter", String(data.newsletterOptIn));

    // Send email notification (non-blocking)
    if (supabase) {
      const confortOption = results.options.find(o => o.type === 'confort');
      const confortComparison = results.comparisons.find(c => c.optionType === 'confort');
      const economiesAnnuelles = confortComparison ? confortComparison.economiesCumulees / 10 : 0;
      
      supabase.functions.invoke('send-simulation-notification', {
        body: {
          email: data.email,
          newsletter: data.newsletterOptIn,
          departement: data.departement,
          surfaceToiture: data.surfaceToiture,
          typeToiture: data.typeToiture,
          usages: {
            wc: data.wcEnabled ? data.wcPersonnes : null,
            jardin: data.jardinEnabled ? data.jardinSurface : null,
            auto: data.autoEnabled ? data.autoLavagesMois : null,
            piscine: data.piscineEnabled ? data.piscineSurface : null,
          },
          prixEau: data.prixEau,
          resultats: {
            potentiel: results.vSupply / 1000,
            besoin: results.vDemand / 1000,
            cuveConfort: confortOption?.volumeCuveArrondi || 0,
            economiesAnnuelles: economiesAnnuelles,
          }
        }
      }).then(({ error }) => {
        if (error) {
          console.error('Erreur envoi notification simulation:', error);
        } else {
          console.log('Notification simulation envoyée');
        }
      }).catch(err => {
        console.error('Erreur envoi notification simulation:', err);
      });
    }

    navigate("/resultat");
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container-app">
          <div className="mx-auto max-w-3xl">
            {/* Stepper */}
            <div className="mb-10">
              <Stepper currentStep={currentStep} steps={STEPS} />
            </div>

            {/* Form */}
            <div className="rounded-2xl border bg-card p-6 shadow-lg md:p-10">
              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                  {currentStep === 1 && <Step1Location />}
                  {currentStep === 2 && <Step2Usages />}
                  {currentStep === 3 && <Step3Financial />}
                  {currentStep === 4 && <Step4Consent />}

                  {/* Navigation */}
                  <div className="mt-10 flex items-center justify-between border-t pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrev}
                      disabled={currentStep === 1}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Précédent
                    </Button>

                    {currentStep < 4 ? (
                      <Button type="button" variant="hero" onClick={handleNext}>
                        Suivant
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="submit" variant="cta">
                        <Send className="mr-2 h-4 w-4" />
                        Voir mon résultat
                      </Button>
                    )}
                  </div>
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
