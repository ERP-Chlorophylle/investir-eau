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

interface QuotePayload {
  email: string;
  phone: string;
  comment: string;
  selectedOption: string;
  economiesCumulees: number;
  coutCuve: number | null;
  departement: string;
  surfaceToiture: number;
}

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function buildClientConfirmation(): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8faf8;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#2d5a3d,#3a7a52);padding:30px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;">✅ Demande de devis reçue</h1>
    </div>
    <div style="padding:24px;text-align:center;">
      <p style="font-size:16px;color:#333;line-height:1.6;">
        Nous avons bien reçu votre demande de devis.<br>
        Notre équipe vous recontactera dans les <strong>meilleurs délais</strong>.
      </p>
      <p style="color:#666;font-size:14px;margin-top:20px;">
        En attendant, n'hésitez pas à nous contacter si vous avez des questions.
      </p>
    </div>
    <div style="background:#f0f7f0;padding:16px;text-align:center;font-size:12px;color:#888;">
      Les Jeunes Pousses — Récupération d'eau de pluie
    </div>
  </div>
</body>
</html>`;
}

function buildAdminQuoteEmail(data: QuotePayload): string {
  const optionLabel = data.selectedOption === "eco" ? "Éco" : data.selectedOption === "confort" ? "Confort" : "Extra";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;padding:20px;">
  <h1 style="color:#b8860b;">📋 Nouvelle demande de devis</h1>
  <table style="border-collapse:collapse;width:100%;max-width:500px;">
    <tr><td style="padding:8px;color:#666;border-bottom:1px solid #eee;"><strong>Email</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${data.email}</td></tr>
    <tr><td style="padding:8px;color:#666;border-bottom:1px solid #eee;"><strong>Téléphone</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${data.phone || "Non renseigné"}</td></tr>
    <tr><td style="padding:8px;color:#666;border-bottom:1px solid #eee;"><strong>Commentaire</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${data.comment || "Aucun"}</td></tr>
  </table>
  <h2 style="color:#2d5a3d;margin-top:20px;">Rappel simulation</h2>
  <table style="border-collapse:collapse;width:100%;max-width:500px;">
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Option choisie</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${optionLabel}</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Coût cuve</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.coutCuve ? formatNumber(data.coutCuve) + ' €' : 'Sur devis'}</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Économies 10 ans</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${formatNumber(data.economiesCumulees)} €</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Département</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.departement}</td></tr>
    <tr><td style="padding:6px;color:#666;border-bottom:1px solid #eee;"><strong>Surface toiture</strong></td><td style="padding:6px;border-bottom:1px solid #eee;">${data.surfaceToiture} m²</td></tr>
  </table>
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

    const data: QuotePayload = await req.json();

    // Send confirmation to client
    await sendBrevoEmail(
      apiKey,
      [{ email: data.email }],
      "✅ Votre demande de devis — Les Jeunes Pousses",
      buildClientConfirmation()
    );

    // Send quote request to admin
    await sendBrevoEmail(
      apiKey,
      ADMIN_EMAILS.map((e) => ({ email: e })),
      `📋 Demande de devis — ${data.departement} — ${data.email}`,
      buildAdminQuoteEmail(data)
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-quote-request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
