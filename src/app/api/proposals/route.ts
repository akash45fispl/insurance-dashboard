import { NextResponse } from 'next/server';
import { SEED_PROPOSALS } from '@/lib/seed';

let memoryProposals: any[] = [...SEED_PROPOSALS];

export async function GET() {
  return NextResponse.json({ proposals: memoryProposals }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body && Array.isArray(body.proposals)) {
      memoryProposals = body.proposals;
    }
    return NextResponse.json({ success: true, proposals: memoryProposals });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Invalid payload' }, { status: 400 });
  }
}
