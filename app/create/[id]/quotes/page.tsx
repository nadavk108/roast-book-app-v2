'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Sparkles, ArrowRight, ArrowLeft, Check, RefreshCw, Plus, X, Pencil, Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { isAdminUser, getMinQuotesRequired } from '@/lib/admin';
import { captureEvent, Events } from '@/lib/posthog';
import { isPredominantlyHebrew, getHebrewBookTitle } from '@/lib/hebrew-utils';

export default function QuotesPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [book, setBook] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    // Step: 'describe' → 'select' → (optional) 'manual'
    const [step, setStep] = useState<'describe' | 'select' | 'manual'>('describe');
    const [description, setDescription] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generatedQuotes, setGeneratedQuotes] = useState<string[]>([]);
    const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
    const [manualQuote, setManualQuote] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adminMode = isAdminUser(user);
    const minQuotes = Math.max(getMinQuotesRequired(user), 6);
    const maxQuotes = 8;

    const isHebrew = isPredominantlyHebrew(book?.victim_name || '') ||
        isPredominantlyHebrew(description);

    useEffect(() => {
        fetchBook();
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error('Failed to load user:', error);
        }
    };

    const fetchBook = async () => {
        try {
            const res = await fetch(`/api/book/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setBook(data);
                // If book already has quotes, go to select step with them pre-selected
                if (data.quotes && data.quotes.length > 0) {
                    setSelectedQuotes(data.quotes.filter((q: string) => q.trim()));
                    setGeneratedQuotes(data.quotes.filter((q: string) => q.trim()));
                    setStep('select');
                }
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!description.trim()) return;

        setGenerating(true);
        try {
            captureEvent(Events.ROAST_ASSISTANT_OPENED, { book_id: params.id });

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

            const { quotes } = await res.json();
            setGeneratedQuotes(quotes);
            setSelectedQuotes(quotes); // All selected by default
            setStep('select');

            captureEvent(Events.ROAST_ASSISTANT_USED, {
                quotes_generated: quotes.length,
                book_id: params.id,
            });
        } catch (error) {
            console.error(error);
            alert('Failed to generate quotes. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const handleRegenerate = async () => {
        if (!description.trim()) {
            setStep('describe');
            return;
        }
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

            const { quotes } = await res.json();
            setGeneratedQuotes(quotes);
            setSelectedQuotes(quotes);
        } catch (error) {
            console.error(error);
            alert('Failed to regenerate. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const toggleQuote = (quote: string) => {
        if (selectedQuotes.includes(quote)) {
            setSelectedQuotes(selectedQuotes.filter(q => q !== quote));
        } else {
            if (selectedQuotes.length >= maxQuotes) return;
            setSelectedQuotes([...selectedQuotes, quote]);
        }
    };

    const removeQuote = (index: number) => {
        const quote = selectedQuotes[index];
        setSelectedQuotes(selectedQuotes.filter((_, i) => i !== index));
    };

    const addManualQuote = () => {
        if (!manualQuote.trim() || selectedQuotes.length >= maxQuotes) return;
        setSelectedQuotes([...selectedQuotes, manualQuote.trim()]);
        setManualQuote('');
    };

    const startEdit = (index: number) => {
        setEditingIndex(index);
        setEditText(selectedQuotes[index]);
    };

    const saveEdit = () => {
        if (editingIndex === null || !editText.trim()) return;
        const updated = [...selectedQuotes];
        updated[editingIndex] = editText.trim();
        setSelectedQuotes(updated);
        setEditingIndex(null);
        setEditText('');
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditText('');
    };

   const handleSubmit = async () => {
        if (selectedQuotes.length < minQuotes) {
            alert(`Please keep at least ${minQuotes} quotes selected`);
            return;
        }

       const finalQuotes = [...selectedQuotes];

        const bookId = params.id || book?.id;

        captureEvent(Events.QUOTES_SUBMITTED, {
            quote_count: finalQuotes.length,
            original_count: selectedQuotes.length,
            is_admin: adminMode,
            book_id: bookId,
        });

        setSaving(true);

        // Fire generation request without waiting — redirect immediately to progress page
        fetch('/api/generate-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookId: bookId,
                quotes: finalQuotes,
                customGreeting: null,
            }),
        }).catch((error) => {
            console.error('[QUOTES] Background generation failed:', error);
        });

        // Redirect instantly — progress page polls for status
        router.push(`/progress/${bookId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    const victimName = book?.victim_name || 'them';

    return (
        <div className="min-h-screen bg-[#FFFDF5] font-body text-black flex flex-col">
            {/* Header */}
            <header className="px-6 py-4 flex items-center border-b-2 border-black bg-white sticky top-0 z-30">
                <Link href="/" className="p-2 hover:bg-black/5 rounded-full transition-colors mr-4">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden border border-black max-w-xs md:max-w-md mx-auto">
                    <div
                        className="bg-yellow-400 h-full transition-all duration-300"
                        style={{ width: step === 'describe' ? '25%' : '50%' }}
                    />
                </div>
                <span className="ml-4 font-bold whitespace-nowrap">
                    Step {step === 'describe' ? '2' : '3'}/3
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

                {/* ===== STEP 1: DESCRIBE ===== */}
                {step === 'describe' && (
                    <div className="bg-white border-2 border-black rounded-xl p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-400 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4">
                                <Sparkles className="w-7 h-7" />
                            </div>
                            <h1
                                className="text-2xl md:text-3xl font-heading font-black mb-2"
                                dir={isHebrew ? 'rtl' : 'ltr'}
                            >
                                {isHebrew
                                    ? `ספרו לנו על ${victimName}`
                                    : `Tell us about ${victimName}`}
                            </h1>
                            <p
                                className="text-gray-500 max-w-md mx-auto"
                                dir={isHebrew ? 'rtl' : 'ltr'}
                            >
                                {isHebrew
                                    ? 'הכל רלוונטי — תחביבים, הרגלים, אובססיות, בדיחות פנימיות, שגעונות. אנחנו נהפוך את זה לרוסטים מטורפים.'
                                    : "Anything goes — hobbies, habits, obsessions, quirks, inside jokes. We'll turn it into hilarious roasts."}
                            </p>
                        </div>

                        <textarea
                            ref={textareaRef}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={isHebrew
                                ? 'למשל: אוהב פיצה יותר מהחיים שלו, תמיד מאחר, מכור לטיקטוק, חושב שהוא שף מקצועי אבל שורף ביצה, ישן עד 2 בצהריים בשבת...'
                                : "e.g. Lives for pizza, always 15 min late, TikTok addict, thinks he's a chef but burns eggs, sleeps till 2pm on weekends, still quotes The Office daily..."}
                            className="w-full min-h-[160px] p-4 rounded-xl border-2 border-black bg-[#FFFDF5] text-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400 placeholder:text-base"
                            dir={isHebrew ? 'rtl' : 'ltr'}
                            style={{ textAlign: isHebrew ? 'right' : 'left' }}
                            maxLength={800}
                        />
                        <div className="flex justify-between items-center mt-2 mb-4">
                            <p className="text-xs text-gray-400">{description.length}/800</p>
                            <p className="text-xs text-gray-400">
                                {isHebrew ? 'ככל שתכתבו יותר, הרוסטים יהיו יותר מדויקים' : 'The more you share, the funnier the roasts'}
                            </p>
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={!description.trim() || generating}
                            className="w-full text-lg py-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                            size="lg"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {isHebrew ? 'מייצר רוסטים...' : 'Generating roasts...'}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    {isHebrew ? 'צרו לי רוסטים' : 'Generate Roasts'}
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* ===== STEP 2: SELECT / EDIT QUOTES ===== */}
                {step === 'select' && (
                    <>
                        <div className="mb-4">
                            <h1
                                className="text-2xl font-heading font-black mb-1 text-center"
                                dir={isHebrew ? 'rtl' : 'ltr'}
                            >
                                {isHebrew
                                    ? `בחרו רוסטים ל${victimName}`
                                    : `Pick roasts for ${victimName}`}
                            </h1>
                            <p className="text-gray-500 text-center text-sm">
                                {isHebrew
                                    ? `הקישו כדי לבטל בחירה. מינימום ${minQuotes}, מקסימום ${maxQuotes}.`
                                    : `Tap to deselect. Keep ${minQuotes}–${maxQuotes} quotes.`}
                            </p>
                        </div>

                        {/* Selected count badge */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className={`px-4 py-1.5 rounded-full border-2 font-heading font-bold text-sm ${
                                selectedQuotes.length >= minQuotes
                                    ? 'bg-green-100 border-green-500 text-green-700'
                                    : 'bg-red-100 border-red-400 text-red-600'
                            }`}>
                                {selectedQuotes.length}/{maxQuotes} selected
                            </div>
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

                        {/* Quote cards */}
                        {!generating && (
                            <div className="space-y-3 mb-6">
                                {generatedQuotes.map((quote, i) => {
                                    const isSelected = selectedQuotes.includes(quote);
                                    const selectedIndex = selectedQuotes.indexOf(quote);
                                    const isHebrewQuote = isPredominantlyHebrew(quote);
                                    const isEditing = editingIndex !== null && selectedQuotes[editingIndex] === quote;

                                    if (isEditing) {
                                        return (
                                            <div key={i} className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4">
                                                <input
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="w-full p-2 border-2 border-black rounded-lg text-sm font-medium bg-white"
                                                    dir={isPredominantlyHebrew(editText) ? 'rtl' : 'ltr'}
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveEdit();
                                                        if (e.key === 'Escape') cancelEdit();
                                                    }}
                                                />
                                                <div className="flex gap-2 mt-2">
                                                    <button onClick={saveEdit} className="text-xs font-bold text-green-600 hover:underline">Save</button>
                                                    <button onClick={cancelEdit} className="text-xs font-bold text-gray-400 hover:underline">Cancel</button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => toggleQuote(quote)}
                                            className={`
                                                relative p-4 rounded-xl border-2 cursor-pointer transition-all group
                                                ${isSelected
                                                    ? 'bg-yellow-50 border-yellow-400 shadow-[2px_2px_0px_0px_#FACC15]'
                                                    : 'bg-white border-gray-200 opacity-50 hover:opacity-70'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`
                                                    w-6 h-6 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors
                                                    ${isSelected
                                                        ? 'bg-yellow-400 border-black'
                                                        : 'border-gray-300'
                                                    }
                                                `}>
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
                                                </div>
                                                <p
                                                    className="flex-1 text-sm font-medium leading-relaxed"
                                                    dir={isHebrewQuote ? 'rtl' : 'ltr'}
                                                    style={{ textAlign: isHebrewQuote ? 'right' : 'left' }}
                                                >
                                                    "{quote}"
                                                </p>
                                            </div>

                                            {/* Edit button */}
                                            {isSelected && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEdit(selectedIndex);
                                                    }}
                                                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/80 border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                                                >
                                                    <Pencil className="w-3 h-3 text-gray-500" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Manual quotes (ones not from generated set) */}
                                {selectedQuotes
                                    .filter(q => !generatedQuotes.includes(q))
                                    .map((quote, i) => {
                                        const actualIndex = selectedQuotes.indexOf(quote);
                                        const isHebrewQuote = isPredominantlyHebrew(quote);
                                        const isEditing = editingIndex === actualIndex;

                                        if (isEditing) {
                                            return (
                                                <div key={`manual-${i}`} className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4">
                                                    <input
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        className="w-full p-2 border-2 border-black rounded-lg text-sm font-medium bg-white"
                                                        dir={isPredominantlyHebrew(editText) ? 'rtl' : 'ltr'}
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') saveEdit();
                                                            if (e.key === 'Escape') cancelEdit();
                                                        }}
                                                    />
                                                    <div className="flex gap-2 mt-2">
                                                        <button onClick={saveEdit} className="text-xs font-bold text-green-600 hover:underline">Save</button>
                                                        <button onClick={cancelEdit} className="text-xs font-bold text-gray-400 hover:underline">Cancel</button>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={`manual-${i}`}
                                                className="relative p-4 rounded-xl border-2 border-yellow-400 bg-yellow-50 shadow-[2px_2px_0px_0px_#FACC15] group"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-6 h-6 rounded bg-yellow-400 border-2 border-black shrink-0 mt-0.5 flex items-center justify-center">
                                                        <Check className="w-3.5 h-3.5 text-black" />
                                                    </div>
                                                    <p
                                                        className="flex-1 text-sm font-medium leading-relaxed"
                                                        dir={isHebrewQuote ? 'rtl' : 'ltr'}
                                                        style={{ textAlign: isHebrewQuote ? 'right' : 'left' }}
                                                    >
                                                        "{quote}"
                                                    </p>
                                                </div>
                                                <div className="absolute top-3 right-3 flex gap-1">
                                                    <button
                                                        onClick={() => startEdit(actualIndex)}
                                                        className="p-1.5 rounded-lg bg-white/80 border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                                                    >
                                                        <Pencil className="w-3 h-3 text-gray-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => removeQuote(actualIndex)}
                                                        className="p-1.5 rounded-lg bg-white/80 border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                                    >
                                                        <X className="w-3 h-3 text-red-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}

                        {/* Add your own + Regenerate */}
                        {!generating && (
                            <div className="space-y-3 mb-6">
                                {/* Add manual quote */}
                                {selectedQuotes.length < maxQuotes && (
                                    <div className="flex gap-2">
                                        <input
                                            value={manualQuote}
                                            onChange={(e) => setManualQuote(e.target.value)}
                                            placeholder={isHebrew ? 'הוסיפו ציטוט משלכם...' : 'Add your own quote...'}
                                            className="flex-1 p-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-black"
                                            dir={isPredominantlyHebrew(manualQuote) ? 'rtl' : 'ltr'}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') addManualQuote();
                                            }}
                                        />
                                        <button
                                            onClick={addManualQuote}
                                            disabled={!manualQuote.trim()}
                                            className="px-4 rounded-xl border-2 border-black bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleRegenerate}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        {isHebrew ? 'צרו חדשים' : 'Regenerate'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStep('describe');
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        {isHebrew ? 'שנו תיאור' : 'Edit description'}
                                    </button>
                                </div>
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
                            disabled={selectedQuotes.length < (adminMode ? 1 : minQuotes) || saving}
                            className="w-full text-lg py-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                            size="lg"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {isHebrew ? 'מייצר...' : 'Creating Magic...'}
                                </>
                            ) : (
                                <>
                                    {adminMode ? 'Generate Full Book' : isHebrew ? 'צרו תצוגה מקדימה' : 'Generate Preview'}
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