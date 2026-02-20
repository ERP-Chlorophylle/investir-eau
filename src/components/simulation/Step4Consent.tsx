import { useFormContext } from "react-hook-form";
import { useRef, useEffect, useState } from "react";
import { Mail, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SimulationFormData } from "@/lib/validation";
import { Link } from "react-router-dom";
import { scrollToElement } from "@/lib/scroll";

export function Step4Consent() {
  const {
    register,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<SimulationFormData>();

  const rgpdConsent = watch("rgpdConsent");
  const emailValue = watch("email");

  const consentRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToConsent, setHasScrolledToConsent] = useState(false);

  // Email valide = format correct et au moins 5 caractères
  const isEmailValid =
    typeof emailValue === "string" &&
    emailValue.length >= 5 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

  // Auto-scroll vers la zone de consentement quand l'email est validé
  useEffect(() => {
    if (isEmailValid && !hasScrolledToConsent && !rgpdConsent) {
      const timer = globalThis.setTimeout(() => {
        scrollToElement(consentRef.current);
        setHasScrolledToConsent(true);
      }, 400);
      return () => globalThis.clearTimeout(timer);
    }
  }, [isEmailValid, hasScrolledToConsent, rgpdConsent]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Recevez notre comparatif</h2>
        <p className="mt-2 text-muted-foreground">
          merci d'indiquer votre e-mail :
        </p>
      </div>

      <div className="mx-auto max-w-lg space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Adresse email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="votre@email.fr"
            {...register("email")}
          />
          {errors.email && emailValue?.trim().length > 0 && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* RGPD + Newsletter combined */}
        <div
          ref={consentRef}
          className={`rounded-xl border-2 p-5 transition-all duration-300 ${
            isEmailValid && !rgpdConsent
              ? "ring-2 ring-primary/70 bg-primary/5 border-primary/40"
              : ""
          }`}
        >
          <div className="flex items-start gap-4">
            <Checkbox
              id="rgpdConsent"
              checked={rgpdConsent === true}
              onCheckedChange={(checked) => {
                setValue("rgpdConsent", checked === true ? true : (undefined as never));
                setValue("newsletterOptIn", checked === true);
                if (checked === true) {
                  clearErrors("rgpdConsent");
                }
              }}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label
                htmlFor="rgpdConsent"
                className="flex cursor-pointer items-center gap-2 font-semibold"
              >
                <Shield className="h-4 w-4 text-accent" />
                Consentement & Newsletter
                <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                J'accepte la{" "}
                <Link
                  to="/politique-confidentialite"
                  className="text-primary underline hover:no-underline"
                  target="_blank"
                >
                  politique de confidentialité
                </Link>
                {" "}et je souhaite recevoir des conseils et actualités sur la récupération d'eau de pluie. Mes données seront utilisées uniquement par Les Jeunes Pousses.
              </p>
            </div>
          </div>
          {errors.rgpdConsent && (
            <p className="mt-2 text-sm text-destructive">{errors.rgpdConsent.message}</p>
          )}
        </div>

        {/* Info box */}
        <div className="rounded-lg bg-water-light p-4 text-sm">
          <p className="font-medium text-foreground">Que se passe-t-il ensuite ?</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>✓ Visualisez notre rapport de simulation d'investissement</li>
            <li>✓ Vos données sont enregistrées chez Les Jeunes Pousses</li>
            <li>✓ Aucun engagement de votre part</li>
            <li>✓ Possibilité de demander un devis personnalisé</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
