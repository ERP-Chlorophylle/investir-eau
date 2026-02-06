import { Cat, GlassWater, ShowerHead, MessageCircle } from "lucide-react";

interface FunMetricsProps {
  volumeAnnuelCouvertLitres: number;
  horizonAnnees: number;
}

// Fun equivalence constants
const CAT_DAILY_WATER_L = 0.2; // 200ml/day
const PASTIS_VOLUME_L = 0.25; // 25cl with water
const GPT_REQUEST_WATER_L = 0.5; // ~0.5L cooling per request
const TEEN_SHOWER_DAILY_L = 60; // "reasonable" teen shower

export function FunMetrics({ volumeAnnuelCouvertLitres, horizonAnnees }: FunMetricsProps) {
  const totalLitres = volumeAnnuelCouvertLitres * horizonAnnees;

  const cats = Math.round(totalLitres / (CAT_DAILY_WATER_L * 365));
  const pastis = Math.round(totalLitres / PASTIS_VOLUME_L);
  const gptRequests = Math.round(totalLitres / GPT_REQUEST_WATER_L);
  const teenShowerYears = (totalLitres / (TEEN_SHOWER_DAILY_L * 365)).toFixed(1);

  const metrics = [
    {
      icon: Cat,
      value: cats.toLocaleString("fr-FR"),
      label: `chat${cats > 1 ? "s" : ""} abreuvé${cats > 1 ? "s" : ""} pendant 1 an`,
      emoji: "🐱",
    },
    {
      icon: GlassWater,
      value: pastis.toLocaleString("fr-FR"),
      label: "pastis bien frais",
      emoji: "🍹",
    },
    {
      icon: MessageCircle,
      value: gptRequests.toLocaleString("fr-FR"),
      label: "requêtes ChatGPT",
      emoji: "🤖",
    },
    {
      icon: ShowerHead,
      value: teenShowerYears,
      label: "an(s) de douches pour un ado raisonnable",
      emoji: "🚿",
    },
  ];

  return (
    <div className="rounded-xl border bg-card p-6">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        En équivalent, sur {horizonAnnees} ans c'est…
      </h4>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex flex-col items-center rounded-lg bg-muted/40 p-4 text-center"
          >
            <span className="text-2xl mb-1">{metric.emoji}</span>
            <p className="text-xl font-bold text-foreground">{metric.value}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-tight">{metric.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
