/**
 * Tax calculator utility for Irish tax calculations
 */

/**
 * Calculate income tax based on Irish tax rates
 * @param {number} income - Gross income
 * @param {number} deductions - Total deductions
 * @param {number} taxCredits - Total tax credits
 * @returns {Object} - Tax calculation results
 */
export const calculateTax = (income, deductions, taxCredits) => {
  // Default values if inputs are not provided
  const grossIncome = Number(income) || 0;
  const totalDeductions = Number(deductions) || 0;
  const totalTaxCredits = Number(taxCredits) || 0;

  // Calculate taxable income
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  // 2023 Irish tax rates
  const standardRateCutoff = 36800; // Standard rate band for single person
  const standardRate = 0.2; // 20%
  const higherRate = 0.4; // 40%

  // Calculate tax
  let taxAtStandardRate = 0;
  let taxAtHigherRate = 0;

  if (taxableIncome <= standardRateCutoff) {
    taxAtStandardRate = taxableIncome * standardRate;
  } else {
    taxAtStandardRate = standardRateCutoff * standardRate;
    taxAtHigherRate = (taxableIncome - standardRateCutoff) * higherRate;
  }

  const grossTax = taxAtStandardRate + taxAtHigherRate;
  
  // Apply tax credits
  const netTax = Math.max(0, grossTax - totalTaxCredits);

  // USC (Universal Social Charge) - simplified calculation
  let usc = 0;
  if (grossIncome > 13000) {
    // Simplified USC calculation
    if (grossIncome <= 22920) {
      usc = grossIncome * 0.02; // 2% rate for simplicity
    } else {
      usc = 22920 * 0.02 + (grossIncome - 22920) * 0.045; // 2% up to €22,920, 4.5% thereafter (simplified)
    }
  }

  // PRSI (Pay Related Social Insurance) - simplified calculation
  const prsi = grossIncome > 18304 ? grossIncome * 0.04 : 0; // 4% for most employees

  // Total tax liability
  const totalTaxLiability = netTax + usc + prsi;
  
  // Net income after tax
  const netIncome = grossIncome - totalTaxLiability;

  // Effective tax rate
  const effectiveTaxRate = grossIncome > 0 ? (totalTaxLiability / grossIncome) * 100 : 0;

  return {
    grossIncome,
    taxableIncome,
    taxAtStandardRate,
    taxAtHigherRate,
    grossTax,
    taxCredits: totalTaxCredits,
    netTax,
    usc,
    prsi,
    totalTaxLiability,
    netIncome,
    effectiveTaxRate: effectiveTaxRate.toFixed(2)
  };
};
