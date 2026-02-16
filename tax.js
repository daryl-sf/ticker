// UK tax bands and thresholds (all amounts in GBP)
const PERSONAL_ALLOWANCE = 12570;
const BASIC_LIMIT = 50270;
const HIGHER_LIMIT = 125140;

/**
 * Estimate UK income tax and employee NI on an exercise gain.
 * All parameters and return values are in GBP.
 * @param {number} annualSalary - Gross annual salary (GBP)
 * @param {number} exerciseGain - Gain from exercise (GBP)
 */
const calculateUkPayeOnExercise = (annualSalary, exerciseGain) => {
  if (exerciseGain <= 0) {
    return {
      tax: 0,
      ni: 0,
      totalDeductions: 0,
      afterTaxGain: exerciseGain
    };
  }

  const adjustedAllowance = calculatePersonalAllowance(annualSalary);
  const taxableSalary = Math.max(0, annualSalary - adjustedAllowance);

  const taxBefore = incomeTaxDue(taxableSalary);
  const taxAfter = incomeTaxDue(taxableSalary + exerciseGain);

  const taxOnExercise = taxAfter - taxBefore;

  const niBefore = employeeNiDue(annualSalary, 0);
  const niAfter = employeeNiDue(annualSalary, exerciseGain);

  const niOnExercise = niAfter - niBefore;

  const totalDeductions = taxOnExercise + niOnExercise;

  return {
    tax: taxOnExercise,
    ni: niOnExercise,
    totalDeductions,
    afterTaxGain: exerciseGain - totalDeductions
  };
};

const calculatePersonalAllowance = (salary) => {
  if (salary <= 100000) return PERSONAL_ALLOWANCE;

  const reduction = Math.min(
    PERSONAL_ALLOWANCE,
    Math.floor((salary - 100000) / 2)
  );

  return PERSONAL_ALLOWANCE - reduction;
};

const incomeTaxDue = (taxableIncome) => {
  const basicBandWidth = BASIC_LIMIT - PERSONAL_ALLOWANCE;
  const higherBandWidth = HIGHER_LIMIT - BASIC_LIMIT;

  let tax = 0;

  if (taxableIncome <= basicBandWidth) {
    tax += taxableIncome * 0.20;
  } else if (taxableIncome <= basicBandWidth + higherBandWidth) {
    tax += basicBandWidth * 0.20;
    tax += (taxableIncome - basicBandWidth) * 0.40;
  } else {
    tax += basicBandWidth * 0.20;
    tax += higherBandWidth * 0.40;
    tax += (taxableIncome - basicBandWidth - higherBandWidth) * 0.45;
  }

  return tax;
};

const employeeNiDue = (salary, extraIncome) => {
  const PRIMARY_THRESHOLD = 12570;
  const UPPER_LIMIT = 50270;

  const totalIncome = salary + extraIncome;
  const taxableIncome = Math.max(0, totalIncome - PRIMARY_THRESHOLD);

  const upperBandWidth = UPPER_LIMIT - PRIMARY_THRESHOLD;

  if (taxableIncome <= upperBandWidth) {
    return taxableIncome * 0.08;
  }

  return (
    upperBandWidth * 0.08 +
    (taxableIncome - upperBandWidth) * 0.02
  );
};

module.exports = {
  calculateUkPayeOnExercise
};