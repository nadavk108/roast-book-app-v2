'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isAdminUser } from '@/lib/admin';
import {
  RefreshCw, TrendingUp, DollarSign, Image, Users,
  ChevronRight, AlertTriangle, CheckCircle, Clock, XCircle, Eye
} from 'lucide-react';

// Video generation phases with cumulative progress %
const VIDEO_PHASES = [
  { label: 'Generating quote cards',    endPct: 8,  durationMs: 5_000 },
  { label: 'Animating images (Hailuo)', endPct: 50, durationMs: 35_000 },
  { label: 'Creating static clips',     endPct: 65, durationMs: 12_000 },
  { label: 'Merging 18 clips',          endPct: 82, durationMs: 15_000 },
  { label: 'Adding background music',   endPct: 90, durationMs: 6_000 },
  { label: 'Uploading to storage',      endPct: 99, durationMs: 8_000 },
];

function VideoProgressModal({ bookName }: { bookName: string }) {
  const [progress, setProgress] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const frameRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const startMs = Date.now();
    startRef.current = startMs;

    // Tick elapsed every second
    const elapsedInterval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);

    // Animate progress through phases
    let currentPhase = 0;
    let phaseStart = startMs;
    const startPct = 0;

    function tick() {
      const now = Date.now();
      if (currentPhase >= VIDEO_PHASES.length) return;

      const phase = VIDEO_PHASES[currentPhase];
      const prevEndPct = currentPhase === 0 ? 0 : VIDEO_PHASES[currentPhase - 1].endPct;
      const phaseElapsed = now - phaseStart;
      const phaseFraction = Math.min(phaseElapsed / phase.durationMs, 0.98);
      const pct = prevEndPct + phaseFraction * (phase.endPct - prevEndPct);

      setProgress(Math.min(pct, 99));
      setPhaseIndex(currentPhase);

      if (phaseElapsed >= phase.durationMs) {
        currentPhase++;
        phaseStart = now;
      }

      frameRef.current = setTimeout(tick, 120);
    }

    tick();

    return () => {
      clearInterval(elapsedInterval);
      if (frameRef.current) clearTimeout(frameRef.current);
    };
  }, []);

  const currentPhaseLabel = VIDEO_PHASES[Math.min(phaseIndex, VIDEO_PHASES.length - 1)].label;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl overflow-hidden">

        {/* Yellow top bar */}
        <div className="h-1.5 bg-yellow-400" />

        <div className="p-8">
          {/* Icon + title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-xl">
              🎬
            </div>
            <div>
              <p className="text-white font-bold text-sm">Generating Video</p>
              <p className="text-white/40 text-xs truncate max-w-[200px]">{bookName}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/50 text-xs">{currentPhaseLabel}</span>
              <span className="text-white font-bold text-sm">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Phase dots */}
          <div className="flex gap-1.5 mb-6">
            {VIDEO_PHASES.map((p, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                  i < phaseIndex ? 'bg-yellow-400' :
                  i === phaseIndex ? 'bg-yellow-400/60' :
                  'bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Time */}
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>{elapsed}s elapsed</span>
            <span>~90s total</span>
          </div>
        </div>

        {/* Yellow bottom bar */}
        <div className="h-1.5 bg-yellow-400" />
      </div>
    </div>
  );
}

type Metrics = {
  funnel: {
    totalCreated: number;
    generating: number;
    previewReady: number;
    paid: number;
    complete: number;
    failed: number;
    reachedPreview: number;
    totalPaid: number;
    conversionToPreview: string;
    conversionToPaid: string;
    conversionOverall: string;
  };
  revenue: {
    total: string;
    today: string;
    thisWeek: string;
    totalOrders: number;
    todayOrders: number;
    weekOrders: number;
  };
  imageGen: {
    booksWithPreview: number;
    booksWithFull: number;
    avgImagesPerBook: string;
    previewSuccessRate: string;
  };
  dailyTrend: { date: string; created: number; paid: number }[];
  recentBooks: {
    id: string;
    name: string;
    status: string;
    slug: string;
    coverUrl: string | null;
    quoteCount: number;
    imageCount: number;
    createdAt: string;
    isAdmin: boolean;
    hasPaid: boolean;
    videoStatus: 'processing' | 'complete' | 'failed' | null;
    videoUrl: string | null;
  }[];
  uniqueUsers: number;
  lastUpdated: string;
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  analyzing: { color: 'bg-blue-500', label: 'Analyzing' },
  generating_prompts: { color: 'bg-blue-500', label: 'Prompts' },
  generating_images: { color: 'bg-blue-500', label: 'Gen Images' },
  generating_remaining: { color: 'bg-blue-500', label: 'Gen Remaining' },
  preview_ready: { color: 'bg-yellow-500', label: 'Preview' },
  paid: { color: 'bg-green-500', label: 'Paid' },
  complete: { color: 'bg-emerald-500', label: 'Complete' },
  failed: { color: 'bg-red-500', label: 'Failed' },
};

export default function AdminPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [videoGenerating, setVideoGenerating] = useState<{ bookId: string; bookName: string } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      if (!isAdminUser(user)) {
        router.push('/');
        return;
      }
      setAuthorized(true);
      fetchMetrics();
    } catch {
      router.push('/');
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  const handleGenerateVideo = async (bookId: string, bookName: string) => {
    setVideoGenerating({ bookId, bookName });
    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (data.videoUrl) {
        window.open(data.videoUrl, '_blank');
      }
    } catch (err: any) {
      alert(`Video generation failed: ${err.message}`);
    } finally {
      setVideoGenerating(null);
      fetchMetrics();
    }
  };

  if (!authorized || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg">Failed to load metrics</p>
          <button onClick={handleRefresh} className="mt-4 px-6 py-2 bg-yellow-400 text-black rounded-lg font-bold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const maxTrend = Math.max(...metrics.dailyTrend.map(d => d.created), 1);

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {videoGenerating && <VideoProgressModal bookName={videoGenerating.bookName} />}
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3 pt-safe">
          <div>
            <h1 className="text-lg font-bold">Admin Dashboard</h1>
            <p className="text-white/40 text-xs">
              Updated {new Date(metrics.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/20"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">

        {/* Revenue Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3">
            <p className="text-emerald-400 text-xs font-medium">Today</p>
            <p className="text-white text-xl font-black">${metrics.revenue.today}</p>
            <p className="text-white/40 text-xs">{metrics.revenue.todayOrders} orders</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3">
            <p className="text-emerald-400 text-xs font-medium">This Week</p>
            <p className="text-white text-xl font-black">${metrics.revenue.thisWeek}</p>
            <p className="text-white/40 text-xs">{metrics.revenue.weekOrders} orders</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3">
            <p className="text-emerald-400 text-xs font-medium">All Time</p>
            <p className="text-white text-xl font-black">${metrics.revenue.total}</p>
            <p className="text-white/40 text-xs">{metrics.revenue.totalOrders} orders</p>
          </div>
        </div>

        {/* Key Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-400" />
              <p className="text-white/60 text-xs">Unique Users</p>
            </div>
            <p className="text-2xl font-black">{metrics.uniqueUsers}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Image className="w-4 h-4 text-purple-400" />
              <p className="text-white/60 text-xs">Avg Images/Book</p>
            </div>
            <p className="text-2xl font-black">{metrics.imageGen.avgImagesPerBook}</p>
          </div>
        </div>

        {/* Funnel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            Conversion Funnel
          </h2>
          <div className="space-y-3">
            <FunnelRow
              label="Created"
              count={metrics.funnel.totalCreated}
              total={metrics.funnel.totalCreated}
              color="bg-white/30"
            />
            <FunnelRow
              label="Preview Ready"
              count={metrics.funnel.reachedPreview}
              total={metrics.funnel.totalCreated}
              color="bg-yellow-500"
              rate={metrics.funnel.conversionToPreview}
            />
            <FunnelRow
              label="Paid"
              count={metrics.funnel.totalPaid}
              total={metrics.funnel.totalCreated}
              color="bg-emerald-500"
              rate={metrics.funnel.conversionOverall}
            />
            <FunnelRow
              label="Complete"
              count={metrics.funnel.complete}
              total={metrics.funnel.totalCreated}
              color="bg-green-500"
            />
            <FunnelRow
              label="Failed"
              count={metrics.funnel.failed}
              total={metrics.funnel.totalCreated}
              color="bg-red-500"
            />
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/40 text-xs">Created → Preview</p>
              <p className="text-lg font-bold text-yellow-400">{metrics.funnel.conversionToPreview}%</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Preview → Paid</p>
              <p className="text-lg font-bold text-emerald-400">{metrics.funnel.conversionToPaid}%</p>
            </div>
          </div>
        </div>

        {/* Daily Trend */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h2 className="text-sm font-bold mb-4">14-Day Trend</h2>
          <div className="flex items-end gap-1 h-24">
            {metrics.dailyTrend.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative" style={{ height: '80px' }}>
                  {/* Created bar */}
                  <div
                    className="absolute bottom-0 w-full bg-white/20 rounded-t"
                    style={{ height: `${(day.created / maxTrend) * 100}%`, minHeight: day.created > 0 ? '4px' : '0' }}
                  />
                  {/* Paid bar overlay */}
                  <div
                    className="absolute bottom-0 w-full bg-emerald-500 rounded-t"
                    style={{ height: `${(day.paid / maxTrend) * 100}%`, minHeight: day.paid > 0 ? '4px' : '0' }}
                  />
                </div>
                {i % 2 === 0 && (
                  <span className="text-[9px] text-white/30">{day.date}</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-white/20 rounded" />
              <span className="text-[10px] text-white/40">Created</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded" />
              <span className="text-[10px] text-white/40">Paid</span>
            </div>
          </div>
        </div>

        {/* Image Gen Stats */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Image className="w-4 h-4 text-purple-400" />
            Image Generation
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-white/40 text-xs">Preview Success</p>
              <p className="text-lg font-bold">{metrics.imageGen.previewSuccessRate}%</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Books w/ Preview</p>
              <p className="text-lg font-bold">{metrics.imageGen.booksWithPreview}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Books w/ Full</p>
              <p className="text-lg font-bold">{metrics.imageGen.booksWithFull}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Avg Images</p>
              <p className="text-lg font-bold">{metrics.imageGen.avgImagesPerBook}</p>
            </div>
          </div>
        </div>

        {/* Recent Books */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h2 className="text-sm font-bold mb-3">Recent Books</h2>
          <div className="space-y-2">
            {metrics.recentBooks.map((book) => {
              const cfg = STATUS_CONFIG[book.status] || { color: 'bg-gray-500', label: book.status };
              const timeAgo = getTimeAgo(book.createdAt);

              return (
                <div
                  key={book.id}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                  onClick={() => {
                    if (book.slug && (book.status === 'complete' || book.status === 'preview_ready')) {
                      window.open(`/book/${book.slug}`, '_blank');
                    }
                  }}
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-lg">
                        ?
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate">{book.name}</p>
                      {book.isAdmin && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-yellow-400/20 text-yellow-400 rounded font-bold">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold text-white ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-white/30 text-[10px]">{book.imageCount} imgs</span>
                      <span className="text-white/30 text-[10px]">{timeAgo}</span>
                    </div>
                  </div>

                  {/* Video controls (complete books only) */}
                  {book.status === 'complete' && (
                    <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {book.videoStatus === 'complete' && book.videoUrl ? (
                        <a
                          href={book.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold"
                        >
                          ▶ Video
                        </a>
                      ) : book.videoStatus === 'processing' || videoGenerating?.bookId === book.id ? (
                        <span className="text-[10px] px-2 py-1 bg-yellow-400/10 text-yellow-400 rounded font-bold flex items-center gap-1">
                          <span className="animate-spin inline-block">⟳</span> ~90s
                        </span>
                      ) : book.videoStatus === 'failed' ? (
                        <button
                          onClick={() => handleGenerateVideo(book.id, book.name)}
                          className="text-[10px] px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded font-bold"
                        >
                          ❌ Retry
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGenerateVideo(book.id, book.name)}
                          disabled={videoGenerating !== null}
                          className="text-[10px] px-2 py-1 bg-white/10 text-white/70 border border-white/20 rounded font-bold disabled:opacity-40"
                        >
                          🎬 Gen
                        </button>
                      )}
                    </div>
                  )}

                  {/* Arrow */}
                  {(book.status === 'complete' || book.status === 'preview_ready') && (
                    <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function FunnelRow({ label, count, total, color, rate }: {
  label: string;
  count: number;
  total: number;
  color: string;
  rate?: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/60">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{count}</span>
          {rate && <span className="text-xs text-white/40">({rate}%)</span>}
        </div>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return `${Math.floor(diffDays / 7)}w`;
}