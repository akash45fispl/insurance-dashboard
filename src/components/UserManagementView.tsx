'use client';

import React, { useState } from 'react';
import { User, Role, UserStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { 
  Users, 
  UserCheck, 
  UserX, 
  ShieldCheck, 
  Search, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Phone, 
  Calendar, 
  Trash2, 
  RefreshCw,
  Lock,
  Database,
  Code,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface UserManagementViewProps {
  users: User[];
  onRefreshUsers: () => void;
  onUpdateUserStatus: (userId: string, status: UserStatus) => Promise<void>;
  onSaveUser: (user: User) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  onRefreshUsers,
  onUpdateUserStatus,
  onSaveUser,
  onDeleteUser,
}) => {
  const { isAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'advisor'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state for adding a user
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('advisor');
  const [newUserStatus, setNewUserStatus] = useState<UserStatus>('active');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Access Required</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto">
          User Management is restricted exclusively to Administrators (`Admin@fortuneinvestment.in`).
        </p>
      </div>
    );
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    const userStatus = u.status || 'active';
    const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    const nameStr = (u.name || '').toLowerCase();
    const emailStr = (u.email || '').toLowerCase();
    const phoneStr = (u.phone || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch = !q || nameStr.includes(q) || emailStr.includes(q) || phoneStr.includes(q);

    return matchesStatus && matchesRole && matchesSearch;
  });

  // Metrics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => (u.status || 'active') === 'active').length;
  const inactiveUsers = users.filter((u) => u.status === 'inactive').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const advisorCount = users.filter((u) => u.role === 'advisor').length;

  const handleManualSync = async () => {
    setSyncing(true);
    await onRefreshUsers();
    setSyncing(false);
    setActionSuccessMsg('Users re-synced from Supabase and Server database.');
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) return;
    setSaving(true);

    const name = newUserName || newUserEmail.split('@')[0];

    const createdUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email: newUserEmail,
      role: newUserRole,
      status: newUserStatus,
      phone: newUserPhone || '+91 98000 00000',
      createdAt: new Date().toISOString(),
    };

    await onSaveUser(createdUser);
    setSaving(false);
    setAddModalOpen(false);

    // Reset Form
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserRole('advisor');
    setNewUserStatus('active');

    setActionSuccessMsg(`User ${name} (${newUserEmail}) added & synced to Supabase.`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus: UserStatus = (user.status || 'active') === 'active' ? 'inactive' : 'active';
    await onUpdateUserStatus(user.id, nextStatus);
    setActionSuccessMsg(`User ${user.name} marked as ${nextStatus.toUpperCase()}`);
    setTimeout(() => setActionSuccessMsg(''), 3000);
  };

  const handleToggleRole = async (user: User) => {
    const nextRole: Role = user.role === 'admin' ? 'advisor' : 'admin';
    const updated: User = { ...user, role: nextRole };
    await onSaveUser(updated);
    setActionSuccessMsg(`Updated ${user.name}'s role to ${nextRole.toUpperCase()}`);
    setTimeout(() => setActionSuccessMsg(''), 3000);
  };

  const handleDelete = async (user: User) => {
    if (confirm(`Are you sure you want to delete user ${user.name} (${user.email})?`)) {
      await onDeleteUser(user.id);
      setActionSuccessMsg(`User ${user.name} deleted.`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
    }
  };

  const sqlSnippet = `-- Copy & Paste into Supabase SQL Editor to automatically sync Auth Users:
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'advisor',
  status TEXT DEFAULT 'active',
  phone TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Public Read Policy
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.users FOR UPDATE USING (true);

-- Automatic Auth Sync Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, status)
  VALUES (new.id, new.email, split_part(new.email, '@', 1), 'advisor', 'active')
  ON CONFLICT (email) DO UPDATE SET updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl">
              <Users className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight">User Management & Supabase Sync</h1>
          </div>
          <p className="text-xs text-slate-400">
            View active & inactive advisor accounts, sync Supabase users, assign roles, and manage system access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setSqlModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-xl border border-purple-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="View Supabase SQL setup guide"
          >
            <Code className="w-4 h-4 text-purple-400" />
            <span>Supabase SQL Guide</span>
          </button>

          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Supabase'}</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add / Register User</span>
          </button>
        </div>
      </div>

      {/* Action Banner */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs font-semibold shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Users</div>
            <div className="text-xl font-black text-slate-900">{totalUsers}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Users</div>
            <div className="text-xl font-black text-emerald-600">{activeUsers}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Inactive Users</div>
            <div className="text-xl font-black text-rose-600">{inactiveUsers}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Admins</div>
            <div className="text-xl font-black text-purple-700">{adminCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Advisors</div>
            <div className="text-xl font-black text-slate-900">{advisorCount}</div>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({totalUsers})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Active ({activeUsers})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'inactive'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            Inactive ({inactiveUsers})
          </button>
        </div>

        {/* Search & Role Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user name or email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin Only</option>
            <option value="advisor">Advisor Only</option>
          </select>
        </div>
      </div>

      {/* Users Table / Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-sm">No users match your criteria.</p>
            <p className="text-xs text-slate-400">Click "+ Add / Register User" above to add any Supabase user email directly into the system.</p>
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              + Add / Register Supabase User
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User Info</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isCurrentAdmin = u.email.toLowerCase() === 'admin@fortuneinvestment.in';
                  const uStatus = u.status || 'active';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm ${
                            u.role === 'admin' ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gradient-to-br from-blue-600 to-cyan-600'
                          }`}>
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrentAdmin && (
                                <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-1.5 py-0.5 rounded border border-purple-200">
                                  Primary Admin
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-[11px] font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center gap-1 text-slate-600">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone || '+91 98000 00000'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                          u.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {u.role === 'admin' ? <ShieldCheck className="w-3 h-3 text-purple-600" /> : <Users className="w-3 h-3 text-blue-600" />}
                          <span>{u.role === 'admin' ? 'Administrator' : 'Advisor'}</span>
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                          uStatus === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {uStatus === 'active' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                          <span>{uStatus === 'active' ? 'Active' : 'Inactive'}</span>
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{u.createdAt ? u.createdAt.split('T')[0] : '2026-01-01'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active / Inactive */}
                          {!isCurrentAdmin && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                                uStatus === 'active'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {uStatus === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          )}

                          {/* Toggle Role */}
                          {!isCurrentAdmin && (
                            <button
                              onClick={() => handleToggleRole(u)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition-all"
                            >
                              {u.role === 'admin' ? 'Make Advisor' : 'Make Admin'}
                            </button>
                          )}

                          {/* Delete */}
                          {!isCurrentAdmin && (
                            <button
                              onClick={() => handleDelete(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Register User Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add / Register Supabase User</h3>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">User Email Address</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="advisor@fortuneinvestment.in"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-purple-500/20 font-mono"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter the email created in Supabase Dashboard (or new advisor email).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name (Optional)</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar (Leave blank to use email prefix)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as Role)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="advisor">Advisor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={newUserStatus}
                    onChange={(e) => setNewUserStatus(e.target.value as UserStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md transition-all"
                >
                  {saving ? 'Registering...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supabase SQL Setup Guide Modal */}
      {sqlModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Supabase Automatic Sync Trigger Setup</h3>
              </div>
              <button
                onClick={() => setSqlModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              When users are created in the Supabase Dashboard under <b>Authentication &gt; Users</b>, Supabase stores them in <code className="bg-slate-950 px-1 py-0.5 rounded text-purple-300">auth.users</code>. Copy &amp; paste this 1-click SQL script into your <b>Supabase SQL Editor</b> so all Supabase Auth users automatically sync to your <b>User Management</b> view:
            </p>

            <div className="relative mb-4">
              <pre className="bg-slate-950 p-4 rounded-2xl text-[11px] text-emerald-400 font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-64">
                {sqlSnippet}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">Run in Supabase Dashboard &gt; SQL Editor &gt; New Query</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlSnippet);
                  alert('SQL Snippet copied to clipboard!');
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <span>📋 Copy SQL Snippet</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
