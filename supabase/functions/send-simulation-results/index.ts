import { serve } from "std/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER_EMAIL = "info@lesjeunespousses.net";
const SENDER_NAME = "Les Jeunes Pousses";
const ADMIN_EMAILS = ["info@lesjeunespousses.net", "waterlife@lesjeunespousses.net"];

type Livret = { id: string; name: string; valeurFuture: number; ecart: number };
type Option = {
  type: string;
  label: string;
  volumeCuveM3: number;
  cout: number | null;
  surDevis?: boolean;
  couvertureReelle: number;
  volumeAnnuelCouvert: number;
};
type Comparison = {
  optionType: string;
  economiesCumulees: number;
  coutCuve: number | null;
  capitalReference?: number;
  livrets?: Livret[];
};
interface SimulationPayload {
  email: string;
  departement: string;
  surfaceToiture: number;
  typeToiture: string;
  usages: {
    wc: boolean;
    wcPersonnes?: number;
    jardin: boolean;
    jardinSurface?: number;
    auto: boolean;
    autoLavagesMois?: number;
    piscine: boolean;
    piscineSurface?: number;
  };
  prixEau: number;
  vSupply: number;
  vDemand: number;
  options: Option[];
  comparisons: Comparison[];
}

type Medal = { rank: 1 | 2 | 3; label: string };

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function optionTitle(optionType: string): string {
  if (optionType === "eco") return "Essentiel";
  if (optionType === "confort") return "Confort";
  return "Serenite +";
}

function livretAGain(comp: Comparison): number | null {
  const livretA = comp.livrets?.find((l) => l.id === "livretA");
  if (!livretA) return null;
  const capitalReference =
    typeof comp.capitalReference === "number" && Number.isFinite(comp.capitalReference)
      ? comp.capitalReference
      : comp.coutCuve ?? 29500;
  return livretA.valeurFuture - capitalReference;
}

function computeRanksAndMedals(data: SimulationPayload): {
  recommended: string | null;
  rankByType: Record<string, number>;
  medalsByType: Record<string, Medal[]>;
} {
  const investment = data.comparisons
    .map((c) => {
      const lA = livretAGain(c);
      if (lA === null) return null;
      return { type: c.optionType, spread: c.economiesCumulees - lA };
    })
    .filter((v): v is { type: string; spread: number } => v !== null)
    .sort((a, b) => b.spread - a.spread);

  const recommended = investment.length > 0 && investment[0].spread > 0 ? investment[0].type : null;

  const usage = data.options
    .filter((o) => o.type === "eco" || o.type === "confort")
    .map((o) => ({ type: o.type, coverage: Number.isFinite(o.couvertureReelle) ? o.couvertureReelle : 0, cost: typeof o.cout === "number" ? o.cout : Number.POSITIVE_INFINITY }))
    .sort((a, b) => (b.coverage !== a.coverage ? b.coverage - a.coverage : a.cost - b.cost));

  const medalsByType: Record<string, Medal[]> = {};
  const push = (type: string | null, medal: Medal) => {
    if (!type) return;
    if (!medalsByType[type]) medalsByType[type] = [];
    medalsByType[type].push(medal);
  };

  push(recommended, { rank: 1, label: "Meilleur investissement" });
  push(usage[0]?.type ?? null, { rank: 2, label: "Meilleur usage" });
  push(data.options.find((o) => o.type === "extra")?.type ?? null, { rank: 3, label: "Meilleure resilience" });

  const rankByType: Record<string, number> = {};
  investment.forEach((e, i) => {
    rankByType[e.type] = i + 1;
  });
  data.options.forEach((o, i) => {
    if (!rankByType[o.type]) rankByType[o.type] = investment.length + i + 1;
  });

  return { recommended, rankByType, medalsByType };
}

function buildClientEmail(data: SimulationPayload): string {
  const usages: string[] = [];
  if (data.usages.wc) usages.push(`WC (${data.usages.wcPersonnes} pers.)`);
  if (data.usages.jardin) usages.push(`Jardin (${data.usages.jardinSurface} m2)`);
  if (data.usages.auto) usages.push(`Lavage auto (${data.usages.autoLavagesMois}x/mois)`);
  if (data.usages.piscine) usages.push(`Piscine (${data.usages.piscineSurface} m2)`);

  const { recommended, rankByType, medalsByType } = computeRanksAndMedals(data);

  const optionsHtml = data.options
    .map((o) => {
      const title = optionTitle(o.type);
      const border = o.type === "eco" ? "#8ad4a2" : o.type === "confort" ? "#7ec6f5" : "#d6b3f5";
      const bg = o.type === "eco" ? "#f3fbf5" : o.type === "confort" ? "#f3f9ff" : "#faf6ff";
      const badge = recommended === o.type
        ? `<div style="display:inline-block;margin-bottom:8px;padding:4px 10px;border-radius:999px;background:#0b73b8;color:#fff;font-size:11px;font-weight:700;">Recommande</div>`
        : "";
      const price = o.cout ? `${formatNumber(o.cout)} EUR TTC` : "Sur devis";
      const rank = rankByType[o.type] ?? "-";
      const medals = (medalsByType[o.type] ?? [])
        .map((m) => `${m.rank === 1 ? "🥇" : m.rank === 2 ? "🥈" : "🥉"} ${m.label}`)
        .map((m) => `<div style="margin-top:6px;padding:4px 8px;border:1px solid #d6e2db;border-radius:999px;background:#fff;font-size:11px;font-weight:600;color:#2d5a3d;white-space:nowrap;">${m}</div>`)
        .join("");

      return `
      <div style="margin-bottom:12px;border:1px solid ${border};background:${bg};border-radius:12px;padding:12px;">
        ${badge}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td valign="top" style="padding-right:8px;">
              <div style="font-size:17px;font-weight:700;color:#1f2937;margin-bottom:4px;">${title}</div>
              <div style="font-size:14px;color:#374151;margin-bottom:2px;"><strong>${formatNumber(o.volumeCuveM3 * 1000)} L</strong></div>
              <div style="font-size:14px;color:#374151;margin-bottom:2px;">Couverture des besoins : <strong>${o.couvertureReelle}%</strong></div>
              <div style="font-size:14px;color:#374151;margin-bottom:6px;">${(o.volumeAnnuelCouvert / 1000).toFixed(1)} m3/an economises</div>
              <div style="font-size:15px;font-weight:700;color:#111827;">Investissement : ${price}</div>
            </td>
            <td valign="top" align="right" style="width:1%;white-space:nowrap;">
              <div style="display:inline-block;padding:4px 8px;border-radius:999px;background:#e9f3ee;color:#2d5a3d;font-size:11px;font-weight:700;">Classement #${rank}</div>
              ${medals}
            </td>
          </tr>
        </table>
      </div>`;
    })
    .join("");

  const comparisonsHtml = data.comparisons
    .map((c) => {
      const label = optionTitle(c.optionType);
      const ga = livretAGain(c);
      const txt = ga === null ? "Gain vs Livret A : non disponible" : `Gain vs Livret A : ${ga >= 0 ? "+" : "-"}${formatNumber(Math.abs(ga))} EUR`;
      return `<li style="margin-bottom:8px;"><strong>${label}</strong> : ${formatNumber(c.economiesCumulees)} EUR d'economies sur 10 ans<br><span style="color:#2d5a3d;">${txt}</span></li>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8faf8;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr><td align="center" bgcolor="#2d5a3d" style="padding:30px;background-color:#2d5a3d;background-image:linear-gradient(135deg,#2d5a3d,#3a7a52);">
        <div style="font-size:24px;font-weight:700;line-height:1.25;color:#fff;">Vos resultats de simulation</div>
        <div style="margin-top:8px;font-size:14px;line-height:1.3;color:#c8e6c9;">Recuperation d'eau de pluie</div>
      </td></tr>
    </table>

    <div style="padding:24px;">
      <h2 style="color:#2d5a3d;font-size:18px;margin-top:0;">Votre configuration</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:6px 0;color:#666;">Departement</td><td style="padding:6px 0;font-weight:600;">${data.departement}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Surface toiture</td><td style="padding:6px 0;font-weight:600;">${data.surfaceToiture} m2</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Prix de l'eau</td><td style="padding:6px 0;font-weight:600;">${data.prixEau} EUR/m3</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Usages</td><td style="padding:6px 0;font-weight:600;">${usages.join(", ")}</td></tr>
      </table>

      <div style="background:#e8f5e9;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;color:#666;font-size:13px;">Potentiel recuperable</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#2d5a3d;">${(data.vSupply / 1000).toFixed(1)} m3/an</p>
        <p style="margin:8px 0 0;color:#666;font-size:13px;">Besoin annuel : <strong>${(data.vDemand / 1000).toFixed(1)} m3/an</strong></p>
      </div>

      <h2 style="color:#2d5a3d;font-size:18px;">Options de cuves recommandees</h2>
      <div style="margin-bottom:20px;">${optionsHtml}</div>

      <h2 style="color:#2d5a3d;font-size:18px;">Economies estimees (10 ans)</h2>
      <ul style="padding-left:20px;color:#333;">${comparisonsHtml}</ul>

      <div style="text-align:center;margin-top:24px;"><p style="color:#666;font-size:13px;">Des questions ? Contactez-nous pour un devis personnalise.</p></div>
    </div>

    <div style="background:#f0f7f0;padding:16px;text-align:center;font-size:12px;color:#888;">Les Jeunes Pousses - Recuperation d'eau de pluie</div>
  </div>
</body></html>`;
}

function buildAdminEmail(data: SimulationPayload): string {
  const usages: string[] = [];
  if (data.usages.wc) usages.push(`WC (${data.usages.wcPersonnes} pers.)`);
  if (data.usages.jardin) usages.push(`Jardin (${data.usages.jardinSurface} m2)`);
  if (data.usages.auto) usages.push(`Lavage auto (${data.usages.autoLavagesMois}x/mois)`);
  if (data.usages.piscine) usages.push(`Piscine (${data.usages.piscineSurface} m2)`);

  const optionsText = data.options.map((o) => `- ${o.label} : ${o.volumeCuveM3} m3 - ${o.cout ? formatNumber(o.cout) + " EUR" : "Sur devis"} - Couverture ${o.couvertureReelle}%`).join("<br>");
  const comparisonsText = data.comparisons.map((c) => {
    const l = optionTitle(c.optionType);
    const g = livretAGain(c);
    const t = g === null ? "Gain vs Livret A non disponible" : `Gain vs Livret A ${g >= 0 ? "+" : "-"}${formatNumber(Math.abs(g))} EUR`;
    return `- ${l} : ${formatNumber(c.economiesCumulees)} EUR d'economies - ${t}`;
  }).join("<br>");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;padding:20px;">
  <h1 style="color:#2d5a3d;">Nouvelle simulation</h1>
  <table style="border-collapse:collapse;width:100%;max-width:500px;">
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Email</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.email}</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Departement</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.departement}</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Surface toiture</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.surfaceToiture} m2</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Type toiture</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.typeToiture}</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Prix eau</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.prixEau} EUR/m3</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Usages</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${usages.join(", ")}</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Potentiel</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${(data.vSupply / 1000).toFixed(1)} m3/an</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Besoin</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${(data.vDemand / 1000).toFixed(1)} m3/an</td></tr>
  </table>
  <h2 style="color:#2d5a3d;margin-top:20px;">Options</h2>
  <p>${optionsText}</p>
  <h2 style="color:#2d5a3d;">Economies (10 ans)</h2>
  <p>${comparisonsText}</p>
</body></html>`;
}

async function sendBrevoEmail(apiKey: string, to: { email: string; name?: string }[], subject: string, htmlContent: string) {
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to,
      subject,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Brevo API error (${res.status}): ${errorText}`);
  }

  return res.json();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("BREVO_API_KEY");
    if (!apiKey) throw new Error("BREVO_API_KEY not configured");

    const data: SimulationPayload = await req.json();

    await sendBrevoEmail(
      apiKey,
      [{ email: data.email }],
      "Vos resultats de simulation - Les Jeunes Pousses",
      buildClientEmail(data)
    );

    await sendBrevoEmail(
      apiKey,
      ADMIN_EMAILS.map((e) => ({ email: e })),
      `Nouvelle simulation - ${data.departement} - ${data.email}`,
      buildAdminEmail(data)
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-simulation-results:", error);
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
