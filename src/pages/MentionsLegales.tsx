import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function MentionsLegales() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container-app">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              Mentions légales
            </h1>

            <div className="mt-8 space-y-8 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground">Éditeur du site</h2>
                <p className="mt-2">
                  Les Jeunes Pousses<br />
                  Email : info@lesjeunespousses.net
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">Hébergement</h2>
                <p className="mt-2">
                  Ce site est hébergé par Lovable.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  Propriété intellectuelle
                </h2>
                <p className="mt-2">
                  L'ensemble du contenu de ce site (textes, images, graphismes, logo, icônes,
                  etc.) est la propriété exclusive de Les Jeunes Pousses, sauf mention contraire.
                  Toute reproduction, représentation, modification, publication, adaptation de
                  tout ou partie des éléments du site est interdite.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  Limitation de responsabilité
                </h2>
                <p className="mt-2">
                  Les informations fournies par ce simulateur sont données à titre indicatif.
                  Elles ne constituent pas un engagement contractuel et peuvent varier selon
                  les conditions réelles d'installation et d'utilisation.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">Sources</h2>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Bilan sécheresse 2022 - Ministère de la Transition écologique</li>
                  <li>Rapport interministériel sur la gestion de l'eau</li>
                  <li>Données climatiques : Météo France</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
