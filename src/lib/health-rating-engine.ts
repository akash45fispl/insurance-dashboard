/**
 * Comprehensive Indian Health Insurance Rating Engine
 * 
 * Provides isolated, transparent actuarial calculation logic for 10 major Indian insurers:
 * 1. Star Health & Allied Insurance
 * 2. Niva Bupa Health Insurance
 * 3. Care Health Insurance
 * 4. HDFC ERGO General Insurance
 * 5. ICICI Lombard General Insurance
 * 6. Bajaj Allianz General Insurance
 * 7. Tata AIG General Insurance
 * 8. Aditya Birla Health Insurance
 * 9. Manipal Cigna Health Insurance
 * 10. New India Assurance (PSU Tabulated Model)
 * 
 * NOTE: These rating models are illustrative actuarial approximations constructed from
 * publicly disclosed IRDAI rate filings, factor brochures, and tariff guidelines for comparison.
 */

import { getInsurerLogoUrl } from './insurer-logos';

export type Relationship = 'Self' | 'Spouse' | 'Child' | 'Parent' | 'Parent-in-law';
export type Gender = 'Male' | 'Female' | 'Other';
export type Zone = 'Metro' | 'Tier 2' | 'Tier 3';
export type PolicyType = 'Individual' | 'Floater';
export type AlcoholUsage = 'None' | 'Occasional' | 'Regular';
export type OccupationRisk = 'Low' | 'Medium' | 'High';
export type DeductibleOption = 'None' | '10%' | '20%';

export interface InsuredMember {
  id: string;
  relationship: Relationship;
  age: number;
  gender: Gender;
}

export interface UserProfile {
  members: InsuredMember[];
  city: string;
  pincode: string;
  zone: Zone;
  sumInsured: number; // 300000 | 500000 | 1000000 | 1500000 | 2500000 | 5000000 | 10000000
  policyType: PolicyType;
  tenureYears: 1 | 2 | 3;
  preExistingConditions: string[]; // ['Diabetes', 'Hypertension', 'Cardiac', 'Other']
  isSmoker: boolean;
  alcohol: AlcoholUsage;
  heightCm?: number;
  weightKg?: number;
  customBmi?: number;
  occupationRisk: OccupationRisk;
  addOns: string[]; // ['Maternity', 'CriticalIllness', 'RoomRentWaiver', 'PersonalAccident', 'OPD', 'ZeroDeductible']
  deductibleCopay: DeductibleOption;
  activeLifestyleRebate?: boolean; // Aditya Birla HealthReturns toggle
}

export interface ItemizedFactor {
  name: string;
  percentage?: number;
  amount: number;
  description: string;
}

export interface InsurerQuote {
  insurerId: string;
  insurerName: string;
  planName: string;
  logoUrl: string;
  bgGradient: string;
  basePremium: number;
  loadings: ItemizedFactor[];
  discounts: ItemizedFactor[];
  grossPremium: number;
  gstAmount: number; // 18% GST standard
  finalAnnualPremium: number;
  monthlyEquivalent: number;
  effectiveRebatePremium?: number; // Aditya Birla HealthReturns simulation
  effectiveRebateMonthly?: number;
  medicalTestRequired?: boolean;
  warnings?: string[];
  breakdownFormula: string; // Plain language math equation string
}

// Map Indian Cities / Pincodes to Zones (Metro / Tier 1, Tier 2, Tier 3)
export function getZoneFromCityOrPincode(city: string, pincode: string): Zone {
  const c = (city || '').toLowerCase().trim();
  const p = (pincode || '').trim();

  // Tier 1 Metro cities
  const metroCities = ['mumbai', 'delhi', 'new delhi', 'noida', 'gurgaon', 'gurugram', 'bengaluru', 'bangalore', 'chennai', 'hyderabad', 'kolkata', 'pune', 'ahmedabad'];
  if (metroCities.some(m => c.includes(m))) return 'Metro';

  // Check pincode prefixes for major metros (e.g. 11xxxx Delhi, 40xxxx Mumbai, 56xxxx Bangalore, 60xxxx Chennai, 70xxxx Kolkata, 50xxxx Hyderabad, 411xxx Pune, 380xxx Ahemadabad)
  if (/^(11|40|41|50|56|60|70|38)/.test(p)) return 'Metro';

  // Tier 2 cities
  const tier2Cities = ['jaipur', 'lucknow', 'chandigarh', 'kochi', 'coimbatore', 'surat', 'vadodara', 'nagpur', 'indore', 'bhopal', 'visakhapatnam', 'patna', 'bhubaneswar', 'ranchi', 'guwahati', 'thiruvananthapuram'];
  if (tier2Cities.some(t => c.includes(t))) return 'Tier 2';

  if (p && p.length === 6) {
    const firstTwo = parseInt(p.substring(0, 2), 10);
    if (firstTwo >= 12 && firstTwo <= 39) return 'Tier 2';
  }

  return 'Tier 3';
}

// Compute BMI from height/weight or custom numeric input
export function calculateBMI(weightKg?: number, heightCm?: number, customBmi?: number): number {
  if (customBmi && customBmi > 0) return customBmi;
  if (weightKg && heightCm && heightCm > 0) {
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  }
  return 22.5; // Normal healthy default
}

// Base Rate Table Constants (Age Band x Sum Insured)
// Calibrated so healthy 30yo with ₹10L cover in Tier 1 lands around ₹8,000 - ₹18,000/yr across insurers
const BASE_RATE_GRID: Record<string, Record<number, number>> = {
  '0-17':  { 300000: 3200, 500000: 4200, 1000000: 5800, 1500000: 7200, 2500000: 9500, 5000000: 13500, 10000000: 19000 },
  '18-35': { 300000: 4800, 500000: 6500, 1000000: 9200, 1500000: 11500, 2500000: 15200, 5000000: 21500, 10000000: 29500 },
  '36-45': { 300000: 6800, 500000: 8900, 1000000: 12800, 1500000: 15800, 2500000: 21000, 5000000: 29800, 10000000: 41000 },
  '46-55': { 300000: 10500, 500000: 14200, 1000000: 19800, 1500000: 24500, 2500000: 32500, 5000000: 46000, 10000000: 63000 },
  '56-65': { 300000: 17200, 500000: 23500, 1000000: 32500, 1500000: 40500, 2500000: 53500, 5000000: 75000, 10000000: 102000 },
  '66+':   { 300000: 26500, 500000: 36000, 1000000: 49500, 1500000: 61500, 2500000: 81000, 5000000: 114000, 10000000: 155000 },
};

export function getAgeBand(age: number): string {
  if (age <= 17) return '0-17';
  if (age <= 35) return '18-35';
  if (age <= 45) return '36-45';
  if (age <= 55) return '46-55';
  if (age <= 65) return '56-65';
  return '66+';
}

export function getEldestAge(members: InsuredMember[]): number {
  if (!members || members.length === 0) return 30;
  return Math.max(...members.map(m => m.age));
}

export function getLookupBaseRate(age: number, sumInsured: number): number {
  const band = getAgeBand(age);
  const grid = BASE_RATE_GRID[band] || BASE_RATE_GRID['18-35'];
  if (grid[sumInsured]) return grid[sumInsured];

  // Nearest fallback or proportional scaling
  const keys = Object.keys(grid).map(Number).sort((a, b) => a - b);
  if (sumInsured < keys[0]) return Math.round(grid[keys[0]] * (sumInsured / keys[0]));
  if (sumInsured > keys[keys.length - 1]) {
    return Math.round(grid[keys[keys.length - 1]] * Math.sqrt(sumInsured / keys[keys.length - 1]));
  }
  return grid[1000000];
}

// Format currency standard en-IN
export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(val));
}

/* =========================================================================
   1. STAR HEALTH & ALLIED INSURANCE
   ========================================================================= */
export function calculateStarHealthPremium(profile: UserProfile): InsurerQuote {
  const eldestAge = getEldestAge(profile.members);
  const baseRate = getLookupBaseRate(eldestAge, profile.sumInsured);
  let currentGross = baseRate;

  const loadings: ItemizedFactor[] = [];
  const discounts: ItemizedFactor[] = [];

  // Gender multiplier: Male +4% for cardiac age (40+), Female +2% for reproductive age (20-39)
  const primaryGender = profile.members[0]?.gender || 'Male';
  if (primaryGender === 'Male' && eldestAge >= 40) {
    const amount = Math.round(baseRate * 0.04);
    loadings.push({ name: 'Gender Risk (Male 40+ Cardiac)', percentage: 4, amount, description: 'Statistically higher cardiac risk band' });
    currentGross += amount;
  } else if (primaryGender === 'Female' && eldestAge >= 20 && eldestAge <= 39) {
    const amount = Math.round(baseRate * 0.02);
    loadings.push({ name: 'Gender Adjustment (Female 20-39)', percentage: 2, amount, description: 'Reproductive health age band' });
    currentGross += amount;
  }

  // Family floater: base on eldest member, +12% per additional adult, +8% per child
  if (profile.policyType === 'Floater' && profile.members.length > 1) {
    let floaterPct = 0;
    profile.members.slice(1).forEach(m => {
      if (m.relationship === 'Child') floaterPct += 8;
      else floaterPct += 12;
    });
    const amount = Math.round(baseRate * (floaterPct / 100));
    loadings.push({ name: `Family Floater Addition (${profile.members.length - 1} dependent members)`, percentage: floaterPct, amount, description: `+12% per adult, +8% per child beyond primary member` });
    currentGross += amount;
  }

  // Pre-existing condition loading: +15-40% depending on condition
  if (profile.preExistingConditions.length > 0) {
    let pedPct = 0;
    if (profile.preExistingConditions.includes('Diabetes')) pedPct += 15;
    if (profile.preExistingConditions.includes('Hypertension')) pedPct += 15;
    if (profile.preExistingConditions.includes('Cardiac')) pedPct += 35;
    if (profile.preExistingConditions.includes('Other')) pedPct += 10;

    const amount = Math.round(baseRate * (pedPct / 100));
    loadings.push({ name: `Pre-Existing Condition Loading (${profile.preExistingConditions.join(', ')})`, percentage: pedPct, amount, description: 'Medical underwriting loading factor' });
    currentGross += amount;
  }

  // Tenure discount: 2yr -5%, 3yr -8%
  if (profile.tenureYears === 2) {
    const amount = Math.round(currentGross * 0.05);
    discounts.push({ name: '2-Year Long Term Tenure Discount', percentage: 5, amount, description: 'Upfront Multi-year policy discount' });
    currentGross -= amount;
  } else if (profile.tenureYears === 3) {
    const amount = Math.round(currentGross * 0.08);
    discounts.push({ name: '3-Year Long Term Tenure Discount', percentage: 8, amount, description: 'Upfront Multi-year policy discount' });
    currentGross -= amount;
  }

  // Deductible/Copay discount
  if (profile.deductibleCopay === '10%') {
    const amount = Math.round(currentGross * 0.08);
    discounts.push({ name: '10% Co-Pay Opted Discount', percentage: 8, amount, description: '10% voluntary copay selection' });
    currentGross -= amount;
  } else if (profile.deductibleCopay === '20%') {
    const amount = Math.round(currentGross * 0.15);
    discounts.push({ name: '20% Co-Pay Opted Discount', percentage: 15, amount, description: '20% voluntary copay selection' });
    currentGross -= amount;
  }

  const grossPremium = currentGross;
  const gstAmount = Math.round(grossPremium * 0.18);
  const finalAnnualPremium = grossPremium + gstAmount;

  const totalLoadings = loadings.reduce((sum, l) => sum + l.amount, 0);
  const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
  const breakdownFormula = `Base Rate ${formatINR(baseRate)}${totalLoadings > 0 ? ` + Loadings ${formatINR(totalLoadings)}` : ''}${totalDiscounts > 0 ? ` − Discounts ${formatINR(totalDiscounts)}` : ''} = Net ${formatINR(grossPremium)} + GST 18% (${formatINR(gstAmount)}) → Final ${formatINR(finalAnnualPremium)}`;

  return {
    insurerId: 'star-health',
    insurerName: 'Star Health Insurance',
    planName: 'Comprehensive Health Optima',
    logoUrl: getInsurerLogoUrl('Star Health'),
    bgGradient: 'from-blue-600 to-indigo-700',
    basePremium: baseRate,
    loadings,
    discounts,
    grossPremium,
    gstAmount,
    finalAnnualPremium,
    monthlyEquivalent: Math.round(finalAnnualPremium / 12),
    breakdownFormula,
  };
}

/* =========================================================================
   2. NIVA BUPA HEALTH INSURANCE
   ========================================================================= */
export function calculateNivaBupaPremium(profile: UserProfile): InsurerQuote {
  const eldestAge = getEldestAge(profile.members);
  const baseRate = getLookupBaseRate(eldestAge, profile.sumInsured);
  let currentGross = baseRate;

  const loadings: ItemizedFactor[] = [];
  const discounts: ItemizedFactor[] = [];
  const warnings: string[] = [];

  // Medical history loading: +10-35%
  let medicalLoadingPct = 0;
  if (profile.preExistingConditions.includes('Cardiac')) medicalLoadingPct += 25;
  if (profile.preExistingConditions.includes('Diabetes') || profile.preExistingConditions.includes('Hypertension')) medicalLoadingPct += 12;
  if (profile.isSmoker) medicalLoadingPct += 10;

  if (medicalLoadingPct > 0) {
    const amount = Math.round(baseRate * (medicalLoadingPct / 100));
    loadings.push({ name: 'Medical Underwriting & Lifestyle Loading', percentage: medicalLoadingPct, amount, description: 'Medical conditions & tobacco consumption risk' });
    currentGross += amount;
  }

  // Mandatory Pre-policy Medical Test Flag
  const medicalTestRequired = eldestAge > 45 || profile.sumInsured >= 2500000;
  if (medicalTestRequired) {
    warnings.push('Mandatory Pre-Policy Tele-Medical Examination required (Age > 45 or Cover ≥ ₹25L)');
  }

  // Occupation loading: High risk +8%, Medium +3%, Low +0%
  if (profile.occupationRisk === 'High') {
    const amount = Math.round(baseRate * 0.08);
    loadings.push({ name: 'Hazardous Occupation Loading', percentage: 8, amount, description: 'Physical hazard work environment' });
    currentGross += amount;
  } else if (profile.occupationRisk === 'Medium') {
    const amount = Math.round(baseRate * 0.03);
    loadings.push({ name: 'Fieldwork Occupation Loading', percentage: 3, amount, description: 'Field travel occupation risk' });
    currentGross += amount;
  }

  // BMI outside 18.5-30: screen warning + 20% loading
  const bmi = calculateBMI(profile.weightKg, profile.heightCm, profile.customBmi);
  if (bmi < 18.5 || bmi > 30) {
    const amount = Math.round(baseRate * 0.20);
    loadings.push({ name: `Extreme BMI Loading (BMI ${bmi})`, percentage: 20, amount, description: 'Body Mass Index outside standard 18.5-30 range' });
    currentGross += amount;
    warnings.push(`Screen Alert: Applicant BMI is ${bmi} (Outside recommended 18.5–30.0 standard window). +20% Underwriting Loading applied.`);
  }

  // Tenure discount: 2yr -7.5%, 3yr -12.5%
  if (profile.tenureYears === 2) {
    const amount = Math.round(currentGross * 0.075);
    discounts.push({ name: '2-Year Policy Tenure Discount', percentage: 7.5, amount, description: 'Multi-year advance payment rebate' });
    currentGross -= amount;
  } else if (profile.tenureYears === 3) {
    const amount = Math.round(currentGross * 0.125);
    discounts.push({ name: '3-Year Policy Tenure Discount', percentage: 12.5, amount, description: 'Multi-year advance payment rebate' });
    currentGross -= amount;
  }

  const grossPremium = currentGross;
  const gstAmount = Math.round(grossPremium * 0.18);
  const finalAnnualPremium = grossPremium + gstAmount;

  const totalLoadings = loadings.reduce((sum, l) => sum + l.amount, 0);
  const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
  const breakdownFormula = `Base Rate ${formatINR(baseRate)}${totalLoadings > 0 ? ` + Loadings ${formatINR(totalLoadings)}` : ''}${totalDiscounts > 0 ? ` − Discounts ${formatINR(totalDiscounts)}` : ''} = Net ${formatINR(grossPremium)} + GST 18% (${formatINR(gstAmount)}) → Final ${formatINR(finalAnnualPremium)}`;

  return {
    insurerId: 'niva-bupa',
    insurerName: 'Niva Bupa Health Insurance',
    planName: 'ReAssure 2.0 Titanium',
    logoUrl: getInsurerLogoUrl('Niva Bupa'),
    bgGradient: 'from-emerald-600 to-teal-700',
    basePremium: baseRate,
    loadings,
    discounts,
    grossPremium,
    gstAmount,
    finalAnnualPremium,
    monthlyEquivalent: Math.round(finalAnnualPremium / 12),
    medicalTestRequired,
    warnings,
    breakdownFormula,
  };
}

/* =========================================================================
   3. CARE HEALTH INSURANCE
   ========================================================================= */
export function calculateCareHealthPremium(profile: UserProfile): InsurerQuote {
  const eldestAge = getEldestAge(profile.members);
  let baseRate = getLookupBaseRate(eldestAge, profile.sumInsured);

  const loadings: ItemizedFactor[] = [];
  const discounts: ItemizedFactor[] = [];

  // Deductible selection directly reduces base premium
  if (profile.deductibleCopay === '10%') {
    const amount = Math.round(baseRate * 0.10);
    discounts.push({ name: '10% Deductible Direct Base Premium Reduction', percentage: 10, amount, description: 'Direct reduction on base rate' });
    baseRate -= amount;
  } else if (profile.deductibleCopay === '20%') {
    const amount = Math.round(baseRate * 0.18);
    discounts.push({ name: '20% Deductible Direct Base Premium Reduction', percentage: 18, amount, description: 'Direct reduction on base rate' });
    baseRate -= amount;
  }

  let currentGross = baseRate;

  // Add-on pricing: each selected add-on adds flat %
  const ADD_ON_RATES: Record<string, { pct: number; label: string }> = {
    Maternity: { pct: 8, label: 'Maternity Cover Rider' },
    CriticalIllness: { pct: 12, label: 'Critical Illness Rider' },
    RoomRentWaiver: { pct: 10, label: 'Room Rent Waiver Rider' },
    OPD: { pct: 6, label: 'OPD Consultation Rider' },
    PersonalAccident: { pct: 5, label: 'Personal Accident Rider' },
    ZeroDeductible: { pct: 7, label: 'Zero Deductible Waiver' },
  };

  profile.addOns.forEach(addonKey => {
    const info = ADD_ON_RATES[addonKey];
    if (info) {
      const amount = Math.round(baseRate * (info.pct / 100));
      loadings.push({ name: info.label, percentage: info.pct, amount, description: `Optional rider benefit (+${info.pct}%)` });
      currentGross += amount;
    }
  });

  // Tenure discount: 2yr -7.5%, 3yr -12.5%
  if (profile.tenureYears === 2) {
    const amount = Math.round(currentGross * 0.075);
    discounts.push({ name: '2-Year Care Tenure Discount', percentage: 7.5, amount, description: 'Multi-year policy discount' });
    currentGross -= amount;
  } else if (profile.tenureYears === 3) {
    const amount = Math.round(currentGross * 0.125);
    discounts.push({ name: '3-Year Care Tenure Discount', percentage: 12.5, amount, description: 'Multi-year policy discount' });
    currentGross -= amount;
  }

  const grossPremium = currentGross;
  const gstAmount = Math.round(grossPremium * 0.18);
  const finalAnnualPremium = grossPremium + gstAmount;

  const totalLoadings = loadings.reduce((sum, l) => sum + l.amount, 0);
  const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
  const breakdownFormula = `Base Rate ${formatINR(baseRate + (discounts.find(d => d.name.includes('Deductible'))?.amount || 0))}${totalLoadings > 0 ? ` + Add-ons ${formatINR(totalLoadings)}` : ''}${totalDiscounts > 0 ? ` − Discounts ${formatINR(totalDiscounts)}` : ''} = Net ${formatINR(grossPremium)} + GST 18% (${formatINR(gstAmount)}) → Final ${formatINR(finalAnnualPremium)}`;

  return {
    insurerId: 'care-health',
    insurerName: 'Care Health Insurance',
    planName: 'Care Advantage Unlimited',
    logoUrl: getInsurerLogoUrl('Care Health'),
    bgGradient: 'from-cyan-600 to-blue-700',
    basePremium: baseRate,
    loadings,
    discounts,
    grossPremium,
    gstAmount,
    finalAnnualPremium,
    monthlyEquivalent: Math.round(finalAnnualPremium / 12),
    breakdownFormula,
  };
}

/* =========================================================================
   4. HDFC ERGO GENERAL INSURANCE
   ========================================================================= */
export function calculateHDFCErgoPremium(profile: UserProfile): InsurerQuote {
  const eldestAge = getEldestAge(profile.members);
  const rawBase = getLookupBaseRate(eldestAge, profile.sumInsured);

  const loadings: ItemizedFactor[] = [];
  const discounts: ItemizedFactor[] = [];

  // Zone multiplier: Metro x1.15, Tier 2 x1.05, Tier 3 x1.00
  let zoneMult = 1.0;
  if (profile.zone === 'Metro') zoneMult = 1.15;
  else if (profile.zone === 'Tier 2') zoneMult = 1.05;

  const baseRate = Math.round(rawBase * zoneMult);
  if (zoneMult > 1.0) {
    const amount = baseRate - rawBase;
    loadings.push({ name: `Zone Rating Multiplier (${profile.zone})`, percentage: Math.round((zoneMult - 1) * 100), amount, description: `Tiered healthcare cost location factor (${profile.zone})` });
  }

  let currentGross = baseRate;

  // Family Floater: Eldest member rate + 20% per additional member
  if (profile.policyType === 'Floater' && profile.members.length > 1) {
    const floaterCount = profile.members.length - 1;
    const floaterPct = floaterCount * 20;
    const amount = Math.round(baseRate * (floaterPct / 100));
    loadings.push({ name: `HDFC Family Floater Addition (${floaterCount} members)`, percentage: floaterPct, amount, description: `Flat +20% base per additional dependent member` });
    currentGross += amount;
  }

  // Fresh policy small first-time discount (-3%)
  const amountFresh = Math.round(currentGross * 0.03);
  discounts.push({ name: 'Fresh Policy Welcome Discount', percentage: 3, amount: amountFresh, description: 'First-time policyholder discount' });
  currentGross -= amountFresh;

  // Tenure discount: 2yr -5%, 3yr -10%
  if (profile.tenureYears === 2) {
    const amount = Math.round(currentGross * 0.05);
    discounts.push({ name: '2-Year HDFC Tenure Discount', percentage: 5, amount, description: '2-year policy discount' });
    currentGross -= amount;
  } else if (profile.tenureYears === 3) {
    const amount = Math.round(currentGross * 0.10);
    discounts.push({ name: '3-Year HDFC Tenure Discount', percentage: 10, amount, description: '3-year policy discount' });
    currentGross -= amount;
  }

  const grossPremium = currentGross;
  const gstAmount = Math.round(grossPremium * 0.18);
  const finalAnnualPremium = grossPremium + gstAmount;

  const totalLoadings = loadings.reduce((sum, l) => sum + l.amount, 0);
  const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
  const breakdownFormula = `Base Rate ${formatINR(rawBase)}${totalLoadings > 0 ? ` + Loadings & Zone ${formatINR(totalLoadings)}` : ''}${totalDiscounts > 0 ? ` − Discounts ${formatINR(totalDiscounts)}` : ''} = Net ${formatINR(grossPremium)} + GST 18% (${formatINR(gstAmount)}) → Final ${formatINR(finalAnnualPremium)}`;

  return {
    insurerId: 'hdfc-ergo',
    insurerName: 'HDFC ERGO General Insurance',
    planName: 'Optima Secure',
    logoUrl: getInsurerLogoUrl('HDFC ERGO'),
    bgGradient: 'from-red-600 to-rose-700',
    basePremium: baseRate,
    loadings,
    discounts,
    grossPremium,
    gstAmount,
    finalAnnualPremium,
    monthlyEquivalent: Math.round(finalAnnualPremium / 12),
    breakdownFormula,
  };
}

/* =========================================================================
   5. ICICI LOMBARD GENERAL INSURANCE
   ========================================================================= */
export function calculateICICILombardPremium(profile: UserProfile): InsurerQuote {
  const eldestAge = getEldestAge(profile.members);

  // Non-linear sum insured curve: premium ∝ sqrt(sum_insured)
  // Baseline for 10L is standard table, scaling by sqrt(sumInsured / 1,000,000)
  const base10L = getLookupBaseRate(eldestAge, 1000000);
  const nonLinearFactor = Math.sqrt(profile.sumInsured / 1000000);
  const rawBase = Math.round(base10L * nonLinearFactor);

  const loadings: ItemizedFactor[] = [];
  const discounts: ItemizedFactor[] = [];

  // Zone multiplier: Tier 1 x1.12, Tier 2/3 x1.00
  let zoneMult = 1.0;
  if (profile.zone === 'Metro') zoneMult = 1.12;

  const baseRate = Math.round(rawBase * zoneMult);
  if (zoneMult > 1.0) {
    loadings.push({ name: 'Tier 1 Metro Zone Loading', percentage: 12, amount: baseRate - rawBase, description: 'Metro healthcare cost loading' });
  }

  let currentGross = baseRate;

  // Family size loading: +10% per additional member
  if (profile.members.length > 1) {
    const extraMembers = profile.members.length - 1;
    const amount = Math.round(baseRate * (extraMembers * 0.10));
    loadings.push({ name: `Family Member Loading (${extraMembers} members)`, percentage: extraMembers * 10, amount, description: '+10% per additional family member' });
    currentGross += amount;
  }

  // Smoker loading: +10%
  if (profile.isSmoker) {
    const amount = Math.round(baseRate * 0.10);
    loadings.push({ name: 'Tobacco Use Loading', percentage: 10, amount, description: 'Smoker lifestyle loading' });
    currentGross += amount;
  }

  // Tenure discount: 2yr -7%, 3yr -12%
  if (profile.tenureYears === 2) {
    const amount = Math.round(currentGross * 0.07);
    discounts.push({ name: '2-Year ICICI Tenure Discount', percentage: 7, amount, description: '2-year long-term discount' });
    currentGross -= amount;
  } else if (profile.tenureYears === 3) {
    const amount = Math.round(currentGross * 0.12);
    discounts.push({ name: '3-Year ICICI Tenure Discount', percentage: 12, amount, description: '3-year long-term discount' });
    currentGross -= amount;
  }

  const grossPremium = currentGross;
  const gstAmount = Math.round(grossPremium * 0.18);
  const finalAnnualPremium = grossPremium + gstAmount;

  const totalLoadings = loadings.reduce((sum, l) => sum + l.amount, 0);
  const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
  const breakdownFormula = `Non-Linear Base Rate ${formatINR(rawBase)}${totalLoadings > 0 ? ` + Loadings ${formatINR(totalLoadings)}` : ''}${totalDiscounts > 0 ? ` − Discounts ${formatINR(totalDiscounts)}` : ''} = Net ${formatINR(grossPremium)} + GST 18% (${formatINR(gstAmount)}) → Final ${formatINR(finalAnnualPremium)}`;

  return {
    insurerId: 'icici-lombard',
    insurerName: 'ICICI Lombard General Insurance',
    planName: 'Elevate Health Shield',
    logoUrl: getInsurerLogoUrl('ICICI Lombard'),
    bgGradient: 'from-amber-600 to-orange-700',
    basePremium: baseRate,
    loadings,
    discounts,
    grossPremium,
    gstAmount,
    finalAnnualPremium,
    monthlyEquivalent: Math.round(finalAnnualPremium / 12),
    breakdownFormula,
  };
}

/* =========================================================================
   6. BAJAJ GENERAL (BAJAJ ALLIANZ) - BASELINE / VANILLA
   ========================================================================= */
export function calculateBajajGeneralPremium(profile: UserProfile): InsurerQuote {
  const eldestAge = getEldestAge(profile.members);
  const baseRate = getLookupBaseRate(eldestAge, profile.sumInsured);

  const loadings: ItemizedFactor[] = [];
  const discounts: ItemizedFactor[] = [];

  let currentGross = baseRate;

  // Family plan: standard linear member count +15% per additional member
  if (profile.members.length > 1) {
    const extraCount = profile.members.length - 1;
    const amount = Math.round(baseRate * (extraCount * 0.15));
    loadings.push({ name: `Family Member Count Addition (${extraCount} members)`, percentage: extraCount * 15, amount, description: 'Vanilla +15% per extra member' });
    currentGross += amount;
  }

  // Zone multiplier: Metro x1.10, Tier 2 x1.04, Tier 3 x1.00
  let zonePct = 0;
  if (profile.zone === 'Metro') zonePct = 10;
  else if (profile.zone === 'Tier 2') zonePct = 4;

  if (zonePct > 0) {
    const amount = Math.round(baseRate * (zonePct / 100));
    loadings.push({ name: `Zone Factor (${profile.zone})`, percentage: zonePct, amount, description: 'Standard city tier factor' });
    currentGross += amount;
  }

  // Tenure discount: 2yr -5%, 3yr -10%
  if (profile.tenureYears === 2) {
    const amount = Math.round(currentGross * 0.05);
    discounts.push({ name: '2-Year Tenure Discount', percentage: 5, amount, description: 'Multi-year policy rebate' });
    currentGross -= amount;
  } else if (profile.tenureYears === 3) {
    const amount = Math.round(currentGross * 0.10);
    discounts.push({ name: '3-Year Tenure Discount', percentage: 10, amount, description: 'Multi-year policy rebate' });
    currentGross -= amount;
  }

  const grossPremium = currentGross;
  const gstAmount = Math.round(grossPremium * 0.18);
  const finalAnnualPremium = grossPremium + gstAmount;

  const totalLoadings = loadings.reduce((sum, l) => sum + l.amount, 0);
  const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
  const breakdownFormula = `Vanilla Base Rate ${formatINR(baseRate)}${totalLoadings > 0 ? ` + Loadings ${formatINR(totalLoadings)}` : ''}${totalDiscounts > 0 ? ` − Discounts ${formatINR(totalDiscounts)}` : ''} = Net ${formatINR(grossPremium)} + GST 18% (${formatINR(gstAmount)}) → Final ${formatINR(finalAnnualPremium)}`;

  return {
    insurerId: 'bajaj-allianz',
    insurerName: 'Bajaj Allianz General Insurance',
    planName: 'Health Guard Gold',
    logoUrl: getInsurerLogoUrl('Bajaj Allianz'),
    bgGradient: 'from-blue-700 to-sky-900',
    basePremium: baseRate,
    loadings,
    discounts,
    grossPremium,
    gstAmount,
    finalAnnualPremium,
    monthlyEquivalent: Math.round(finalAnnualPremium / 12),
    breakdownFormula,
  };
}

/* =========================================================================
   7. TATA AIG GENERAL INSURANCE
   ========================================================================= */
export function calculateTataAIGPremium(profile: UserProfile): InsurerQuote {
  const eldestAge = getEldestAge(profile.members);
  const baseRate = getLookupBaseRate(eldestAge, profile.sumInsured);

  const loadings: ItemizedFactor[] = [];
  const discounts: ItemizedFactor[] = [];

  let currentGross = baseRate;

  // Gender: Female -3% relative to male (men skew higher actuarial risk)
  const primaryGender = profile.members[0]?.gender || 'Male';
  if (primaryGender === 'Female') {
    const amount = Math.round(baseRate * 0.03);
    discounts.push({ name: 'Female Policyholder Discount', percentage: 3, amount, description: 'Lower statistical mortality/morbidity risk' });
    currentGross -= amount;
  }

  // Family plan tiered discount: 2 members -10%, 3 members -20%, 4+ members -32%
  if (profile.policyType === 'Floater' && profile.members.length > 1) {
    let familyDiscPct = 0;
    if (profile.members.length === 2) familyDiscPct = 10;
    else if (profile.members.length === 3) familyDiscPct = 20;
    else if (profile.members.length >= 4) familyDiscPct = 32;

    if (familyDiscPct > 0) {
      const amount = Math.round(baseRate * (familyDiscPct / 100));
      discounts.push({ name: `Family Floater Tiered Rebate (${profile.members.length} members)`, percentage: familyDiscPct, amount, description: 'Cumulative multi-member floater discount' });
      currentGross -= amount;
    }
  }

  // Add-ons priced individually
  if (profile.addOns.includes('CriticalIllness')) {
    const amount = Math.round(baseRate * 0.10);
    loadings.push({ name: 'Critical Illness Rider', percentage: 10, amount, description: 'Lump-sum 36 critical illness benefit' });
    currentGross += amount;
  }
  if (profile.addOns.includes('Maternity')) {
    const amount = Math.round(baseRate * 0.07);
    loadings.push({ name: 'Maternity & Newborn Cover', percentage: 7, amount, description: 'Maternity expenses & vaccination rider' });
    currentGross += amount;
  }

  // Long term discount: 2yr -5%, 3yr -7.5%
  if (profile.tenureYears === 2) {
    const amount = Math.round(currentGross * 0.05);
    discounts.push({ name: '2-Year Tata AIG Discount', percentage: 5, amount, description: '2-year policy discount' });
    currentGross -= amount;
  } else if (profile.tenureYears === 3) {
    const amount = Math.round(currentGross * 0.075);
    discounts.push({ name: '3-Year Tata AIG Discount', percentage: 7.5, amount, description: '3-year policy discount' });
    currentGross -= amount;
  }

  const grossPremium = currentGross;
  const gstAmount = Math.round(grossPremium * 0.18);
  const finalAnnualPremium = grossPremium + gstAmount;

  const totalLoadings = loadings.reduce((sum, l) => sum + l.amount, 0);
  const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
  const breakdownFormula = `Base Rate ${formatINR(baseRate)}${totalLoadings > 0 ? ` + Add-ons ${formatINR(totalLoadings)}` : ''}${totalDiscounts > 0 ? ` − Discounts ${formatINR(totalDiscounts)}` : ''} = Net ${formatINR(grossPremium)} + GST 18% (${formatINR(gstAmount)}) → Final ${formatINR(finalAnnualPremium)}`;

  return {
    insurerId: 'tata-aig',
    insurerName: 'Tata AIG General Insurance',
    planName: 'MediCare Premier',
    logoUrl: getInsurerLogoUrl('TATA AIG'),
    bgGradient: 'from-blue-800 to-indigo-900',
    basePremium: baseRate,
    loadings,
    discounts,
    grossPremium,
    gstAmount,
    finalAnnualPremium,
    monthlyEquivalent: Math.round(finalAnnualPremium / 12),
    breakdownFormula,
  };
}

/* =========================================================================
   8. ADITYA BIRLA HEALTH INSURANCE
   ========================================================================= */
export function calculateAdityaBirlaPremium(profile: UserProfile): InsurerQuote {
  const eldestAge = getEldestAge(profile.members);
  const baseRate = getLookupBaseRate(eldestAge, profile.sumInsured);

  const loadings: ItemizedFactor[] = [];
  const discounts: ItemizedFactor[] = [];

  let currentGross = baseRate;

  // Age-dependent gender curve: Women 18-59 pay +5% vs men; 60+ women pay -5% vs men
  const primaryGender = profile.members[0]?.gender || 'Male';
  if (primaryGender === 'Female') {
    if (eldestAge >= 18 && eldestAge <= 59) {
      const amount = Math.round(baseRate * 0.05);
      loadings.push({ name: 'Gender Loading (Female 18-59)', percentage: 5, amount, description: 'Age-dependent health utilization rating' });
      currentGross += amount;
    } else if (eldestAge >= 60) {
      const amount = Math.round(baseRate * 0.05);
      discounts.push({ name: 'Senior Female Discount (60+)', percentage: 5, amount, description: 'Senior female health longevity credit' });
      currentGross -= amount;
    }
  }

  // Pre-existing condition loading: +10-35%
  if (profile.preExistingConditions.length > 0) {
    let pedPct = 0;
    if (profile.preExistingConditions.includes('Cardiac')) pedPct += 25;
    if (profile.preExistingConditions.includes('Diabetes')) pedPct += 12;
    if (profile.preExistingConditions.includes('Hypertension')) pedPct += 10;
    if (profile.preExistingConditions.includes('Other')) pedPct += 8;

    const amount = Math.round(baseRate * (pedPct / 100));
    loadings.push({ name: 'Pre-existing Medical Condition Loading', percentage: pedPct, amount, description: 'Underwriting risk loading factor' });
    currentGross += amount;
  }

  // Tenure discount: 2yr -7.5%, 3yr -10%
  if (profile.tenureYears === 2) {
    const amount = Math.round(currentGross * 0.075);
    discounts.push({ name: '2-Year Tenure Discount', percentage: 7.5, amount, description: 'Multi-year policy rebate' });
    currentGross -= amount;
  } else if (profile.tenureYears === 3) {
    const amount = Math.round(currentGross * 0.10);
    discounts.push({ name: '3-Year Tenure Discount', percentage: 10, amount, description: 'Multi-year policy rebate' });
    currentGross -= amount;
  }

  const grossPremium = currentGross;
  const gstAmount = Math.round(grossPremium * 0.18);
  const finalAnnualPremium = grossPremium + gstAmount;

  // Active lifestyle (HealthReturns™ eligible simulation): up to 30% cash-back earned post-purchase
  const rebateRate = profile.activeLifestyleRebate ? 0.30 : 0;
  const effectiveRebatePremium = Math.round(finalAnnualPremium * (1 - rebateRate));
  const effectiveRebateMonthly = Math.round(effectiveRebatePremium / 12);

  const totalLoadings = loadings.reduce((sum, l) => sum + l.amount, 0);
  const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
  const breakdownFormula = `Base Rate ${formatINR(baseRate)}${totalLoadings > 0 ? ` + Loadings ${formatINR(totalLoadings)}` : ''}${totalDiscounts > 0 ? ` − Discounts ${formatINR(totalDiscounts)}` : ''} = Net ${formatINR(grossPremium)} + GST 18% (${formatINR(gstAmount)}) → Final ${formatINR(finalAnnualPremium)}${profile.activeLifestyleRebate ? ` (Effective after HealthReturns™ 30% Rebate: ${formatINR(effectiveRebatePremium)})` : ''}`;

  return {
    insurerId: 'aditya-birla',
    insurerName: 'Aditya Birla Health Insurance',
    planName: 'Activ Health Platinum Enhanced',
    logoUrl: getInsurerLogoUrl('Aditya Birla'),
    bgGradient: 'from-rose-700 to-red-900',
    basePremium: baseRate,
    loadings,
    discounts,
    grossPremium,
    gstAmount,
    finalAnnualPremium,
    monthlyEquivalent: Math.round(finalAnnualPremium / 12),
    effectiveRebatePremium,
    effectiveRebateMonthly,
    breakdownFormula,
  };
}

/* =========================================================================
   9. MANIPAL CIGNA HEALTH INSURANCE
   ========================================================================= */
export function calculateManipalCignaPremium(profile: UserProfile): InsurerQuote {
  const eldestAge = getEldestAge(profile.members);
  const baseRate = getLookupBaseRate(eldestAge, profile.sumInsured);

  const loadings: ItemizedFactor[] = [];
  const discounts: ItemizedFactor[] = [];

  let currentGross = baseRate;

  // BMI Loading applied directly: +5% per 5 BMI points outside 18.5-30
  const bmi = calculateBMI(profile.weightKg, profile.heightCm, profile.customBmi);
  let bmiLoadingPct = 0;
  if (bmi > 30) {
    const diff = bmi - 30;
    bmiLoadingPct = Math.ceil(diff / 5) * 5;
  } else if (bmi < 18.5) {
    const diff = 18.5 - bmi;
    bmiLoadingPct = Math.ceil(diff / 5) * 5;
  }

  if (bmiLoadingPct > 0) {
    const amount = Math.round(baseRate * (bmiLoadingPct / 100));
    loadings.push({ name: `Direct BMI Loading (BMI ${bmi})`, percentage: bmiLoadingPct, amount, description: `+5% per 5 BMI points outside 18.5-30 window` });
    currentGross += amount;
  }

  // Co-pay/deductible selection reduces premium (10% -> -8%, 20% -> -15%)
  if (profile.deductibleCopay === '10%') {
    const amount = Math.round(baseRate * 0.08);
    discounts.push({ name: '10% Co-pay Selection Discount', percentage: 8, amount, description: '10% voluntary copay rebate' });
    currentGross -= amount;
  } else if (profile.deductibleCopay === '20%') {
    const amount = Math.round(baseRate * 0.15);
    discounts.push({ name: '20% Co-pay Selection Discount', percentage: 15, amount, description: '20% voluntary copay rebate' });
    currentGross -= amount;
  }

  // Tenure discount: 2yr -7.5%, 3yr -12.5%
  if (profile.tenureYears === 2) {
    const amount = Math.round(currentGross * 0.075);
    discounts.push({ name: '2-Year ProHealth Discount', percentage: 7.5, amount, description: 'Multi-year policy rebate' });
    currentGross -= amount;
  } else if (profile.tenureYears === 3) {
    const amount = Math.round(currentGross * 0.125);
    discounts.push({ name: '3-Year ProHealth Discount', percentage: 12.5, amount, description: 'Multi-year policy rebate' });
    currentGross -= amount;
  }

  const grossPremium = currentGross;
  const gstAmount = Math.round(grossPremium * 0.18);
  const finalAnnualPremium = grossPremium + gstAmount;

  const totalLoadings = loadings.reduce((sum, l) => sum + l.amount, 0);
  const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
  const breakdownFormula = `Base Rate ${formatINR(baseRate)}${totalLoadings > 0 ? ` + Direct BMI Loading ${formatINR(totalLoadings)}` : ''}${totalDiscounts > 0 ? ` − Discounts ${formatINR(totalDiscounts)}` : ''} = Net ${formatINR(grossPremium)} + GST 18% (${formatINR(gstAmount)}) → Final ${formatINR(finalAnnualPremium)}`;

  return {
    insurerId: 'manipal-cigna',
    insurerName: 'Manipal Cigna Health Insurance',
    planName: 'ProHealth Prime Direct',
    logoUrl: getInsurerLogoUrl('Manipal Cigna'),
    bgGradient: 'from-purple-600 to-indigo-800',
    basePremium: baseRate,
    loadings,
    discounts,
    grossPremium,
    gstAmount,
    finalAnnualPremium,
    monthlyEquivalent: Math.round(finalAnnualPremium / 12),
    breakdownFormula,
  };
}

/* =========================================================================
   10. NEW INDIA ASSURANCE (PSU / TABULATED TARIFF MODEL)
   ========================================================================= */
export function calculateNewIndiaAssurancePremium(profile: UserProfile): InsurerQuote {
  const eldestAge = getEldestAge(profile.members);
  const baseRate = getLookupBaseRate(eldestAge, profile.sumInsured);

  const loadings: ItemizedFactor[] = [];
  const discounts: ItemizedFactor[] = [];

  let currentGross = baseRate;

  // Age-based renewal loading: +2.5% per year once insured crosses age 65
  if (eldestAge > 65) {
    const seniorYears = eldestAge - 65;
    const seniorPct = parseFloat((seniorYears * 2.5).toFixed(1));
    const amount = Math.round(baseRate * (seniorPct / 100));
    loadings.push({ name: `PSU Senior Renewal Loading (${seniorYears} yrs past 65)`, percentage: seniorPct, amount, description: 'Tariff loading +2.5%/yr for age > 65' });
    currentGross += amount;
  }

  // Pre-existing condition tariff loading
  if (profile.preExistingConditions.length > 0) {
    const amount = Math.round(baseRate * 0.15);
    loadings.push({ name: 'PSU Tariff Medical Loading', percentage: 15, amount: amount, description: 'Standard PSU medical history tariff loading' });
    currentGross += amount;
  }

  // Exact published PSU tenure discounts: 1yr 0%, 2yr -5%, 3yr -7%
  if (profile.tenureYears === 2) {
    const amount = Math.round(currentGross * 0.05);
    discounts.push({ name: '2-Year PSU Tariff Discount', percentage: 5, amount, description: 'Published PSU 2-year rebate' });
    currentGross -= amount;
  } else if (profile.tenureYears === 3) {
    const amount = Math.round(currentGross * 0.07);
    discounts.push({ name: '3-Year PSU Tariff Discount', percentage: 7, amount, description: 'Published PSU 3-year rebate' });
    currentGross -= amount;
  }

  // No zone or gender multipliers (PSU pricing is flat across India)

  const grossPremium = currentGross;
  const gstAmount = Math.round(grossPremium * 0.18);
  const finalAnnualPremium = grossPremium + gstAmount;

  const totalLoadings = loadings.reduce((sum, l) => sum + l.amount, 0);
  const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
  const breakdownFormula = `PSU Tariff Base ${formatINR(baseRate)}${totalLoadings > 0 ? ` + Tariff Loadings ${formatINR(totalLoadings)}` : ''}${totalDiscounts > 0 ? ` − PSU Discounts ${formatINR(totalDiscounts)}` : ''} = Net ${formatINR(grossPremium)} + GST 18% (${formatINR(gstAmount)}) → Final ${formatINR(finalAnnualPremium)}`;

  return {
    insurerId: 'new-india-assurance',
    insurerName: 'New India Assurance (PSU)',
    planName: 'Mediclaim Policy (National Tariff)',
    logoUrl: getInsurerLogoUrl('New India Assurance'),
    bgGradient: 'from-blue-900 to-slate-900',
    basePremium: baseRate,
    loadings,
    discounts,
    grossPremium,
    gstAmount,
    finalAnnualPremium,
    monthlyEquivalent: Math.round(finalAnnualPremium / 12),
    breakdownFormula,
  };
}

/* =========================================================================
   MASTER CALCULATION FUNCTION: Run all 10 rating models
   ========================================================================= */
export function calculateAllInsurerQuotes(profile: UserProfile): InsurerQuote[] {
  const quotes: InsurerQuote[] = [
    calculateStarHealthPremium(profile),
    calculateNivaBupaPremium(profile),
    calculateCareHealthPremium(profile),
    calculateHDFCErgoPremium(profile),
    calculateICICILombardPremium(profile),
    calculateBajajGeneralPremium(profile),
    calculateTataAIGPremium(profile),
    calculateAdityaBirlaPremium(profile),
    calculateManipalCignaPremium(profile),
    calculateNewIndiaAssurancePremium(profile),
  ];

  return quotes;
}
