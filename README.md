# Soutraly — Prototype

Depot : [github.com/cheesygeek/Soutraly](https://github.com/cheesygeek/Soutraly)

Plateforme de micro-credit entre particuliers (Cote d'Ivoire, XOF) : les emprunteurs
demandent un pret de 30 jours (10 000 a 100 000 XOF), les preteurs les financent, la
plateforme prend des frais et fait office de marketplace + broker.

Le moteur de conversation (`dispatch()`) est partage par deux points d'entree :
un **chat web** qui imite WhatsApp (pratique pour tester sans telephone) et un
**webhook Twilio WhatsApp Sandbox** pour discuter avec le bot depuis un vrai
WhatsApp — voir [Brancher WhatsApp](#brancher-whatsapp-twilio-sandbox--deploiement-railway)
plus bas.

## Lancer le projet

Prerequis : Node.js 20+.

```bash
npm install
npm run dev
```

Le serveur demarre sur `http://localhost:3000` :

- `/` — chat web (entrer un numero de telephone simule pour demarrer une conversation)
- `/admin.html` — vue de suivi du pilote (utilisateurs, prets, frais collectes),
  protegee par `ADMIN_USERNAME` / `ADMIN_PASSWORD` (a definir dans `.env`, sinon
  impossible de s'y connecter meme en local)

La base de donnees SQLite est creee automatiquement dans `data/soutraly.db` au
premier lancement, les justificatifs KYC recus dans `data/kyc-uploads/`.

## Structure

```
src/
  db/          schema SQL, connexion SQLite, requetes par entite
  config/      regles de pret (fixes), frais (placeholders a valider), config Twilio
  bot/         moteur de conversation (state machine) et un handler par etat
  services/    logique metier : demande de pret, financement, remboursement, retards
  whatsapp/    utilitaires specifiques au canal WhatsApp (normalisation de numero)
  routes/      endpoints Express (chat web, admin, dev, webhook WhatsApp)
  jobs/        verification periodique des prets en retard
public/        interface de chat (vanilla JS) + dashboard admin
```

## Points d'attention

- **Frais** ([src/config/fees.ts](src/config/fees.ts)) : pourcentages placeholder,
  non issus du document produit (qui ne fixe aucun taux). A valider avant tout
  pilote avec de vrais montants.
- **KYC** : demande desormais de vrais documents (photo ou PDF, jamais de texte).
  Emprunteur : piece d'identite **puis** contrat de travail (deux fichiers,
  demandes l'un apres l'autre). Preteur : piece d'identite seule. Stockes sur le
  disque (`data/kyc-uploads/`, jamais commite — voir `.gitignore`) et consultables
  depuis l'admin (liens "ID" / "Contrat" separes). Formats acceptes :
  JPEG/PNG/WebP/PDF, 10 Mo max (voir [src/whatsapp/mediaStorage.ts](src/whatsapp/mediaStorage.ts)).
  Le statut reste auto-verifie a la reception des fichiers : **aucune verification
  humaine du contenu**, ce n'est qu'une collecte de documents, pas un vrai controle KYC.
- **WhatsApp reel** : branche via Twilio WhatsApp Sandbox (voir section dediee
  ci-dessous). Le sandbox est gratuit mais limite a des fins de pilote — chaque
  participant doit "join" manuellement et les sessions expirent apres 72h
  d'inactivite. Passer a un expediteur WhatsApp de production (Twilio ou Meta
  Cloud API) avant un vrai lancement.

## Tester le parcours de retard sans attendre 30 jours

Des endpoints dev (non proteges, a ne pas exposer en production) permettent de
forcer le passage en retard :

```bash
# Antidater l'echeance d'un pret
curl -X POST http://localhost:3000/api/dev/loans/<ID>/backdate -H "Content-Type: application/json" -d '{"daysAgo":1}'

# Declencher le controle de retard immediatement
curl -X POST http://localhost:3000/api/dev/run-late-check
```

## Rappel automatique avant echeance

Un job ([src/jobs/loanReminderJob.ts](src/jobs/loanReminderJob.ts), verifie toutes
les heures) envoie un message WhatsApp proactif aux emprunteurs dont le pret
arrive a echeance dans les `REMINDER_DAYS_BEFORE_DUE` jours
([src/config/loanRules.ts](src/config/loanRules.ts), 2 jours par defaut). Chaque
pret n'est rappele qu'une fois (`reminder_sent_at`) ; un envoi qui echoue n'est
pas marque comme fait et sera retente au prochain cycle.

**A savoir** : WhatsApp n'autorise l'envoi de texte libre que dans les 24h
suivant le dernier message de l'utilisateur — passe ce delai, Meta peut
rejeter l'envoi tant qu'aucun message-modele pre-approuve n'est utilise. Comme
un rappel arrive typiquement plusieurs jours apres la derniere interaction, il
est probable qu'il faille a terme soumettre un modele de message a Meta pour
que les rappels passent de maniere fiable — a valider en conditions reelles.

Pour tester sans attendre :

```bash
# Antidater l'echeance d'un pret pour la rapprocher (valeur negative = dans le futur)
curl -X POST http://localhost:3000/api/dev/loans/<ID>/backdate -H "Content-Type: application/json" -d '{"daysAgo":-1}'

# Declencher le controle de rappel immediatement
curl -X POST http://localhost:3000/api/dev/run-reminder-check
```

## Brancher WhatsApp (Twilio Sandbox) + deploiement Railway

Le webhook (`POST /webhook/whatsapp`, voir [src/routes/whatsappWebhook.ts](src/routes/whatsappWebhook.ts))
reutilise exactement le meme moteur de conversation que le chat web — aucune
difference de logique entre les deux canaux. Pour l'activer avec de vrais
numeros, il faut un compte Twilio et un hebergeur avec une URL publique
HTTPS stable (Railway ici).

### 1. Creer le compte Twilio et activer le Sandbox

1. Creer un compte gratuit sur [twilio.com](https://www.twilio.com).
2. Dans la Console : **Messaging → Try it out → Send a WhatsApp message** pour
   activer le Sandbox. Noter le numero du sandbox et le code de jonction
   (`join <mot-code>`).
3. Sur la page d'accueil de la Console, copier l'**Account SID** et l'**Auth
   Token** (les deux sont necessaires : le premier pour telecharger les photos/PDF
   envoyes par les utilisateurs, le second pour valider les messages entrants).

### 2. Deployer sur Railway

1. Sur [railway.app](https://railway.app) : **New Project → Deploy from GitHub repo**,
   choisir `cheesygeek/Soutraly`.
2. Ajouter un **Volume** au service, monte sur `/data` (persistance de la base
   SQLite entre les redeploiements).
3. Variables d'environnement du service :
   - `DB_PATH=/data/soutraly.db`
   - `TWILIO_AUTH_TOKEN=<copie depuis la Console Twilio>`
   - `TWILIO_ACCOUNT_SID=<copie depuis la Console Twilio>`
   - `TWILIO_WHATSAPP_FROM=<numero expediteur, ex: +14155238886 pour le sandbox>`
     (necessaire pour les rappels de pret sortants — voir plus bas)
   - `ADMIN_USERNAME=` / `ADMIN_PASSWORD=` (choisis toi-meme — protegent
     `/admin.html`, qui donne desormais acces a de vrais documents d'identite)
   - `PORT` : deja injecte automatiquement par Railway, rien a faire.
   - `PUBLIC_BASE_URL` : optionnel — si absent, le serveur utilise automatiquement
     `RAILWAY_PUBLIC_DOMAIN` (expose par Railway). A definir explicitement si un
     domaine personnalise est utilise.
4. Railway detecte automatiquement `npm run build` puis `npm start` (Nixpacks).
   Les justificatifs KYC sont sauvegardes a cote du fichier SQLite, donc sur le
   meme volume `/data` — aucune configuration supplementaire necessaire.

### 3. Configurer le webhook cote Twilio

Une fois le premier deploiement termine et le domaine public Railway connu :
dans la Console Twilio, Sandbox Settings → **"WHEN A MESSAGE COMES IN"** →
`https://<domaine-railway>/webhook/whatsapp`, methode **POST**.

### 4. Faire rejoindre les participants du pilote

Chaque participant doit envoyer `join <mot-code>` au numero Twilio Sandbox
depuis son propre WhatsApp avant que ses messages n'atteignent le bot — c'est
Twilio qui intercepte ce message, rien a gerer cote code.

**A savoir** : les sessions du Sandbox gratuit expirent apres **72h
d'inactivite par participant** (il faudra renvoyer `join` apres une pause). Pas
de limite de ce type avec un expediteur de production (payant).

### Verifier la securite du webhook

Chaque requete entrante est validee via la signature `X-Twilio-Signature`
(voir `TWILIO_AUTH_TOKEN` + `PUBLIC_BASE_URL` dans
[src/config/whatsapp.ts](src/config/whatsapp.ts)) — une requete sans signature
valide est rejetee en 403, meme avec le bon format de donnees :

```bash
curl -X POST https://<domaine>/webhook/whatsapp -d "From=whatsapp:+225...&Body=test"
# → 403 Signature Twilio invalide.
```

## Logo

Le logo est dans [branding/soutraly-logo.png](branding/soutraly-logo.png) (1280×1280,
source editable dans [branding/logo-source.html](branding/logo-source.html), regenerable
via Chrome headless : `Google Chrome --headless=new --screenshot=out.png --window-size=640,640 --force-device-scale-factor=2 file://.../logo-source.html`).

**Limite du Sandbox Twilio** : le numero de test (`+1 415 523 8886`) est partage
entre tous les comptes Twilio — impossible d'y appliquer une photo de profil
personnalisee. Le logo ne pourra etre affiche comme photo de profil WhatsApp
qu'une fois passe a un expediteur de production (numero dedie, via Twilio ou
directement le WhatsApp Business Manager de Meta).

## Scripts

- `npm run dev` — serveur de developpement avec rechargement automatique
- `npm run build` — compilation TypeScript vers `dist/` (copie aussi `schema.sql`)
- `npm start` — lance la version compilee
