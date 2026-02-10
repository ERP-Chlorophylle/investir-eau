import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER_EMAIL = "info@lesjeunespousses.net";
const SENDER_NAME = "Les Jeunes Pousses";
const ADMIN_EMAILS = [
  "info@lesjeunespousses.net",
  "waterlife@lesjeunespousses.net",
];

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
  options: {
    type: string;
    label: string;
    volumeCuveM3: number;
    cout: number | null;
    couvertureReelle: number;
    volumeAnnuelCouvert: number;
  }[];
  comparisons: {
    optionType: string;
    economiesCumulees: number;
    coutCuve: number | null;
  }[];
}

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function buildClientEmail(data: SimulationPayload): string {
  const usagesList: string[] = [];
  if (data.usages.wc) usagesList.push(`WC (${data.usages.wcPersonnes} pers.)`);
  if (data.usages.jardin) usagesList.push(`Jardin (${data.usages.jardinSurface} m²)`);
  if (data.usages.auto) usagesList.push(`Lavage auto (${data.usages.autoLavagesMois}x/mois)`);
  if (data.usages.piscine) usagesList.push(`Piscine (${data.usages.piscineSurface} m²)`);

  const optionsHtml = data.options.map((opt) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${opt.label}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${opt.volumeCuveM3} m³</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${opt.cout ? formatNumber(opt.cout) + ' €' : 'Sur devis'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${opt.couvertureReelle}%</td>
    </tr>
  `).join("");

  const comparisonsHtml = data.comparisons.map((comp) => {
    const label = comp.optionType === "eco" ? "Éco" : comp.optionType === "confort" ? "Confort" : "Extra";
    return `<li style="margin-bottom:4px;"><strong>${label}</strong> : ${formatNumber(comp.economiesCumulees)} € d'économies sur 10 ans</li>`;
  }).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8faf8;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#2d5a3d,#3a7a52);padding:30px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;">🌿 Vos résultats de simulation</h1>
      <p style="color:#c8e6c9;margin:8px 0 0;font-size:14px;">Récupération d'eau de pluie</p>
    </div>
    
    <div style="padding:24px;">
      <h2 style="color:#2d5a3d;font-size:18px;margin-top:0;">Votre configuration</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:6px 0;color:#666;">Département</td><td style="padding:6px 0;font-weight:600;">${data.departement}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Surface toiture</td><td style="padding:6px 0;font-weight:600;">${data.surfaceToiture} m²</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Prix de l'eau</td><td style="padding:6px 0;font-weight:600;">${data.prixEau} €/m³</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Usages</td><td style="padding:6px 0;font-weight:600;">${usagesList.join(", ")}</td></tr>
      </table>

      <div style="background:#e8f5e9;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;color:#666;font-size:13px;">Potentiel récupérable</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#2d5a3d;">${(data.vSupply / 1000).toFixed(1)} m³/an</p>
        <p style="margin:8px 0 0;color:#666;font-size:13px;">Besoin annuel : <strong>${(data.vDemand / 1000).toFixed(1)} m³/an</strong></p>
      </div>

      <h2 style="color:#2d5a3d;font-size:18px;">Options de cuves recommandées</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f0f7f0;">
            <th style="padding:10px 12px;text-align:left;font-size:13px;">Option</th>
            <th style="padding:10px 12px;text-align:left;font-size:13px;">Volume</th>
            <th style="padding:10px 12px;text-align:left;font-size:13px;">Coût</th>
            <th style="padding:10px 12px;text-align:left;font-size:13px;">Couverture</th>
          </tr>
        </thead>
        <tbody>${optionsHtml}</tbody>
      </table>

      <h2 style="color:#2d5a3d;font-size:18px;">Économies estimées (10 ans)</h2>
      <ul style="padding-left:20px;color:#333;">${comparisonsHtml}</ul>

      <div style="text-align:center;margin-top:24px;">
        <p style="color:#666;font-size:13px;">Des questions ? Contactez-nous pour un devis personnalisé.</p>
      </div>
    </div>

    <div style="background:#f0f7f0;padding:16px;text-align:center;font-size:12px;color:#888;">
      Les Jeunes Pousses — Récupération d'eau de pluie
    </div>
  </div>
</body>
</html>`;
}

function buildAdminEmail(data: SimulationPayload): string {
  const usagesList: string[] = [];
  if (data.usages.wc) usagesList.push(`WC (${data.usages.wcPersonnes} pers.)`);
  if (data.usages.jardin) usagesList.push(`Jardin (${data.usages.jardinSurface} m²)`);
  if (data.usages.auto) usagesList.push(`Lavage auto (${data.usages.autoLavagesMois}x/mois)`);
  if (data.usages.piscine) usagesList.push(`Piscine (${data.usages.piscineSurface} m²)`);

  const optionsText = data.options.map((opt) =>
    `• ${opt.label} : ${opt.volumeCuveM3} m³ — ${opt.cout ? formatNumber(opt.cout) + ' €' : 'Sur devis'} — Couverture ${opt.couvertureReelle}%`
  ).join("<br>");

  const comparisonsText = data.comparisons.map((comp) => {
    const label = comp.optionType === "eco" ? "Éco" : comp.optionType === "confort" ? "Confort" : "Extra";
    return `• ${label} : ${formatNumber(comp.economiesCumulees)} € d'économies`;
  }).join("<br>");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;padding:20px;">
  <h1 style="color:#2d5a3d;">📊 Nouvelle simulation</h1>
  <table style="border-collapse:collapse;width:100%;max-width:500px;">
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Email</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.email}</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Département</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.departement}</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Surface toiture</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.surfaceToiture} m²</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Type toiture</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.typeToiture}</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Prix eau</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.prixEau} €/m³</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Usages</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${usagesList.join(", ")}</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Potentiel</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${(data.vSupply / 1000).toFixed(1)} m³/an</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Besoin</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${(data.vDemand / 1000).toFixed(1)} m³/an</td></tr>
  </table>
  <h2 style="color:#2d5a3d;margin-top:20px;">Options</h2>
  <p>${optionsText}</p>
  <h2 style="color:#2d5a3d;">Économies (10 ans)</h2>
  <p>${comparisonsText}</p>
</body>
</html>`;
}

async function sendBrevoEmail(apiKey: string, to: { email: string; name?: string }[], subject: string, htmlContent: string) {
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "accept": "application/json",
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("BREVO_API_KEY");
    if (!apiKey) throw new Error("BREVO_API_KEY not configured");

    const data: SimulationPayload = await req.json();

    // Send client email
    await sendBrevoEmail(
      apiKey,
      [{ email: data.email }],
      "🌿 Vos résultats de simulation — Les Jeunes Pousses",
      buildClientEmail(data)
    );

    // Send admin email
    await sendBrevoEmail(
      apiKey,
      ADMIN_EMAILS.map((e) => ({ email: e })),
      `📊 Nouvelle simulation — ${data.departement} — ${data.email}`,
      buildAdminEmail(data)
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-simulation-results:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
