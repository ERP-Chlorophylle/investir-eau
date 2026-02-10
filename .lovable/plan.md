
# Integration Brevo : Emails de simulation et devis

## Ce qui va se passer

### Quand un utilisateur termine sa simulation (clic "Voir mon resultat") :
- **Vous** recevez un email avec les resultats complets de la simulation (departement, surface toiture, usages, options de cuves, economies estimees, email du prospect)
- **Le client** recoit un email recapitulatif de sa simulation avec ses resultats personnalises

### Quand un utilisateur demande un devis :
- **Vous** recevez un email de demande de devis (avec telephone, commentaire + rappel des resultats de simulation)
- **Le client** recoit un email de confirmation que sa demande de devis a bien ete prise en compte

## Etapes de mise en place

### 1. Cle API Brevo (prealable)
Vous devrez fournir votre cle API Brevo, a creer sur [https://app.brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api). Elle sera stockee en secret du projet (`BREVO_API_KEY`).

Il faudra aussi definir :
- Votre adresse email de reception (ex: `contact@lesjeunespousses.fr`)
- L'adresse d'envoi verifiee sur Brevo (ex: `noreply@lesjeunespousses.fr`)

### 2. Edge function `send-simulation-results`
Envoyee automatiquement a la fin de la simulation :
- **Email au client** : recapitulatif visuel (departement, surface, usages, 3 options de cuves avec volumes et couts, economies estimees)
- **Email a vous** : notification "Nouvelle simulation" avec toutes les donnees du prospect + resultats

### 3. Edge function `send-quote-request`
Envoyee quand le client clique "Envoyer ma demande" dans le formulaire de devis :
- **Email a vous** : demande de devis avec telephone, commentaire, option selectionnee et rappel des resultats de simulation
- **Email au client** : confirmation "Votre demande de devis a bien ete prise en compte"

### 4. Modifications frontend

**`src/pages/Simulateur.tsx`** : Apres le `navigate("/resultat")`, appel a la edge function `send-simulation-results` avec les inputs et resultats.

**`src/components/results/QuoteForm.tsx`** : Le `handleSubmit` appelle la edge function `send-quote-request` au lieu du simple `console.log`. On lui passe aussi les donnees de simulation (option selectionnee, economies, cout cuve).

**`src/components/results/FinancialComparison.tsx`** : Passer les donnees de simulation au `QuoteForm` (option type, economies, cout cuve, volume).

**`src/pages/Resultat.tsx`** : Passer les inputs complets au composant `FinancialComparison` pour que le devis contienne toutes les infos.

## Details techniques

### Structure des edge functions

Deux fichiers :
- `supabase/functions/send-simulation-results/index.ts`
- `supabase/functions/send-quote-request/index.ts`

Chaque fonction :
- Utilise l'API Brevo v3 (`https://api.brevo.com/v3/smtp/email`)
- Gestion CORS standard
- `verify_jwt = false` dans `supabase/config.toml`
- Lit `BREVO_API_KEY` depuis `Deno.env.get()`

### Donnees envoyees a `send-simulation-results`

```text
{
  email, departement, surfaceToiture, typeToiture,
  usages (wc, jardin, auto, piscine),
  prixEau,
  vSupply, vDemand,
  options: [{ type, label, volumeCuveM3, cout, couvertureReelle, volumeAnnuelCouvert }],
  comparisons: [{ optionType, economiesCumulees, coutCuve }]
}
```

### Donnees envoyees a `send-quote-request`

```text
{
  email, phone, comment,
  selectedOption, economiesCumulees, coutCuve,
  departement, surfaceToiture
}
```

### Emails HTML

Les emails seront en HTML simple et lisible, avec le branding "Les Jeunes Pousses" et les couleurs du site. Pas de template externe, tout inline dans les edge functions.
