import { Link } from "react-router-dom";
import { Droplets } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-app flex h-16 items-center">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Droplets className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="whitespace-nowrap text-[clamp(0.72rem,2.5vw,1.125rem)] font-bold text-foreground">
            Simulateur d'investissement Cuve vs Livrets
          </span>
        </Link>
      </div>
    </header>
  );
}
