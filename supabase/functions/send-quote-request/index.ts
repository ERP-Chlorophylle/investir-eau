import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RECIPIENT_EMAIL = "info@lesjeunespousses.net";

interface QuoteRequestData {
  email: string;
  phone: string;
  comment: string;
  simulation: {
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
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-quote-request: Received request");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: QuoteRequestData = await req.json();
    console.log("send-quote-request: Data received", JSON.stringify(data));

    // Build usages list
    const usagesList: string[] = [];
    if (data.simulation.usages.wc !== null) {
      usagesList.push(`🚽 WC : ${data.simulation.usages.wc} personnes`);
    }
    if (data.simulation.usages.jardin !== null) {
      usagesList.push(`🌱 Jardin : ${data.simulation.usages.jardin} m²`);
    }
    if (data.simulation.usages.auto !== null) {
      usagesList.push(`🚗 Auto : ${data.simulation.usages.auto} lavages/mois`);
    }
    if (data.simulation.usages.piscine !== null) {
      usagesList.push(`🏊 Piscine : ${data.simulation.usages.piscine} m²`);
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
          .header { background: linear-gradient(135deg, #f59e0b, #eab308); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; color: #f59e0b; margin-bottom: 10px; font-size: 16px; }
          .highlight { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; }
          .comment-box { background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fcd34d; font-style: italic; }
          ul { margin: 0; padding-left: 20px; }
          li { margin: 5px 0; }
          .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
          .priority { background: #fef3c7; border: 2px solid #f59e0b; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📋 Demande de devis</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Action requise</p>
          </div>
          
          <div class="content">
            <div class="priority">
              ⚡ <strong>Ce prospect souhaite être recontacté</strong>
            </div>

            <div class="section">
              <div class="section-title">📧 Contact</div>
              <div class="highlight">
                <p style="margin: 0 0 10px 0;"><strong>Email :</strong> <a href="mailto:${data.email}">${data.email}</a></p>
                <p style="margin: 0;"><strong>Téléphone :</strong> ${data.phone || 'Non renseigné'}</p>
              </div>
            </div>

            ${data.comment ? `
            <div class="section">
              <div class="section-title">💬 Message du prospect</div>
              <div class="comment-box">
                ${data.comment}
              </div>
            </div>
            ` : ''}

            <div class="section">
              <div class="section-title">📊 Rappel de la simulation</div>
              <div class="highlight">
                <p style="margin: 0 0 5px 0;"><strong>Département :</strong> ${data.simulation.departement}</p>
                <p style="margin: 0 0 5px 0;"><strong>Surface toiture :</strong> ${data.simulation.surfaceToiture} m²</p>
                <p style="margin: 0 0 5px 0;"><strong>Type de toiture :</strong> ${data.simulation.typeToiture === 'pente' ? 'En pente' : 'Toit plat'}</p>
                <p style="margin: 0;"><strong>Prix de l'eau :</strong> ${data.simulation.prixEau.toFixed(2)} €/m³</p>
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
              <div class="section-title">🎯 Résultats</div>
              <div class="highlight">
                <p style="margin: 0 0 5px 0;"><strong>Potentiel récupérable :</strong> ${data.simulation.resultats.potentiel.toFixed(1)} m³/an</p>
                <p style="margin: 0 0 5px 0;"><strong>Besoin annuel :</strong> ${data.simulation.resultats.besoin.toFixed(1)} m³/an</p>
                <p style="margin: 0 0 5px 0;"><strong>Cuve recommandée :</strong> ${data.simulation.resultats.cuveConfort.toLocaleString('fr-FR')} L</p>
                <p style="margin: 0;"><strong>Économies annuelles :</strong> ${data.simulation.resultats.economiesAnnuelles.toFixed(0)} €</p>
              </div>
            </div>
          </div>
          
          <div class="footer">
            Les Jeunes Pousses - Demande de devis depuis le simulateur
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("send-quote-request: Sending email to", RECIPIENT_EMAIL);

    const emailResponse = await resend.emails.send({
      from: "Simulateur Eau de Pluie <onboarding@resend.dev>",
      to: [RECIPIENT_EMAIL],
      subject: `📋 Demande de devis - ${data.email}${data.phone ? ` - ${data.phone}` : ''}`,
      html,
    });

    console.log("send-quote-request: Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("send-quote-request: Error", error);
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
