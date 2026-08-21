/**
 * Unit conversion + local-date helpers for the input pickers.
 * Pure functions so the arithmetic is testable without a renderer.
 */

export const CM_PER_IN = 2.54;
export const KG_PER_LB = 0.45359237;

export const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * `new Date('1998-03-14')` is parsed as UTC and lands on the previous day
 * west of Greenwich, so ISO dates are built and read in local time instead.
 */
export const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function fromIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole feet + inches, rolling 5′12″ up to 6′0″. */
export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalIn = cm / CM_PER_IN;
  let ft = Math.floor(totalIn / 12);
  let inch = Math.round(totalIn % 12);
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  return { ft, inch };
}

export const ftInToCm = (ft: number, inch: number) => round1((ft * 12 + inch) * CM_PER_IN);

/**
 * Split a decimal amount into the two dial columns (whole + tenths),
 * rolling 79.97 up to 80.0 rather than showing it as 79.10.
 */
export function splitTenths(total: number): { whole: number; tenth: number } {
  let whole = Math.floor(total);
  let tenth = Math.round((total - whole) * 10);
  if (tenth === 10) {
    whole += 1;
    tenth = 0;
  }
  return { whole, tenth };
}
