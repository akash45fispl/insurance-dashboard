import { Scheme, Proposal, AdvisorNote, User, AnalyticsMetrics, ProposalStatus } from './types';
import { SEED_SCHEMES, SEED_PROPOSALS, SEED_ADVISOR_NOTES, SEED_USERS } from './seed';
import { supabase, isSupabaseConfigured } from './supabase';

const SCHEMES_KEY = 'fortune_schemes_db';
const PROPOSALS_KEY = 'fortune_proposals_db';
const NOTES_KEY = 'fortune_notes_db';
const USERS_KEY = 'fortune_users_db';

// ---------------- SANITIZATION & DEFENSIVE DATA GUARDS ----------------
export function sanitizeProposal(p: any): Proposal | null {
  if (!p || typeof p !== 'object') return null;
  if (!p.id || typeof p.id !== 'string') return null;

  return {
    id: p.id,
    name: p.name || 'Untitled Proposal',
    client: {
      name: p.client?.name || 'Client',
      age: typeof p.client?.age === 'number' ? p.client.age : 35,
      family: p.client?.family || 'Self',
      city: p.client?.city || 'Location',
      advisor: p.client?.advisor || 'Advisor',
      email: p.client?.email || '',
      phone: p.client?.phone || '',
      members: Array.isArray(p.client?.members) ? p.client.members : [],
    },
    compareIds: Array.isArray(p.compareIds) ? p.compareIds : [],
    createdBy: p.createdBy || 'advisor@fortune.com',
    createdByDisplay: p.createdByDisplay || 'Advisor',
    status: p.status || 'Created',
    date: p.date || new Date().toISOString().split('T')[0],
    category: p.category || 'health',
    totalPremium: typeof p.totalPremium === 'number' ? p.totalPremium : 35000,
    customNotes: p.customNotes || {},
    createdAt: p.createdAt || new Date().toISOString(),
    statusLog: Array.isArray(p.statusLog) ? p.statusLog : [],
    schemeCalculations: p.schemeCalculations || undefined,
  };
}

export function sanitizeScheme(s: any): Scheme | null {
  if (!s || typeof s !== 'object') return null;
  if (!s.id || typeof s.id !== 'string') return null;

  return {
    id: s.id,
    category: s.category || 'health',
    insurer: s.insurer || 'Insurer',
    type: s.type || 'standalone',
    plan: s.plan || 'Plan',
    tagline: s.tagline || '',
    csr: s.csr || '90%',
    network: s.network || '10,000+ Hospitals',
    sumInsured: s.sumInsured || '₹5 Lakhs',
    entryAge: s.entryAge || '18-65 yrs',
    roomRent: s.roomRent || 'No cap',
    restoration: s.restoration || '100%',
    waitingPED: s.waitingPED || '36 months',
    ratePerLakh: typeof s.ratePerLakh === 'number' ? s.ratePerLakh : 1200,
    financials: s.financials || {
      sumInsured: s.sumInsured || '₹5 Lakhs',
      entryAge: s.entryAge || '18-65 yrs',
      network: s.network || '10,000+ Hospitals',
      roomRent: s.roomRent || 'No cap',
      restoration: s.restoration || '100%',
      waitingPED: s.waitingPED || '36 months',
      csr: s.csr || '90%',
      premium: 'Est. ₹12,000/yr',
    },
    inclusions: Array.isArray(s.inclusions) ? s.inclusions : [],
    specialBenefits: Array.isArray(s.specialBenefits) ? s.specialBenefits : [],
    hospitalNetwork: s.hospitalNetwork || {
      csrPercentage: s.csr || '90%',
      cashlessGaragesOrHospitalsCount: s.network || '10,000+ Hospitals',
      settlementSpeed: '< 2 Hours',
      tpaSupport: 'Direct in-house claims'
    },
    targetProfile: s.targetProfile || {
      bestFor: 'General policyholders',
      idealAgeRange: '18 – 65 years',
      recommendedFamilyType: 'Self + Spouse + Children'
    },
    finePrint: s.finePrint || {
      subLimits: 'Standard policy sub-limits apply.',
      deductibles: 'Zero deductible',
      coPay: 'Nil'
    },
    exclusions: Array.isArray(s.exclusions) ? s.exclusions : [],
    premiumNote: s.premiumNote || '',
    logoUrl: s.logoUrl || undefined,
    calculatedPremium: s.calculatedPremium || undefined,
  };
}

// Helper for localStorage fallback
function getLocalItem<T>(key: string, seedDefault: T): T {
  if (typeof window === 'undefined') return seedDefault;
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(seedDefault));
      return seedDefault;
    }
    return JSON.parse(data) as T;
  } catch (err) {
    console.error('LocalStorage read error:', err);
    return seedDefault;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

// ---------------- SERVER API CLOUD SYNC HELPERS ----------------
async function fetchServerProposals(): Promise<Proposal[] | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/proposals', { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json && Array.isArray(json.proposals)) {
      const sanitized = json.proposals.map(sanitizeProposal).filter((p: Proposal | null): p is Proposal => p !== null);
      return sanitized;
    }
  } catch (err) {
    console.warn('Server proposals sync fetch error:', err);
  }
  return null;
}

async function syncProposalsToServer(proposals: Proposal[]): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposals }),
    });
  } catch (err) {
    console.warn('Server proposal sync push error:', err);
  }
}

async function fetchServerSchemes(): Promise<Scheme[] | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/schemes', { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json && Array.isArray(json.schemes)) {
      const sanitized = json.schemes.map(sanitizeScheme).filter((s: Scheme | null): s is Scheme => s !== null);
      return sanitized;
    }
  } catch (err) {
    console.warn('Server scheme sync fetch error:', err);
  }
  return null;
}

async function syncSchemesToServer(schemes: Scheme[]): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/schemes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemes }),
    });
  } catch (err) {
    console.warn('Server scheme sync push error:', err);
  }
}

// ---------------- SCHEMES CRUD ----------------
export async function getSchemes(): Promise<Scheme[]> {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('schemes').select('*');
      if (!error && data && data.length > 0) {
        return data.map(sanitizeScheme).filter((s: Scheme | null): s is Scheme => s !== null);
      }
    }

    const serverSchemes = await fetchServerSchemes();
    if (serverSchemes && serverSchemes.length > 0) {
      setLocalItem(SCHEMES_KEY, serverSchemes);
      return serverSchemes;
    }
  } catch (err) {
    console.error('getSchemes error:', err);
  }

  const rawLocal = getLocalItem<any[]>(SCHEMES_KEY, SEED_SCHEMES);
  return rawLocal.map(sanitizeScheme).filter((s: Scheme | null): s is Scheme => s !== null);
}

export async function getSchemeById(id: string): Promise<Scheme | null> {
  const schemes = await getSchemes();
  return schemes.find((s) => s.id === id) || null;
}

export async function saveScheme(scheme: Scheme): Promise<Scheme> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('schemes').upsert(scheme).select().single();
    if (!error && data) {
      const sanitized = sanitizeScheme(data);
      if (sanitized) return sanitized;
    }
  }
  
  const rawSchemes = getLocalItem<any[]>(SCHEMES_KEY, SEED_SCHEMES);
  const schemes = rawSchemes.map(sanitizeScheme).filter((s: Scheme | null): s is Scheme => s !== null);
  
  const idx = schemes.findIndex((s) => s.id === scheme.id);
  if (idx >= 0) {
    schemes[idx] = scheme;
  } else {
    schemes.unshift(scheme);
  }
  setLocalItem(SCHEMES_KEY, schemes);
  syncSchemesToServer(schemes);
  return scheme;
}

export async function deleteScheme(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('schemes').delete().eq('id', id);
    if (!error) return true;
  }

  const rawSchemes = getLocalItem<any[]>(SCHEMES_KEY, SEED_SCHEMES);
  const schemes = rawSchemes.map(sanitizeScheme).filter((s: Scheme | null): s is Scheme => s !== null);
  const filtered = schemes.filter((s) => s.id !== id);
  setLocalItem(SCHEMES_KEY, filtered);
  syncSchemesToServer(filtered);
  return true;
}

// ---------------- PROPOSALS CRUD ----------------
export async function getProposals(): Promise<Proposal[]> {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('proposals').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(sanitizeProposal).filter((p: Proposal | null): p is Proposal => p !== null);
      }
    }

    const serverProps = await fetchServerProposals();
    if (serverProps && serverProps.length > 0) {
      setLocalItem(PROPOSALS_KEY, serverProps);
      return serverProps;
    }
  } catch (err) {
    console.error('getProposals error:', err);
  }

  const rawLocal = getLocalItem<any[]>(PROPOSALS_KEY, SEED_PROPOSALS);
  const sanitized = rawLocal.map(sanitizeProposal).filter((p: Proposal | null): p is Proposal => p !== null);
  if (sanitized.length > 0) {
    syncProposalsToServer(sanitized);
  }
  return sanitized;
}

export async function getProposalById(id: string): Promise<Proposal | null> {
  const proposals = await getProposals();
  return proposals.find((p) => p.id === id) || null;
}

export async function createProposal(proposal: Omit<Proposal, 'id' | 'createdAt'>): Promise<Proposal> {
  const newProposal: Proposal = {
    ...proposal,
    id: `prop-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('proposals').insert(newProposal).select().single();
    if (!error && data) {
      const sanitized = sanitizeProposal(data);
      if (sanitized) return sanitized;
    }
  }

  const rawProps = getLocalItem<any[]>(PROPOSALS_KEY, SEED_PROPOSALS);
  const proposals = rawProps.map(sanitizeProposal).filter((p: Proposal | null): p is Proposal => p !== null);
  proposals.unshift(newProposal);
  setLocalItem(PROPOSALS_KEY, proposals);
  syncProposalsToServer(proposals);

  return newProposal;
}

export async function updateProposalStatus(id: string, status: ProposalStatus, userName: string = 'Admin'): Promise<Proposal | null> {
  const rawProps = getLocalItem<any[]>(PROPOSALS_KEY, SEED_PROPOSALS);
  const proposals = rawProps.map(sanitizeProposal).filter((p: Proposal | null): p is Proposal => p !== null);
  const idx = proposals.findIndex((p) => p.id === id);
  if (idx >= 0) {
    const oldStatus = proposals[idx].status;
    proposals[idx].status = status;
    
    if (!proposals[idx].statusLog) {
      proposals[idx].statusLog = [];
    }
    
    proposals[idx].statusLog.push({
      oldStatus,
      newStatus: status,
      changedBy: userName,
      changedAt: new Date().toISOString()
    });
    
    setLocalItem(PROPOSALS_KEY, proposals);
    syncProposalsToServer(proposals);
    return proposals[idx];
  }
  return null;
}

export async function deleteProposal(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('proposals').delete().eq('id', id);
    if (!error) return true;
  }

  const rawProps = getLocalItem<any[]>(PROPOSALS_KEY, SEED_PROPOSALS);
  const proposals = rawProps.map(sanitizeProposal).filter((p: Proposal | null): p is Proposal => p !== null);
  const filtered = proposals.filter((p) => p.id !== id);
  setLocalItem(PROPOSALS_KEY, filtered);
  syncProposalsToServer(filtered);
  return true;
}

// ---------------- ADVISOR NOTES CRUD ----------------
export async function getAdvisorNotes(schemeId?: string): Promise<AdvisorNote[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('advisor_notes').select('*');
    if (schemeId) query = query.eq('scheme_id', schemeId);
    const { data, error } = await query;
    if (!error && data) return data as AdvisorNote[];
  }
  const notes = getLocalItem<AdvisorNote[]>(NOTES_KEY, SEED_ADVISOR_NOTES);
  if (schemeId) return notes.filter((n) => n.schemeId === schemeId);
  return notes;
}

export async function saveAdvisorNote(schemeId: string, advisorId: string, advisorName: string, noteText: string): Promise<AdvisorNote> {
  const updatedAt = new Date().toISOString();
  const noteObj: AdvisorNote = {
    id: `note-${schemeId}-${advisorId}`,
    schemeId,
    advisorId,
    advisorName,
    noteText,
    updatedAt,
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('advisor_notes').upsert({
      id: noteObj.id,
      scheme_id: schemeId,
      advisor_id: advisorId,
      advisor_name: advisorName,
      note_text: noteText,
      updated_at: updatedAt,
    }).select().single();
    if (!error && data) return noteObj;
  }

  const notes = getLocalItem<AdvisorNote[]>(NOTES_KEY, SEED_ADVISOR_NOTES);
  const idx = notes.findIndex((n) => n.schemeId === schemeId && n.advisorId === advisorId);
  if (idx >= 0) {
    notes[idx] = noteObj;
  } else {
    notes.push(noteObj);
  }
  setLocalItem(NOTES_KEY, notes);
  return noteObj;
}

// ---------------- USERS CRUD ----------------
export async function getUsers(): Promise<User[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('users').select('*');
    if (!error && data && data.length > 0) return data as User[];
  }
  return getLocalItem<User[]>(USERS_KEY, SEED_USERS);
}

export async function saveUser(user: User): Promise<User> {
  const users = getLocalItem<User[]>(USERS_KEY, SEED_USERS);
  const idx = users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.unshift(user);
  }
  setLocalItem(USERS_KEY, users);
  return user;
}

export async function updateUserStatus(userId: string, status: 'active' | 'inactive'): Promise<User | null> {
  const users = getLocalItem<User[]>(USERS_KEY, SEED_USERS);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx >= 0) {
    users[idx].status = status;
    setLocalItem(USERS_KEY, users);
    return users[idx];
  }
  return null;
}

export async function deleteUser(userId: string): Promise<boolean> {
  const users = getLocalItem<User[]>(USERS_KEY, SEED_USERS);
  const filtered = users.filter((u) => u.id !== userId);
  setLocalItem(USERS_KEY, filtered);
  return true;
}

// ---------------- ANALYTICS DATA ----------------
export async function getAnalyticsMetrics(): Promise<AnalyticsMetrics> {
  const proposals = await getProposals();
  const schemes = await getSchemes();

  const totalProposals = proposals.length;
  const totalPremiumVolume = proposals.reduce((acc, p) => acc + (p.totalPremium || 35000), 0);
  const purchased = proposals.filter((p) => p.status === 'Purchased').length;
  const conversionRate = totalProposals > 0 ? Math.round((purchased / totalProposals) * 100) : 0;

  // Category distribution
  const catMap: Record<string, { count: number; volume: number }> = {
    health: { count: 0, volume: 0 },
    term: { count: 0, volume: 0 },
    motor: { count: 0, volume: 0 },
    travel: { count: 0, volume: 0 },
  };

  proposals.forEach((p) => {
    const cat = p.category || 'health';
    if (!catMap[cat]) catMap[cat] = { count: 0, volume: 0 };
    catMap[cat].count += 1;
    catMap[cat].volume += p.totalPremium || 35000;
  });

  const categoryDistribution = Object.entries(catMap).map(([category, val]) => ({
    category: category.toUpperCase(),
    count: val.count,
    volume: val.volume,
  }));

  // Status distribution
  const statusCounts: Record<ProposalStatus, number> = { 'Created': 0, 'Sent to Client': 0, 'Accepted': 0, 'Purchased': 0, 'Declined': 0 };
  proposals.forEach((p) => {
    if (p && p.status && statusCounts[p.status] !== undefined) statusCounts[p.status] += 1;
  });

  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    percentage: totalProposals > 0 ? Math.round((count / totalProposals) * 100) : 0,
  }));

  // Advisor performance
  const advisorMap: Record<string, { name: string; proposals: number; volume: number; purchased: number }> = {};
  proposals.forEach((p) => {
    const advName = p.createdByDisplay || p.createdBy || 'Advisor';
    if (!advisorMap[advName]) {
      advisorMap[advName] = { name: advName, proposals: 0, volume: 0, purchased: 0 };
    }
    advisorMap[advName].proposals += 1;
    advisorMap[advName].volume += p.totalPremium || 35000;
    if (p.status === 'Purchased') advisorMap[advName].purchased += 1;
  });

  const advisorPerformance = Object.values(advisorMap).map((adv) => ({
    name: adv.name.split(' ')[0],
    proposals: adv.proposals,
    volume: Math.round(adv.volume / 1000), // in Thousands
    conversion: adv.proposals > 0 ? Math.round((adv.purchased / adv.proposals) * 100) : 0,
  }));

  const monthlyTrend = [
    { month: 'Apr 2026', volume: 120, proposals: 4 },
    { month: 'May 2026', volume: 180, proposals: 6 },
    { month: 'Jun 2026', volume: 240, proposals: 8 },
    { month: 'Jul 2026', volume: 310, proposals: 11 },
    { month: 'Aug 2026', volume: Math.round(totalPremiumVolume / 1000), proposals: totalProposals },
  ];

  return {
    totalProposals,
    totalPremiumVolume,
    conversionRate,
    activeAdvisors: Object.keys(advisorMap).length || 2,
    categoryDistribution,
    statusDistribution,
    advisorPerformance,
    monthlyTrend,
  };
}
