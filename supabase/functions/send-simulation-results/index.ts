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
    livrets?: {
      id: string;
      name: string;
      valeurFuture: number;
      ecart: number;
    }[];
  }[];
}

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getOptionLabel(optionType: string): string {
  if (optionType === "eco") return "Essentiel";
  if (optionType === "confort") return "Confort";
  return "Serenite +";
}

function getLivretAGain(comp: SimulationPayload["comparisons"][number]): number | null {
  const livretA = comp.livrets?.find((livret) => livret.id === "livretA");
  return livretA ? livretA.ecart : null;
}

function buildClientEmail(data: SimulationPayload): string {
  const usagesList: string[] = [];
  if (data.usages.wc) usagesList.push(`WC (${data.usages.wcPersonnes} pers.)`);
  if (data.usages.jardin) usagesList.push(`Jardin (${data.usages.jardinSurface} mÂ²)`);
  if (data.usages.auto) usagesList.push(`Lavage auto (${data.usages.autoLavagesMois}x/mois)`);
  if (data.usages.piscine) usagesList.push(`Piscine (${data.usages.piscineSurface} mÂ²)`);

  const optionsCardsHtml = data.options.map((opt) => {
    const optionType = opt.type === "eco" ? "Essentiel" : opt.type === "confort" ? "Confort" : "Sérénité +";
    const badgeHtml = opt.type === "confort"
      ? `<div style="display:inline-block;margin-bottom:8px;padding:4px 10px;border-radius:999px;background:#0b73b8;color:#ffffff;font-size:11px;font-weight:700;">Recommandé</div>`
      : "";
    const borderColor = opt.type === "eco" ? "#8ad4a2" : opt.type === "confort" ? "#7ec6f5" : "#d6b3f5";
    const bgColor = opt.type === "eco" ? "#f3fbf5" : opt.type === "confort" ? "#f3f9ff" : "#faf6ff";
    const price = opt.cout ? `${formatNumber(opt.cout)} € TTC` : "Sur devis";

    return `
      <div style="margin-bottom:12px;border:1px solid ${borderColor};background:${bgColor};border-radius:12px;padding:12px;">
        ${badgeHtml}
        <div style="font-size:17px;font-weight:700;color:#1f2937;margin-bottom:4px;">${optionType}</div>
        <div style="font-size:14px;color:#374151;margin-bottom:2px;"><strong>${formatNumber(opt.volumeCuveM3 * 1000)} L</strong> (soit ${opt.volumeCuveM3} m³)</div>
        <div style="font-size:14px;color:#374151;margin-bottom:2px;">Couverture des besoins : <strong>${opt.couvertureReelle}%</strong></div>
        <div style="font-size:14px;color:#374151;margin-bottom:6px;">${(opt.volumeAnnuelCouvert / 1000).toFixed(1)} m³/an économisés</div>
        <div style="font-size:15px;font-weight:700;color:#111827;">Investissement : ${price}</div>
      </div>
    `;
  }).join("");

  const comparisonsHtml = data.comparisons.map((comp) => {
    const label = getOptionLabel(comp.optionType);
    const livretAGain = getLivretAGain(comp);
    const livretAText =
      livretAGain === null
        ? "Gain vs Livret A : non disponible"
        : `Gain vs Livret A : ${livretAGain >= 0 ? "+" : "-"}${formatNumber(Math.abs(livretAGain))} â‚¬`;
    return `<li style="margin-bottom:8px;"><strong>${label}</strong> : ${formatNumber(comp.economiesCumulees)} â‚¬ d'Ã©conomies sur 10 ans<br><span style="color:#2d5a3d;">${livretAText}</span></li>`;
  }).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8faf8;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr>
        <td align="center" bgcolor="#2d5a3d" style="padding:30px;background-color:#2d5a3d;background-image:linear-gradient(135deg,#2d5a3d,#3a7a52);">
          <div style="font-size:24px;font-weight:700;line-height:1.25;color:#ffffff;mso-line-height-rule:exactly;">
            🌿 Vos résultats de simulation
          </div>
          <div style="margin-top:8px;font-size:14px;line-height:1.3;color:#c8e6c9;mso-line-height-rule:exactly;">
            Récupération d'eau de pluie
          </div>
        </td>
      </tr>
    </table>
    
    <div style="padding:24px;">
      <h2 style="color:#2d5a3d;font-size:18px;margin-top:0;">Votre configuration</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:6px 0;color:#666;">DÃ©partement</td><td style="padding:6px 0;font-weight:600;">${data.departement}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Surface toiture</td><td style="padding:6px 0;font-weight:600;">${data.surfaceToiture} mÂ²</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Prix de l'eau</td><td style="padding:6px 0;font-weight:600;">${data.prixEau} â‚¬/mÂ³</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Usages</td><td style="padding:6px 0;font-weight:600;">${usagesList.join(", ")}</td></tr>
      </table>

      <div style="background:#e8f5e9;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;color:#666;font-size:13px;">Potentiel rÃ©cupÃ©rable</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#2d5a3d;">${(data.vSupply / 1000).toFixed(1)} mÂ³/an</p>
        <p style="margin:8px 0 0;color:#666;font-size:13px;">Besoin annuel : <strong>${(data.vDemand / 1000).toFixed(1)} mÂ³/an</strong></p>
      </div>

      <h2 style="color:#2d5a3d;font-size:18px;">Options de cuves recommandées</h2>
      <div style="margin-bottom:20px;">${optionsCardsHtml}</div>

      <h2 style="color:#2d5a3d;font-size:18px;">Ã‰conomies estimÃ©es (10 ans)</h2>
      <ul style="padding-left:20px;color:#333;">${comparisonsHtml}</ul>

      <div style="text-align:center;margin-top:24px;">
        <p style="color:#666;font-size:13px;">Des questions ? Contactez-nous pour un devis personnalisÃ©.</p>
      </div>
    </div>

    <div style="background:#f0f7f0;padding:16px;text-align:center;font-size:12px;color:#888;">
      Les Jeunes Pousses â€” RÃ©cupÃ©ration d'eau de pluie
    </div>
  </div>
</body>
</html>`;
}

function buildAdminEmail(data: SimulationPayload): string {
  const usagesList: string[] = [];
  if (data.usages.wc) usagesList.push(`WC (${data.usages.wcPersonnes} pers.)`);
  if (data.usages.jardin) usagesList.push(`Jardin (${data.usages.jardinSurface} mÂ²)`);
  if (data.usages.auto) usagesList.push(`Lavage auto (${data.usages.autoLavagesMois}x/mois)`);
  if (data.usages.piscine) usagesList.push(`Piscine (${data.usages.piscineSurface} mÂ²)`);

  const optionsText = data.options.map((opt) =>
    `â€¢ ${opt.label} : ${opt.volumeCuveM3} mÂ³ â€” ${opt.cout ? formatNumber(opt.cout) + ' â‚¬' : 'Sur devis'} â€” Couverture ${opt.couvertureReelle}%`
  ).join("<br>");

  const comparisonsText = data.comparisons.map((comp) => {
    const label = getOptionLabel(comp.optionType);
    const livretAGain = getLivretAGain(comp);
    const livretAText =
      livretAGain === null
        ? "Gain vs Livret A non disponible"
        : `Gain vs Livret A ${livretAGain >= 0 ? "+" : "-"}${formatNumber(Math.abs(livretAGain))} â‚¬`;
    return `â€¢ ${label} : ${formatNumber(comp.economiesCumulees)} â‚¬ d'Ã©conomies â€” ${livretAText}`;
  }).join("<br>");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;padding:20px;">
  <h1 style="color:#2d5a3d;">ðŸ“Š Nouvelle simulation</h1>
  <table style="border-collapse:collapse;width:100%;max-width:500px;">
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Email</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.email}</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>DÃ©partement</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.departement}</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Surface toiture</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.surfaceToiture} mÂ²</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Type toiture</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.typeToiture}</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Prix eau</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.prixEau} â‚¬/mÂ³</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Usages</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${usagesList.join(", ")}</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Potentiel</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${(data.vSupply / 1000).toFixed(1)} mÂ³/an</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Besoin</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${(data.vDemand / 1000).toFixed(1)} mÂ³/an</td></tr>
  </table>
  <h2 style="color:#2d5a3d;margin-top:20px;">Options</h2>
  <p>${optionsText}</p>
  <h2 style="color:#2d5a3d;">Ã‰conomies (10 ans)</h2>
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
      "ðŸŒ¿ Vos rÃ©sultats de simulation â€” Les Jeunes Pousses",
      buildClientEmail(data)
    );

    // Send admin email
    await sendBrevoEmail(
      apiKey,
      ADMIN_EMAILS.map((e) => ({ email: e })),
      `ðŸ“Š Nouvelle simulation â€” ${data.departement} â€” ${data.email}`,
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
