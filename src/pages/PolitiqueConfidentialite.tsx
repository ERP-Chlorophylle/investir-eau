import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function PolitiqueConfidentialite() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container-app">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              Politique de confidentialité
            </h1>

            <div className="mt-8 space-y-8 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  Responsable du traitement
                </h2>
                <p className="mt-2">
                  Les Jeunes Pousses<br />
                  Email : info@lesjeunespousses.net
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  Données collectées
                </h2>
                <p className="mt-2">
                  Dans le cadre de l'utilisation du simulateur, nous collectons les données suivantes :
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Adresse email</li>
                  <li>Code postal et département</li>
                  <li>Caractéristiques de votre toiture</li>
                  <li>Usages prévus de l'eau de pluie</li>
                  <li>Préférences de simulation (prix de l'eau, horizon)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">Finalités</h2>
                <p className="mt-2">Les données collectées sont utilisées pour :</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Générer votre rapport de simulation personnalisé</li>
                  <li>Vous envoyer le rapport par email</li>
                  <li>Traiter votre éventuelle demande de devis</li>
                  <li>
                    Si vous y avez consenti : vous envoyer notre newsletter et des informations
                    sur la récupération d'eau de pluie
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">Base légale</h2>
                <p className="mt-2">
                  Le traitement de vos données repose sur votre consentement explicite,
                  recueilli via la case à cocher obligatoire avant l'affichage des résultats.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  Durée de conservation
                </h2>
                <p className="mt-2">
                  Vos données sont conservées pendant une durée maximale de 3 ans à compter de
                  votre dernière interaction avec nous, sauf obligation légale contraire.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">Stockage</h2>
                <p className="mt-2">
                  Vos données sont stockées de manière sécurisée sur les serveurs Office 365
                  de Microsoft, dans le respect du RGPD.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">Vos droits</h2>
                <p className="mt-2">
                  Conformément au RGPD, vous disposez des droits suivants :
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Droit d'accès à vos données</li>
                  <li>Droit de rectification</li>
                  <li>Droit à l'effacement (« droit à l'oubli »)</li>
                  <li>Droit à la limitation du traitement</li>
                  <li>Droit à la portabilité</li>
                  <li>Droit d'opposition</li>
                  <li>Droit de retirer votre consentement à tout moment</li>
                </ul>
                <p className="mt-2">
                  Pour exercer ces droits, contactez-nous à : info@lesjeunespousses.net
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">Cookies</h2>
                <p className="mt-2">
                  Ce site utilise uniquement des cookies techniques essentiels au
                  fonctionnement du simulateur. Aucun cookie de tracking ou publicitaire
                  n'est utilisé.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
