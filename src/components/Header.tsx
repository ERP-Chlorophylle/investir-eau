import { Link } from "react-router-dom";

const LJP_LOGO = "https://bkoecslauxzbmkzxntdq.supabase.co/storage/v1/object/public/email-assets/image%20LJP.png";

interface HeaderProps {
  title?: string;
  mobileTitle?: string;
}

export function Header({
  title = "Simulateur d'investissements : Cuve vs Livrets",
  mobileTitle,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-app flex h-16 items-center">
        <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <img
            src={LJP_LOGO}
            alt="Les Jeunes Pousses"
            className="h-9 w-auto object-contain"
          />
          {mobileTitle ? (
            <>
              <span className="text-[clamp(0.66rem,2.3vw,1.125rem)] font-bold leading-tight text-foreground md:hidden">
                {mobileTitle}
              </span>
              <span className="hidden whitespace-nowrap text-[clamp(0.72rem,2.5vw,1.125rem)] font-bold text-foreground md:inline">
                {title}
              </span>
            </>
          ) : (
            <>
              <span className="text-[clamp(0.66rem,2.3vw,1.125rem)] font-bold leading-tight text-foreground md:hidden">
                <span className="block">Simulateur d'investissements :</span>
                <span className="block">Cuve vs Livrets</span>
              </span>
              <span className="hidden whitespace-nowrap text-[clamp(0.72rem,2.5vw,1.125rem)] font-bold text-foreground md:inline">
                {title}
              </span>
            </>
          )}
        </Link>
      </div>
    </header>
  );
}
