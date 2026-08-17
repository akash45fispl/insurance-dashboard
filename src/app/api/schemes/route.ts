import { NextResponse } from 'next/server';
import { SEED_SCHEMES } from '@/lib/seed';
import fs from 'fs';
import path from 'path';

import os from 'os';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const FILE_PATH = path.join(DATA_DIR, 'schemes.json');
const TMP_FILE_PATH = path.join(os.tmpdir(), 'schemes.json');

function loadSchemesFromDisk(): any[] {
  try {
    if (fs.existsSync(TMP_FILE_PATH)) {
      const content = fs.readFileSync(TMP_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    if (fs.existsSync(FILE_PATH)) {
      const content = fs.readFileSync(FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading schemes.json from disk:', err);
  }
  return [...SEED_SCHEMES];
}

function saveSchemesToDisk(schemes: any[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(FILE_PATH, JSON.stringify(schemes, null, 2), 'utf-8');
  } catch (err) {
    // Read-only filesystem on Vercel
  }

  try {
    fs.writeFileSync(TMP_FILE_PATH, JSON.stringify(schemes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to tmp schemes:', err);
  }
}

export async function GET() {
  const schemes = loadSchemesFromDisk();
  return NextResponse.json({ schemes }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body && Array.isArray(body.schemes)) {
      saveSchemesToDisk(body.schemes);
    }
    const currentSchemes = loadSchemesFromDisk();
    return NextResponse.json({ success: true, schemes: currentSchemes });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Invalid payload' }, { status: 400 });
  }
}
