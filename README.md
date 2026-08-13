# Soutraly — Prototype

Depot : [github.com/cheesygeek/Soutraly](https://github.com/cheesygeek/Soutraly)

Plateforme de micro-credit entre particuliers (Cote d'Ivoire, XOF) : les emprunteurs
demandent un pret de 30 jours (50 000 a 500 000 XOF), les preteurs les financent, la
plateforme prend des frais et fait office de marketplace + broker.

Ce prototype **simule WhatsApp via un chat web** (look et menus numerotes façon
WhatsApp) — aucune connexion a l'API WhatsApp reelle (Meta/Twilio) pour l'instant.
Il sert a valider la logique conversationnelle et metier avant de brancher WhatsApp
et de lancer le pilote a 10 personnes.

## Lancer le projet

Prerequis : Node.js 20+.

```bash
npm install
npm run dev
```

Le serveur demarre sur `http://localhost:3000` :

- `/` — chat web (entrer un numero de telephone simule pour demarrer une conversation)
- `/admin.html` — vue de suivi du pilote (utilisateurs, prets, frais collectes)

La base de donnees SQLite est creee automatiquement dans `data/soutraly.db` au
premier lancement.

## Structure

```
src/
  db/          schema SQL, connexion SQLite, requetes par entite
  config/      regles de pret (fixes) et frais (placeholders a valider)
  bot/         moteur de conversation (state machine) et un handler par etat
  services/    logique metier : demande de pret, financement, remboursement, retards
  routes/      endpoints Express (chat, admin, dev)
  jobs/        verification periodique des prets en retard
public/        interface de chat (vanilla JS) + dashboard admin
```

## Points d'attention

- **Frais** ([src/config/fees.ts](src/config/fees.ts)) : pourcentages placeholder,
  non issus du document produit (qui ne fixe aucun taux). A valider avant tout
  pilote avec de vrais montants.
- **KYC** : auto-verifie a la reception d'un texte quelconque (pas de vraie
  verification de piece/contrat) — suffisant pour tester le parcours, pas pour
  un vrai pilote.
- **WhatsApp reel** : a brancher dans une phase ulterieure (Meta Cloud API ou
  Twilio), une fois la logique conversationnelle validee via ce chat web.

## Tester le parcours de retard sans attendre 30 jours

Des endpoints dev (non proteges, a ne pas exposer en production) permettent de
forcer le passage en retard :

```bash
# Antidater l'echeance d'un pret
curl -X POST http://localhost:3000/api/dev/loans/<ID>/backdate -H "Content-Type: application/json" -d '{"daysAgo":1}'

# Declencher le controle de retard immediatement
curl -X POST http://localhost:3000/api/dev/run-late-check
```

## Scripts

- `npm run dev` — serveur de developpement avec rechargement automatique
- `npm run build` — compilation TypeScript vers `dist/`
- `npm start` — lance la version compilee
