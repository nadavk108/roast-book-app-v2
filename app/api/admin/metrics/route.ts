import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { isAdminUser } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all books
    const { data: books, error } = await supabaseAdmin
      .from('roast_books')
      .select('id, created_at, victim_name, status, slug, cover_image_url, stripe_payment_intent, quotes, preview_image_urls, full_image_urls, user_email')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const allBooks = books || [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    // === FUNNEL ===
    const totalCreated = allBooks.length;
    const byStatus: Record<string, number> = {};
    for (const b of allBooks) {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1;
    }

    const previewReady = byStatus['preview_ready'] || 0;
    const paid = byStatus['paid'] || 0;
    const complete = byStatus['complete'] || 0;
    const failed = byStatus['failed'] || 0;
    const generating = (byStatus['analyzing'] || 0) +
      (byStatus['generating_prompts'] || 0) +
      (byStatus['generating_images'] || 0) +
      (byStatus['generating_remaining'] || 0);

    // Books that reached preview or beyond
    const reachedPreview = previewReady + paid + complete + (byStatus['generating_remaining'] || 0);
    // Books that paid
    const totalPaid = paid + complete + (byStatus['generating_remaining'] || 0);

    const funnel = {
      totalCreated,
      generating,
      previewReady,
      paid,
      complete,
      failed,
      reachedPreview,
      totalPaid,
      conversionToPreview: totalCreated > 0 ? ((reachedPreview / totalCreated) * 100).toFixed(1) : '0',
      conversionToPaid: reachedPreview > 0 ? ((totalPaid / reachedPreview) * 100).toFixed(1) : '0',
      conversionOverall: totalCreated > 0 ? ((totalPaid / totalCreated) * 100).toFixed(1) : '0',
    };

    // === REVENUE ===
    const paidBooks = allBooks.filter(b =>
      b.status === 'complete' || b.status === 'paid' || b.status === 'generating_remaining'
    );
    // Exclude admin books from revenue
    const realPaidBooks = paidBooks.filter(b => b.user_email !== 'nadavkarlinski@gmail.com');
    const totalRevenue = realPaidBooks.length * 9.99;

    const todayPaid = realPaidBooks.filter(b => new Date(b.created_at) >= todayStart).length;
    const weekPaid = realPaidBooks.filter(b => new Date(b.created_at) >= weekStart).length;

    const revenue = {
      total: totalRevenue.toFixed(2),
      today: (todayPaid * 9.99).toFixed(2),
      thisWeek: (weekPaid * 9.99).toFixed(2),
      totalOrders: realPaidBooks.length,
      todayOrders: todayPaid,
      weekOrders: weekPaid,
    };

    // === IMAGE GEN STATS ===
    const booksWithPreview = allBooks.filter(b => b.preview_image_urls?.length > 0);
    const booksWithFull = allBooks.filter(b => b.full_image_urls?.length > 0);
    const avgImagesPerBook = booksWithFull.length > 0
      ? (booksWithFull.reduce((sum, b) => sum + (b.full_image_urls?.length || 0), 0) / booksWithFull.length).toFixed(1)
      : '0';

    const imageGen = {
      booksWithPreview: booksWithPreview.length,
      booksWithFull: booksWithFull.length,
      avgImagesPerBook,
      previewSuccessRate: totalCreated > 0
        ? ((booksWithPreview.length / totalCreated) * 100).toFixed(1)
        : '0',
    };

    // === DAILY TREND (last 14 days) ===
    const dailyTrend: { date: string; created: number; paid: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dayBooks = allBooks.filter(b => {
        const created = new Date(b.created_at);
        return created >= d && created < nextD;
      });

      const dayPaid = dayBooks.filter(b =>
        (b.status === 'complete' || b.status === 'paid' || b.status === 'generating_remaining') &&
        b.user_email !== 'nadavkarlinski@gmail.com'
      );

      dailyTrend.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        created: dayBooks.length,
        paid: dayPaid.length,
      });
    }

    // === RECENT BOOKS ===
    const recentBooks = allBooks.slice(0, 25).map(b => ({
      id: b.id,
      name: b.victim_name,
      status: b.status,
      slug: b.slug,
      coverUrl: b.cover_image_url,
      quoteCount: b.quotes?.length || 0,
      imageCount: b.full_image_urls?.length || b.preview_image_urls?.length || 0,
      createdAt: b.created_at,
      isAdmin: b.user_email === 'nadavkarlinski@gmail.com',
      hasPaid: b.stripe_payment_intent !== null,
    }));

    // === UNIQUE USERS ===
    const uniqueEmails = new Set(allBooks.map(b => b.user_email).filter(Boolean));

    return NextResponse.json({
      funnel,
      revenue,
      imageGen,
      dailyTrend,
      recentBooks,
      uniqueUsers: uniqueEmails.size,
      lastUpdated: now.toISOString(),
    });

  } catch (err: any) {
    console.error('Admin metrics error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}