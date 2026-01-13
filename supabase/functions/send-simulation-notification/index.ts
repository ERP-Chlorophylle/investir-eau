import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    const html = `
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

    console.log("send-simulation-notification: Sending email to", RECIPIENT_EMAIL);

    const emailResponse = await resend.emails.send({
      from: "Simulateur Eau de Pluie <onboarding@resend.dev>",
      to: [RECIPIENT_EMAIL],
      subject: `🌧️ Nouvelle simulation - Dept ${data.departement} - ${data.email}`,
      html,
    });

    console.log("send-simulation-notification: Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
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
