'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IdeaGeneratorModal } from '@/components/project/IdeaGeneratorModal';
import { Sparkles, ArrowRight, ArrowLeft, Plus, Shield } from 'lucide-react';
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

    const [quotes, setQuotes] = useState<string[]>(Array(8).fill(''));
    const [customGreeting, setCustomGreeting] = useState('');
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);

    const adminMode = isAdminUser(user);
    const minQuotes = getMinQuotesRequired(user);

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
                if (data.quotes && data.quotes.length > 0) {
                    const padded = [...data.quotes];
                    while (padded.length < 8) padded.push('');
                    setQuotes(padded.slice(0, 8));
                }
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuote = (index: number, value: string) => {
        const newQuotes = [...quotes];
        newQuotes[index] = value;
        setQuotes(newQuotes);
    };

    const handleAssistantAdd = (newQuotes: string[]) => {
        const currentQuotes = [...quotes];
        let addIndex = 0;

        for (const quote of newQuotes) {
            while (addIndex < currentQuotes.length && currentQuotes[addIndex].trim() !== '') {
                addIndex++;
            }

            if (addIndex < currentQuotes.length) {
                currentQuotes[addIndex] = quote;
            } else {
                break;
            }
        }
        setQuotes(currentQuotes);

        // Track roast assistant usage
        captureEvent(Events.ROAST_ASSISTANT_USED, {
            quotes_added: newQuotes.length,
            book_id: params.id,
        });
    };

    const handleNext = async () => {
        let validQuotes = quotes.filter(q => q.trim());

        if (validQuotes.length < minQuotes) {
            alert(`Please provide at least ${minQuotes} quote${minQuotes > 1 ? 's' : ''}`);
            return;
        }

        // Admin mode: Don't pad quotes, generate exactly what's entered
        // Regular mode: Pad to 8 quotes
        if (!adminMode) {
            while (validQuotes.length < 8) {
                validQuotes.push(validQuotes[0]);
            }
        }

        console.log('=== STARTING PREVIEW GENERATION ===');
        console.log('Book ID from params:', params.id);
        console.log('Book object:', book);
        console.log('Valid quotes:', validQuotes);

        if (!params.id && !book?.id) {
            console.error('ERROR: No book ID available');
            alert('Error: Book ID is missing');
            return;
        }

        const bookId = params.id || book?.id;
        console.log('Using bookId:', bookId);

        // Track quotes submission
        captureEvent(Events.QUOTES_SUBMITTED, {
            quote_count: validQuotes.length,
            has_custom_greeting: !!customGreeting,
            is_admin: adminMode,
            book_id: bookId,
        });

        setSaving(true);
        try {
            console.log('Calling /api/generate-preview with payload:', {
                bookId,
                quotes: validQuotes,
                customGreeting: customGreeting || null,
            });

            const res = await fetch('/api/generate-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId: bookId,
                    quotes: validQuotes,
                    customGreeting: customGreeting || null,
                }),
            });

            console.log('Response received. Status:', res.status);

            if (!res.ok) {
                const errorData = await res.json();
                console.error('API returned error:', errorData);
                console.error('Full error details:', JSON.stringify(errorData, null, 2));

                // Show detailed error to user
                const errorMessage = errorData.error || 'Generation failed';
                const errorDetails = errorData.errorDetails;

                let alertMessage = `Failed to start generation:\n\n${errorMessage}`;

                if (errorDetails) {
                    alertMessage += `\n\nTechnical Details:\n`;
                    if (errorDetails.name) alertMessage += `- Error type: ${errorDetails.name}\n`;
                    if (errorDetails.code) alertMessage += `- Error code: ${errorDetails.code}\n`;
                    if (errorDetails.hint) alertMessage += `- Hint: ${errorDetails.hint}\n`;
                    if (errorDetails.stack) alertMessage += `\n Stack trace:\n${errorDetails.stack.slice(0, 500)}...`;
                }

                throw new Error(alertMessage);
            }

            const data = await res.json();
            console.log('API success response:', data);

            console.log('Redirecting to /progress/' + bookId);
            router.push(`/progress/${bookId}`);
        } catch (error: any) {
            console.error('=== GENERATION ERROR ===');
            console.error('Error message:', error.message);
            console.error('Full error:', error);

            // Show full error to user
            alert(error.message || `Failed to start generation: ${String(error)}`);
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    const filledCount = quotes.filter(q => q.trim()).length;
    const canProceed = filledCount >= minQuotes;

    return (
        <div className="min-h-screen bg-[#FFFDF5] font-body text-black flex flex-col relative">
            {/* Removed generic loading overlay - user redirects to /progress page which has detailed loader */}

            <header className="px-6 py-4 flex items-center border-b-2 border-black bg-white sticky top-0 z-30">
                <Link href="/" className="p-2 hover:bg-black/5 rounded-full transition-colors mr-4">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden border border-black max-w-xs md:max-w-md mx-auto">
                    <div className="bg-yellow-400 h-full w-[40%]" />
                </div>
                <span className="ml-4 font-bold whitespace-nowrap">Step 2/5</span>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
                <div className="bg-white border-2 border-black rounded-xl p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">

                    {/* Admin Mode Banner */}
                    {adminMode && (
                        <div className="mb-6 bg-primary border-3 border-foreground rounded-xl p-4 shadow-brutal">
                            <div className="flex items-center gap-3">
                                <Shield className="h-6 w-6" />
                                <div>
                                    <p className="font-heading font-bold text-lg">ADMIN MODE ACTIVE</p>
                                    <p className="text-sm">
                                        Enter 1-8 quotes. All images will be generated immediately without preview.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={`flex items-center justify-between mb-6 ${isPredominantlyHebrew(book?.victim_name || '') ? 'flex-row-reverse' : ''}`}>
                        <div className="flex-1">
                            <h1
                                className="text-2xl md:text-3xl font-heading font-black"
                                dir={isPredominantlyHebrew(book?.victim_name || '') ? 'rtl' : 'ltr'}
                                style={{
                                    textAlign: isPredominantlyHebrew(book?.victim_name || '') ? 'right' : 'left',
                                }}
                            >
                                {isPredominantlyHebrew(book?.victim_name || '')
                                    ? getHebrewBookTitle(book?.victim_name, book?.victim_gender)
                                    : `Things ${book?.victim_name} would NEVER say`}
                            </h1>
                            <p
                                className="text-gray-600 mt-1"
                                dir={isPredominantlyHebrew(book?.victim_name || '') ? 'rtl' : 'ltr'}
                                style={{
                                    textAlign: isPredominantlyHebrew(book?.victim_name || '') ? 'right' : 'left',
                                }}
                            >
                                {adminMode
                                    ? `${filledCount} quotes added (${minQuotes}-8 allowed)`
                                    : filledCount >= minQuotes
                                        ? `${filledCount} quotes added (minimum ${minQuotes})`
                                        : `Add at least ${minQuotes} quotes`
                                }
                            </p>
                        </div>

                        <Button
                            size="sm"
                            onClick={() => {
                                setIsAssistantOpen(true);
                                captureEvent(Events.ROAST_ASSISTANT_OPENED, { book_id: params.id });
                            }}
                            className={`bg-yellow-100 text-yellow-800 border-yellow-400 hover:bg-yellow-200 flex-shrink-0 ${isPredominantlyHebrew(book?.victim_name || '') ? 'ml-0 mr-4' : 'ml-4'}`}
                        >
                            <Sparkles className={`w-4 h-4 ${isPredominantlyHebrew(book?.victim_name || '') ? 'ml-2' : 'mr-2'}`} />
                            Need ideas?
                        </Button>
                    </div>

                    <div className="space-y-4 mb-8">
                        {quotes.map((quote, i) => {
                            const isHebrewQuote = isPredominantlyHebrew(quote);
                            return (
                                <div key={i} className="relative group">
                                    <Input
                                        value={quote}
                                        onChange={(e) => updateQuote(i, e.target.value)}
                                        placeholder={`Quote #${i + 1}`}
                                        className="py-6 pl-4 pr-10 text-lg border-2 border-gray-200 focus:border-black focus:ring-yellow-400 rounded-xl"
                                        dir={isHebrewQuote ? 'rtl' : 'ltr'}
                                        style={{
                                            textAlign: isHebrewQuote ? 'right' : 'left',
                                        }}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300">
                                        {i + 1}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-8 text-center" onClick={() => {
                        setIsAssistantOpen(true);
                        captureEvent(Events.ROAST_ASSISTANT_OPENED, { book_id: params.id });
                    }}>
                        <div className="flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                            <div className="bg-yellow-400 rounded-full p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2">
                                <Plus className="w-6 h-6" />
                            </div>
                            <p className="font-bold">Use Roast Assistant</p>
                            <p className="text-xs text-gray-500">Generate funny quotes instantly</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleNext}
                        disabled={!canProceed || saving}
                        className="w-full text-lg py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                        size="lg"
                    >
                        {saving ? 'Creating Magic...' : adminMode ? 'Generate Full Book' : 'Generate Preview'}
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>

                </div>
            </main>

            <IdeaGeneratorModal
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
                victimName={book?.victim_name || 'them'}
                onSelectSuggestions={handleAssistantAdd}
            />
        </div>
    );
}