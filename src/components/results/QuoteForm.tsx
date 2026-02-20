import { useCallback, useState } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { Send, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
interface QuoteFormProps {
  email: string;
  selectedOption?: string;
  economiesCumulees?: number;
  coutCuve?: number | null;
  departement?: string;
  surfaceToiture?: number;
}
export function QuoteForm({
  email,
  selectedOption,
  economiesCumulees,
  coutCuve,
  departement,
  surfaceToiture,
}: QuoteFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), []);
  const handleTurnstileExpire = useCallback(() => setTurnstileToken(null), []);
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/send-quote-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          comment,
          selectedOption: selectedOption || "confort",
          economiesCumulees: economiesCumulees || 0,
          coutCuve: coutCuve ?? null,
          departement: departement || "",
          surfaceToiture: surfaceToiture || 0,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur serveur");
      }

      setIsSubmitted(true);
      toast({
        title: "Demande envoyée !",
        description: "Nous vous recontacterons dans les meilleurs délais."
      });
    } catch (error) {
      console.error('Erreur demande de devis:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  if (isSubmitted) {
    return <div className="rounded-xl border-2 border-accent bg-eco-light p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
          <Check className="h-6 w-6 text-accent-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Demande envoyée !</h3>
        <p className="mt-2 text-muted-foreground">
          Notre équipe vous recontactera dans les meilleurs délais.
        </p>
      </div>;
  }
  if (!isOpen) {
    return <div className="text-center my-[80px]">
        <Button onClick={() => setIsOpen(true)} variant="gold" size="lg">
          <Send className="mr-2 h-5 w-5" />
          Demander un devis
        </Button>
      </div>;
  }
  return <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-4">
      <h3 className="text-lg font-semibold">Demander un devis personnalisé</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quote-email">Email</Label>
          <Input id="quote-email" type="email" value={email} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quote-phone">Téléphone (optionnel)</Label>
          <Input id="quote-phone" type="tel" placeholder="06 12 34 56 78" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quote-comment">Commentaire (optionnel)</Label>
        <Textarea id="quote-comment" placeholder="Précisez vos besoins ou questions..." value={comment} onChange={e => setComment(e.target.value)} rows={3} />
      </div>

      <TurnstileWidget
        onVerify={handleTurnstileVerify}
        onExpire={handleTurnstileExpire}
      />

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" variant="cta" disabled={isLoading}>
          {isLoading ? <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </> : <>
              <Send className="mr-2 h-4 w-4" />
              Envoyer ma demande
            </>}
        </Button>
      </div>
    </form>;
}