import { Link } from "react-router-dom";
import { ArrowRight, Droplets, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden water-pattern py-20 md:py-32">
          <div className="container-app relative z-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="animate-slide-up">
                <span className="inline-flex items-center gap-2 rounded-full bg-water-light px-4 py-1.5 text-sm font-medium text-primary">
                  <Droplets className="h-4 w-4" />
                  Simulateur gratuit
                </span>
              </div>

              <h1 className="animate-slide-up delay-100 mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Et si votre cuve faisait{" "}
                <span className="gradient-text">mieux que votre livret</span> ?
              </h1>

              <p className="animate-slide-up delay-200 mt-6 text-lg text-muted-foreground md:text-xl">
                Comparez la valeur de vos économies d'eau avec un placement financier
                classique. Découvrez le potentiel réel d'une cuve de récupération.
              </p>

              <div className="animate-slide-up delay-300 mt-10">
                <Button asChild variant="hero" size="xl">
                  <Link to="/simulateur">
                    Lancer la simulation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-water-medium/30 blur-3xl" />
          <div className="absolute -right-20 top-20 h-64 w-64 rounded-full bg-eco-medium/30 blur-3xl" />
        </section>

        {/* Benefits Section */}
        <section className="py-20 md:py-28">
          <div className="container-app">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                Pourquoi récupérer l'eau de pluie ?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Face aux sécheresses récurrentes et à la hausse du prix de l'eau,
                la récupération devient un investissement stratégique.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {/* Benefit 1 */}
              <div className="group rounded-2xl border bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-eco-light transition-colors group-hover:bg-accent/20">
                  <TrendingUp className="h-7 w-7 text-eco-dark" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Économies durables</h3>
                <p className="mt-3 text-muted-foreground">
                  Réduisez votre facture d'eau jusqu'à 50% en utilisant l'eau de pluie
                  pour les WC, le jardin et la voiture.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="group rounded-2xl border bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-water-light transition-colors group-hover:bg-primary/20">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Autonomie renforcée</h3>
                <p className="mt-3 text-muted-foreground">
                  Sécurisez votre approvisionnement en eau face aux restrictions
                  et aux pénuries de plus en plus fréquentes.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="group rounded-2xl border bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold-light transition-colors group-hover:bg-gold/30">
                  <Droplets className="h-7 w-7 text-gold" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Contexte sécheresse</h3>
                <p className="mt-3 text-muted-foreground">
                  En 2022, plus de 1 000 communes ont connu des coupures d'eau.
                  Anticipez les prochains épisodes.
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Button asChild variant="cta" size="lg">
                <Link to="/simulateur">
                  Calculer mes économies
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
