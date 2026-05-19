import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { count, error } = await supabaseAdmin
    .from('roast_books')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'complete');

  if (error) return NextResponse.json({ count: 0 }, { status: 500 });
  return NextResponse.json({ count: count ?? 0 });
}
