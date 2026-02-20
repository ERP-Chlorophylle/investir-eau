import { serve } from "std/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER_EMAIL = "info@lesjeunespousses.net";
const SENDER_NAME = "Les Jeunes Pousses";
// À réactiver en prod : "info@lesjeunespousses.net", "waterlife@lesjeunespousses.net"
const ADMIN_EMAILS = ["ia@hchlorophylle.fr"];

// URL absolue du logo hébergé sur Supabase Storage (bucket public email-assets)
const LOGO_URL = "https://bkoecslauxzbmkzxntdq.supabase.co/storage/v1/object/public/email-assets/image%20LJP.png";
const SITE_URL = "https://investir-eau.lesjeunespousses.net";

interface QuotePayload {
  email: string;
  phone: string;
  comment: string;
  selectedOption: string;
  economiesCumulees: number;
  coutCuve: number | null;
  departement: string;
  surfaceToiture: number;
  prixEau?: number;
  usages?: string[];
  communeNom?: string;
}

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getOptionLabel(selectedOption: string): string {
  if (selectedOption === "eco") return "Essentiel";
  if (selectedOption === "confort") return "Confort";
  return "Sérénité +";
}

function buildClientConfirmation(data: QuotePayload): string {
  const optionLabel = getOptionLabel(data.selectedOption);
  const economiesFormatted = formatNumber(data.economiesCumulees);
  const coutFormatted = data.coutCuve ? formatNumber(data.coutCuve) + " €" : "Sur devis";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre demande de devis – Les Jeunes Pousses</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- HEADER avec logo -->
          <tr>
            <td style="background:#ffffff;border-radius:16px 16px 0 0;padding:36px 40px 28px;text-align:center;border-bottom:3px solid #2d5a3d;">
              <img src="${LOGO_URL}" alt="Les Jeunes Pousses" width="140" style="display:block;margin:0 auto 20px;max-width:140px;height:auto;" />
              <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:700;color:#111827;line-height:1.2;">
                Votre demande de devis<br>a bien été reçue ✅
              </h1>
              <p style="margin:0;font-size:15px;color:#374151;font-family:Arial,sans-serif;">
                Récupération d'eau de pluie — Option <strong style="color:#1a3d28;">${optionLabel}</strong>
              </p>
            </td>
          </tr>

          <!-- CONTENU PRINCIPAL -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px;">

              <p style="margin:0 0 24px;font-size:16px;color:#2d3a2d;line-height:1.7;font-family:Arial,sans-serif;">
                Bonjour,<br><br>
                Merci pour votre confiance. Notre équipe a bien reçu votre simulation et votre demande de devis personnalisé.
                Nous vous recontacterons <strong>dans les meilleurs délais</strong> pour affiner votre projet.
              </p>

              <!-- RÉCAP DES ÉCONOMIES -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border-radius:12px;margin-bottom:28px;overflow:hidden;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#2d5a3d;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,sans-serif;">
                      Vos économies estimées sur 10 ans
                    </p>
                    <p style="margin:0;font-size:36px;font-weight:700;color:#1a3d28;font-family:Georgia,serif;line-height:1.1;">
                      ${economiesFormatted} €
                    </p>
                    <p style="margin:8px 0 0;font-size:13px;color:#4a7a5a;font-family:Arial,sans-serif;">
                      Option choisie : <strong>${optionLabel}</strong> — Investissement estimé : ${coutFormatted}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- DÉTAILS DE VOTRE SIMULATION -->
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1a3d28;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">
                Récapitulatif de votre simulation
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e0ece0;margin-bottom:28px;">
                <tr style="background:#f8fdf8;">
                  <td style="padding:10px 16px;font-size:13px;color:#666;font-family:Arial,sans-serif;border-bottom:1px solid #e8f0e8;width:45%;">Département</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a3d28;font-weight:600;font-family:Arial,sans-serif;border-bottom:1px solid #e8f0e8;">${data.departement || "—"}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;font-size:13px;color:#666;font-family:Arial,sans-serif;border-bottom:1px solid #e8f0e8;">Surface de toiture</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a3d28;font-weight:600;font-family:Arial,sans-serif;border-bottom:1px solid #e8f0e8;">${data.surfaceToiture} m²</td>
                </tr>
                ${data.prixEau ? `<tr style="background:#f8fdf8;">
                  <td style="padding:10px 16px;font-size:13px;color:#666;font-family:Arial,sans-serif;border-bottom:1px solid #e8f0e8;">Prix de l'eau</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a3d28;font-weight:600;font-family:Arial,sans-serif;border-bottom:1px solid #e8f0e8;">${data.prixEau} €/m³</td>
                </tr>` : ""}
                <tr ${data.prixEau ? "" : 'style="background:#f8fdf8;"'}>
                  <td style="padding:10px 16px;font-size:13px;color:#666;font-family:Arial,sans-serif;">Option cuve</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a3d28;font-weight:600;font-family:Arial,sans-serif;">${optionLabel}</td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${SITE_URL}" style="display:inline-block;background:linear-gradient(135deg,#2d5a3d,#3a7a52);color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;letter-spacing:0.5px;">
                      🌿 Revoir ma simulation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;font-family:Arial,sans-serif;text-align:center;">
                Des questions ? Répondez directement à cet email ou appelez-nous.<br>
                Nous sommes là pour vous accompagner.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#1a3d28;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#a8d5b5;font-family:Arial,sans-serif;">
                <strong style="color:#ffffff;">Les Jeunes Pousses</strong>
              </p>
              <p style="margin:0;font-size:11px;color:#6a9a7a;font-family:Arial,sans-serif;">
                Conseil, fourniture et installation de cuves de récupération d'eau de pluie<br>
                <a href="${SITE_URL}" style="color:#6a9a7a;">${SITE_URL}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildAdminQuoteEmail(data: QuotePayload): string {
  const optionLabel = getOptionLabel(data.selectedOption);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle demande de devis – Les Jeunes Pousses</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a3d28,#2d5a3d);border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
              <img src="${LOGO_URL}" alt="Les Jeunes Pousses" width="120" style="display:block;margin:0 auto 14px;max-width:120px;height:auto;" />
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">
                📋 Nouvelle demande de devis
              </h1>
            </td>
          </tr>

          <!-- CONTACT -->
          <tr>
            <td style="background:#ffffff;padding:28px 32px;">
              <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#2d5a3d;text-transform:uppercase;letter-spacing:1px;">
                Coordonnées du prospect
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                <tr style="background:#f9f9f9;">
                  <td style="padding:10px 16px;font-size:13px;color:#666;width:40%;border-bottom:1px solid #eee;">Email</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a1a1a;font-weight:600;border-bottom:1px solid #eee;">
                    <a href="mailto:${data.email}" style="color:#2d5a3d;">${data.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;font-size:13px;color:#666;border-bottom:1px solid #eee;">Téléphone</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a1a1a;font-weight:600;border-bottom:1px solid #eee;">
                    ${data.phone ? `<a href="tel:${data.phone}" style="color:#2d5a3d;">${data.phone}</a>` : '<span style="color:#999;">Non renseigné</span>'}
                  </td>
                </tr>
                <tr style="background:#f9f9f9;">
                  <td style="padding:10px 16px;font-size:13px;color:#666;">Commentaire</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a1a1a;font-weight:600;">${data.comment || '<span style="color:#999;font-weight:400;">Aucun</span>'}</td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#2d5a3d;text-transform:uppercase;letter-spacing:1px;">
                Simulation choisie
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                <tr style="background:#f9f9f9;">
                  <td style="padding:10px 16px;font-size:13px;color:#666;width:40%;border-bottom:1px solid #eee;">Option cuve</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a3d28;font-weight:700;border-bottom:1px solid #eee;">${optionLabel}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;font-size:13px;color:#666;border-bottom:1px solid #eee;">Coût estimé</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a1a1a;font-weight:600;border-bottom:1px solid #eee;">${data.coutCuve ? formatNumber(data.coutCuve) + " €" : "Sur devis"}</td>
                </tr>
                <tr style="background:#e8f5e9;">
                  <td style="padding:10px 16px;font-size:13px;color:#2d5a3d;font-weight:600;border-bottom:1px solid #c8e6c9;">Économies sur 10 ans</td>
                  <td style="padding:10px 16px;font-size:16px;color:#1a3d28;font-weight:700;border-bottom:1px solid #c8e6c9;">${formatNumber(data.economiesCumulees)} €</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;font-size:13px;color:#666;border-bottom:1px solid #eee;">Département</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a1a1a;font-weight:600;border-bottom:1px solid #eee;">${data.departement || "—"}</td>
                </tr>
                ${data.communeNom ? `<tr style="background:#f9f9f9;">
                  <td style="padding:10px 16px;font-size:13px;color:#666;border-bottom:1px solid #eee;">Commune</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a1a1a;font-weight:600;border-bottom:1px solid #eee;">${data.communeNom}</td>
                </tr>` : ""}
                <tr ${data.communeNom ? "" : 'style="background:#f9f9f9;"'}>
                  <td style="padding:10px 16px;font-size:13px;color:#666;border-bottom:1px solid #eee;">Surface toiture</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a1a1a;font-weight:600;border-bottom:1px solid #eee;">${data.surfaceToiture} m²</td>
                </tr>
                ${data.prixEau ? `<tr>
                  <td style="padding:10px 16px;font-size:13px;color:#666;">Prix de l'eau</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a1a1a;font-weight:600;">${data.prixEau} €/m³</td>
                </tr>` : ""}
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#1a3d28;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#6a9a7a;">
                Notification interne — Les Jeunes Pousses
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
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

    const body = await req.json();
    const { turnstileToken, ...data } = body as QuotePayload & { turnstileToken?: string };

    // Vérification Turnstile anti-bot
    const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
    const isProd = Deno.env.get("SUPABASE_ENV") === "production";
    const isDevBypass = turnstileToken === "dev-bypass" && !isProd;

    if (turnstileSecret && !isDevBypass) {
      if (!turnstileToken) {
        return new Response(JSON.stringify({ error: "Vérification anti-bot requise" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(turnstileToken)}`,
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        console.error("Turnstile verification failed:", verifyData);
        return new Response(JSON.stringify({ error: "Vérification anti-bot échouée" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Send confirmation to client
    await sendBrevoEmail(
      apiKey,
      [{ email: data.email }],
      `🌿 Votre devis Les Jeunes Pousses — ${formatNumber(data.economiesCumulees)} € d'économies sur 10 ans`,
      buildClientConfirmation(data)
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
  } catch (error: unknown) {
    console.error("Error in send-quote-request:", error);
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
