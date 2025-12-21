import { useFormContext } from "react-hook-form";
import { Mail, Shield, Newspaper } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SimulationFormData } from "@/lib/validation";
import { Link } from "react-router-dom";

export function Step4Consent() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SimulationFormData>();

  const rgpdConsent = watch("rgpdConsent");
  const newsletterOptIn = watch("newsletterOptIn");

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Vos coordonnées</h2>
        <p className="mt-2 text-muted-foreground">
          Recevez votre rapport personnalisé par email
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
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* RGPD consent */}
        <div className="rounded-xl border-2 p-5">
          <div className="flex items-start gap-4">
            <Checkbox
              id="rgpdConsent"
              checked={rgpdConsent === true}
              onCheckedChange={(checked) => setValue("rgpdConsent", checked === true ? true : undefined as any)}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label
                htmlFor="rgpdConsent"
                className="flex cursor-pointer items-center gap-2 font-semibold"
              >
                <Shield className="h-4 w-4 text-accent" />
                Consentement RGPD
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
                . Mes données seront utilisées uniquement pour traiter ma demande.
              </p>
            </div>
          </div>
          {errors.rgpdConsent && (
            <p className="mt-2 text-sm text-destructive">{errors.rgpdConsent.message}</p>
          )}
        </div>

        {/* Newsletter */}
        <div className="rounded-xl border bg-muted/30 p-5">
          <div className="flex items-start gap-4">
            <Checkbox
              id="newsletterOptIn"
              checked={newsletterOptIn}
              onCheckedChange={(checked) => setValue("newsletterOptIn", !!checked)}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label
                htmlFor="newsletterOptIn"
                className="flex cursor-pointer items-center gap-2 font-semibold"
              >
                <Newspaper className="h-4 w-4 text-muted-foreground" />
                Newsletter (optionnel)
              </Label>
              <p className="text-sm text-muted-foreground">
                Je souhaite recevoir des conseils et actualités sur la récupération d'eau de pluie
              </p>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-lg bg-water-light p-4 text-sm">
          <p className="font-medium text-foreground">Que se passe-t-il ensuite ?</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>✓ Vous recevez votre rapport détaillé par email</li>
            <li>✓ Aucun engagement de votre part</li>
            <li>✓ Possibilité de demander un devis personnalisé</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
