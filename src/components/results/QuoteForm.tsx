import { useState } from "react";
import { Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface QuoteFormProps {
  email: string;
}

export function QuoteForm({ email }: QuoteFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send data to the backend
    console.log("Quote request:", { email, phone, comment });
    setIsSubmitted(true);
    toast({
      title: "Demande envoyée !",
      description: "Nous vous recontacterons dans les meilleurs délais.",
    });
  };

  if (isSubmitted) {
    return (
      <div className="rounded-xl border-2 border-accent bg-eco-light p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
          <Check className="h-6 w-6 text-accent-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Demande envoyée !</h3>
        <p className="mt-2 text-muted-foreground">
          Notre équipe vous recontactera dans les meilleurs délais.
        </p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="text-center">
        <Button onClick={() => setIsOpen(true)} variant="gold" size="lg">
          <Send className="mr-2 h-5 w-5" />
          Demander un devis
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-4">
      <h3 className="text-lg font-semibold">Demander un devis personnalisé</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quote-email">Email</Label>
          <Input id="quote-email" type="email" value={email} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quote-phone">Téléphone (optionnel)</Label>
          <Input
            id="quote-phone"
            type="tel"
            placeholder="06 12 34 56 78"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quote-comment">Commentaire (optionnel)</Label>
        <Textarea
          id="quote-comment"
          placeholder="Précisez vos besoins ou questions..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
          Annuler
        </Button>
        <Button type="submit" variant="cta">
          <Send className="mr-2 h-4 w-4" />
          Envoyer ma demande
        </Button>
      </div>
    </form>
  );
}
