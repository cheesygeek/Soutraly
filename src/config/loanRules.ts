// Bornes de pret decidees par le porteur du projet (mises a jour le 2026-08-13,
// remplacent les 50k-500k du one-pager initial).

export const LOAN_MIN_AMOUNT = 10_000; // XOF
export const LOAN_MAX_AMOUNT = 100_000; // XOF
export const LOAN_TENOR_DAYS = 30;

// Fenetre d'emprunt calee sur la fin de mois (cahier des charges, section 4) :
// du jour BORROWING_WINDOW_OPEN_DAY jusqu'a la fin du mois, puis du 1er
// jusqu'au jour BORROWING_WINDOW_CLOSE_DAY inclus du mois suivant.
export const BORROWING_WINDOW_OPEN_DAY = 25;
export const BORROWING_WINDOW_CLOSE_DAY = 5;

// Rappel automatique envoye avant l'echeance du remboursement.
export const REMINDER_DAYS_BEFORE_DUE = 2;
