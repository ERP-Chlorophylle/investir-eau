interface FunMetricsProps {
  volumeAnnuelCouvertLitres: number;
}

// Fun equivalence constants (all based on ANNUAL volume)
const CAT_DAILY_WATER_L = 0.2; // 200ml/day
const PASTIS_VOLUME_L = 0.25; // 25cl with water
const GPT_REQUEST_WATER_L = 0.5; // ~0.5L cooling per request
const TEEN_SHOWER_DAILY_L = 60; // "reasonable" teen shower

export function FunMetrics({ volumeAnnuelCouvertLitres }: FunMetricsProps) {
  const annualLitres = volumeAnnuelCouvertLitres;

  const cats = Math.round(annualLitres / (CAT_DAILY_WATER_L * 365));
  const pastis = Math.round(annualLitres / PASTIS_VOLUME_L);
  const gptRequests = Math.round(annualLitres / GPT_REQUEST_WATER_L);
  const teenShowerDays = Math.round(annualLitres / TEEN_SHOWER_DAILY_L);

  const metrics = [
    {
      value: cats.toLocaleString("fr-FR"),
      label: `chat${cats > 1 ? "s" : ""} abreuvé${cats > 1 ? "s" : ""} pendant 1 an`,
      emoji: "🐱",
    },
    {
      value: pastis.toLocaleString("fr-FR"),
      label: "pastis bien frais",
      emoji: "🍹",
    },
    {
      value: gptRequests.toLocaleString("fr-FR"),
      label: "requêtes ChatGPT",
      emoji: "🤖",
    },
    {
      value: teenShowerDays.toLocaleString("fr-FR"),
      label: `jour${teenShowerDays > 1 ? "s" : ""} de douches pour un ado raisonnable`,
      emoji: "🚿",
    },
  ];

  return (
    <div className="rounded-xl border bg-card p-6">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Chaque année, vos économies d'eau c'est…
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
