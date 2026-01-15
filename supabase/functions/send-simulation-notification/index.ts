import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RECIPIENT_EMAIL = "info@lesjeunespousses.net";

interface SimulationNotificationRequest {
  email: string;
  newsletter: boolean;
  departement: string;
  surfaceToiture: number;
  typeToiture: string;
  usages: {
    wc: number | null;
    jardin: number | null;
    auto: number | null;
    piscine: number | null;
  };
  prixEau: number;
  resultats: {
    potentiel: number;
    besoin: number;
    cuveConfort: number;
    economiesAnnuelles: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-simulation-notification: Received request");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: SimulationNotificationRequest = await req.json();
    console.log("send-simulation-notification: Data received", JSON.stringify(data));

    // Initialize SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.office365.com",
        port: 587,
        tls: true,
        auth: {
          username: Deno.env.get("SMTP_USER")!,
          password: Deno.env.get("SMTP_PASSWORD")!,
        },
      },
    });

    // Build usages list
    const usagesList: string[] = [];
    if (data.usages.wc !== null) {
      usagesList.push(`🚽 WC : ${data.usages.wc} personnes`);
    }
    if (data.usages.jardin !== null) {
      usagesList.push(`🌱 Jardin : ${data.usages.jardin} m²`);
    }
    if (data.usages.auto !== null) {
      usagesList.push(`🚗 Auto : ${data.usages.auto} lavages/mois`);
    }
    if (data.usages.piscine !== null) {
      usagesList.push(`🏊 Piscine : ${data.usages.piscine} m²`);
    }

    const usagesHtml = usagesList.length > 0 
      ? usagesList.map(u => `<li>${u}</li>`).join('')
      : '<li>Aucun usage sélectionné</li>';

    // Email interne (notification)
    const internalHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0ea5e9, #06b6d4); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; color: #0ea5e9; margin-bottom: 10px; font-size: 16px; }
          .highlight { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
          .badge-yes { background: #dcfce7; color: #166534; }
          .badge-no { background: #fee2e2; color: #991b1b; }
          ul { margin: 0; padding-left: 20px; }
          li { margin: 5px 0; }
          .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🌧️ Nouvelle simulation</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Département ${data.departement}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="section-title">📧 Prospect</div>
              <div class="highlight">
                <p style="margin: 0 0 10px 0;"><strong>Email :</strong> ${data.email}</p>
                <p style="margin: 0;">
                  <strong>Newsletter :</strong> 
                  <span class="badge ${data.newsletter ? 'badge-yes' : 'badge-no'}">
                    ${data.newsletter ? '✅ Oui' : '❌ Non'}
                  </span>
                </p>
              </div>
            </div>

            <div class="section">
              <div class="section-title">🏠 Installation</div>
              <div class="highlight">
                <p style="margin: 0 0 5px 0;"><strong>Département :</strong> ${data.departement}</p>
                <p style="margin: 0 0 5px 0;"><strong>Surface toiture :</strong> ${data.surfaceToiture} m²</p>
                <p style="margin: 0 0 5px 0;"><strong>Type de toiture :</strong> ${data.typeToiture === 'pente' ? 'En pente' : 'Toit plat'}</p>
                <p style="margin: 0;"><strong>Prix de l'eau :</strong> ${data.prixEau.toFixed(2)} €/m³</p>
              </div>
            </div>

            <div class="section">
              <div class="section-title">💧 Usages sélectionnés</div>
              <div class="highlight">
                <ul>
                  ${usagesHtml}
                </ul>
              </div>
            </div>

            <div class="section">
              <div class="section-title">📊 Résultats de la simulation</div>
              <div class="highlight">
                <p style="margin: 0 0 5px 0;"><strong>Potentiel récupérable :</strong> ${data.resultats.potentiel.toFixed(1)} m³/an</p>
                <p style="margin: 0 0 5px 0;"><strong>Besoin annuel :</strong> ${data.resultats.besoin.toFixed(1)} m³/an</p>
                <p style="margin: 0 0 5px 0;"><strong>Cuve recommandée :</strong> ${data.resultats.cuveConfort.toLocaleString('fr-FR')} L</p>
                <p style="margin: 0;"><strong>Économies annuelles :</strong> ${data.resultats.economiesAnnuelles.toFixed(0)} €</p>
              </div>
            </div>
          </div>
          
          <div class="footer">
            Les Jeunes Pousses - Simulation de récupération d'eau de pluie
          </div>
        </div>
      </body>
      </html>
    `;

    // Email prospect (résultats personnalisés)
    const prospectHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0ea5e9, #06b6d4); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .section { margin-bottom: 25px; }
          .section-title { font-weight: bold; color: #0ea5e9; margin-bottom: 15px; font-size: 18px; }
          .highlight { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; }
          .result-grid { display: table; width: 100%; }
          .result-row { display: table-row; }
          .result-label { display: table-cell; padding: 8px 0; color: #6b7280; }
          .result-value { display: table-cell; padding: 8px 0; font-weight: bold; text-align: right; color: #1f2937; }
          .big-number { font-size: 32px; color: #0ea5e9; font-weight: bold; }
          .savings-box { background: linear-gradient(135deg, #dcfce7, #bbf7d0); padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #f59e0b, #eab308); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
          .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
          ul { margin: 0; padding-left: 20px; }
          li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🌧️ Vos résultats de simulation</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Récupération d'eau de pluie</p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 25px;">
              Bonjour,<br><br>
              Merci d'avoir utilisé notre simulateur ! Voici le récapitulatif de votre projet de récupération d'eau de pluie.
            </p>

            <div class="section">
              <div class="section-title">🏠 Votre installation</div>
              <div class="highlight">
                <div class="result-grid">
                  <div class="result-row">
                    <span class="result-label">Département</span>
                    <span class="result-value">${data.departement}</span>
                  </div>
                  <div class="result-row">
                    <span class="result-label">Surface de toiture</span>
                    <span class="result-value">${data.surfaceToiture} m²</span>
                  </div>
                  <div class="result-row">
                    <span class="result-label">Type de toiture</span>
                    <span class="result-value">${data.typeToiture === 'pente' ? 'En pente' : 'Toit plat'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">💧 Vos usages</div>
              <div class="highlight">
                <ul>
                  ${usagesHtml}
                </ul>
              </div>
            </div>

            <div class="section">
              <div class="section-title">📊 Résultats de votre simulation</div>
              <div class="highlight">
                <div class="result-grid">
                  <div class="result-row">
                    <span class="result-label">Potentiel récupérable</span>
                    <span class="result-value">${data.resultats.potentiel.toFixed(1)} m³/an</span>
                  </div>
                  <div class="result-row">
                    <span class="result-label">Besoin estimé</span>
                    <span class="result-value">${data.resultats.besoin.toFixed(1)} m³/an</span>
                  </div>
                  <div class="result-row">
                    <span class="result-label">Cuve recommandée</span>
                    <span class="result-value">${data.resultats.cuveConfort.toLocaleString('fr-FR')} L</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="savings-box">
              <p style="margin: 0 0 5px 0; color: #166534;">💰 Économies annuelles estimées</p>
              <span class="big-number">${data.resultats.economiesAnnuelles.toFixed(0)} €</span>
              <p style="margin: 5px 0 0 0; color: #166534; font-size: 14px;">par an sur votre facture d'eau</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="margin-bottom: 15px; font-size: 16px;">
                <strong>Prêt à passer à l'action ?</strong><br>
                Demandez un devis personnalisé pour votre projet.
              </p>
              <a href="https://investir-eau.lovable.app/resultat" class="cta-button">
                📋 Demander un devis gratuit
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;"><strong>Les Jeunes Pousses</strong></p>
            <p style="margin: 0;">Spécialiste de la récupération d'eau de pluie</p>
            <p style="margin: 10px 0 0 0;">
              <a href="mailto:info@lesjeunespousses.net" style="color: #9ca3af;">info@lesjeunespousses.net</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("send-simulation-notification: Sending internal email to", RECIPIENT_EMAIL);

    // Envoyer email interne
    await client.send({
      from: RECIPIENT_EMAIL,
      to: RECIPIENT_EMAIL,
      subject: `🌧️ Nouvelle simulation - Dept ${data.departement} - ${data.email}`,
      content: "Nouvelle simulation reçue",
      html: internalHtml,
    });

    console.log("send-simulation-notification: Internal email sent");

    // Envoyer email au prospect
    console.log("send-simulation-notification: Sending prospect email to", data.email);

    await client.send({
      from: RECIPIENT_EMAIL,
      to: data.email,
      subject: `🌧️ Vos résultats de simulation - Récupération d'eau de pluie`,
      content: "Vos résultats de simulation",
      html: prospectHtml,
    });

    console.log("send-simulation-notification: Prospect email sent");

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("send-simulation-notification: Error", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
