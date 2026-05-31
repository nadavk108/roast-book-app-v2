'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { captureEvent, Events } from '@/lib/posthog';
import { getOrCreateSessionToken } from '@/lib/session-token';

export default function CreatePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [flowStep, setFlowStep] = useState<1 | 2>(1);
    const [victimName, setVictimName] = useState('');
    const [victimGender, setVictimGender] = useState<'male' | 'female' | 'neutral'>('neutral');
    const [description, setDescription] = useState('');

    const progressWidth = flowStep === 1 ? '25%' : '50%';

    const handleGenerateRoasts = async () => {
        if (!victimName.trim() || !description.trim()) return;

        setLoading(true);

        try {
            const sessionToken = getOrCreateSessionToken();

            // 1. Create book (no photo yet)
            const createRes = await fetch('/api/create-book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    victimName: victimName.trim(),
                    victimGender,
                    description: description.trim(),
                    session_token: sessionToken,
                }),
            });

            if (!createRes.ok) {
                const err = await createRes.json();
                throw new Error(err.error || 'Failed to create book');
            }

            const { bookId } = await createRes.json();

            captureEvent(Events.BOOK_CREATION_STARTED, { victim_name: victimName, book_id: bookId });

            // 2. Fire quote generation (fire-and-forget — quotes page handles the case where quotes aren't ready)
            fetch('/api/generate-quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, victimName: victimName.trim(), trueTraits: description.trim() }),
            }).catch(err => console.warn('[Create] Quote pre-generation failed:', err));

            // 3. Navigate to quotes page
            const traitsParam = `?traits=${encodeURIComponent(description.trim())}`;
            router.push(`/create/${bookId}/quotes${traitsParam}`);
        } catch (error: any) {
            alert(`Error: ${error.message || 'Failed to create book. Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFDF5] font-body text-black flex flex-col">
            {/* Header */}
            <header className="px-6 py-4 flex items-center border-b-2 border-black bg-white">
                {flowStep > 1 ? (
                    <button
                        type="button"
                        onClick={() => setFlowStep(1)}
                        className="p-2 hover:bg-black/5 rounded-full transition-colors mr-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                ) : (
                    <Link href="/" className="p-2 hover:bg-black/5 rounded-full transition-colors mr-4">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                )}
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden border border-black">
                    <div
                        className="bg-yellow-400 h-full transition-all duration-300"
                        style={{ width: progressWidth }}
                    />
                </div>
                <span className="ml-4 font-bold whitespace-nowrap">Step {flowStep}/4</span>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">

                {/* ===== STEP 1: NAME + GENDER ===== */}
                {flowStep === 1 && (
                    <div className="bg-white border-2 border-black rounded-xl p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h1 className="text-3xl font-heading font-black mb-2">
                            Who are we roasting?
                        </h1>
                        <p className="text-gray-600 mb-8">
                            Start with their name and we'll build the book around them.
                        </p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold mb-2">
                                    Their name
                                </label>
                                <Input
                                    placeholder="e.g. Josh"
                                    value={victimName}
                                    onChange={(e) => setVictimName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && victimName.trim()) setFlowStep(2);
                                    }}
                                    className="text-lg py-6 border-2 border-black rounded-xl focus:ring-yellow-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2">
                                    Gender
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setVictimGender('male')}
                                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all ${
                                            victimGender === 'male'
                                                ? 'bg-yellow-400 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                : 'bg-white border-gray-300 hover:border-black'
                                        }`}
                                    >
                                        Male
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVictimGender('female')}
                                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all ${
                                            victimGender === 'female'
                                                ? 'bg-yellow-400 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                : 'bg-white border-gray-300 hover:border-black'
                                        }`}
                                    >
                                        Female
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVictimGender('neutral')}
                                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all ${
                                            victimGender === 'neutral'
                                                ? 'bg-yellow-400 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                : 'bg-white border-gray-300 hover:border-black'
                                        }`}
                                    >
                                        Other
                                    </button>
                                </div>
                            </div>

                            <Button
                                onClick={() => setFlowStep(2)}
                                disabled={!victimName.trim()}
                                className="w-full text-lg py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all mt-4"
                                size="lg"
                            >
                                Next - Describe Them
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ===== STEP 2: DESCRIBE PERSONALITY ===== */}
                {flowStep === 2 && (
                    <div className="bg-white border-2 border-black rounded-xl p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h1 className="text-3xl font-heading font-black mb-2">
                            Tell us about {victimName}
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Anything goes: hobbies, habits, obsessions, quirks, inside jokes. We'll turn it into hilarious roasts.
                        </p>

                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Lives for pizza, always 15 min late, TikTok addict, thinks he's a chef but burns eggs, sleeps till 2pm on weekends, still quotes The Office daily..."
                            className="w-full min-h-[160px] p-4 rounded-xl border-2 border-black bg-[#FFFDF5] text-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400 placeholder:text-base"
                            maxLength={800}
                        />
                        <div className="flex justify-between items-center mt-2 mb-6">
                            <p className="text-xs text-gray-400">{description.length}/800</p>
                            <p className="text-xs text-gray-400">The more you share, the funnier the roasts</p>
                        </div>

                        <Button
                            onClick={handleGenerateRoasts}
                            disabled={!description.trim() || loading}
                            className="w-full text-lg py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent mr-2" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    Generate Roasts
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </div>
                )}

            </main>
        </div>
    );
}
