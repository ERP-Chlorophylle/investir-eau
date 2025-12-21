import { AlertTriangle, ExternalLink } from "lucide-react";

export function DroughtAlert() {
  return (
    <div className="rounded-xl border-2 border-gold/50 bg-gold-light p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/20">
          <AlertTriangle className="h-5 w-5 text-gold" />
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">
            Contexte sécheresse en France
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              • En 2022, <span className="font-medium text-foreground">1 052 communes</span> ont
              connu des coupures d'eau au plus fort de l'été.
            </li>
            <li>
              • Au 30 août 2022 :{" "}
              <span className="font-medium text-foreground">93 départements sur 96</span> avaient
              des restrictions, dont 79 au niveau crise.
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Sources : Bilan sécheresse 2022 / Rapport interministériel
          </p>
        </div>
      </div>
    </div>
  );
}
