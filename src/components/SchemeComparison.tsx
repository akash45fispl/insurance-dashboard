import React, { useState } from 'react';
import { Plus, X, Scale, ArrowRight, FileText, MessageCircle, Mail, Sparkles, Send } from 'lucide-react';
import { Scheme } from '@/lib/types';
import { getInsurerLogoUrl } from '@/lib/insurer-logos';

interface SchemeComparisonProps {
  schemes: Scheme[];
  compareIds: string[];
  onRemoveFromCompare: (id: string) => void;
  onClearCompare: () => void;
  onSelectScheme: (scheme: Scheme) => void;
  onAddIdToCompare: (id: string) => void;
  onCreateProposalFromCompare?: (selectedIds: string[]) => void;
}

export const SchemeComparison: React.FC<SchemeComparisonProps> = ({
  schemes,
  compareIds,
  onRemoveFromCompare,
  onClearCompare,
  onSelectScheme,
  onAddIdToCompare,
  onCreateProposalFromCompare,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  // Get schemes selected for comparison
  const selectedSchemes = schemes.filter((s) => compareIds.includes(s.id));
  const activeCategory = selectedSchemes.length > 0 ? selectedSchemes[0].category : null;

  // Filter unselected schemes to ONLY match active category
  const unselectedSchemes = schemes.filter((s) => {
    if (compareIds.includes(s.id)) return false;
    if (activeCategory && s.category !== activeCategory) return false;
    return true;
  });

  const handleQuickWhatsAppShare = () => {
    if (selectedSchemes.length === 0) return;
    let msg = `*Fortune Investment Services - Insurance Policy Comparison*\n\n`;
    selectedSchemes.forEach((s, idx) => {
      msg += `*${idx + 1}. ${s.plan} (${s.insurer})*\n`;
      msg += `• Sum Insured: ${s.sumInsured}\n`;
      msg += `• Est. Premium: ${s.financials.premium}\n`;
      msg += `• CSR %: ${s.csr}\n`;
      msg += `• Network: ${s.network}\n`;
      msg += `• Room Rent: ${s.roomRent}\n\n`;
    });
    msg += `Reach out to us to get your customized formal proposal document!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleQuickEmailShare = () => {
    if (selectedSchemes.length === 0) return;
    const subject = `Insurance Policy Comparison: ${selectedSchemes.map((s) => s.plan).join(' vs ')}`;
    let body = `Dear Client,\n\nHere is the side-by-side policy comparison matrix:\n\n`;
    selectedSchemes.forEach((s, idx) => {
      body += `${idx + 1}. ${s.plan} - ${s.insurer}\n`;
      body += `   Sum Insured: ${s.sumInsured}\n`;
      body += `   Est. Premium: ${s.financials.premium}\n`;
      body += `   Claim Settlement Ratio: ${s.csr}\n`;
      body += `   Hospital Network: ${s.network}\n`;
      body += `   Restoration: ${s.restoration}\n\n`;
    });
    body += `Regards,\nFortune Investment Services`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8">
      
      {/* Panel Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Compare Schemes</h2>
            <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs px-2.5 py-0.5 rounded-full">
              Side-by-Side Spec Matrix ({selectedSchemes.length}/4)
            </span>
            {activeCategory && (
              <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs px-2.5 py-0.5 rounded-full uppercase">
                {activeCategory} Policies Only
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compare key financials, inclusions, CSR %, room capping, restoration, and fine print across selected policies.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedSchemes.length > 0 && onCreateProposalFromCompare && (
            <button
              onClick={() => onCreateProposalFromCompare(compareIds)}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Send as Proposal</span>
            </button>
          )}

          {selectedSchemes.length < 4 && (
            <button
              onClick={() => setPickerOpen(!pickerOpen)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Scheme
            </button>
          )}

          {selectedSchemes.length > 0 && (
            <button
              onClick={onClearCompare}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            >
              Clear Matrix
            </button>
          )}
        </div>
      </div>

      {/* Scheme Picker Dropdown Drawer */}
      {pickerOpen && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-blue-200 dark:border-blue-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Select a scheme to add to comparison:</span>
            <button onClick={() => setPickerOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {unselectedSchemes.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onAddIdToCompare(s.id);
                  setPickerOpen(false);
                }}
                className="p-2.5 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg text-left transition-all text-xs"
              >
                <div className="font-bold text-slate-900 dark:text-slate-100">{s.plan}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{s.insurer} • {s.category.toUpperCase()}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Matrix Table */}
      {selectedSchemes.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <Scale className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No schemes selected for comparison</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Select schemes from the Scheme Library above or click "+ Add Scheme to Compare" to build your side-by-side matrix.
          </p>
          <button
            onClick={() => setPickerOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
          >
            + Select Schemes to Compare
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3.5 bg-slate-100 dark:bg-slate-800/90 font-bold text-slate-800 dark:text-slate-200 w-48 shrink-0 border-r border-slate-200 dark:border-slate-800">
                    Policy Parameters
                  </th>
                  {selectedSchemes.map((s) => {
                    const logoUrl = getInsurerLogoUrl(s.insurer, s.logoUrl);
                    return (
                      <th key={s.id} className="p-3.5 bg-slate-50 dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 min-w-[240px] relative border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                        <button
                          onClick={() => onRemoveFromCompare(s.id)}
                          className="absolute top-2.5 right-2.5 p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center gap-2 mb-1.5">
                          <img
                            src={logoUrl}
                            alt={s.insurer}
                            className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-0.5 shrink-0"
                          />
                          <div className="truncate">
                            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block truncate">{s.insurer}</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block mt-0.5">{s.plan}</span>
                        <button
                          onClick={() => onSelectScheme(s)}
                          className="mt-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          View 8-Section Details <ArrowRight className="w-3 h-3" />
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                
                {/* Category */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Category</td>
                  {selectedSchemes.map((s) => (
                    <td key={s.id} className="p-3 uppercase font-bold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0">{s.category}</td>
                  ))}
                </tr>

                {/* Sum Insured */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Sum Insured Range</td>
                  {selectedSchemes.map((s) => (
                    <td key={s.id} className="p-3 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0">{s.sumInsured}</td>
                  ))}
                </tr>

                {/* Est Premium */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Est. Premium</td>
                  {selectedSchemes.map((s) => (
                    <td key={s.id} className="p-3 font-extrabold text-blue-700 dark:text-blue-400 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0">{s.financials.premium}</td>
                  ))}
                </tr>

                {/* Claim Settlement Ratio */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Claim Settlement Ratio (CSR)</td>
                  {selectedSchemes.map((s) => (
                    <td key={s.id} className="p-3 font-bold text-emerald-600 dark:text-emerald-400 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0">{s.csr}</td>
                  ))}
                </tr>

                {/* Hospital / Garage Network */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Cashless Network Size</td>
                  {selectedSchemes.map((s) => (
                    <td key={s.id} className="p-3 text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0">{s.network}</td>
                  ))}
                </tr>

                {/* Room Rent Limits */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Room Rent Limits</td>
                  {selectedSchemes.map((s) => (
                    <td key={s.id} className="p-3 text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0">{s.roomRent}</td>
                  ))}
                </tr>

                {/* Restoration Benefit */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Restoration Benefit</td>
                  {selectedSchemes.map((s) => (
                    <td key={s.id} className="p-3 text-blue-800 dark:text-blue-300 font-bold border-r border-slate-100 dark:border-slate-800/60 last:border-r-0">{s.restoration}</td>
                  ))}
                </tr>

                {/* Waiting Period */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">PED Waiting Period</td>
                  {selectedSchemes.map((s) => (
                    <td key={s.id} className="p-3 text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0">{s.waitingPED}</td>
                  ))}
                </tr>

                {/* Key Rider Benefits */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Special Benefits & Riders</td>
                  {selectedSchemes.map((s) => (
                    <td key={s.id} className="p-3 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0">
                      <ul className="list-disc pl-4 space-y-1 text-[11px]">
                        {s.specialBenefits.slice(0, 2).map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>

                {/* Fine Print & Deductibles */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Sub-limits & Deductibles</td>
                  {selectedSchemes.map((s) => (
                    <td key={s.id} className="p-3 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0">
                      <div className="text-[11px]"><span className="font-semibold text-slate-900 dark:text-slate-100">Sub-limits:</span> {s.finePrint.subLimits}</div>
                      <div className="text-[11px] mt-1"><span className="font-semibold text-slate-900 dark:text-slate-100">Co-pay:</span> {s.finePrint.coPay}</div>
                    </td>
                  ))}
                </tr>

                {/* Best For Profile */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Target Profile ("Best For")</td>
                  {selectedSchemes.map((s) => (
                    <td key={s.id} className="p-3 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0">
                      <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/60 text-blue-950 dark:text-blue-200 rounded-lg font-medium text-[11px]">
                        {s.targetProfile.bestFor}
                      </div>
                    </td>
                  ))}
                </tr>

              </tbody>
            </table>
          </div>

          {/* Bottom Send Proposal Action Card */}
          <div className="mt-8 p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl border border-blue-500/30 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-400/30 text-blue-300">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">Send Compared Schemes as Client Proposal</h4>
                <p className="text-xs text-blue-200 mt-0.5">
                  Send these {selectedSchemes.length} compared policies directly to your client via WhatsApp, Email, or build a formal PDF Proposal.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {onCreateProposalFromCompare && (
                <button
                  onClick={() => onCreateProposalFromCompare(compareIds)}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Client Proposal PDF</span>
                </button>
              )}
              <button
                onClick={handleQuickWhatsAppShare}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={handleQuickEmailShare}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
