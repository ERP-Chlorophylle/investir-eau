

## Plan : Migration vers Microsoft Graph API

### Contexte du problème
Supabase Edge Functions utilisent Deno Deploy, qui **bloque les ports SMTP 25, 465 et 587**. C'est pourquoi denomailer ne fonctionne pas, quelle que soit la configuration.

### Solution : Utiliser Microsoft Graph API

Microsoft Graph API permet d'envoyer des emails via HTTPS (port 443), qui n'est pas bloqué.

### Étape 1 : Créer une application Azure AD

1. Aller sur https://portal.azure.com
2. Naviguer vers **Azure Active Directory** > **Inscriptions d'applications**
3. Cliquer sur **Nouvelle inscription**
4. Nom : "Investir Eau - Emails"
5. Type de compte : "Comptes dans cet annuaire d'organisation uniquement"
6. Cliquer sur **Inscrire**

### Étape 2 : Configurer les permissions

1. Dans l'application créée, aller dans **Autorisations de l'API**
2. Cliquer sur **Ajouter une autorisation** > **Microsoft Graph** > **Autorisations d'application**
3. Ajouter : `Mail.Send`
4. Cliquer sur **Accorder le consentement administrateur**

### Étape 3 : Créer un secret client

1. Aller dans **Certificats et secrets**
2. Cliquer sur **Nouveau secret client**
3. Copier la valeur du secret (elle ne sera plus visible après)

### Étape 4 : Récupérer les identifiants

Noter ces 3 valeurs :
- **Tenant ID** (ID de l'annuaire) - visible dans Vue d'ensemble
- **Client ID** (ID d'application) - visible dans Vue d'ensemble  
- **Client Secret** - créé à l'étape 3

### Étape 5 : Ajouter les secrets Supabase

Configurer 3 nouveaux secrets :
- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`

### Étape 6 : Modifier les Edge Functions

Remplacer denomailer par des appels à Microsoft Graph API :

```typescript
// Obtenir un token d'accès
const tokenResponse = await fetch(
  `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
  {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: "https://graph.microsoft.com/.default",
    }),
  }
);

// Envoyer l'email via Graph API
await fetch(
  `https://graph.microsoft.com/v1.0/users/info@lesjeunespousses.net/sendMail`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: "Sujet de l'email",
        body: { contentType: "HTML", content: htmlContent },
        toRecipients: [{ emailAddress: { address: "destinataire@email.com" } }],
      },
    }),
  }
);
```

### Étape 7 : Mettre à jour les deux Edge Functions

- `send-simulation-notification/index.ts`
- `send-quote-request/index.ts`

Les templates HTML des emails restent identiques.

### Résultat attendu

| Avantage | Description |
|----------|-------------|
| Port HTTPS 443 | Non bloqué par Deno Deploy |
| Emails natifs Office 365 | Envoyés directement depuis votre boîte |
| Pas de service tiers | Tout reste dans votre écosystème Microsoft |
| Réponses directes | Les destinataires peuvent répondre à info@lesjeunespousses.net |

### Prérequis

Vous devez avoir un accès administrateur à votre compte Microsoft 365 / Azure AD pour créer l'application et accorder les permissions.

