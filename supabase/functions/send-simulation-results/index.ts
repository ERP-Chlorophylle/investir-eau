import { serve } from "std/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER_EMAIL = "info@lesjeunespousses.net";
const SENDER_NAME = "Les Jeunes Pousses";
const ADMIN_EMAILS = ["info@lesjeunespousses.net", "waterlife@lesjeunespousses.net"];
const TURNSTILE_ENABLED = true;

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
  communeNom?: string;
  vSupply: number;
  vDemand: number;
  options: Option[];
  comparisons: Comparison[];
  sessionId?: string | null;
}

type Medal = { rank: 1 | 2 | 3; label: string };
const VISIBLE_LIVRET_IDS = new Set(["livretA", "ldds", "pel"]);

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function optionTitle(optionType: string): string {
  if (optionType === "eco") return "Essentiel";
  if (optionType === "confort") return "Confort";
  return "S\u00e9r\u00e9nit\u00e9 +";
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
  push(data.options.find((o) => o.type === "extra")?.type ?? null, { rank: 3, label: "Meilleure r\u00e9silience" });

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
  if (data.usages.jardin) usages.push(`Jardin (${data.usages.jardinSurface} m\u00b2)`);
  if (data.usages.auto) usages.push(`Lavage auto (${data.usages.autoLavagesMois}x/mois)`);
  if (data.usages.piscine) usages.push(`Piscine (${data.usages.piscineSurface} m\u00b2)`);

  const { recommended, rankByType, medalsByType } = computeRanksAndMedals(data);

  // Trouver la meilleure option (recommandée ou eco par défaut)
  const bestType = recommended ?? "eco";
  const bestComp = data.comparisons.find((c) => c.optionType === bestType) ?? data.comparisons[0];
  const bestOption = data.options.find((o) => o.type === bestType) ?? data.options[0];
  const bestLivretAGain = livretAGain(bestComp);
  const bestSpread = bestLivretAGain !== null ? bestComp.economiesCumulees - bestLivretAGain : null;
  const cuveWins = bestSpread !== null && bestSpread > 0;

  // Bloc hero financier — architecture table pour compatibilité email universelle
  let heroFinancialHtml = "";
  if (bestSpread !== null) {
    if (cuveWins) {
      const label = `Cuve ${optionTitle(bestType)} ${formatNumber(bestOption.volumeCuveM3 * 1000)} L &bull; ${formatNumber(bestComp.economiesCumulees)} \u20ac d'\u00e9conomies cumul\u00e9es`;
      heroFinancialHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-radius:12px;overflow:hidden;">
        <tr>
          <td bgcolor="#0b6e27" align="center" style="background:#0b6e27;padding:20px 24px;border-radius:12px;">
            <p style="margin:0 0 6px;font-size:12px;color:#c8e6c9;text-transform:uppercase;letter-spacing:1px;font-weight:700;font-family:Arial,sans-serif;">Votre cuve rapporte plus qu'un Livret A</p>
            <p style="margin:0 0 4px;font-size:34px;font-weight:800;color:#ffffff;font-family:Arial,sans-serif;line-height:1;">+${formatNumber(bestSpread)} \u20ac</p>
            <p style="margin:0 0 12px;font-size:13px;color:#a5d6a7;font-family:Arial,sans-serif;">de gain suppl\u00e9mentaire sur 10 ans vs Livret A</p>
            <table role="presentation" cellpadding="0" cellspacing="0" align="center">
              <tr>
                <td bgcolor="#1a9e3f" style="background:rgba(255,255,255,0.18);border-radius:999px;padding:6px 16px;">
                  <p style="margin:0;font-size:12px;color:#ffffff;font-weight:600;font-family:Arial,sans-serif;white-space:nowrap;">${label}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
    } else {
      heroFinancialHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-radius:12px;overflow:hidden;">
        <tr>
          <td bgcolor="#1565c0" align="center" style="background:#1565c0;padding:20px 24px;border-radius:12px;">
            <p style="margin:0 0 6px;font-size:12px;color:#bbdefb;text-transform:uppercase;letter-spacing:1px;font-weight:700;font-family:Arial,sans-serif;">\u00c9conomies d'eau estim\u00e9es</p>
            <p style="margin:0 0 4px;font-size:34px;font-weight:800;color:#ffffff;font-family:Arial,sans-serif;line-height:1;">${formatNumber(bestComp.economiesCumulees)} \u20ac</p>
            <p style="margin:0 0 12px;font-size:13px;color:#90caf9;font-family:Arial,sans-serif;">d'\u00e9conomies cumul\u00e9es sur 10 ans</p>
            <table role="presentation" cellpadding="0" cellspacing="0" align="center">
              <tr>
                <td bgcolor="#1e88e5" style="border-radius:999px;padding:6px 16px;">
                  <p style="margin:0;font-size:12px;color:#ffffff;font-weight:600;font-family:Arial,sans-serif;">+ r\u00e9silience en cas de s\u00e9cheresse</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
    }
  }

  // Bloc comparaison livrets — table email-safe
  const allLivrets = (bestComp.livrets ?? []).filter((livret) => VISIBLE_LIVRET_IDS.has(livret.id));
  let livretComparisonHtml = "";
  if (allLivrets.length > 0) {
    const rows = allLivrets.map((l) => {
      const capitalRef = typeof bestComp.capitalReference === "number" ? bestComp.capitalReference : (bestComp.coutCuve ?? 29500);
      const interets = l.valeurFuture - capitalRef;
      const avantage = bestComp.economiesCumulees - interets;
      const color = avantage > 0 ? "#2e7d32" : "#c62828";
      const sign = avantage > 0 ? "+" : "";
      return `<tr>
        <td style="padding:10px 16px;font-size:14px;color:#333;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;">${l.name}</td>
        <td align="right" style="padding:10px 16px;font-size:14px;color:#666;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;">${formatNumber(interets)} \u20ac</td>
        <td align="right" style="padding:10px 16px;font-size:14px;font-weight:700;color:${color};border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;">${sign}${formatNumber(avantage)} \u20ac</td>
      </tr>`;
    }).join("");
    livretComparisonHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-radius:12px;overflow:hidden;border:1px solid #e0e0e0;">
      <tr>
        <td bgcolor="#f5f5f5" style="background:#f5f5f5;padding:10px 16px;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#333;font-family:Arial,sans-serif;">Cuve vs Livrets d'\u00e9pargne (sur 10 ans)</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr bgcolor="#fafafa">
              <td style="padding:8px 16px;font-size:12px;font-weight:700;color:#888;border-bottom:1px solid #e8e8e8;font-family:Arial,sans-serif;">Placement</td>
              <td align="right" style="padding:8px 16px;font-size:12px;font-weight:700;color:#888;border-bottom:1px solid #e8e8e8;font-family:Arial,sans-serif;">Int\u00e9r\u00eats</td>
              <td align="right" style="padding:8px 16px;font-size:12px;font-weight:700;color:#888;border-bottom:1px solid #e8e8e8;font-family:Arial,sans-serif;">Avantage cuve</td>
            </tr>
            ${rows}
            <tr bgcolor="#e8f5e9">
              <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#2d5a3d;font-family:Arial,sans-serif;">Cuve ${optionTitle(bestType)}</td>
              <td align="right" colspan="2" style="padding:10px 16px;font-size:14px;font-weight:700;color:#2d5a3d;font-family:Arial,sans-serif;">${formatNumber(bestComp.economiesCumulees)} \u20ac d'\u00e9conomies</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  }

  const sortedOptions = [...data.options].sort((a, b) => {
    if (a.type === recommended) return -1;
    if (b.type === recommended) return 1;
    return 0;
  });

  const optionsHtml = sortedOptions
    .map((o) => {
      const title = optionTitle(o.type);
      const isReco = o.type === recommended;
      const border = isReco ? "#2d5a3d" : o.type === "confort" ? "#7ec6f5" : "#e0e0e0";
      const bg = isReco ? "#f0faf3" : "#fafafa";
      const badge = isReco
        ? `<div style="display:inline-block;margin-bottom:8px;padding:4px 10px;border-radius:999px;background:#2d5a3d;color:#fff;font-size:11px;font-weight:700;">Recommand\u00e9</div>`
        : "";
      const price = o.cout ? `${formatNumber(o.cout)} \u20ac TTC` : "Sur devis";
      const rank = rankByType[o.type] ?? "-";
      const medals = (medalsByType[o.type] ?? [])
        .map((m) => `${m.rank === 1 ? "\u{1F947}" : m.rank === 2 ? "\u{1F948}" : "\u{1F949}"} ${m.label}`)
        .map((m) => `<div style="margin-top:6px;padding:4px 8px;border-radius:999px;background:#fff;border:1px solid #d6e2db;font-size:11px;font-weight:600;color:#2d5a3d;white-space:nowrap;">${m}</div>`)
        .join("");

      // Gain vs Livret A pour cette option
      const comp = data.comparisons.find((c) => c.optionType === o.type);
      const gainLA = comp ? livretAGain(comp) : null;
      const spreadLA = comp && gainLA !== null ? comp.economiesCumulees - gainLA : null;
      const gainLine = spreadLA !== null
        ? spreadLA > 0
          ? `<div style="margin-top:6px;font-size:13px;font-weight:700;color:#2e7d32;">+${formatNumber(spreadLA)} \u20ac vs Livret A</div>`
          : `<div style="margin-top:6px;font-size:13px;font-weight:600;color:#e65100;">${formatNumber(spreadLA)} \u20ac vs Livret A</div>`
        : "";

      return `
      <div style="margin-bottom:12px;border:${isReco ? "2px" : "1px"} solid ${border};background:${bg};border-radius:12px;padding:14px;">
        ${badge}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td valign="top" style="padding-right:8px;">
              <div style="font-size:17px;font-weight:700;color:#1f2937;margin-bottom:4px;">${title}</div>
              <div style="font-size:14px;color:#374151;margin-bottom:2px;"><strong>${formatNumber(o.volumeCuveM3 * 1000)} L</strong></div>
              <div style="font-size:14px;color:#374151;margin-bottom:2px;">Couverture : <strong>${o.couvertureReelle}%</strong> des besoins</div>
              <div style="font-size:14px;color:#374151;margin-bottom:2px;">${(o.volumeAnnuelCouvert / 1000).toFixed(1)} m\u00b3/an \u00e9conomis\u00e9s</div>
              <div style="font-size:15px;font-weight:700;color:#111827;margin-top:6px;">Investissement : ${price}</div>
              ${gainLine}
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

  const BASE_URL = "https://economie-eau.lesjeunespousses.net";
  const ctaUrl = data.sessionId
    ? `${BASE_URL}/resultat?session=${encodeURIComponent(data.sessionId)}&devis=1`
    : `${BASE_URL}/simulateur`;
  const logoUrl = "https://bkoecslauxzbmkzxntdq.supabase.co/storage/v1/object/public/email-assets/image%20LJP.png";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td align="center" bgcolor="#0d2d6e" style="background:linear-gradient(135deg,#0d2d6e 0%,#1565c0 60%,#1e88e5 100%);padding:28px 32px 24px;">
            <img src="${logoUrl}" alt="Les Jeunes Pousses" width="130" style="display:block;margin:0 auto 16px;max-width:130px;height:auto;" />
            <p style="margin:0 0 6px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.2;font-family:Arial,sans-serif;">Vos r\u00e9sultats de simulation</p>
            <p style="margin:0;font-size:13px;color:#90caf9;font-family:Arial,sans-serif;">R\u00e9cup\u00e9ration d'eau de pluie</p>
          </td>
        </tr>

        <!-- CORPS -->
        <tr><td style="padding:24px 28px;">
      ${heroFinancialHtml}

      <!-- CONFIGURATION 2 COLONNES -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <!-- Colonne gauche : Votre configuration -->
          <td valign="top" width="48%" style="padding-right:8px;">
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1565c0;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,sans-serif;">Votre configuration</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${data.communeNom ? `<tr>
                <td style="padding:6px 0;font-size:12px;color:#888;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;">Commune</td>
                <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1f2937;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;">${data.communeNom}</td>
              </tr>` : ""}
              <tr>
                <td style="padding:6px 0;font-size:12px;color:#888;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;">Surface toiture</td>
                <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1f2937;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;">${data.surfaceToiture} m\u00b2</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:12px;color:#888;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;">Type de toit</td>
                <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1f2937;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;">${data.typeToiture === "pente" ? "En pente" : "Toit plat"}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:12px;color:#888;font-family:Arial,sans-serif;">Prix de l'eau</td>
                <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1f2937;font-family:Arial,sans-serif;">${data.prixEau.toFixed(2)} \u20ac/m\u00b3</td>
              </tr>
            </table>
          </td>
          <!-- Separateur -->
          <td width="4%">&nbsp;</td>
          <!-- Colonne droite : Vos Usages -->
          <td valign="top" width="48%">
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1565c0;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,sans-serif;">Vos Usages</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${data.usages.wc ? `<tr><td style="padding:5px 0;font-size:13px;color:#374151;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;">\uD83D\uDEBF WC (${data.usages.wcPersonnes} pers.)</td></tr>` : ""}
              ${data.usages.jardin ? `<tr><td style="padding:5px 0;font-size:13px;color:#374151;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;">\uD83C\uDF3F Jardin (${data.usages.jardinSurface} m\u00b2)</td></tr>` : ""}
              ${data.usages.auto ? `<tr><td style="padding:5px 0;font-size:13px;color:#374151;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;">\uD83D\uDE97 Lavage auto (${data.usages.autoLavagesMois}x/mois)</td></tr>` : ""}
              ${data.usages.piscine ? `<tr><td style="padding:5px 0;font-size:13px;color:#374151;font-family:Arial,sans-serif;">\uD83C\uDFCA Piscine (${data.usages.piscineSurface} m\u00b2)</td></tr>` : ""}
            </table>
          </td>
        </tr>
      </table>

      <!-- POTENTIEL / BESOIN -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-radius:10px;overflow:hidden;">
        <tr>
          <td bgcolor="#e8f4fd" style="background:#e8f4fd;padding:16px;border-radius:10px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%">
                  <p style="margin:0 0 4px;font-size:12px;color:#666;font-family:Arial,sans-serif;">Potentiel r\u00e9cup\u00e9rable</p>
                  <p style="margin:0;font-size:22px;font-weight:800;color:#1565c0;font-family:Arial,sans-serif;">${(data.vSupply / 1000).toFixed(1)} m\u00b3/an</p>
                </td>
                <td width="50%">
                  <p style="margin:0 0 4px;font-size:12px;color:#666;font-family:Arial,sans-serif;">Besoin annuel</p>
                  <p style="margin:0;font-size:22px;font-weight:800;color:#0d2d6e;font-family:Arial,sans-serif;">${(data.vDemand / 1000).toFixed(1)} m\u00b3/an</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${data.vSupply < data.vDemand ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border-radius:10px;overflow:hidden;">
        <tr>
          <td bgcolor="#fff8e1" style="background:#fff8e1;padding:14px 16px;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400e;font-family:Arial,sans-serif;">&#x26A1; Votre potentiel r\u00e9cup\u00e9rable est inf\u00e9rieur \u00e0 votre besoin annuel</p>
            <p style="margin:0;font-size:13px;color:#78350f;font-family:Arial,sans-serif;">Nous pouvons vous aider \u00e0 <strong>augmenter votre potentiel de r\u00e9cup\u00e9ration</strong> : extension de surface de collecte, optimisation des versants de toiture, ou syst\u00e8mes compl\u00e9mentaires. Contactez-nous pour une \u00e9tude personnalis\u00e9e.</p>
          </td>
        </tr>
      </table>` : ""}
      <h2 style="color:#1565c0;font-size:16px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,sans-serif;">&#x1F4A1; Notre avis d'expert</h2>
      ${!cuveWins && bestLivretAGain !== null ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border-radius:10px;overflow:hidden;">
        <tr>
          <td bgcolor="#fff8e1" style="background:#fff8e1;padding:14px 16px;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400e;font-family:Arial,sans-serif;">&#x26A0; Investissement moins rentable qu'un Livret A sur 10 ans</p>
            <p style="margin:0;font-size:13px;color:#78350f;font-family:Arial,sans-serif;line-height:1.5;">Sur 10 ans, placer ce capital sur un Livret A rapporterait environ <strong>${formatNumber(Math.abs(bestSpread ?? 0))} \u20ac de plus</strong>. Mais une cuve, c\u2019est aussi la <strong>garantie d\u2019avoir de l\u2019eau pendant les restrictions d\u2019usage</strong>, l\u2019ind\u00e9pendance face aux hausses tarifaires et une empreinte \u00e9cologique bien meilleure. Avec quelques travaux d\u2019optimisation, ce bilan peut rapidement s\u2019inverser.</p>
          </td>
        </tr>
      </table>` : ""}
      ${data.vSupply > data.vDemand * 1.25 ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border-radius:10px;overflow:hidden;">
        <tr>
          <td bgcolor="#f0fdf4" style="background:#f0fdf4;padding:14px 16px;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#14532d;font-family:Arial,sans-serif;">&#x1F4A7; Votre toiture a un potentiel bien sup\u00e9rieur \u00e0 vos besoins actuels</p>
            <p style="margin:0;font-size:13px;color:#166534;font-family:Arial,sans-serif;line-height:1.5;">Vous r\u00e9cup\u00e9rez jusqu\u2019\u00e0 <strong>${(data.vSupply / 1000).toFixed(1)} m\u00b3/an</strong> pour seulement <strong>${(data.vDemand / 1000).toFixed(1)} m\u00b3/an</strong> de besoins d\u00e9clar\u00e9s. Avec quelques travaux simples \u2014 arrosage automatique, nettoyage haute-pression, usage sanitaire \u00e9tendu \u2014 vous pourriez exploiter ce surplus et <strong>multiplier vos \u00e9conomies</strong>. Contactez-nous pour une \u00e9tude personnalis\u00e9e.</p>
          </td>
        </tr>
      </table>` : ""}
      <h2 style="color:#1565c0;font-size:16px;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,sans-serif;">Nous recommandons ces cuves :</h2>
      <div style="margin-bottom:24px;">${optionsHtml}</div>

      ${livretComparisonHtml}

      <div style="text-align:center;margin:28px 0 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" align="center">
          <tr>
            <td bgcolor="#1565c0" style="background:#1565c0;border-radius:999px;">
              <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;color:#fff;text-decoration:none;font-size:15px;font-weight:700;font-family:Arial,sans-serif;">\uD83D\uDCA7 Demander un devis gratuit</a>
            </td>
          </tr>
        </table>
        <p style="margin:8px 0 0;font-size:12px;color:#999;font-family:Arial,sans-serif;">R\u00e9ponse sous 48h</p>
      </div>

      <div style="margin-top:24px;padding:14px;border-radius:8px;background:#fff8e1;border:1px solid #ffe082;">
        <div style="font-size:13px;color:#795548;line-height:1.5;">
          <strong>Le saviez-vous ?</strong> Le prix de l'eau augmente en moyenne de 3% par an en France.
          Sur 10 ans, votre cuve devient un v\u00e9ritable investissement qui se rentabilise
          tout en vous prot\u00e9geant des restrictions d'eau li\u00e9es aux s\u00e9cheresses.
        </div>
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;border-top:1px solid #e3eaf6;padding-top:20px;">
        <tr>
          <td align="center" style="padding-bottom:12px;">
            <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#1565c0;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Nos services</p>
            <p style="margin:0;font-size:11px;color:#888;font-family:Arial,sans-serif;">Les Jeunes Pousses &bull; Conseil, fourniture et installation</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 4px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:4px;" align="center" width="33%">
                  <a href="${ctaUrl}" style="display:block;padding:10px 8px;background:#1565c0;color:#fff;text-decoration:none;border-radius:8px;font-size:12px;font-weight:700;text-align:center;font-family:Arial,sans-serif;">\uD83D\uDCCB Demander un devis</a>
                </td>
                <td style="padding:4px;" align="center" width="33%">
                  <a href="https://lesjeunespousses.net/" style="display:block;padding:10px 8px;background:#e3f2fd;color:#1565c0;text-decoration:none;border-radius:8px;font-size:12px;font-weight:700;text-align:center;border:1px solid #90caf9;font-family:Arial,sans-serif;">\uD83C\uDF31 Notre site web</a>
                </td>
                <td style="padding:4px;" align="center" width="33%">
                   <a href="${BASE_URL}/simulateur" style="display:block;padding:10px 8px;background:#e3f2fd;color:#1565c0;text-decoration:none;border-radius:8px;font-size:12px;font-weight:700;text-align:center;border:1px solid #90caf9;font-family:Arial,sans-serif;">\uD83D\uDCA7 Simuler \u00e0 nouveau</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
        </td></tr>

        <!-- FOOTER -->
        <tr>
          <td bgcolor="#0d2d6e" align="center" style="background:#0d2d6e;padding:18px 32px;">
            <p style="margin:0 0 3px;font-size:13px;font-family:Arial,sans-serif;"><strong style="color:#ffffff;">Les Jeunes Pousses</strong></p>
            <p style="margin:0;font-size:11px;color:#90caf9;font-family:Arial,sans-serif;">R\u00e9cup\u00e9ration d'eau de pluie &bull; Conseil et installation<br><a href="https://lesjeunespousses.net/" style="color:#90caf9;text-decoration:none;">lesjeunespousses.net</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}


function buildAdminEmail(data: SimulationPayload): string {
  const usages: string[] = [];
  if (data.usages.wc) usages.push(`WC (${data.usages.wcPersonnes} pers.)`);
  if (data.usages.jardin) usages.push(`Jardin (${data.usages.jardinSurface} m\u00b2)`);
  if (data.usages.auto) usages.push(`Lavage auto (${data.usages.autoLavagesMois}x/mois)`);
  if (data.usages.piscine) usages.push(`Piscine (${data.usages.piscineSurface} m\u00b2)`);

  const { recommended, rankByType, medalsByType } = computeRanksAndMedals(data);

  const optionsHtml = data.options.map((o) => {
    const title = optionTitle(o.type);
    const price = o.cout ? `${formatNumber(o.cout)} \u20ac` : "Sur devis";
    const rank = rankByType[o.type] ?? "-";
    const medals = (medalsByType[o.type] ?? [])
      .map((m) => `${m.rank === 1 ? "\u{1F947}" : m.rank === 2 ? "\u{1F948}" : "\u{1F949}"} ${m.label}`)
      .join(" &bull; ");
    const isReco = o.type === recommended;
    const recoBadge = isReco ? ' <span style="background:#2d5a3d;color:#fff;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;">RECOMMAND\u00c9</span>' : "";
    const comp = data.comparisons.find((c) => c.optionType === o.type);
    const ga = comp ? livretAGain(comp) : null;
    const spreadLA = comp && ga !== null ? comp.economiesCumulees - ga : null;
    const gainText = spreadLA !== null
      ? spreadLA > 0
        ? `<span style="color:#2e7d32;font-weight:700;">+${formatNumber(spreadLA)} \u20ac vs Livret A</span>`
        : `<span style="color:#c62828;font-weight:700;">${formatNumber(spreadLA)} \u20ac vs Livret A</span>`
      : "";
    const ecoCumulees = comp ? `${formatNumber(comp.economiesCumulees)} \u20ac d'\u00e9co. sur 10 ans` : "";

    const bgColor = isReco ? "#f0faf3" : "#fafafa";
    const borderColor = isReco ? "#2d5a3d" : "#e0e0e0";

    return `
    <tr>
      <td style="padding:12px;border:1px solid ${borderColor};border-radius:8px;background:${bgColor};margin-bottom:8px;">
        <div style="font-size:16px;font-weight:700;color:#1f2937;margin-bottom:4px;">
          #${rank} ${title} — ${formatNumber(o.volumeCuveM3 * 1000)} L${recoBadge}
        </div>
        <div style="font-size:13px;color:#555;margin-bottom:2px;">
          Couverture : <strong>${o.couvertureReelle}%</strong> &bull; 
          ${(o.volumeAnnuelCouvert / 1000).toFixed(1)} m\u00b3/an &bull; 
          Investissement : <strong>${price}</strong>
        </div>
        <div style="font-size:13px;margin-top:4px;">
          ${ecoCumulees}${gainText ? " &bull; " + gainText : ""}
        </div>
        ${medals ? `<div style="font-size:12px;color:#2d5a3d;margin-top:4px;">${medals}</div>` : ""}
      </td>
    </tr>
    <tr><td style="height:8px;"></td></tr>`;
  }).join("");

  const logoUrl = "https://bkoecslauxzbmkzxntdq.supabase.co/storage/v1/object/public/email-assets/image%20LJP.png";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head>
<body style="font-family:Arial,sans-serif;padding:20px;background:#f8f8f8;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <div style="margin-bottom:12px;text-align:center;">
    <img src="${logoUrl}" alt="Les Jeunes Pousses" style="height:36px;width:auto;display:inline-block;" />
  </div>
  <h1 style="color:#2d5a3d;font-size:20px;margin-top:0;">Nouvelle simulation re\u00e7ue</h1>

  <table style="border-collapse:collapse;width:100%;margin-bottom:20px;">
    <tr><td style="padding:6px 8px;color:#888;border-bottom:1px solid #f0f0f0;font-size:13px;width:120px;">Email</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-weight:600;font-size:14px;"><a href="mailto:${data.email}" style="color:#1565c0;">${data.email}</a></td></tr>
    ${data.communeNom ? `<tr><td style="padding:6px 8px;color:#888;border-bottom:1px solid #f0f0f0;font-size:13px;">Commune</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-weight:600;font-size:14px;">${data.communeNom}</td></tr>` : ""}
    <tr><td style="padding:6px 8px;color:#888;border-bottom:1px solid #f0f0f0;font-size:13px;">D\u00e9partement</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-weight:600;font-size:14px;">${data.departement}</td></tr>
    <tr><td style="padding:6px 8px;color:#888;border-bottom:1px solid #f0f0f0;font-size:13px;">Toiture</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-weight:600;font-size:14px;">${data.surfaceToiture} m\u00b2 (${data.typeToiture})</td></tr>
    <tr><td style="padding:6px 8px;color:#888;border-bottom:1px solid #f0f0f0;font-size:13px;">Prix eau</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-weight:600;font-size:14px;">${data.prixEau} \u20ac/m\u00b3</td></tr>
    <tr><td style="padding:6px 8px;color:#888;border-bottom:1px solid #f0f0f0;font-size:13px;">Usages</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-weight:600;font-size:14px;">${usages.join(", ")}</td></tr>
    <tr><td style="padding:6px 8px;color:#888;font-size:13px;">Potentiel / Besoin</td><td style="padding:6px 8px;font-weight:600;font-size:14px;">${(data.vSupply / 1000).toFixed(1)} m\u00b3 / ${(data.vDemand / 1000).toFixed(1)} m\u00b3 (${data.vSupply >= data.vDemand ? "supply OK" : "supply limit\u00e9"})</td></tr>
  </table>

  <h2 style="color:#2d5a3d;font-size:16px;margin-bottom:8px;">Options propos\u00e9es au prospect</h2>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
    ${optionsHtml}
  </table>

  </div>
</body></html>`;
}

async function sendBrevoEmail(apiKey: string, to: { email: string; name?: string }[], subject: string, htmlContent: string) {
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json; charset=utf-8",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to,
      subject,
      htmlContent,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
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
    const { turnstileToken, ...data } = body as SimulationPayload & { turnstileToken?: string };

    // V\u00e9rification Turnstile anti-bot
    const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (TURNSTILE_ENABLED && turnstileSecret) {
      if (!turnstileToken) {
        return new Response(JSON.stringify({ error: "V\u00e9rification anti-bot requise" }), {
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
        return new Response(JSON.stringify({ error: "V\u00e9rification anti-bot \u00e9chou\u00e9e" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

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
