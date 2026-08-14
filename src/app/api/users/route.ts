import { NextResponse } from 'next/server';
import { SEED_USERS } from '@/lib/seed';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User } from '@/lib/types';

let memoryUsers: User[] = [...SEED_USERS];

function sanitizeUserRecord(u: any): User | null {
  if (!u || typeof u !== 'object') return null;
  if (!u.email || typeof u.email !== 'string') return null;

  return {
    id: u.id || `usr_${Date.now()}`,
    email: u.email,
    name: u.name || u.email.split('@')[0],
    role: u.role === 'admin' || u.email.toLowerCase().includes('admin') ? 'admin' : 'advisor',
    status: u.status === 'inactive' ? 'inactive' : 'active',
    createdAt: u.createdAt || u.created_at || new Date().toISOString(),
    phone: u.phone || '+91 98000 00000',
    lastLogin: u.lastLogin || u.last_login || new Date().toISOString(),
  };
}

export async function GET() {
  let combinedUsers = [...memoryUsers];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data && data.length > 0) {
        const supUsers = data.map(sanitizeUserRecord).filter((u: User | null): u is User => u !== null);
        
        // Merge Supabase users with memory users avoiding duplicate emails
        const map = new Map<string, User>();
        [...combinedUsers, ...supUsers].forEach((u) => {
          map.set(u.email.toLowerCase(), u);
        });
        combinedUsers = Array.from(map.values());
        memoryUsers = combinedUsers;
      }
    } catch (err) {
      console.warn('Supabase users fetch warning:', err);
    }
  }

  return NextResponse.json({ users: combinedUsers }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body && Array.isArray(body.users)) {
      const sanitizedList = body.users.map(sanitizeUserRecord).filter((u: User | null): u is User => u !== null);
      
      const map = new Map<string, User>();
      [...memoryUsers, ...sanitizedList].forEach((u) => {
        map.set(u.email.toLowerCase(), u);
      });
      memoryUsers = Array.from(map.values());

      if (isSupabaseConfigured && supabase) {
        for (const u of sanitizedList) {
          await supabase.from('users').upsert({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            status: u.status,
            phone: u.phone,
            updated_at: new Date().toISOString(),
          });
        }
      }
    } else if (body && body.user) {
      const sanitized = sanitizeUserRecord(body.user);
      if (sanitized) {
        const idx = memoryUsers.findIndex((u) => u.email.toLowerCase() === sanitized.email.toLowerCase());
        if (idx >= 0) {
          memoryUsers[idx] = { ...memoryUsers[idx], ...sanitized };
        } else {
          memoryUsers.unshift(sanitized);
        }

        if (isSupabaseConfigured && supabase) {
          await supabase.from('users').upsert({
            id: sanitized.id,
            email: sanitized.email,
            name: sanitized.name,
            role: sanitized.role,
            status: sanitized.status,
            phone: sanitized.phone,
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({ success: true, users: memoryUsers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Invalid payload' }, { status: 400 });
  }
}
