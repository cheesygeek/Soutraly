// Modele economique issu du cahier des charges strategique (section 5-6) :
// interet emprunteur de 1,9 %/mois, reparti entre le preteur, la plateforme
// et le fonds de reserve mutualise. Ce ne sont PLUS des placeholders — ce
// sont les taux tels que decides dans le cahier des charges.

export const BORROWER_MONTHLY_RATE = 0.019;

export const LENDER_SHARE = 0.5;
export const PLATFORM_SHARE = 0.3;
export const RESERVE_SHARE = 0.2;

export function computeInterest(amount: number): number {
  return Math.round(amount * BORROWER_MONTHLY_RATE);
}

export interface InterestSplit {
  lenderShare: number;
  platformShare: number;
  reserveShare: number;
}

// Le reste (apres arrondi des deux premieres parts) va a la reserve, pour ne
// perdre aucun XOF d'arrondi plutot que de le laisser disparaitre.
export function splitInterest(interest: number): InterestSplit {
  const lenderShare = Math.round(interest * LENDER_SHARE);
  const platformShare = Math.round(interest * PLATFORM_SHARE);
  const reserveShare = interest - lenderShare - platformShare;
  return { lenderShare, platformShare, reserveShare };
}
