'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
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
            <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFDF5] font-body text-black flex flex-col">
            {/* Header */}
            <header className="px-6 py-4 flex items-center border-b-2 border-black bg-white sticky top-0 z-30">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors mr-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden border border-black max-w-xs md:max-w-md mx-auto">
                    <div
                        className="bg-yellow-400 h-full transition-all duration-300"
                        style={{ width: '75%' }}
                    />
                </div>
                <span className="ml-4 font-bold whitespace-nowrap">
                    Step 3/4
                </span>
            </header>

            {/* Admin Badge */}
            {adminMode && (
                <div className="mx-4 mt-4 bg-primary border-3 border-foreground rounded-xl p-4 shadow-brutal">
                    <div className="flex items-center gap-3">
                        <Shield className="h-6 w-6" />
                        <div>
                            <p className="font-heading font-bold text-lg">ADMIN MODE</p>
                            <p className="text-sm">Min 1 quote. All images generated immediately.</p>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl pb-32">

                {/* ===== LOADING: waiting for quotes ===== */}
                {step === 'loading' && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-400 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-2">
                            <Sparkles className="w-8 h-8 animate-pulse" />
                        </div>
                        <p className="font-heading font-black text-2xl">
                            {isHebrew ? 'מייצר רוסטים...' : 'Generating roasts...'}
                        </p>
                        <p className="text-gray-500 text-sm">
                            {isHebrew ? 'זה לוקח כמה שניות' : 'This takes just a few seconds'}
                        </p>
                    </div>
                )}

                {/* ===== SELECT: edit and confirm quotes ===== */}
                {step === 'select' && (
                    <>
                        <div className="mb-6">
                            <h1
                                className="text-2xl font-heading font-black mb-1 text-center"
                                dir={isHebrew ? 'rtl' : 'ltr'}
                            >
                                {isHebrew
                                    ? 'בחרו את הטובים ביותר'
                                    : 'Pick your favorites'}
                            </h1>
                            <p className="text-gray-500 text-center text-sm">
                                {isHebrew
                                    ? 'הקישו על ציטוט כדי לערוך אותו'
                                    : 'Tap any quote to edit it'}
                            </p>
                        </div>

                        {/* Loading overlay for regeneration */}
                        {generating && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mr-3" />
                                <p className="font-heading font-bold">
                                    {isHebrew ? 'מייצר רוסטים חדשים...' : 'Generating new roasts...'}
                                </p>
                            </div>
                        )}

                        {/* Quote cards - exactly 8, always */}
                        {!generating && (
                            <div className="space-y-3 mb-6">
                                {quotes.map((quote, i) => {
                                    const isHebrewQuote = isPredominantlyHebrew(quote);
                                    const isEditing = editingIndex === i;

                                    if (isEditing) {
                                        return (
                                            <div key={i} className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 shadow-[2px_2px_0px_0px_#FACC15]">
                                                <textarea
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="w-full min-h-[80px] p-3 border-2 border-black rounded-lg text-sm font-medium bg-white resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                    dir={isPredominantlyHebrew(editText) ? 'rtl' : 'ltr'}
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEdit();
                                                        if (e.key === 'Escape') cancelEdit();
                                                    }}
                                                    onBlur={saveEdit}
                                                />
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={saveEdit}
                                                        className="flex items-center gap-1 text-xs font-bold text-green-600 hover:underline"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        {isHebrew ? 'שמור' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="text-xs font-bold text-gray-400 hover:underline"
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
                                            className="relative p-4 rounded-xl border-2 border-yellow-400 bg-yellow-50 shadow-[2px_2px_0px_0px_#FACC15] cursor-pointer transition-all hover:shadow-[4px_4px_0px_0px_#FACC15] hover:-translate-y-0.5 active:shadow-[1px_1px_0px_0px_#FACC15] active:translate-y-0"
                                        >
                                            <Pencil
                                                className={`absolute top-2 ${isHebrewQuote ? 'left-2' : 'right-2'} w-4 h-4 text-gray-400 pointer-events-none${i === 0 && showFirstPulse ? ' animate-pulse' : ''}`}
                                            />
                                            <p
                                                className={`text-sm md:text-base font-medium leading-relaxed ${isHebrewQuote ? 'pl-6' : 'pr-6'}`}
                                                dir={isHebrewQuote ? 'rtl' : 'ltr'}
                                                style={{ textAlign: isHebrewQuote ? 'right' : 'left' }}
                                            >
                                                "{quote}"
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Regenerate button */}
                        {!generating && (
                            <div className="flex gap-3 mb-6">
                                <button
                                    onClick={handleRegenerate}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-sm font-bold transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    {isHebrew ? 'צרו חדשים' : 'Regenerate'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Sticky Submit Button - Only on select step */}
            {step === 'select' && !generating && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FFFDF5] via-[#FFFDF5] to-transparent pointer-events-none z-20">
                    <div className="container mx-auto max-w-2xl pointer-events-auto">
                        <Button
                            onClick={handleSubmit}
                            disabled={saving || quotes.length === 0}
                            className="w-full text-lg py-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                            size="lg"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {isHebrew ? 'טוען...' : 'Loading...'}
                                </>
                            ) : (
                                <>
                                    {isHebrew ? 'הוסיפו תמונה שלהם' : 'Next - Add Photo'}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
