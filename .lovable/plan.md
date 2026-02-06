

# Enrichir le gros carré bleu des économies cuve

## Constat actuel

Le carré bleu affiche seulement :
- Un gros chiffre d'économies cumulées
- Une phrase explicative générique

C'est effectivement assez vide et peu informatif pour l'utilisateur.

## Ce qui va changer

Le carré bleu va devenir un vrai **tableau de bord des économies**, avec des informations concrètes et utiles :

1. **Le chiffre principal** (conserve) -- les economies cumulees bien visibles en grand
2. **3 mini-indicateurs concrets** sous le chiffre principal :
   - Economies par an (ex: "~261 €/an")
   - Economies par mois (ex: "~22 €/mois sur votre facture")
   - Volume d'eau economise (ex: "52 m3 d'eau potable economises")
3. **Barre de progression visuelle** montrant les economies par rapport a l'investissement initial (ex: "Economies = 193% de l'investissement")
4. **Le texte explicatif** sera plus court et precis

Le tout reste dans le theme bleu eau avec les billets qui tombent et les gouttes decoratives.

## Details techniques

### Fichier modifie : `src/components/results/FinancialComparison.tsx`

- Ajouter les props `prixEau` et `volumeAnnuelCouvert` au composant (ou les calculer a partir des donnees existantes)
- Calculer dans le composant :
  - `economiesParAn = economiesCumulees / horizonAnnees`
  - `economiesParMois = economiesParAn / 12`
  - `volumeM3Total = (economiesCumulees / prixEau)` approximation, ou mieux passer le volume directement
  - `ratioInvestissement = (economiesCumulees / coutCuve) * 100`
- Ajouter une grille 3 colonnes avec les mini-indicateurs (icones Calendar, Wallet, Droplets)
- Ajouter un composant Progress de shadcn pour la barre visuelle
- Imports supplementaires : `Calendar`, `Wallet` depuis lucide-react

### Fichier modifie : `src/pages/Resultat.tsx`

- Passer les donnees supplementaires au composant `FinancialComparison` (le `volumeAnnuelCouvert` de l'option selectionnee et le `prixEau` des inputs)

### Modifications du type `FinancialComparison` dans `src/lib/calculations.ts`

- Ajouter `volumeAnnuelCouvert: number` et `prixEau: number` a l'interface `FinancialComparison` pour que le composant ait toutes les donnees necessaires

Pas de nouvelle dependance a installer.

