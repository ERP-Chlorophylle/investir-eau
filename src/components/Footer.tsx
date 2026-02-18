import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container-app py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/mentions-legales" className="transition-colors hover:text-foreground">
              Mentions légales
            </Link>
            <Link to="/politique-confidentialite" className="transition-colors hover:text-foreground">
              Politique de confidentialité
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Les Jeunes Pousses
          </p>
        </div>
      </div>
    </footer>
  );
}
