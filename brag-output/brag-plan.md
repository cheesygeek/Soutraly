# Soutraly — plan de la vidéo /brag-slim

**Format** : vertical 1080×1920, 30 i/s, 20 s · **Ton** : `default` tirant vers `polished` (on parle d'argent : clair, sobre, rassurant) · **Langue** : français

## Questionnaire

- **C'est quoi ?** Un service de micro-crédit entre particuliers en Côte d'Ivoire (en XOF), qui se passe entièrement dans une conversation WhatsApp avec un bot.
- **Pour qui ?** Les salariés à qui il manque un peu d'argent en fin de mois (prêt de 10 000 à 100 000 XOF sur 30 jours), et les particuliers qui veulent prêter.
- **Ce qui le distingue** : aucune app à installer, tout se fait sur WhatsApp. Les demandes s'ouvrent du 25 du mois jusqu'au 5 du mois suivant, au moment où l'argent manque. Le coût est affiché avant de confirmer (intérêt de 1,9 %).
- **Phrase forte (copie du bot)** : « La plateforme qui connecte emprunteurs et preteurs pour des prets de 30 jours. »
- **Accroche visuelle** : un calendrier qui défile jusqu'au **25** (le jour où les demandes ouvrent) et la question « Fin du mois difficile ? ».
- **Interface montrée** : la vraie conversation du bot, capturée en lançant le prototype en local, côté emprunteur puis côté prêteur. Elle est rendue avec les couleurs de `public/css/chat.css` (`#075e54`, `#dcf8c6`, `#e5ddd5`).
- **Légende de partage** : « Fin du mois difficile ? Avec Soutraly, on emprunte et on prête entre particuliers, directement sur WhatsApp. »

## Garde-fous

- **Données fictives** : « Koffi Yao » (emprunteur) et « Aminata Kone » (prêteuse) ont été créés pour la démo, dans une base de test jetable. Ni noms ni numéros ne sont affichés à l'écran.
- **Bulles reprises mot pour mot du bot** : montants (50 000 XOF, 950 XOF d'intérêt, 50 950 XOF à rembourser, 475 XOF de rendement pour le prêteur) et textes, y compris l'absence d'accents propre au bot.
- **Horloge avancée de 3 jours** pour la capture : le bot refuse les demandes en dehors du 25 → 5 (on est le 23).
- **Pas d'étape « profil vérifié ✅ »** : le README précise qu'il n'y a pas encore de vraie vérification humaine des documents, donc on ne l'affiche pas comme un argument.
- **Pas d'adresse ni de numéro** : le pilote tourne sur le sandbox Twilio. La fin de la vidéo dit « Pilote en cours · Côte d'Ivoire ».
- ⚠️ **À valider avant toute diffusion publique** : une promotion de crédit entre particuliers est encadrée dans l'UEMOA (BCEAO). À faire relire par un juriste avant de poster.

## Identité

Vert profond `#093F32` / `#0B4F3F` / `#12664F`, or `#E8C15C` / `#F4D98A`, crème `#FBEFD1` (couleurs du logo). Chat aux couleurs WhatsApp de `chat.css`. Police : Inter (police système du prototype).

## Musique

120 BPM (un temps = 0,5 s), en si bémol majeur, plus posée que Bara-kah : marimba, basse ronde, shaker discret. Coupes sur les temps. Effets dans la tonalité : chaque bulle qui arrive fait une petite note, et le financement réussi déclenche un arpège.

## Storyboard (20 s)

| # | Temps | Scène | Texte |
|---|---|---|---|
| 1 | 0–3 s | Fond vert. Une page de calendrier crème défile 21 → 22 → 23 → 24 → **25** sur les temps ; le 25 s'entoure d'or. | « Fin du mois difficile ? » |
| 2 | 3–6 s | On passe par le fond. Le logo arrive en rebond, avec « Soutraly » écrit en crème. | « Prêts de 30 jours entre particuliers, sur WhatsApp. » |
| 3 | 6–11 s | Téléphone, conversation WhatsApp « Soutraly ». Le bot demande le montant ; on tape « 50000 » ; le bot affiche le récapitulatif (intérêt 950 XOF, total 50 950 XOF) ; on touche « 1 » ; demande enregistrée. | « Emprunteur · demandez votre prêt » |
| 4 | 11–16 s | Changement de conversation (côté prêteur). Le bot liste « 50 000 XOF sur 30 jours » ; on touche « 1 » ; le rendement estimé s'affiche (475 XOF) ; on confirme ; « Pret #1 finance avec succes ! » s'illumine. | « Prêteur · financez-le » |
| 5 | 16–20 s | Fond vert, logo, slogan, mention du pilote. | « Emprunter. Prêter. Sur WhatsApp. » · « Pilote en cours · Côte d'Ivoire » |

Total : 3 + 3 + 5 + 5 + 4 = **20 s**.
