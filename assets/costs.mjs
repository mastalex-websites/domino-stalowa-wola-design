export function calculatePurchaseCosts({ price, apartment, landRegister, taxRate, commissionRate }) {
  const empty = { pcc: 0, notary: 0, vat: 0, agency: 0, court: 0, copies: 0, application: 0, fees: 0, total: 0 };
  if (!Number.isFinite(price) || price <= 0) return empty;

  const brackets = [
    { ceiling: 3000, lower: 0, base: 100, rate: 0 },
    { ceiling: 10000, lower: 3000, base: 100, rate: 0.03 },
    { ceiling: 30000, lower: 10000, base: 310, rate: 0.02 },
    { ceiling: 60000, lower: 30000, base: 710, rate: 0.01 },
    { ceiling: 1000000, lower: 60000, base: 1010, rate: 0.004 },
    { ceiling: 2000000, lower: 1000000, base: 4770, rate: 0.002 },
    { ceiling: Infinity, lower: 2000000, base: 6770, rate: 0.002 }
  ];
  const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
  const bracket = brackets.find(item => price <= item.ceiling);
  const fullNotaryFee = Math.min(10000, bracket.base + (price - bracket.lower) * bracket.rate);
  const notary = round(apartment ? fullNotaryFee / 2 : fullNotaryFee);
  const pcc = round(price * taxRate / 100);
  const vat = round(notary * 0.23);
  const agency = round(price * commissionRate / 100);
  const hasCourtFees = !apartment || landRegister;
  const court = hasCourtFees ? 200 : 0;
  const application = hasCourtFees ? 246 : 0;
  const copies = 200;
  const fees = round(pcc + notary + vat + agency + court + application + copies);
  return { pcc, notary, vat, agency, court, copies, application, fees, total: round(price + fees) };
}
