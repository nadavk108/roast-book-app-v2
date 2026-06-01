'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ArrowLeft, RefreshCw, Shield, Loader2, Check, Pencil } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { isAdminUser } from '@/lib/admin';
import { captureEvent, Events } from '@/lib/posthog';
import { isPredominantlyHebrew } from '@/lib/hebrew-utils';

export default function QuotesPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [book, setBook] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    // 'loading' while waiting for quotes to generate, 'select' once ready
    const [step, setStep] = useState<'loading' | 'select'>('loading');
    const [description, setDescription] = useState('');
    const [generating, setGenerating] = useState(false);
    const [quotes, setQuotes] = useState<string[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const adminMode = isAdminUser(user);

    const [showFirstPulse, setShowFirstPulse] = useState(false);

    useEffect(() => {
        if (step !== 'select') return;
        setShowFirstPulse(true);
        const timer = setTimeout(() => setShowFirstPulse(false), 2000);
        return () => clearTimeout(timer);
    }, [step]);

    const isHebrew = isPredominantlyHebrew(book?.victim_name || '') ||
        isPredominantlyHebrew(description);

    useEffect(() => {
        fetchBook();
        loadUser();
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error('Failed to load user:', error);
        }
    };

    const applyBookData = (data: any) => {
        setBook(data);
        if (data.victim_traits) setDescription(data.victim_traits);
        else if (data.victim_description) setDescription(data.victim_description);

        if (data.quotes && data.quotes.length > 0) {
            setQuotes(data.quotes.filter((q: string) => q.trim()).slice(0, 8));
            setStep('select');
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
            return true; // quotes found
        }
        return false;
    };

    const fetchBook = async () => {
        try {
            const res = await fetch(`/api/book/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                const hasQuotes = applyBookData(data);
                if (!hasQuotes) {
                    // Start polling every 2s until quotes appear
                    pollRef.current = setInterval(async () => {
                        try {
                            const pollRes = await fetch(`/api/book/${params.id}`);
                            if (pollRes.ok) {
                                const pollData = await pollRes.json();
                                applyBookData(pollData);
                            }
                        } catch (err) {
                            console.error('[Quotes] Poll error:', err);
                        }
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = async () => {
        if (!description.trim()) return;

        setGenerating(true);
        try {
            const res = await fetch('/api/generate-quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId: params.id,
                    victimName: book?.victim_name || '',
                    trueTraits: description.trim(),
                }),
            });

            if (!res.ok) throw new Error('Generation failed');

            const { quotes: generatedQuotes } = await res.json();
            setQuotes(generatedQuotes.slice(0, 8));
        } catch (error) {
            console.error(error);
            alert('Failed to regenerate. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const startEdit = (index: number) => {
        setEditingIndex(index);
        setEditText(quotes[index]);
    };

    const saveEdit = () => {
        if (editingIndex === null || !editText.trim()) return;
        const updated = [...quotes];
        updated[editingIndex] = editText.trim();
        setQuotes(updated);
        setEditingIndex(null);
        setEditText('');
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditText('');
    };

    const handleSubmit = async () => {
        const bookId = params.id || book?.id;

        captureEvent(Events.QUOTES_SUBMITTED, {
            quote_count: quotes.length,
            is_admin: adminMode,
            book_id: bookId,
        });
        try { captureEvent(Events.QUOTES_SELECTED, { num_quotes_shown: quotes.length, num_quotes_selected: quotes.length, book_id: bookId }); } catch {}
        if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
            (window as any).fbq('track', 'Lead');
        }

        // Save quotes to DB before navigating
        setSaving(true);
        try {
            await fetch('/api/generate-quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId,
                    victimName: book?.victim_name || '',
                    trueTraits: book?.victim_traits || '',
                    quotes, // pass selected quotes to save
                }),
            });
        } catch (err) {
            console.warn('[Quotes] Failed to persist quote selection:', err);
        }

        // Navigate to photo upload (Step 4)
        router.push(`/create/${bookId}/photo`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-body text-foreground flex flex-col">
            {/* App bar */}
            <header className="px-4 py-3 flex items-center gap-3 border-b-[2.5px] border-foreground bg-background sticky top-0 z-30">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex items-center justify-center w-9 h-9 rounded-xl border-[2px] border-foreground bg-card shadow-[2px_2px_0_#0E0E0E] hover:-translate-x-px hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all shrink-0"
                    aria-label="Go back"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 bg-foreground/10 h-2.5 rounded-full overflow-hidden border border-foreground/20">
                    <div className="bg-primary h-full rounded-full border-r border-foreground/30" style={{ width: '75%' }} />
                </div>

                <span className="font-heading font-black text-sm whitespace-nowrap shrink-0">Step 3 of 4</span>
            </header>

            {/* Admin Badge */}
            {adminMode && (
                <div className="mx-4 mt-4 bg-primary border-[2.5px] border-foreground rounded-xl p-4 shadow-[4px_4px_0_#0E0E0E]">
                    <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5" />
                        <div>
                            <p className="font-heading font-bold">ADMIN MODE</p>
                            <p className="text-sm text-foreground/60">Min 1 quote. All images generated immediately.</p>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl pb-32">

                {/* ===== LOADING: waiting for quotes ===== */}
                {step === 'loading' && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary border-[2.5px] border-foreground shadow-[4px_4px_0_#0E0E0E] mb-2">
                            <Sparkles className="w-8 h-8 animate-pulse" />
                        </div>
                        <p className="font-heading font-black text-2xl">
                            {isHebrew ? 'מייצר רוסטים...' : `Writing ${book?.victim_name || 'their'}’s roasts…`}
                        </p>
                        <p className="text-foreground/50 text-sm">
                            {isHebrew ? 'זה לוקח כמה שניות' : 'Just a few seconds'}
                        </p>
                    </div>
                )}

                {/* ===== SELECT: edit and confirm quotes ===== */}
                {step === 'select' && (
                    <>
                        <div className="mb-6 text-center">
                            <h1
                                className="font-heading font-black text-2xl mb-1 tracking-tight"
                                dir={isHebrew ? 'rtl' : 'ltr'}
                            >
                                {isHebrew ? 'בחרו את הטובים ביותר' : 'Pick your favorites'}
                            </h1>
                            <p className="text-foreground/50 text-sm">
                                {isHebrew ? 'הקישו על ציטוט כדי לערוך אותו' : 'Tap any quote to edit it'}
                            </p>
                        </div>

                        {/* Loading overlay for regeneration */}
                        {generating && (
                            <div className="flex items-center justify-center py-12 gap-3">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                <p className="font-heading font-bold">
                                    {isHebrew ? 'מייצר רוסטים חדשים...' : 'Generating new roasts...'}
                                </p>
                            </div>
                        )}

                        {/* Quote cards */}
                        {!generating && (
                            <div className="space-y-3 mb-6">
                                {quotes.map((quote, i) => {
                                    const isHebrewQuote = isPredominantlyHebrew(quote);
                                    const isEditing = editingIndex === i;

                                    if (isEditing) {
                                        return (
                                            <div key={i} className="bg-primary/10 border-[2.5px] border-primary rounded-xl p-4 shadow-[3px_3px_0_#FFC700]">
                                                <textarea
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="w-full min-h-[80px] p-3 border-[2px] border-foreground rounded-xl text-sm font-medium bg-card resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                                    dir={isPredominantlyHebrew(editText) ? 'rtl' : 'ltr'}
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEdit();
                                                        if (e.key === 'Escape') cancelEdit();
                                                    }}
                                                    onBlur={saveEdit}
                                                />
                                                <div className="flex gap-3 mt-2">
                                                    <button
                                                        onClick={saveEdit}
                                                        className="flex items-center gap-1 text-xs font-heading font-black text-[#1FAE54] hover:underline"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        {isHebrew ? 'שמור' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="text-xs font-heading font-bold text-foreground/40 hover:underline"
                                                    >
                                                        {isHebrew ? 'ביטול' : 'Cancel'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => startEdit(i)}
                                            className="relative p-4 rounded-xl border-[2.5px] border-foreground bg-card shadow-[4px_4px_0_#0E0E0E] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0E0E0E] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                                        >
                                            <Pencil
                                                className={`absolute top-3 ${isHebrewQuote ? 'left-3' : 'right-3'} w-4 h-4 text-foreground/30 pointer-events-none${i === 0 && showFirstPulse ? ' animate-pulse' : ''}`}
                                            />
                                            <p
                                                className={`text-sm md:text-base font-medium leading-relaxed text-foreground ${isHebrewQuote ? 'pl-6' : 'pr-6'}`}
                                                dir={isHebrewQuote ? 'rtl' : 'ltr'}
                                                style={{ textAlign: isHebrewQuote ? 'right' : 'left' }}
                                            >
                                                &ldquo;{quote}&rdquo;
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Regenerate button */}
                        {!generating && (
                            <div className="mb-6">
                                <button
                                    onClick={handleRegenerate}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-[2.5px] border-foreground bg-card font-heading font-bold text-sm transition-all shadow-[3px_3px_0_#0E0E0E] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0E0E0E] active:translate-y-0 active:shadow-none text-foreground"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    {isHebrew ? 'צרו חדשים' : 'Regenerate roasts'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Sticky Submit Button */}
            {step === 'select' && !generating && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pointer-events-none z-20">
                    <div className="container mx-auto max-w-2xl pointer-events-auto">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving || quotes.length === 0}
                            className={`w-full flex items-center justify-center gap-2 font-heading font-black text-lg py-4 rounded-xl border-[2.5px] transition-all ${
                                !saving && quotes.length > 0
                                    ? 'bg-primary border-foreground shadow-[6px_6px_0_#0E0E0E] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#0E0E0E] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none cursor-pointer'
                                    : 'bg-[#ECE5CE] border-[#CDC4A6] text-[#B5AC8F] cursor-not-allowed'
                            }`}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    {isHebrew ? 'טוען...' : 'Saving...'}
                                </>
                            ) : (
                                <>
                                    {isHebrew ? 'הוסיפו תמונה שלהם' : 'Next - add their photo'}
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
