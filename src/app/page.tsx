'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LoginView } from '@/components/LoginView';
import { Navbar } from '@/components/Navbar';
import { SchemeLibrary } from '@/components/SchemeLibrary';
import { ClientProposals } from '@/components/ClientProposals';
import { SchemeComparison } from '@/components/SchemeComparison';
import { AnalyticsOverview } from '@/components/AnalyticsOverview';
import { AdvisorReportsView } from '@/components/AdvisorReportsView';
import { SchemeDetailView } from '@/components/SchemeDetailView';
import { ProposalDetailView } from '@/components/ProposalDetailView';
import { NewProposalModal } from '@/components/NewProposalModal';
import { EditSchemeModal } from '@/components/EditSchemeModal';
import { SchemePremiumCalculator } from '@/components/SchemePremiumCalculator';
import { SchemeSettingsView } from '@/components/SchemeSettingsView';
import { UserManagementView } from '@/components/UserManagementView';
import { IndianHealthCalculator } from '@/components/IndianHealthCalculator';
import { InsurerQuote, UserProfile } from '@/lib/health-rating-engine';
import { Scheme, Proposal, AnalyticsMetrics, ProposalStatus, CalculatedPremiumDetails, User, UserStatus } from '@/lib/types';
import { 
  getSchemes, 
  getProposals, 
  getAnalyticsMetrics, 
  getUsers,
  saveUser,
  updateUserStatus,
  deleteUser,
  saveScheme,
  deleteScheme,
  createProposal, 
  updateProposalStatus, 
  deleteProposal 
} from '@/lib/data-service';
import { ShieldCheck, Plus, Sparkles, Scale, Layers, Calculator } from 'lucide-react';

export default function HomePage() {
  const { user, loading, isAdmin } = useAuth();

  // State management
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsMetrics | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);

  // Active View mode
  const [activeView, setActiveView] = useState<'dashboard' | 'library' | 'proposals' | 'compare' | 'analytics' | 'reports' | 'detail' | 'proposal_doc' | 'settings' | 'users' | 'calculator'>('dashboard');

  // Selected entities for deep view
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [selectedProposalDoc, setSelectedProposalDoc] = useState<Proposal | null>(null);

  // Compare multi-select state
  const [compareIds, setCompareIds] = useState<string[]>(['star-assure', 'hdfc-optima-secure']);

  // Proposal Creation Modal state
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [preSelectedSchemeForProp, setPreSelectedSchemeForProp] = useState<Scheme | null>(null);
  const [calcQuotesForProposal, setCalcQuotesForProposal] = useState<InsurerQuote[]>([]);
  const [calcProfileForProposal, setCalcProfileForProposal] = useState<UserProfile | null>(null);

  // Admin Scheme Edit / Create Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
  const [isNewSchemeMode, setIsNewSchemeMode] = useState(false);

  // Premium Calculator Modal state
  const [calculatorModalOpen, setCalculatorModalOpen] = useState(false);
  const [calculatorScheme, setCalculatorScheme] = useState<Scheme | null>(null);

  // Dark Mode state
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  // Load data on mount, user change, tab focus & periodic cloud polling
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const sList = await getSchemes();
        const pList = await getProposals();
        const aMetrics = await getAnalyticsMetrics();
        const uList = await getUsers();
        if (isMounted) {
          setSchemes(sList);
          setProposals(pList);
          setAnalytics(aMetrics);
          setUsersList(uList);
        }
      } catch (err) {
        console.error('Error fetching synced cloud data:', err);
      }
    }

    loadData();

    // Auto-refresh proposals every 8 seconds across systems
    const timer = setInterval(() => {
      loadData();
    }, 8000);

    const handleFocus = () => {
      loadData();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  // User Management Handlers
  const handleRefreshUsers = async () => {
    const uList = await getUsers();
    setUsersList(uList);
  };

  const handleUpdateUserStatus = async (userId: string, status: UserStatus) => {
    await updateUserStatus(userId, status);
    await handleRefreshUsers();
  };

  const handleSaveUser = async (userToSave: User) => {
    await saveUser(userToSave);
    await handleRefreshUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
    await handleRefreshUsers();
  };

  // Auth Protection guard
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Fortune Advisor Suite...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Handle Detail View Trigger
  const handleSelectScheme = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setActiveView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Add New Scheme Trigger
  const handleAddNewScheme = () => {
    setEditingScheme(null);
    setIsNewSchemeMode(true);
    setEditModalOpen(true);
  };

  // Handle Admin Edit Scheme Trigger
  const handleOpenEditScheme = (scheme: Scheme) => {
    setEditingScheme(scheme);
    setIsNewSchemeMode(false);
    setEditModalOpen(true);
  };

  // Handle Delete Scheme Trigger
  const handleDeleteScheme = async (schemeId: string) => {
    await deleteScheme(schemeId);
    const updatedList = await getSchemes();
    setSchemes(updatedList);
    setCompareIds(compareIds.filter((cId) => cId !== schemeId));
    if (selectedScheme && selectedScheme.id === schemeId) {
      setSelectedScheme(null);
      setActiveView('dashboard');
    }
  };

  // Handle Open Premium Calculator Modal
  const handleOpenCalculator = (scheme: Scheme) => {
    setCalculatorScheme(scheme);
    setCalculatorModalOpen(true);
  };

  // Handle Save Calculation Result
  const handleSaveCalculation = async (schemeId: string, details: CalculatedPremiumDetails) => {
    const targetScheme = schemes.find((s) => s.id === schemeId);
    if (!targetScheme) return;
    const updated: Scheme = {
      ...targetScheme,
      calculatedPremium: details,
      financials: {
        ...targetScheme.financials,
        premium: `₹${details.netAnnualPremium.toLocaleString('en-IN')}/yr (Calculated)`,
      },
    };
    await saveScheme(updated);
    const updatedList = await getSchemes();
    setSchemes(updatedList);
    if (selectedScheme && selectedScheme.id === schemeId) {
      setSelectedScheme(updated);
    }
  };

  // Handle Save Edited/New Scheme
  const handleSaveScheme = async (updatedScheme: Scheme) => {
    await saveScheme(updatedScheme);
    const updatedList = await getSchemes();
    setSchemes(updatedList);

    // If currently viewing details for this scheme, update selectedScheme
    if (selectedScheme && selectedScheme.id === updatedScheme.id) {
      setSelectedScheme(updatedScheme);
    }
  };

  // Handle Proposal View Trigger
  const handleViewProposalDoc = (proposal: Proposal) => {
    setSelectedProposalDoc(proposal);
    setActiveView('proposal_doc');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Compare toggle handler with Category Lock enforcement
  const handleToggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((cId) => cId !== id));
    } else {
      if (compareIds.length >= 4) {
        alert('You can compare a maximum of 4 schemes simultaneously.');
        return;
      }

      // Strict Category Rule: Only schemes of the SAME category can be added to comparison
      if (compareIds.length > 0) {
        const activeCategory = schemes.find((s) => compareIds.includes(s.id))?.category;
        const targetScheme = schemes.find((s) => s.id === id);

        if (activeCategory && targetScheme && targetScheme.category !== activeCategory) {
          alert(`Category Mismatch: Only insurance policies of the SAME category can be compared together. Current comparison matrix is locked to "${activeCategory.toUpperCase()}" insurance. Please clear the matrix or select ${activeCategory.toUpperCase()} policies.`);
          return;
        }
      }

      setCompareIds([...compareIds, id]);
    }
  };

  // Create & Save Proposal
  const handleSaveProposal = async (proposalObj: Omit<Proposal, 'id' | 'createdAt'>) => {
    // Attach current calculated premiums to proposal document if available
    const schemeCalculations: Record<string, CalculatedPremiumDetails> = {};
    schemes.forEach((s) => {
      if (proposalObj.compareIds.includes(s.id) && s.calculatedPremium) {
        schemeCalculations[s.id] = s.calculatedPremium;
      }
    });

    const fullProposal = {
      ...proposalObj,
      schemeCalculations: Object.keys(schemeCalculations).length > 0 ? schemeCalculations : undefined,
    };

    const saved = await createProposal(fullProposal);
    const updatedList = await getProposals();
    const updatedMetrics = await getAnalyticsMetrics();
    setProposals(updatedList);
    setAnalytics(updatedMetrics);
    setSelectedProposalDoc(saved);
    setActiveView('proposal_doc');
  };

  // Update Status
  const handleUpdateStatus = async (id: string, status: ProposalStatus) => {
    await updateProposalStatus(id, status, user?.name || 'Admin');
    const updatedList = await getProposals();
    const updatedMetrics = await getAnalyticsMetrics();
    setProposals(updatedList);
    setAnalytics(updatedMetrics);
  };

  // Delete Proposal
  const handleDeleteProposal = async (id: string) => {
    await deleteProposal(id);
    const updatedList = await getProposals();
    const updatedMetrics = await getAnalyticsMetrics();
    setProposals(updatedList);
    setAnalytics(updatedMetrics);
  };

  // Render Scheme Detail View
  if (activeView === 'detail' && selectedScheme) {
    return (
      <SchemeDetailView
        scheme={selectedScheme}
        onBack={() => setActiveView('dashboard')}
        onOpenCalculator={handleOpenCalculator}
      />
    );
  }

  // Render Proposal Presentation View
  if (activeView === 'proposal_doc' && selectedProposalDoc) {
    return (
      <ProposalDetailView
        proposal={selectedProposalDoc}
        allSchemes={schemes}
        onBack={() => setActiveView('dashboard')}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Navbar */}
      <Navbar
        activeView={activeView === 'detail' || activeView === 'proposal_doc' ? 'dashboard' : activeView}
        setActiveView={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        compareCount={compareIds.length}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Container - Single Dedicated View Rendering */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* VIEW 1: HOME / SCHEME LIBRARY (DEFAULT) */}
        {(activeView === 'dashboard' || activeView === 'library') && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Welcome Hero Banner */}
            <div className="bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800/90 relative overflow-hidden">
              {/* Glowing Ambient Light Orbs */}
              <div className="absolute -right-12 -top-12 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-12 -bottom-12 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div>
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-emerald-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-400/30 mb-3 shadow-inner">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Fortune Investment Services Portal</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
                    Welcome back, <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-emerald-300 bg-clip-text text-transparent">{user.name}</span> 👋
                  </h1>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                    Browse flagship health, term, motor & travel insurance policies across top IRDAI insurers, run interactive premium calculations, compare policies, and create client proposals.
                  </p>

                  {/* Feature Pills */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 uppercase">Health Floaters</span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">Term Life</span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase">Motor Comprehensive</span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">Global Travel</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    onClick={() => setActiveView('calculator')}
                    className="px-5 py-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-teal-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 border border-teal-400/30"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>10-Insurer Health Calculator</span>
                  </button>

                  <button
                    onClick={() => {
                      setPreSelectedSchemeForProp(null);
                      setProposalModalOpen(true);
                    }}
                    className="px-5 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 border border-blue-400/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Create Client Proposal</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Scheme Library */}
            <SchemeLibrary
              schemes={schemes}
              onSelectScheme={handleSelectScheme}
              onToggleCompare={handleToggleCompare}
              compareIds={compareIds}
              onCreateProposalWithScheme={(sch) => {
                setPreSelectedSchemeForProp(sch);
                setProposalModalOpen(true);
              }}
              onCreateProposalFromCompare={() => {
                setPreSelectedSchemeForProp(null);
                setProposalModalOpen(true);
              }}
              onOpenCalculator={handleOpenCalculator}
              isAdmin={isAdmin}
            />
          </div>
        )}

        {/* VIEW 2: 10-INSURER INDIAN HEALTH CALCULATOR */}
        {activeView === 'calculator' && (
          <div className="animate-in fade-in duration-200">
            <IndianHealthCalculator
              onBackToDashboard={() => setActiveView('dashboard')}
              onCreateProposal={(selectedQuotes, profile) => {
                setCalcQuotesForProposal(selectedQuotes);
                setCalcProfileForProposal(profile);
                setPreSelectedSchemeForProp(null);
                setProposalModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 3: CLIENT PROPOSALS */}
        {activeView === 'proposals' && (
          <div className="animate-in fade-in duration-200">
            <ClientProposals
              proposals={proposals}
              onViewProposal={handleViewProposalDoc}
              onCreateNewProposal={() => {
                setPreSelectedSchemeForProp(null);
                setCalcQuotesForProposal([]);
                setCalcProfileForProposal(null);
                setProposalModalOpen(true);
              }}
              onUpdateStatus={handleUpdateStatus}
              onDeleteProposal={handleDeleteProposal}
              isAdmin={isAdmin}
            />
          </div>
        )}

        {/* VIEW 4: ADVISOR REPORTS */}
        {activeView === 'reports' && (
          <div className="animate-in fade-in duration-200">
            <AdvisorReportsView
              proposals={proposals}
              onViewProposalDoc={handleViewProposalDoc}
            />
          </div>
        )}

        {/* VIEW 5: COMPARE SCHEMES */}
        {activeView === 'compare' && (
          <div className="animate-in fade-in duration-200">
            <SchemeComparison
              schemes={schemes}
              compareIds={compareIds}
              onRemoveFromCompare={handleToggleCompare}
              onClearCompare={() => setCompareIds([])}
              onSelectScheme={handleSelectScheme}
              onAddIdToCompare={handleToggleCompare}
              onCreateProposalFromCompare={() => {
                setPreSelectedSchemeForProp(null);
                setCalcQuotesForProposal([]);
                setCalcProfileForProposal(null);
                setProposalModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 6: ANALYTICS OVERVIEW */}
        {activeView === 'analytics' && analytics && (
          <div className="animate-in fade-in duration-200">
            <AnalyticsOverview metrics={analytics} />
          </div>
        )}

        {/* VIEW 7: SCHEME SETTINGS */}
        {activeView === 'settings' && (
          <div className="animate-in fade-in duration-200">
            <SchemeSettingsView
              schemes={schemes}
              onAddNewScheme={handleAddNewScheme}
              onEditScheme={handleOpenEditScheme}
              onDeleteScheme={handleDeleteScheme}
              onOpenCalculator={handleOpenCalculator}
              onSelectScheme={handleSelectScheme}
            />
          </div>
        )}

        {/* VIEW 8: USER MANAGEMENT */}
        {activeView === 'users' && (
          <div className="animate-in fade-in duration-200">
            <UserManagementView
              users={usersList}
              onRefreshUsers={handleRefreshUsers}
              onUpdateUserStatus={handleUpdateUserStatus}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            Fortune Advisor Suite • Fortune Investment Services Pvt Ltd
          </div>
          <p className="text-[11px] text-slate-500 max-w-xl mx-auto">
            IRDAI Registration No. 10492/2026 • Confidential internal wealth management advisor tool. All figures shown are indicative.
          </p>
          <p className="text-[10px] text-slate-600">
            Copyright © 2026 Fortune Investment Services Pvt Ltd. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Proposal Creation Modal */}
      <NewProposalModal
        schemes={schemes}
        isOpen={proposalModalOpen}
        onClose={() => {
          setProposalModalOpen(false);
          setCalcQuotesForProposal([]);
          setCalcProfileForProposal(null);
        }}
        onSaveProposal={handleSaveProposal}
        preSelectedScheme={preSelectedSchemeForProp}
        initialCompareIds={compareIds}
        calculatorQuotes={calcQuotesForProposal}
        calculatorProfile={calcProfileForProposal}
      />

      {/* Admin Scheme Edit / Add Modal */}
      <EditSchemeModal
        scheme={editingScheme}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingScheme(null);
          setIsNewSchemeMode(false);
        }}
        onSave={handleSaveScheme}
        onDelete={handleDeleteScheme}
        isNewMode={isNewSchemeMode}
      />

      {/* Scheme Premium Calculator Modal */}
      {calculatorScheme && (
        <SchemePremiumCalculator
          scheme={calculatorScheme}
          isOpen={calculatorModalOpen}
          onClose={() => {
            setCalculatorModalOpen(false);
            setCalculatorScheme(null);
          }}
          onSaveCalculation={handleSaveCalculation}
        />
      )}

    </div>
  );
}
