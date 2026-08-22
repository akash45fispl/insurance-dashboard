'use client';

import React, { useState, useMemo } from 'react';
import { 
  UserProfile, 
  InsuredMember, 
  InsurerQuote, 
  calculateAllInsurerQuotes, 
  getZoneFromCityOrPincode, 
  calculateBMI, 
  formatINR,
  Relationship,
  Gender,
  Zone,
  PolicyType,
  AlcoholUsage,
  OccupationRisk,
  DeductibleOption
} from '@/lib/health-rating-engine';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';
import { 
  Calculator, 
  Users, 
  Plus, 
  Trash2, 
  MapPin, 
  ShieldCheck, 
  Heart, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Activity, 
  TrendingDown, 
  TrendingUp, 
  Check, 
  Info, 
  Scale, 
  Stethoscope, 
  Building2, 
  Award,
  Zap,
  HelpCircle
} from 'lucide-react';

interface IndianHealthCalculatorProps {
  onBackToDashboard?: () => void;
  onCreateProposal?: (selectedQuotes: InsurerQuote[], profile: UserProfile) => void;
}

export const IndianHealthCalculator: React.FC<IndianHealthCalculatorProps> = ({ 
  onBackToDashboard,
  onCreateProposal 
}) => {

  // Default User Profile State
  const [members, setMembers] = useState<InsuredMember[]>([
    { id: '1', relationship: 'Self', age: 32, gender: 'Male' },
    { id: '2', relationship: 'Spouse', age: 30, gender: 'Female' },
  ]);

  const [city, setCity] = useState<string>('Mumbai');
  const [pincode, setPincode] = useState<string>('400001');
  const [overrideZone, setOverrideZone] = useState<Zone | null>(null);

  const [sumInsured, setSumInsured] = useState<number>(1000000); // Default ₹10 Lakhs
  const [policyType, setPolicyType] = useState<PolicyType>('Floater');
  const [tenureYears, setTenureYears] = useState<1 | 2 | 3>(1);

  const [preExistingConditions, setPreExistingConditions] = useState<string[]>([]);
  const [isSmoker, setIsSmoker] = useState<boolean>(false);
  const [alcohol, setAlcohol] = useState<AlcoholUsage>('None');

  const [heightCm, setHeightCm] = useState<number>(172);
  const [weightKg, setWeightKg] = useState<number>(68);
  const [customBmiInput, setCustomBmiInput] = useState<string>('');

  const [occupationRisk, setOccupationRisk] = useState<OccupationRisk>('Low');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(['RoomRentWaiver']);
  const [deductibleCopay, setDeductibleCopay] = useState<DeductibleOption>('None');
  const [activeLifestyleRebate, setActiveLifestyleRebate] = useState<boolean>(false);

  // Accordion Expander State
  const [expandedInsurerId, setExpandedInsurerId] = useState<string | null>('star-health');

  // Sorting Control State
  const [sortBy, setSortBy] = useState<'lowest' | 'highest' | 'name' | 'base'>('lowest');

  // Multi-Select Quote State for Proposal Creation
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([
    'star-health', 'niva-bupa', 'care-health', 'hdfc-ergo', 'icici-lombard',
    'bajaj-allianz', 'tata-aig', 'aditya-birla', 'manipal-cigna', 'new-india-assurance'
  ]);

  // Derived Zone
  const computedZone = useMemo(() => {
    if (overrideZone) return overrideZone;
    return getZoneFromCityOrPincode(city, pincode);
  }, [city, pincode, overrideZone]);

  // Derived BMI
  const computedBmi = useMemo(() => {
    const customNum = customBmiInput ? parseFloat(customBmiInput) : 0;
    return calculateBMI(weightKg, heightCm, customNum);
  }, [weightKg, heightCm, customBmiInput]);

  // Build Full User Profile Object
  const currentProfile = useMemo<UserProfile>(() => {
    return {
      members,
      city,
      pincode,
      zone: computedZone,
      sumInsured,
      policyType,
      tenureYears,
      preExistingConditions,
      isSmoker,
      alcohol,
      heightCm,
      weightKg,
      customBmi: computedBmi,
      occupationRisk,
      addOns: selectedAddOns,
      deductibleCopay,
      activeLifestyleRebate,
    };
  }, [
    members, 
    city, 
    pincode, 
    computedZone, 
    sumInsured, 
    policyType, 
    tenureYears, 
    preExistingConditions, 
    isSmoker, 
    alcohol, 
    heightCm, 
    weightKg, 
    computedBmi, 
    occupationRisk, 
    selectedAddOns, 
    deductibleCopay, 
    activeLifestyleRebate
  ]);

  // Calculate Quotes across all 10 Insurers
  const allQuotes = useMemo<InsurerQuote[]>(() => {
    return calculateAllInsurerQuotes(currentProfile);
  }, [currentProfile]);

  // Sorted Quotes
  const sortedQuotes = useMemo(() => {
    const copy = [...allQuotes];
    if (sortBy === 'lowest') return copy.sort((a, b) => a.finalAnnualPremium - b.finalAnnualPremium);
    if (sortBy === 'highest') return copy.sort((a, b) => b.finalAnnualPremium - a.finalAnnualPremium);
    if (sortBy === 'name') return copy.sort((a, b) => a.insurerName.localeCompare(b.insurerName));
    if (sortBy === 'base') return copy.sort((a, b) => a.basePremium - b.basePremium);
    return copy;
  }, [allQuotes, sortBy]);

  // Stat Extremes
  const lowestQuote = useMemo(() => {
    return allQuotes.reduce((prev, curr) => (curr.finalAnnualPremium < prev.finalAnnualPremium ? curr : prev), allQuotes[0]);
  }, [allQuotes]);

  const highestQuote = useMemo(() => {
    return allQuotes.reduce((prev, curr) => (curr.finalAnnualPremium > prev.finalAnnualPremium ? curr : prev), allQuotes[0]);
  }, [allQuotes]);

  const averagePremium = useMemo(() => {
    const total = allQuotes.reduce((sum, q) => sum + q.finalAnnualPremium, 0);
    return Math.round(total / allQuotes.length);
  }, [allQuotes]);

  // Member Management Handlers
  const handleAddMember = () => {
    if (members.length >= 6) {
      alert('Maximum 6 family members supported per calculation profile.');
      return;
    }
    const newId = String(Date.now());
    let defaultRel: Relationship = 'Child';
    if (!members.some(m => m.relationship === 'Spouse')) defaultRel = 'Spouse';
    else if (!members.some(m => m.relationship === 'Parent')) defaultRel = 'Parent';

    setMembers([...members, { id: newId, relationship: defaultRel, age: 25, gender: 'Male' }]);
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) {
      alert('At least 1 primary member is required.');
      return;
    }
    setMembers(members.filter(m => m.id !== id));
  };

  const handleUpdateMember = (id: string, field: keyof InsuredMember, value: any) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // Quote Selection Handlers
  const toggleQuoteSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedQuoteIds.includes(id)) {
      setSelectedQuoteIds(selectedQuoteIds.filter((qId) => qId !== id));
    } else {
      setSelectedQuoteIds([...selectedQuoteIds, id]);
    }
  };

  const handleToggleSelectAllQuotes = () => {
    if (selectedQuoteIds.length === allQuotes.length) {
      setSelectedQuoteIds([]);
    } else {
      setSelectedQuoteIds(allQuotes.map((q) => q.insurerId));
    }
  };

  const handleCreateProposalClick = () => {
    if (!onCreateProposal) return;
    const selectedQuotes = allQuotes.filter((q) => selectedQuoteIds.includes(q.insurerId));
    if (selectedQuotes.length === 0) {
      alert('Please select at least 1 insurer quote to create a proposal.');
      return;
    }
    onCreateProposal(selectedQuotes, currentProfile);
  };

  const toggleCondition = (condition: string) => {
    if (condition === 'None') {
      setPreExistingConditions([]);
      return;
    }
    if (preExistingConditions.includes(condition)) {
      setPreExistingConditions(preExistingConditions.filter(c => c !== condition));
    } else {
      setPreExistingConditions([...preExistingConditions, condition]);
    }
  };

  const toggleAddOn = (addon: string) => {
    if (selectedAddOns.includes(addon)) {
      setSelectedAddOns(selectedAddOns.filter(a => a !== addon));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800/90 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-teal-300 text-xs font-bold px-3 py-1 rounded-full border border-teal-400/30 mb-3 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Multi-Insurer Rating Engine</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
              Indian Health Insurance <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">Premium Calculator</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Enter your family profile once to generate side-by-side estimated premiums across 10 major IRDAI Indian insurers with step-by-step plain-language rating breakdowns.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
              >
                ← Back to Dashboard
              </button>
            )}
            <div className="bg-slate-800/90 border border-slate-700 px-4 py-3 rounded-2xl text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Insurers Evaluated</span>
              <span className="text-lg font-black text-teal-400">10 Major Insurers</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Unified Profile Input Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-teal-600 to-blue-600 text-white shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                Step 1: Universal Family Profile & Coverage Inputs
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Applied uniformly across all 10 insurer pricing engines simultaneously
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-800">
            {members.length} {members.length === 1 ? 'Member' : 'Members'} ({policyType})
          </span>
        </div>

        {/* Inputs Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          
          {/* LEFT COLUMN: Members & Age Builder (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
                <span>Insured Members (1 – 6 Members)</span>
                <span className="text-[10px] text-slate-400 font-normal">(Eldest age keys Floater base rate)</span>
              </label>
              
              <button
                type="button"
                onClick={handleAddMember}
                disabled={members.length >= 6}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Member</span>
              </button>
            </div>

            {/* Member List Cards */}
            <div className="space-y-3">
              {members.map((m, idx) => (
                <div 
                  key={m.id}
                  className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-wrap sm:flex-nowrap items-center gap-3 transition-all hover:border-teal-300 dark:hover:border-teal-700"
                >
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>

                  {/* Relationship */}
                  <div className="w-full sm:w-36">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">Relationship</label>
                    <select
                      value={m.relationship}
                      onChange={(e) => handleUpdateMember(m.id, 'relationship', e.target.value as Relationship)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Self">Self</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Parent-in-law">Parent-in-law</option>
                    </select>
                  </div>

                  {/* Age Input */}
                  <div className="flex-1 min-w-[120px]">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Age</label>
                      <span className="font-extrabold text-teal-700 dark:text-teal-300 text-xs">{m.age} yrs</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={85}
                      value={m.age}
                      onChange={(e) => handleUpdateMember(m.id, 'age', Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  {/* Gender */}
                  <div className="w-28">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">Gender</label>
                    <select
                      value={m.gender}
                      onChange={(e) => handleUpdateMember(m.id, 'gender', e.target.value as Gender)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Delete Button */}
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* City / Pincode / Zone Selector */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <span>City & Location Zone Classification</span>
                </label>

                {/* Derived Zone Badge */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold">Mapped Zone:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase border ${
                    computedZone === 'Metro' 
                      ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300'
                      : computedZone === 'Tier 2'
                      ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}>
                    {computedZone} (Tier {computedZone === 'Metro' ? '1' : computedZone === 'Tier 2' ? '2' : '3'})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">City Name</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setOverrideZone(null);
                    }}
                    placeholder="e.g. Mumbai, Jaipur..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">Pincode (6 digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value);
                      setOverrideZone(null);
                    }}
                    placeholder="e.g. 400001"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">Zone Override</label>
                  <select
                    value={overrideZone || computedZone}
                    onChange={(e) => setOverrideZone(e.target.value as Zone)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Metro">Metro (Tier 1)</option>
                    <option value="Tier 2">Tier 2 City</option>
                    <option value="Tier 3">Tier 3 City</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Medical History & Lifestyle Factors */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span>Pre-existing Conditions & Underwriting Risk Factors</span>
              </label>

              {/* Pre-existing Conditions Multi-select */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Pre-Existing Conditions (PED):</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'None', label: 'None / Healthy' },
                    { id: 'Diabetes', label: 'Diabetes' },
                    { id: 'Hypertension', label: 'Hypertension (BP)' },
                    { id: 'Cardiac', label: 'Cardiac History' },
                    { id: 'Other', label: 'Other Chronic' },
                  ].map((c) => {
                    const isNone = c.id === 'None';
                    const active = isNone ? preExistingConditions.length === 0 : preExistingConditions.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCondition(c.id)}
                        className={`px-3 py-1.5 rounded-lg border font-semibold text-[11px] transition-all flex items-center gap-1.5 ${
                          active
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5" />}
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tobacco, Alcohol & Occupation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                
                {/* Tobacco */}
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">Smoker / Tobacco Use</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { val: false, label: 'No' },
                      { val: true, label: 'Yes (+10%)' },
                    ].map((item) => (
                      <button
                        key={String(item.val)}
                        type="button"
                        onClick={() => setIsSmoker(item.val)}
                        className={`py-1.5 px-2 rounded-lg border font-semibold text-[11px] text-center transition-all ${
                          isSmoker === item.val
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alcohol */}
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">Alcohol Consumption</label>
                  <select
                    value={alcohol}
                    onChange={(e) => setAlcohol(e.target.value as AlcoholUsage)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="None">None</option>
                    <option value="Occasional">Occasional</option>
                    <option value="Regular">Regular</option>
                  </select>
                </div>

                {/* Occupation Risk */}
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">Occupation Risk</label>
                  <select
                    value={occupationRisk}
                    onChange={(e) => setOccupationRisk(e.target.value as OccupationRisk)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Low">Low Risk (Desk Job)</option>
                    <option value="Medium">Medium Risk (Fieldwork)</option>
                    <option value="High">High Risk (Hazardous)</option>
                  </select>
                </div>

              </div>

              {/* BMI Calculator Inputs */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Body Mass Index (BMI) Underwriting Check:</span>
                  <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                    computedBmi >= 18.5 && computedBmi <= 30
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    BMI: {computedBmi} ({computedBmi >= 18.5 && computedBmi <= 30 ? 'Normal' : 'Extreme Loading Warning'})
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-medium block">Height (cm)</label>
                    <input
                      type="number"
                      value={heightCm || ''}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      placeholder="172"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-medium block">Weight (kg)</label>
                    <input
                      type="number"
                      value={weightKg || ''}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      placeholder="68"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-medium block">Or Direct BMI</label>
                    <input
                      type="number"
                      step="0.1"
                      value={customBmiInput}
                      onChange={(e) => setCustomBmiInput(e.target.value)}
                      placeholder="e.g. 24.5"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Sum Insured, Policy Type, Tenure, Add-ons & Deductibles (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Sum Insured Dropdown */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 block">
                Select Sum Insured Coverage
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[300000, 500000, 1000000, 1500000, 2500000, 5000000, 10000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSumInsured(amt)}
                    className={`py-2 px-1 rounded-xl font-extrabold text-[11px] transition-all text-center ${
                      sumInsured === amt
                        ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-md ring-2 ring-teal-400/40'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    ₹{amt >= 10000000 ? '1 Cr' : `${amt / 100000}L`}
                  </button>
                ))}
              </div>
            </div>

            {/* Policy Type & Policy Tenure */}
            <div className="grid grid-cols-2 gap-3">
              
              {/* Policy Type */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200 block">Policy Type</label>
                <div className="grid grid-cols-2 gap-1">
                  {(['Individual', 'Floater'] as PolicyType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPolicyType(type)}
                      className={`py-2 px-1 rounded-lg font-bold text-[11px] text-center transition-all ${
                        policyType === type
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tenure */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200 block">Tenure Years</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { yr: 1, label: '1 Yr', disc: 'Std' },
                    { yr: 2, label: '2 Yrs', disc: '-5% to 8%' },
                    { yr: 3, label: '3 Yrs', disc: '-8% to 12.5%' },
                  ].map((t) => (
                    <button
                      key={t.yr}
                      type="button"
                      onClick={() => setTenureYears(t.yr as any)}
                      className={`py-1.5 px-1 rounded-lg font-extrabold text-[11px] text-center transition-all ${
                        tenureYears === t.yr
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>{t.label}</div>
                      <div className="text-[9px] opacity-80 font-normal">{t.disc}</div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Deductible / Copay Selection */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 block">
                Opted Deductible / Voluntary Co-Pay (Reduces Base Rate)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { opt: 'None', label: 'None (Full Cover)' },
                  { opt: '10%', label: '10% Co-pay (-8% to 10%)' },
                  { opt: '20%', label: '20% Co-pay (-15% to 18%)' },
                ].map((d) => (
                  <button
                    key={d.opt}
                    type="button"
                    onClick={() => setDeductibleCopay(d.opt as DeductibleOption)}
                    className={`p-2 rounded-xl font-bold text-[11px] text-center transition-all ${
                      deductibleCopay === d.opt
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add-ons Checklist */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 block">
                Desired Add-on Protection Riders:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'Maternity', label: 'Maternity Cover' },
                  { id: 'CriticalIllness', label: 'Critical Illness Rider' },
                  { id: 'RoomRentWaiver', label: 'Room Rent Waiver' },
                  { id: 'PersonalAccident', label: 'Personal Accident' },
                  { id: 'OPD', label: 'OPD Consultations' },
                  { id: 'ZeroDeductible', label: 'Zero Deductible Waiver' },
                ].map((a) => {
                  const checked = selectedAddOns.includes(a.id);
                  return (
                    <div
                      key={a.id}
                      onClick={() => toggleAddOn(a.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                        checked
                          ? 'bg-teal-50/80 border-teal-400 text-teal-950 dark:bg-teal-950/40 dark:text-teal-200 dark:border-teal-700'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="rounded text-teal-600 focus:ring-0"
                      />
                      <span className="font-semibold text-[11px]">{a.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Aditya Birla HealthReturns Rebate Simulation Toggle */}
            <div className="bg-gradient-to-r from-rose-950/40 to-indigo-950/40 p-4 rounded-2xl border border-rose-500/30 text-slate-200 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-xs text-rose-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Active Lifestyle (HealthReturns™ Simulation)</span>
                </div>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  Aditya Birla wellness reward — up to -30% earned cashback post-purchase
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveLifestyleRebate(!activeLifestyleRebate)}
                className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${
                  activeLifestyleRebate ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                } flex items-center`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* 3. Stat Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Lowest Quote */}
        <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 p-5 rounded-3xl border border-emerald-500/40 text-white shadow-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider">Lowest Estimated Quote</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1">{lowestQuote.insurerName}</h3>
            <p className="text-xs text-slate-400">{lowestQuote.planName}</p>
            <div className="text-2xl font-black text-emerald-300 mt-2">
              {formatINR(lowestQuote.finalAnnualPremium)} <span className="text-xs font-normal text-slate-400">/ yr</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-400/30">
              Est. {formatINR(lowestQuote.monthlyEquivalent)}/mo
            </span>
          </div>
        </div>

        {/* Market Average */}
        <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900 p-5 rounded-3xl border border-blue-500/40 text-white shadow-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <span className="text-[10px] font-extrabold uppercase text-blue-400 tracking-wider">10-Insurer Market Average</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1">Cross-Insurer Average</h3>
            <p className="text-xs text-slate-400">₹{(sumInsured / 100000).toFixed(0)} Lakhs Coverage</p>
            <div className="text-2xl font-black text-blue-300 mt-2">
              {formatINR(averagePremium)} <span className="text-xs font-normal text-slate-400">/ yr</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-3 py-1 rounded-full border border-blue-400/30">
              Est. {formatINR(Math.round(averagePremium / 12))}/mo
            </span>
          </div>
        </div>

        {/* Highest Quote */}
        <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-slate-900 p-5 rounded-3xl border border-rose-500/40 text-white shadow-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span className="text-[10px] font-extrabold uppercase text-rose-400 tracking-wider">Highest Comprehensive Quote</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1">{highestQuote.insurerName}</h3>
            <p className="text-xs text-slate-400">{highestQuote.planName}</p>
            <div className="text-2xl font-black text-rose-300 mt-2">
              {formatINR(highestQuote.finalAnnualPremium)} <span className="text-xs font-normal text-slate-400">/ yr</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs bg-rose-500/20 text-rose-300 font-bold px-3 py-1 rounded-full border border-rose-400/30">
              Est. {formatINR(highestQuote.monthlyEquivalent)}/mo
            </span>
          </div>
        </div>

      </div>

      {/* 4. Recharts Comparison Bar Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
              <Scale className="w-5 h-5 text-teal-600" />
              <span>Annual Premium Comparison Chart (10 Insurers Side by Side)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visualizes final annual premiums inclusive of 18% GST for easy market position comparison
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1 text-emerald-600"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> Lowest</span>
            <span className="flex items-center gap-1 text-teal-600"><span className="w-3 h-3 rounded bg-teal-500 inline-block"></span> Standard</span>
            <span className="flex items-center gap-1 text-rose-600"><span className="w-3 h-3 rounded bg-rose-500 inline-block"></span> Highest</span>
          </div>
        </div>

        {/* Recharts Render */}
        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedQuotes.map(q => ({
                name: q.insurerName.replace(' Insurance', '').replace(' General', ''),
                premium: q.finalAnnualPremium,
                monthly: q.monthlyEquivalent,
                isLowest: q.insurerId === lowestQuote.insurerId,
                isHighest: q.insurerId === highestQuote.insurerId,
              }))}
              margin={{ top: 20, right: 20, left: 20, bottom: 65 }}
            >
              <XAxis 
                dataKey="name" 
                angle={-35} 
                textAnchor="end" 
                tick={{ fontSize: 11, fill: '#64748B' }} 
                interval={0} 
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748B' }} 
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} 
              />
              <Tooltip 
                formatter={(val: number) => [formatINR(val), 'Annual Premium']}
                contentStyle={{ 
                  backgroundColor: '#0F172A', 
                  borderColor: '#334155', 
                  borderRadius: '12px', 
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' 
                }} 
              />
              <Bar dataKey="premium" radius={[8, 8, 0, 0]}>
                {sortedQuotes.map((entry, index) => {
                  let fillColor = '#0D9488'; // teal default
                  if (entry.insurerId === lowestQuote.insurerId) fillColor = '#10B981'; // emerald lowest
                  if (entry.insurerId === highestQuote.insurerId) fillColor = '#F43F5E'; // rose highest
                  return <Cell key={`cell-${index}`} fill={fillColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Comparison Table & Accordion Math Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
              Step 2: Detailed Premium Matrix & Plain-Language Rating Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any insurer row to expand transparent actuarial math equations and itemized factor receipts
            </p>
          </div>

          {/* Proposal Action & Sorting Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {onCreateProposal && (
              <button
                type="button"
                onClick={handleCreateProposalClick}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all transform hover:-translate-y-0.5 border border-emerald-400/30"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Proposal with Selected ({selectedQuoteIds.length})</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-teal-500"
              >
                <option value="lowest">Lowest Final Premium</option>
                <option value="highest">Highest Final Premium</option>
                <option value="name">Insurer Name (A-Z)</option>
                <option value="base">Base Premium Rate</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                <th className="p-4 w-10 text-center rounded-l-xl">
                  <input
                    type="checkbox"
                    checked={selectedQuoteIds.length === allQuotes.length && allQuotes.length > 0}
                    onChange={handleToggleSelectAllQuotes}
                    className="rounded text-teal-600 focus:ring-0 cursor-pointer"
                    title="Select All Insurers for Proposal"
                  />
                </th>
                <th className="p-4">Insurer & Plan Variant</th>
                <th className="p-4">Base Premium</th>
                <th className="p-4">Loadings Applied</th>
                <th className="p-4">Discounts Applied</th>
                <th className="p-4 text-right">Final Annual (18% GST)</th>
                <th className="p-4 text-right rounded-r-xl">Monthly EMI</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedQuotes.map((q) => {
                const isExpanded = expandedInsurerId === q.insurerId;
                const isLowest = q.insurerId === lowestQuote.insurerId;
                const isHighest = q.insurerId === highestQuote.insurerId;
                const isSelected = selectedQuoteIds.includes(q.insurerId);

                return (
                  <React.Fragment key={q.insurerId}>
                    {/* Main Row */}
                    <tr 
                      onClick={() => setExpandedInsurerId(isExpanded ? null : q.insurerId)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                        isExpanded ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                      } ${isSelected ? '' : 'opacity-60'}`}
                    >
                      {/* Selection Checkbox */}
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleQuoteSelection(q.insurerId, e as any)}
                          className="rounded text-teal-600 focus:ring-0 cursor-pointer w-4 h-4"
                        />
                      </td>
                      {/* Insurer Name & Plan */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={q.logoUrl} 
                            alt={q.insurerName} 
                            className="w-9 h-9 rounded-xl object-contain bg-white shadow-xs border border-slate-200 p-0.5 shrink-0" 
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 dark:text-white text-sm">{q.insurerName}</span>
                              {isLowest && (
                                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 uppercase">
                                  Lowest
                                </span>
                              )}
                              {isHighest && (
                                <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-300 uppercase">
                                  Highest
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{q.planName}</span>
                          </div>
                        </div>
                      </td>

                      {/* Base Premium */}
                      <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                        {formatINR(q.basePremium)}
                      </td>

                      {/* Loadings Badges */}
                      <td className="p-4">
                        {q.loadings.length === 0 ? (
                          <span className="text-slate-400 text-[10px]">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {q.loadings.map((l, idx) => (
                              <span key={idx} className="bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                                +{formatINR(l.amount)} ({l.name.split(' ')[0]})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Discounts Badges */}
                      <td className="p-4">
                        {q.discounts.length === 0 ? (
                          <span className="text-slate-400 text-[10px]">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {q.discounts.map((d, idx) => (
                              <span key={idx} className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                -{formatINR(d.amount)} ({d.name.split(' ')[0]})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Final Annual Premium */}
                      <td className="p-4 text-right">
                        <div className="text-base font-black text-slate-900 dark:text-white">
                          {formatINR(q.finalAnnualPremium)}
                        </div>
                        <span className="text-[10px] text-slate-400 block">incl. 18% GST</span>
                      </td>

                      {/* Monthly EMI & Expand Trigger */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div>
                            <span className="font-bold text-teal-700 dark:text-teal-400 text-xs block">{formatINR(q.monthlyEquivalent)}/mo</span>
                            <span className="text-[9px] text-slate-400 block">Est. EMI</span>
                          </div>
                          <div className="p-1 text-slate-400 hover:text-teal-600">
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-teal-600" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* EXPANDABLE ACCORDION DETAIL ROW */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-0 bg-slate-900 text-slate-100">
                          <div className="p-6 space-y-4 animate-in fade-in duration-200 border-y border-slate-800">
                            
                            {/* Equation Banner */}
                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Calculator className="w-4 h-4" />
                                  Plain-Language Actuarial Calculation Equation
                                </span>
                                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-400/30">
                                  Auditable Rating Logic
                                </span>
                              </div>
                              
                              <p className="font-mono text-xs sm:text-sm text-emerald-300 font-bold bg-slate-900/90 p-3 rounded-xl border border-slate-800 leading-relaxed overflow-x-auto">
                                {q.breakdownFormula}
                              </p>
                            </div>

                            {/* Warnings Banner if any */}
                            {q.warnings && q.warnings.length > 0 && (
                              <div className="bg-amber-950/60 border border-amber-500/40 p-3 rounded-xl text-amber-200 text-xs flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  {q.warnings.map((w, idx) => (
                                    <p key={idx} className="font-semibold">{w}</p>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Itemized Factor Receipts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              
                              {/* Loadings Breakdown */}
                              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                                <span className="font-extrabold text-rose-400 block border-b border-slate-800 pb-2">
                                  Loadings Applied (+ Amount)
                                </span>
                                {q.loadings.length === 0 ? (
                                  <p className="text-slate-500 italic">No medical or lifestyle risk loadings applied.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {q.loadings.map((l, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-slate-300">
                                        <div>
                                          <span className="font-bold text-white block">{l.name}</span>
                                          <span className="text-[10px] text-slate-400 block">{l.description}</span>
                                        </div>
                                        <span className="font-bold text-rose-400 shrink-0">+ {formatINR(l.amount)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Discounts Breakdown */}
                              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                                <span className="font-extrabold text-emerald-400 block border-b border-slate-800 pb-2">
                                  Discounts Applied (- Amount)
                                </span>
                                {q.discounts.length === 0 ? (
                                  <p className="text-slate-500 italic">No multi-year or copay discounts applied.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {q.discounts.map((d, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-slate-300">
                                        <div>
                                          <span className="font-bold text-white block">{d.name}</span>
                                          <span className="text-[10px] text-slate-400 block">{d.description}</span>
                                        </div>
                                        <span className="font-bold text-emerald-400 shrink-0">- {formatINR(d.amount)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                            </div>

                            {/* Aditya Birla Wellness Rebate Notice if applicable */}
                            {q.effectiveRebatePremium && activeLifestyleRebate && (
                              <div className="bg-gradient-to-r from-amber-950/60 to-purple-950/60 p-4 rounded-xl border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <div className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                                    <Zap className="w-4 h-4 text-amber-400" />
                                    <span>Aditya Birla HealthReturns™ Conditional Rebate</span>
                                  </div>
                                  <p className="text-[10px] text-slate-300 mt-0.5">
                                    Post-purchase wellness reward up to 30% earned cashback via fitness step tracking
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs text-slate-400 block">Effective Post-Rebate Premium:</span>
                                  <span className="text-lg font-black text-amber-300">{formatINR(q.effectiveRebatePremium)}/yr ({formatINR(q.effectiveRebateMonthly || 0)}/mo)</span>
                                </div>
                              </div>
                            )}

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* 6. Regulatory & Actuarial Disclaimer Banner */}
      <div className="bg-slate-900 border border-slate-800 text-slate-400 p-5 rounded-2xl text-xs space-y-2">
        <div className="flex items-center gap-2 text-white font-bold">
          <Info className="w-4 h-4 text-teal-400" />
          <span>Statutory Rating Disclaimer</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          These are simplified illustrative estimates based on publicly available rating factors, not official insurer quotes. Actual premiums require underwriting by the insurer and may vary based on verified medical records, pin-code zone classifications, porting history, and official IRDAI product filings.
        </p>
      </div>

    </div>
  );
};
