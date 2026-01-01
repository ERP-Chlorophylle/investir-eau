import { Link } from "react-router-dom";
import { ArrowRight, Droplets, PiggyBank, Scale, TrendingUp, Leaf, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-water-light via-background to-eco-light py-12 md:py-20">
          <div className="container-app relative z-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="animate-slide-up">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <Scale className="h-4 w-4" />
                  Comparateur gratuit
                </span>
              </div>

              <h1 className="animate-slide-up delay-100 mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                <span className="gradient-text">Cuve ou Livret A ?</span>
                <br />
                <span className="text-foreground/90">Faites le match.</span>
              </h1>

              <p className="animate-slide-up delay-200 mt-4 text-base text-muted-foreground lg:text-lg">
                Investir dans une cuve de récupération d'eau de pluie ou placer son argent sur un livret d'épargne ? 
                <strong className="text-foreground"> Découvrez quelle option vous rapporte le plus.</strong>
              </p>

              <div className="animate-slide-up delay-300 mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button asChild variant="hero" size="xl">
                  <Link to="/simulateur">
                    Comparer maintenant
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-eco-dark" />
                  Gratuit • 2 minutes • Résultat immédiat
                </div>
              </div>
            </div>
          </div>

          {/* Decorative blobs */}
          <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-water-medium/20 blur-3xl" />
          <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-eco-medium/20 blur-3xl" />
        </section>

        {/* How it works */}
        <section className="border-y bg-card py-16">
          <div className="container-app">
            <div className="grid gap-8 text-center md:grid-cols-3">
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  1
                </div>
                <h3 className="mt-4 font-semibold text-foreground">Vos données</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Toiture, usages (WC, jardin, piscine...) et prix de l'eau local
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  2
                </div>
                <h3 className="mt-4 font-semibold text-foreground">On calcule</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Volume de cuve optimal, économies d'eau, et valeur des placements
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  3
                </div>
                <h3 className="mt-4 font-semibold text-foreground">Vous comparez</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cuve vs Livret A, LDDS, CEL, PEL — voyez qui gagne
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 md:py-28">
          <div className="container-app">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                Pourquoi comparer ?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Le prix de l'eau augmente chaque année. Les taux des livrets stagnent.
                <br />
                <strong className="text-foreground">Il est temps de voir les chiffres.</strong>
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {/* Benefit 1 */}
              <div className="group rounded-2xl border bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-eco-light transition-colors group-hover:bg-eco-medium/30">
                  <TrendingUp className="h-7 w-7 text-eco-dark" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Économies croissantes</h3>
                <p className="mt-3 text-muted-foreground">
                  Le prix de l'eau augmente de <strong>+1%/an en moyenne</strong>. 
                  Vos économies s'amplifient chaque année.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="group rounded-2xl border bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-water-light transition-colors group-hover:bg-primary/20">
                  <Leaf className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Geste écologique</h3>
                <p className="mt-3 text-muted-foreground">
                  Préservez une ressource précieuse tout en faisant fructifier votre investissement.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="group rounded-2xl border bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold-light transition-colors group-hover:bg-gold/30">
                  <ShieldCheck className="h-7 w-7 text-gold" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Autonomie face aux sécheresses</h3>
                <p className="mt-3 text-muted-foreground">
                  En 2022, <strong>1 052 communes</strong> ont subi des coupures d'eau.
                  Sécurisez votre approvisionnement.
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Button asChild variant="cta" size="lg">
                <Link to="/simulateur">
                  Lancer ma simulation gratuite
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
