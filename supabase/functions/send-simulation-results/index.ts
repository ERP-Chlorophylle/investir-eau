import { serve } from "std/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER_EMAIL = "info@lesjeunespousses.net";
const SENDER_NAME = "Les Jeunes Pousses";
// À réactiver plus tard : "info@lesjeunespousses.net", "waterlife@lesjeunespousses.net"
const ADMIN_EMAILS = ["ia@hchlorophylle.fr"];
const TURNSTILE_ENABLED = false;

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

  // Bloc hero financier
  const heroFinancialHtml = bestSpread !== null
    ? cuveWins
      ? `
      <div style="margin:0 0 24px;border-radius:12px;background:linear-gradient(135deg,#0b6e27,#1a9e3f);padding:24px;text-align:center;">
        <div style="font-size:13px;color:#c8e6c9;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:8px;">Votre cuve rapporte plus qu'un Livret A</div>
        <div style="font-size:36px;font-weight:800;color:#fff;margin-bottom:4px;">+${formatNumber(bestSpread)} \u20ac</div>
        <div style="font-size:14px;color:#a5d6a7;">de gain suppl\u00e9mentaire sur 10 ans vs Livret A</div>
        <div style="margin-top:12px;display:inline-block;padding:6px 16px;border-radius:999px;background:rgba(255,255,255,0.2);color:#fff;font-size:12px;font-weight:600;">
          Cuve ${optionTitle(bestType)} ${formatNumber(bestOption.volumeCuveM3 * 1000)} L &bull; ${formatNumber(bestComp.economiesCumulees)} \u20ac d'\u00e9conomies cumul\u00e9es
        </div>
      </div>`
      : `
      <div style="margin:0 0 24px;border-radius:12px;background:linear-gradient(135deg,#1565c0,#1e88e5);padding:24px;text-align:center;">
        <div style="font-size:13px;color:#bbdefb;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:8px;">\u00c9conomies d'eau estim\u00e9es</div>
        <div style="font-size:36px;font-weight:800;color:#fff;margin-bottom:4px;">${formatNumber(bestComp.economiesCumulees)} \u20ac</div>
        <div style="font-size:14px;color:#90caf9;">d'\u00e9conomies cumul\u00e9es sur 10 ans</div>
        <div style="margin-top:12px;display:inline-block;padding:6px 16px;border-radius:999px;background:rgba(255,255,255,0.2);color:#fff;font-size:12px;font-weight:600;">
          + r\u00e9silience en cas de s\u00e9cheresse ou restriction d'eau
        </div>
      </div>`
    : "";

  // Bloc comparaison livrets
  const allLivrets = (bestComp.livrets ?? []).filter((livret) => VISIBLE_LIVRET_IDS.has(livret.id));
  const livretComparisonHtml = allLivrets.length > 0
    ? `
      <div style="margin-bottom:24px;border-radius:12px;border:1px solid #e0e0e0;overflow:hidden;">
        <div style="background:#f5f5f5;padding:12px 16px;font-size:14px;font-weight:700;color:#333;">
          Cuve vs Livrets d'\u00e9pargne (sur 10 ans)
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr style="background:#fafafa;">
            <td style="padding:8px 16px;font-size:12px;font-weight:700;color:#888;border-bottom:1px solid #e8e8e8;">Placement</td>
            <td align="right" style="padding:8px 16px;font-size:12px;font-weight:700;color:#888;border-bottom:1px solid #e8e8e8;">Int\u00e9r\u00eats</td>
            <td align="right" style="padding:8px 16px;font-size:12px;font-weight:700;color:#888;border-bottom:1px solid #e8e8e8;">Avantage cuve</td>
          </tr>
          ${allLivrets.map((l) => {
            const capitalRef = typeof bestComp.capitalReference === "number" ? bestComp.capitalReference : (bestComp.coutCuve ?? 29500);
            const interets = l.valeurFuture - capitalRef;
            const avantage = bestComp.economiesCumulees - interets;
            const color = avantage > 0 ? "#2e7d32" : "#c62828";
            const sign = avantage > 0 ? "+" : "";
            return `<tr>
              <td style="padding:10px 16px;font-size:14px;color:#333;border-bottom:1px solid #f0f0f0;">${l.name}</td>
              <td align="right" style="padding:10px 16px;font-size:14px;color:#666;border-bottom:1px solid #f0f0f0;">${formatNumber(interets)} \u20ac</td>
              <td align="right" style="padding:10px 16px;font-size:14px;font-weight:700;color:${color};border-bottom:1px solid #f0f0f0;">${sign}${formatNumber(avantage)} \u20ac</td>
            </tr>`;
          }).join("")}
          <tr style="background:#e8f5e9;">
            <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#2d5a3d;">Cuve ${optionTitle(bestType)}</td>
            <td align="right" style="padding:10px 16px;font-size:14px;font-weight:700;color:#2d5a3d;" colspan="2">${formatNumber(bestComp.economiesCumulees)} \u20ac d'\u00e9conomies</td>
          </tr>
        </table>
      </div>`
    : "";

  const optionsHtml = data.options
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

  const ctaUrl = "https://investir-eau.lesjeunespousses.net";
  const logoUrl = `${ctaUrl}/image%20LJP.png`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f4;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr><td align="center" bgcolor="#2d5a3d" style="padding:32px 24px;background-color:#2d5a3d;background-image:linear-gradient(135deg,#1e4a2e,#3a7a52);">
        <div style="margin-bottom:12px;">
          <img src="${logoUrl}" alt="Les Jeunes Pousses" style="height:44px;width:auto;display:inline-block;" />
        </div>
        <div style="font-size:26px;font-weight:800;line-height:1.25;color:#fff;">Vos r\u00e9sultats de simulation</div>
        <div style="margin-top:8px;font-size:14px;line-height:1.3;color:#a5d6a7;">R\u00e9cup\u00e9ration d'eau de pluie</div>
      </td></tr>
    </table>

    <div style="padding:24px;">

      ${heroFinancialHtml}

      <h2 style="color:#2d5a3d;font-size:16px;margin-top:0;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Votre configuration</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:8px 0;color:#888;font-size:14px;border-bottom:1px solid #f0f0f0;">D\u00e9partement</td><td style="padding:8px 0;font-weight:600;font-size:14px;border-bottom:1px solid #f0f0f0;">${data.departement}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-size:14px;border-bottom:1px solid #f0f0f0;">Surface toiture</td><td style="padding:8px 0;font-weight:600;font-size:14px;border-bottom:1px solid #f0f0f0;">${data.surfaceToiture} m\u00b2</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-size:14px;border-bottom:1px solid #f0f0f0;">Prix de l'eau</td><td style="padding:8px 0;font-weight:600;font-size:14px;border-bottom:1px solid #f0f0f0;">${data.prixEau} \u20ac/m\u00b3</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-size:14px;">Usages</td><td style="padding:8px 0;font-weight:600;font-size:14px;">${usages.join(", ")}</td></tr>
      </table>

      <div style="background:linear-gradient(135deg,#e8f5e9,#f1f8e9);border-radius:10px;padding:16px;margin-bottom:24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td style="width:50%;">
              <div style="font-size:12px;color:#666;margin-bottom:4px;">Potentiel r\u00e9cup\u00e9rable</div>
              <div style="font-size:22px;font-weight:800;color:#2d5a3d;">${(data.vSupply / 1000).toFixed(1)} m\u00b3/an</div>
            </td>
            <td style="width:50%;">
              <div style="font-size:12px;color:#666;margin-bottom:4px;">Besoin annuel</div>
              <div style="font-size:22px;font-weight:800;color:#1565c0;">${(data.vDemand / 1000).toFixed(1)} m\u00b3/an</div>
            </td>
          </tr>
        </table>
      </div>

      <h2 style="color:#2d5a3d;font-size:16px;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Options de cuves recommand\u00e9es</h2>
      <div style="margin-bottom:24px;">${optionsHtml}</div>

      ${livretComparisonHtml}

      <div style="text-align:center;margin:32px 0 16px;">
        <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#2d5a3d,#3a7a52);color:#fff;text-decoration:none;border-radius:999px;font-size:16px;font-weight:700;box-shadow:0 4px 12px rgba(45,90,61,0.3);">
          Demander un devis gratuit
        </a>
        <div style="margin-top:10px;font-size:12px;color:#999;">R\u00e9ponse sous 48h</div>
      </div>

      <div style="margin-top:24px;padding:14px;border-radius:8px;background:#fff8e1;border:1px solid #ffe082;">
        <div style="font-size:13px;color:#795548;line-height:1.5;">
          <strong>Le saviez-vous ?</strong> Le prix de l'eau augmente en moyenne de 3% par an en France.
          Sur 10 ans, votre cuve devient un v\u00e9ritable investissement qui se rentabilise
          tout en vous prot\u00e9geant des restrictions d'eau li\u00e9es aux s\u00e9cheresses.
        </div>
      </div>

      <div style="margin-top:32px;border-top:1px solid #e8f5e9;padding-top:24px;">
        <div style="text-align:center;margin-bottom:16px;">
          <div style="font-size:13px;font-weight:700;color:#2d5a3d;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Nos services</div>
          <div style="font-size:12px;color:#888;">Les Jeunes Pousses &bull; Conseil, fourniture et installation</div>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:4px;" align="center" width="33%">
              <a href="${ctaUrl}" style="display:block;padding:10px 8px;background:#2d5a3d;color:#fff;text-decoration:none;border-radius:8px;font-size:12px;font-weight:700;text-align:center;">\uD83D\uDCCB Demander un devis</a>
            </td>
            <td style="padding:4px;" align="center" width="33%">
              <a href="https://lesjeunespousses.net/" style="display:block;padding:10px 8px;background:#f0f7f0;color:#2d5a3d;text-decoration:none;border-radius:8px;font-size:12px;font-weight:700;text-align:center;border:1px solid #c8e6c9;">\uD83C\uDF31 Notre site web</a>
            </td>
            <td style="padding:4px;" align="center" width="33%">
              <a href="${ctaUrl}" style="display:block;padding:10px 8px;background:#f0f7f0;color:#2d5a3d;text-decoration:none;border-radius:8px;font-size:12px;font-weight:700;text-align:center;border:1px solid #c8e6c9;">\uD83D\uDCA7 Simuler \u00e0 nouveau</a>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div style="background:#2d5a3d;padding:20px;text-align:center;">
      <div style="font-size:13px;color:#a5d6a7;margin-bottom:4px;">Les Jeunes Pousses</div>
      <div style="font-size:11px;color:#81c784;">R\u00e9cup\u00e9ration d'eau de pluie &bull; Conseil et installation</div>
      <div style="margin-top:8px;font-size:11px;color:#81c784;"><a href="https://lesjeunespousses.net/" style="color:#a5d6a7;text-decoration:none;">lesjeunespousses.net</a></div>
    </div>
  </div>
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

  const logoUrl = "https://investir-eau.lesjeunespousses.net/image%20LJP.png";
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
