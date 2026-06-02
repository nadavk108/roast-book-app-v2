'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    const [selectedTraits, setSelectedTraits] = useState<string[]>([]);

    const TRAIT_CHIPS = [
        'Always late', 'Coffee addict', 'Gym obsessed',
        'Phone addict', 'Thinks they can cook', 'Netflix binger',
        'Party animal', 'Homebody', 'Overthinker',
        'Sneakerhead', 'Always eating', 'Drama queen',
        'Workaholic', 'TikTok addict', 'Never on time',
        'Control freak', 'Shopaholic', 'Loud laugher',
    ];

    const toggleTrait = (trait: string) => {
        setSelectedTraits(prev =>
            prev.includes(trait)
                ? prev.filter(t => t !== trait)
                : [...prev, trait]
        );
    };

    const progressWidth = flowStep === 1 ? '25%' : '50%';

    const handleGenerateRoasts = async () => {
        const combinedDescription = [
            ...selectedTraits,
            description.trim(),
        ].filter(Boolean).join(', ');

        if (!victimName.trim() || !combinedDescription) return;

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
                    description: combinedDescription,
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
                body: JSON.stringify({ bookId, victimName: victimName.trim(), trueTraits: combinedDescription }),
            }).catch(err => console.warn('[Create] Quote pre-generation failed:', err));

            // 3. Navigate to quotes page
            const traitsParam = `?traits=${encodeURIComponent(combinedDescription)}`;
            router.push(`/create/${bookId}/quotes${traitsParam}`);
        } catch (error: any) {
            alert(`Error: ${error.message || 'Failed to create book. Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };

    const step1Valid = victimName.trim().length > 0;
    const step2Valid = (selectedTraits.length >= 3 || description.trim().length >= 12) && !loading;

    return (
        <div className="min-h-screen bg-background font-body text-foreground flex flex-col">
            {/* App bar */}
            <header className="px-4 py-3 flex items-center gap-3 border-b-[2.5px] border-foreground bg-background sticky top-0 z-30">
                {flowStep > 1 ? (
                    <button
                        type="button"
                        onClick={() => setFlowStep(1)}
                        className="flex items-center justify-center w-9 h-9 rounded-xl border-[2px] border-foreground bg-card shadow-[2px_2px_0_#0E0E0E] hover:-translate-x-px hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all shrink-0"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                ) : (
                    <Link
                        href="/"
                        className="flex items-center justify-center w-9 h-9 rounded-xl border-[2px] border-foreground bg-card shadow-[2px_2px_0_#0E0E0E] hover:-translate-x-px hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all shrink-0"
                        aria-label="Back to home"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                )}

                {/* Progress bar */}
                <div className="flex-1 bg-foreground/10 h-2.5 rounded-full overflow-hidden border border-foreground/20">
                    <div
                        className="bg-primary h-full rounded-full transition-all duration-500 border-r border-foreground/30"
                        style={{ width: progressWidth }}
                    />
                </div>

                <span className="font-heading font-black text-sm whitespace-nowrap shrink-0">
                    Step {flowStep} of 4
                </span>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">

                {/* ===== STEP 1: NAME + GENDER ===== */}
                {flowStep === 1 && (
                    <div className="bg-card border-[2.5px] border-foreground rounded-2xl p-6 md:p-8 shadow-[6px_6px_0_#0E0E0E]">
                        <h1 className="font-heading font-black text-2xl md:text-3xl mb-2 tracking-tight">
                            Who are we roasting?
                        </h1>
                        <p className="text-foreground/50 mb-8 text-sm">
                            Start with their name and we&apos;ll build the book around them.
                        </p>

                        <div className="space-y-6">
                            <div>
                                <label className="block font-heading font-black text-sm mb-2" htmlFor="victim-name">
                                    Their name
                                </label>
                                <Input
                                    id="victim-name"
                                    placeholder="e.g. Josh"
                                    value={victimName}
                                    onChange={(e) => setVictimName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && victimName.trim()) setFlowStep(2);
                                    }}
                                    className="text-lg py-6 border-[2.5px] border-foreground rounded-xl bg-muted focus:ring-primary focus:border-primary shadow-[2px_2px_0_#0E0E0E]"
                                />
                            </div>

                            <div>
                                <label className="block font-heading font-black text-sm mb-2">
                                    Gender
                                </label>
                                <div className="flex gap-2">
                                    {(['male', 'female', 'neutral'] as const).map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setVictimGender(g)}
                                            className={`flex-1 py-3 px-3 rounded-xl border-[2.5px] font-heading font-bold text-sm transition-all ${
                                                victimGender === g
                                                    ? 'bg-primary border-foreground shadow-[3px_3px_0_#0E0E0E]'
                                                    : 'bg-card border-foreground/30 hover:border-foreground text-foreground/60 hover:text-foreground'
                                            }`}
                                        >
                                            {g === 'male' ? 'He' : g === 'female' ? 'She' : 'They'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setFlowStep(2)}
                                disabled={!step1Valid}
                                className={`w-full flex items-center justify-center gap-2 font-heading font-black text-lg py-4 rounded-xl border-[2.5px] transition-all mt-2 ${
                                    step1Valid
                                        ? 'bg-primary border-foreground shadow-[6px_6px_0_#0E0E0E] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#0E0E0E] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none cursor-pointer'
                                        : 'bg-[#ECE5CE] border-[#CDC4A6] text-[#B5AC8F] cursor-not-allowed'
                                }`}
                            >
                                Next - describe them
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== STEP 2: DESCRIBE PERSONALITY ===== */}
                {flowStep === 2 && (
                    <div className="bg-card border-[2.5px] border-foreground rounded-2xl p-6 md:p-8 shadow-[6px_6px_0_#0E0E0E]">
                        <h1 className="font-heading font-black text-2xl md:text-3xl mb-2 tracking-tight">
                            Tell us about {victimName}
                        </h1>
                        <p className="text-foreground/50 mb-4 text-sm">
                            Tap what sounds like them:
                        </p>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {TRAIT_CHIPS.map((trait) => {
                                const selected = selectedTraits.includes(trait);
                                return (
                                    <button
                                        key={trait}
                                        type="button"
                                        onClick={() => toggleTrait(trait)}
                                        className={`px-4 py-2 rounded-full border-[2.5px] border-[#0E0E0E] text-[14px] font-body transition-all active:translate-y-[1px] active:shadow-none ${
                                            selected
                                                ? 'bg-[#FFC700] font-bold shadow-[2px_2px_0_#0E0E0E]'
                                                : 'bg-white font-semibold'
                                        }`}
                                    >
                                        {trait}
                                    </button>
                                );
                            })}
                        </div>

                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add inside jokes, specific quirks, catchphrases..."
                            className="w-full min-h-[100px] p-4 rounded-xl border-[2.5px] border-foreground bg-muted text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary shadow-[2px_2px_0_#0E0E0E] placeholder:text-foreground/30 placeholder:text-sm"
                            maxLength={800}
                        />
                        <div className="flex justify-between items-center mt-2 mb-6">
                            <p className="text-xs text-foreground/40 font-mono">{description.length}/800</p>
                            <p className="text-xs text-foreground/40">The more you share, the funnier the roasts</p>
                        </div>

                        <button
                            type="button"
                            onClick={handleGenerateRoasts}
                            disabled={!step2Valid}
                            className={`w-full flex items-center justify-center gap-2 font-heading font-black text-lg py-4 rounded-xl border-[2.5px] transition-all ${
                                step2Valid
                                    ? 'bg-primary border-foreground shadow-[6px_6px_0_#0E0E0E] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#0E0E0E] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none cursor-pointer'
                                    : 'bg-[#ECE5CE] border-[#CDC4A6] text-[#B5AC8F] cursor-not-allowed'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
                                    Writing roasts...
                                </>
                            ) : (
                                <>
                                    Next - generate roasts
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </div>
                )}

            </main>
        </div>
    );
}
