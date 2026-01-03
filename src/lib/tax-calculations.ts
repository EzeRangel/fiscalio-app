export function calculateISR_RESICO(
  income: number,
  declarationType: "monthly" | "bimonthly" | "annual"
): number {
  const MONTHLY_RESICO_RATES = [
    { limit: 25000.0, rate: 0.01 },
    { limit: 50000.0, rate: 0.011 },
    { limit: 83333.33, rate: 0.015 },
    { limit: 208333.33, rate: 0.02 },
    { limit: 3500000.0, rate: 0.025 },
  ];

  const ANNUAL_RESICO_RATES = [
    { limit: 300000.0, rate: 0.01 },
    { limit: 600000.0, rate: 0.011 },
    { limit: 1000000.0, rate: 0.015 },
    { limit: 2500000.0, rate: 0.02 },
    { limit: 3500000.0, rate: 0.025 },
  ];

  const ratesTable =
    declarationType === "monthly" ? MONTHLY_RESICO_RATES : ANNUAL_RESICO_RATES;

  let applicableRate = 0;

  // Find the applicable rate
  for (const range of ratesTable) {
    if (income <= range.limit) {
      applicableRate = range.rate;
      break;
    }
    // If income exceeds all limits, the last rate applies (capped at max limit)
    applicableRate = ratesTable[ratesTable.length - 1].rate;
  }

  // Ensure income does not exceed the maximum limit for calculation purposes
  const maxIncome = ratesTable[ratesTable.length - 1].limit;
  const incomeForCalculation = Math.min(income, maxIncome);

  return incomeForCalculation * applicableRate;
}
