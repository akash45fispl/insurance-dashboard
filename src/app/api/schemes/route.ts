import { NextResponse } from 'next/server';
import { SEED_SCHEMES } from '@/lib/seed';

let memorySchemes: any[] = [...SEED_SCHEMES];

export async function GET() {
  return NextResponse.json({ schemes: memorySchemes }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body && Array.isArray(body.schemes)) {
      memorySchemes = body.schemes;
    }
    return NextResponse.json({ success: true, schemes: memorySchemes });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Invalid payload' }, { status: 400 });
  }
}
