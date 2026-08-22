'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Scheme, Proposal, InsuranceCategory, CalculatedPremiumDetails } from '@/lib/types';
import { 
  InsurerQuote, 
  UserProfile, 
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
import { useAuth } from '@/lib/auth-context';
import { X, Plus, Trash2, Check, ArrowRight, ShieldCheck, User, Calculator, Stethoscope, MapPin, Zap, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const INSURER_TO_SCHEME_MAP: Record<string, string> = {
  'star-health': 'star-assure',
  'hdfc-ergo': 'hdfc-optima-secure',
  'niva-bupa': 'niva-bupa-reassure-2',
  'care-health': 'care-supreme',
  'icici-lombard': 'icici-elevate',
  'bajaj-allianz': 'bajaj-health-guard',
  'tata-aig': 'tata-medicare',
  'aditya-birla': 'aditya-activ-health',
  'manipal-cigna': 'manipal-prohealth',
  'new-india-assurance': 'new-india-mediclaim',
};

interface NewProposalModalProps {
  schemes: Scheme[];
  isOpen: boolean;
  onClose: () => void;
  onSaveProposal: (proposalData: Omit<Proposal, 'id' | 'createdAt'>) => void;
  preSelectedScheme?: Scheme | null;
  initialCompareIds?: string[];
  calculatorQuotes?: InsurerQuote[];
  calculatorProfile?: UserProfile | null;
}

export const NewProposalModal: React.FC<NewProposalModalProps> = ({
  schemes,
  isOpen,
  onClose,
  onSaveProposal,
  preSelectedScheme,
  initialCompareIds = [],
  calculatorQuotes = [],
  calculatorProfile = null,
}) => {
  const { user } = useAuth();
  
  // Basic Client Info
  const [clientName, setClientName] = useState('');
  const [clientAge, setClientAge] = useState(35);
  const [clientCity, setClientCity] = useState('Mumbai');
  const [clientPincode, setClientPincode] = useState('400001');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [category, setCategory] = useState<InsuranceCategory>('health');

  // Full Rating Calculator Inputs
  const [sumInsured, setSumInsured] = useState<number>(1000000);
  const [policyType, setPolicyType] = useState<PolicyType>('Floater');
  const [tenureYears, setTenureYears] = useState<1 | 2 | 3>(1);

  const [preExistingConditions, setPreExistingConditions] = useState<string[]>([]);
  const [isSmoker, setIsSmoker] = useState<boolean>(false);
  const [alcohol, setAlcohol] = useState<AlcoholUsage>('None');

  const [heightCm, setHeightCm] = useState<number>(172);
  const [weightKg, setWeightKg] = useState<number>(68);
  const [occupationRisk, setOccupationRisk] = useState<OccupationRisk>('Low');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(['RoomRentWaiver']);
  const [deductibleCopay, setDeductibleCopay] = useState<DeductibleOption>('None');
  const [activeLifestyleRebate, setActiveLifestyleRebate] = useState<boolean>(false);

  // Accordion Expander inside Modal
  const [showCalculatorForm, setShowCalculatorForm] = useState<boolean>(true);

  // Family members list
  const [members, setMembers] = useState([
    { id: '1', relation: 'Self', age: 35, name: '', premiumShare: 15000, gender: 'Male' as Gender },
    { id: '2', relation: 'Spouse', age: 32, name: '', premiumShare: 12000, gender: 'Female' as Gender },
  ]);

  // Selected scheme IDs
  const [selectedSchemeIds, setSelectedSchemeIds] = useState<string[]>([]);

  // Computed Zone & BMI
  const computedZone = useMemo(() => getZoneFromCityOrPincode(clientCity, clientPincode), [clientCity, clientPincode]);
  const computedBmi = useMemo(() => calculateBMI(weightKg, heightCm), [weightKg, heightCm]);

  // Dynamic Live Calculation Engine Execution
  const liveProfile = useMemo<UserProfile>(() => {
    return {
      members: members.map(m => ({
        id: m.id || String(m.age),
        relationship: m.relation as Relationship,
        age: m.age,
        gender: m.gender || 'Male',
      })),
      city: clientCity,
      pincode: clientPincode,
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
    members, clientCity, clientPincode, computedZone, sumInsured, policyType, tenureYears,
    preExistingConditions, isSmoker, alcohol, heightCm, weightKg, computedBmi,
    occupationRisk, selectedAddOns, deductibleCopay, activeLifestyleRebate
  ]);

  const liveCalculatedQuotes = useMemo<InsurerQuote[]>(() => {
    return calculateAllInsurerQuotes(liveProfile);
  }, [liveProfile]);

  useEffect(() => {
    if (isOpen) {
      if (calculatorProfile && calculatorQuotes.length > 0) {
        // Pre-fill from Indian Health Premium Calculator
        setClientAge(calculatorProfile.members[0]?.age || 35);
        setClientCity(calculatorProfile.city || 'Mumbai');
        setClientPincode(calculatorProfile.pincode || '400001');
        setSumInsured(calculatorProfile.sumInsured || 1000000);
        setPolicyType(calculatorProfile.policyType || 'Floater');
        setTenureYears(calculatorProfile.tenureYears || 1);
        setPreExistingConditions(calculatorProfile.preExistingConditions || []);
        setIsSmoker(calculatorProfile.isSmoker || false);
        setAlcohol(calculatorProfile.alcohol || 'None');
        setHeightCm(calculatorProfile.heightCm || 172);
        setWeightKg(calculatorProfile.weightKg || 68);
        setOccupationRisk(calculatorProfile.occupationRisk || 'Low');
        setSelectedAddOns(calculatorProfile.addOns || ['RoomRentWaiver']);
        setDeductibleCopay(calculatorProfile.deductibleCopay || 'None');
        setActiveLifestyleRebate(calculatorProfile.activeLifestyleRebate || false);

        setProposalTitle(`${calculatorProfile.members[0]?.age || 35}yo ${calculatorProfile.policyType} Health Proposal (${calculatorQuotes.length} Insurers)`);
        setCategory('health');

        setMembers(
          calculatorProfile.members.map((m) => ({
            id: m.id,
            relation: m.relationship,
            age: m.age,
            name: m.relationship,
            gender: m.gender || 'Male',
            premiumShare: Math.round(calculatorQuotes[0]?.monthlyEquivalent || 12000),
          }))
        );

        // Map selected quotes to scheme IDs
        const mappedIds: string[] = [];
        calculatorQuotes.forEach((q) => {
          const directId = INSURER_TO_SCHEME_MAP[q.insurerId];
          if (directId && schemes.some((s) => s.id === directId)) {
            mappedIds.push(directId);
          } else {
            const matched = schemes.find((s) =>
              s.insurer.toLowerCase().includes(q.insurerName.toLowerCase().split(' ')[0])
            );
            if (matched) mappedIds.push(matched.id);
          }
        });

        if (mappedIds.length > 0) {
          setSelectedSchemeIds(mappedIds);
        } else {
          setSelectedSchemeIds(schemes.slice(0, 3).map((s) => s.id));
        }
      } else if (preSelectedScheme) {
        setSelectedSchemeIds([preSelectedScheme.id]);
      } else if (initialCompareIds && initialCompareIds.length > 0) {
        setSelectedSchemeIds(initialCompareIds);
      } else {
        setSelectedSchemeIds(schemes.slice(0, 2).map((s) => s.id));
      }
    }
  }, [isOpen, preSelectedScheme, initialCompareIds, schemes, calculatorQuotes, calculatorProfile]);

  if (!isOpen) return null;

  const handleAddMember = () => {
    setMembers([...members, { id: String(Date.now()), relation: 'Child', age: 5, name: '', gender: 'Male', premiumShare: 8000 }]);
  };

  const handleRemoveMember = (idx: number) => {
    setMembers(members.filter((_, i) => i !== idx));
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

  const toggleSchemeSelection = (id: string) => {
    if (selectedSchemeIds.includes(id)) {
      setSelectedSchemeIds(selectedSchemeIds.filter((sId) => sId !== id));
    } else {
      setSelectedSchemeIds([...selectedSchemeIds, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || selectedSchemeIds.length === 0) return;

    const familySummary = members.map((m) => `${m.relation} (${m.age})`).join(', ');

    // Build comprehensive schemeCalculations map for all selected schemes
    const schemeCalculations: Record<string, CalculatedPremiumDetails> = {};
    
    // Choose source quotes: liveCalculatedQuotes or calculatorQuotes
    const sourceQuotes = liveCalculatedQuotes.length > 0 ? liveCalculatedQuotes : calculatorQuotes;

    schemes.forEach((s) => {
      if (selectedSchemeIds.includes(s.id)) {
        // Find matching quote from rating engine
        const quote = sourceQuotes.find((q) => {
          const mappedId = INSURER_TO_SCHEME_MAP[q.insurerId];
          return mappedId === s.id || s.insurer.toLowerCase().includes(q.insurerName.toLowerCase().split(' ')[0]);
        }) || sourceQuotes[0];

        if (quote) {
          schemeCalculations[s.id] = {
            basePremium: quote.basePremium,
            riderPremium: quote.loadings.reduce((sum, l) => sum + l.amount, 0),
            subtotal: quote.grossPremium,
            tenureDiscount: quote.discounts.reduce((sum, d) => sum + d.amount, 0),
            taxGst: quote.gstAmount,
            netAnnualPremium: quote.finalAnnualPremium,
            monthlyEmi: quote.monthlyEquivalent,
            parameters: {
              sumInsuredAmount: sumInsured,
              primaryAge: Number(clientAge),
              policyType: policyType === 'Floater' ? 'floater_2a2c' : 'individual',
              tenureYears: tenureYears,
              selectedRiders: selectedAddOns,
              zone: computedZone,
              pincode: clientPincode,
              city: clientCity,
              preExistingConditions: preExistingConditions,
              isSmoker: isSmoker,
              alcohol: alcohol,
              bmi: computedBmi,
              occupationRisk: occupationRisk,
              deductibleCopay: deductibleCopay,
              activeLifestyleRebate: activeLifestyleRebate,
            },
            loadings: quote.loadings,
            discounts: quote.discounts,
            breakdownFormula: quote.breakdownFormula,
            insurerId: quote.insurerId,
            insurerName: quote.insurerName,
            planName: quote.planName,
            medicalTestRequired: quote.medicalTestRequired,
            warnings: quote.warnings,
            effectiveRebatePremium: quote.effectiveRebatePremium,
            effectiveRebateMonthly: quote.effectiveRebateMonthly,
          };
        }
      }
    });

    const proposalObj: Omit<Proposal, 'id' | 'createdAt'> = {
      name: proposalTitle || `${clientName} Health Insurance Portfolio`,
      client: {
        name: clientName,
        age: Number(clientAge),
        family: familySummary,
        city: clientCity,
        advisor: user?.name || 'Rahul Sharma',
        email: clientEmail,
        phone: clientPhone,
        members: members.map((m) => ({
          ...m,
          name: m.name || m.relation,
        })),
      },
      compareIds: selectedSchemeIds,
      createdBy: user?.email || 'fortune.rahul@fortune.com',
      createdByDisplay: user?.name || 'Rahul Sharma (Senior Advisor)',
      status: 'Created',
      date: new Date().toISOString().split('T')[0],
      category,
      schemeCalculations: Object.keys(schemeCalculations).length > 0 ? schemeCalculations : undefined,
      totalPremium: Object.values(schemeCalculations).length > 0
        ? Math.round(Object.values(schemeCalculations).reduce((acc, c) => acc + c.netAnnualPremium, 0) / Object.values(schemeCalculations).length)
        : members.reduce((acc, m) => acc + (m.premiumShare || 10000), 0),
    };

    onSaveProposal(proposalObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl my-6 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-teal-950 to-indigo-950 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/20 rounded-xl border border-teal-400/30">
              <Calculator className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white font-heading">Configure Client Proposal & Premium Calculator</h2>
              <p className="text-xs text-slate-300">Collect client profile, underwriting factors & embed transparent rating breakdowns.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {/* Proposal Document Title */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Proposal Document Title</label>
            <input
              type="text"
              value={proposalTitle}
              onChange={(e) => setProposalTitle(e.target.value)}
              placeholder="e.g. Sharma Family Health Shield (₹10L Floater)"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          {/* Client Identity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Age</label>
              <input
                type="number"
                value={clientAge}
                onChange={(e) => setClientAge(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">City & Pincode</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                  placeholder="City"
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                />
                <input
                  type="text"
                  maxLength={6}
                  value={clientPincode}
                  onChange={(e) => setClientPincode(e.target.value)}
                  placeholder="Pincode"
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Client Email ID</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InsuranceCategory)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold capitalize"
              >
                <option value="health">Health Insurance</option>
                <option value="term">Term Insurance</option>
                <option value="motor">Motor Insurance</option>
                <option value="travel">Travel Insurance</option>
              </select>
            </div>
          </div>

          {/* ACCORDION: Interactive Health Insurance Rating Calculator Inputs */}
          {category === 'health' && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 space-y-4">
              <div 
                onClick={() => setShowCalculatorForm(!showCalculatorForm)}
                className="flex items-center justify-between cursor-pointer border-b border-slate-800 pb-3"
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-extrabold text-white">
                    Health Insurance Rating & Underwriting Parameters
                  </h3>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded border border-teal-400/30">
                    Live Rating Engine
                  </span>
                </div>
                <button type="button" className="text-slate-400 hover:text-white">
                  {showCalculatorForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showCalculatorForm && (
                <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                  
                  {/* Grid 1: Sum Insured & Policy Floater & Tenure */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    
                    {/* Sum Insured */}
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Sum Insured Coverage</label>
                      <select
                        value={sumInsured}
                        onChange={(e) => setSumInsured(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 font-bold text-white"
                      >
                        <option value={300000}>₹3 Lakhs</option>
                        <option value={500000}>₹5 Lakhs</option>
                        <option value={1000000}>₹10 Lakhs</option>
                        <option value={1500000}>₹15 Lakhs</option>
                        <option value={2500000}>₹25 Lakhs</option>
                        <option value={5000000}>₹50 Lakhs</option>
                        <option value={10000000}>₹1 Crore</option>
                      </select>
                    </div>

                    {/* Policy Type */}
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Policy Structure</label>
                      <div className="grid grid-cols-2 gap-1">
                        {(['Individual', 'Floater'] as PolicyType[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setPolicyType(t)}
                            className={`py-2 px-1 rounded-lg font-bold text-[11px] text-center transition-all ${
                              policyType === t
                                ? 'bg-teal-600 text-white shadow-xs'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tenure */}
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Policy Tenure</label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { yr: 1, label: '1 Yr' },
                          { yr: 2, label: '2 Yrs (-5% disc)' },
                          { yr: 3, label: '3 Yrs (-8% disc)' },
                        ].map((t) => (
                          <button
                            key={t.yr}
                            type="button"
                            onClick={() => setTenureYears(t.yr as any)}
                            className={`py-2 px-1 rounded-lg font-extrabold text-[10px] text-center transition-all ${
                              tenureYears === t.yr
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Grid 2: Medical Conditions & Lifestyle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    
                    {/* Pre-existing Conditions */}
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Pre-Existing Conditions (PED)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'None', label: 'None / Healthy' },
                          { id: 'Diabetes', label: 'Diabetes' },
                          { id: 'Hypertension', label: 'BP / Hypertension' },
                          { id: 'Cardiac', label: 'Cardiac History' },
                        ].map((c) => {
                          const active = c.id === 'None' ? preExistingConditions.length === 0 : preExistingConditions.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleCondition(c.id)}
                              className={`px-2.5 py-1 rounded-lg border font-semibold text-[11px] ${
                                active ? 'bg-teal-600 text-white border-teal-500' : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tobacco & Occupation */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-300 block mb-1">Smoker / Tobacco</label>
                        <select
                          value={isSmoker ? 'Yes' : 'No'}
                          onChange={(e) => setIsSmoker(e.target.value === 'Yes')}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 font-bold text-white"
                        >
                          <option value="No">No (Non-smoker)</option>
                          <option value="Yes">Yes (+10% loading)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-300 block mb-1">Occupation Risk</label>
                        <select
                          value={occupationRisk}
                          onChange={(e) => setOccupationRisk(e.target.value as OccupationRisk)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 font-bold text-white"
                        >
                          <option value="Low">Low Risk</option>
                          <option value="Medium">Medium Risk</option>
                          <option value="High">High Risk</option>
                        </select>
                      </div>
                    </div>

                  </div>

                  {/* Grid 3: Add-on Riders & Deductible */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Add-on Riders</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'Maternity', label: 'Maternity' },
                          { id: 'CriticalIllness', label: 'Critical Illness' },
                          { id: 'RoomRentWaiver', label: 'Room Rent Waiver' },
                          { id: 'OPD', label: 'OPD Cover' },
                        ].map((a) => {
                          const active = selectedAddOns.includes(a.id);
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => toggleAddOn(a.id)}
                              className={`px-2.5 py-1 rounded-lg border font-semibold text-[11px] ${
                                active ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {a.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Opted Co-pay / Deductible</label>
                      <select
                        value={deductibleCopay}
                        onChange={(e) => setDeductibleCopay(e.target.value as DeductibleOption)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 font-bold text-white"
                      >
                        <option value="None">None (Full Coverage)</option>
                        <option value="10%">10% Co-pay (Discount -8% to -10%)</option>
                        <option value="20%">20% Co-pay (Discount -15% to -18%)</option>
                      </select>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* Family Members Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-slate-800 dark:text-slate-200">Family Members Covered:</span>
              <button
                type="button"
                onClick={handleAddMember}
                className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Member
              </button>
            </div>

            <div className="space-y-2">
              {members.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={m.relation}
                    onChange={(e) => {
                      const updated = [...members];
                      updated[idx].relation = e.target.value;
                      setMembers(updated);
                    }}
                    placeholder="Relation (Self, Spouse...)"
                    className="w-1/3 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  />
                  <input
                    type="number"
                    value={m.age}
                    onChange={(e) => {
                      const updated = [...members];
                      updated[idx].age = Number(e.target.value);
                      setMembers(updated);
                    }}
                    placeholder="Age"
                    className="w-20 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  />
                  <select
                    value={m.gender}
                    onChange={(e) => {
                      const updated = [...members];
                      updated[idx].gender = e.target.value as Gender;
                      setMembers(updated);
                    }}
                    className="w-24 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Schemes Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Select Schemes to Include in Proposal:</span>
              <span className="text-[10px] text-teal-600 font-bold bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200">
                {selectedSchemeIds.length} Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
              {schemes.map((s) => {
                const selected = selectedSchemeIds.includes(s.id);
                // Get live calculated estimate for this scheme
                const liveQuote = liveCalculatedQuotes.find((q) => {
                  const mappedId = INSURER_TO_SCHEME_MAP[q.insurerId];
                  return mappedId === s.id || s.insurer.toLowerCase().includes(q.insurerName.toLowerCase().split(' ')[0]);
                });

                const estPremium = liveQuote ? liveQuote.finalAnnualPremium : (s.ratePerLakh ? s.ratePerLakh * (sumInsured / 100000) : 14000);

                return (
                  <div
                    key={s.id}
                    onClick={() => toggleSchemeSelection(s.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2 ${
                      selected
                        ? 'bg-teal-50/80 border-teal-400 dark:bg-teal-950/40 dark:border-teal-700 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{s.insurer}</div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-xs">{s.plan}</div>
                      <div className="text-[11px] text-teal-700 dark:text-teal-300 font-bold mt-0.5">
                        Est. {formatINR(estPremium)}/yr ({formatINR(Math.round(estPremium / 12))}/mo)
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {}}
                      className="rounded text-teal-600 focus:ring-0 mt-1 w-4 h-4"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Submit Action */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Save & Generate Client Proposal
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
