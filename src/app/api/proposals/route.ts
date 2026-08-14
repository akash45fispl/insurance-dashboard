import { NextResponse } from 'next/server';

let memoryProposals: any[] = [];

function isDemoProposal(p: any): boolean {
  if (!p) return true;
  const id = (p.id || '').toLowerCase();
  const createdBy = (p.createdBy || '').toLowerCase();
  const createdByDisplay = (p.createdByDisplay || '').toLowerCase();
  const clientAdvisor = (p.client?.advisor || '').toLowerCase();

  if (id === 'prop-101' || id === 'prop-102' || id === 'prop-103') return true;
  if (createdBy.includes('rahul') || createdBy.includes('priya')) return true;
  if (createdByDisplay.includes('rahul') || createdByDisplay.includes('priya')) return true;
  if (clientAdvisor.includes('rahul') || clientAdvisor.includes('priya')) return true;

  return false;
}

export async function GET() {
  memoryProposals = memoryProposals.filter((p) => !isDemoProposal(p));
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
      memoryProposals = body.proposals.filter((p: any) => !isDemoProposal(p));
    }
    return NextResponse.json({ success: true, proposals: memoryProposals });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Invalid payload' }, { status: 400 });
  }
}
