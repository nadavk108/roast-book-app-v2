'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Sparkles, Check } from 'lucide-react';

type RoastAssistantProps = {
    victimName: string;
    onQuotesGenerated: (quotes: string[]) => void;
    onClose: () => void;
};

export function RoastAssistant({ victimName, onQuotesGenerated, onClose }: RoastAssistantProps) {
    const [loading, setLoading] = useState(false);
    const [traits, setTraits] = useState('');
    const [generatedQuotes, setGeneratedQuotes] = useState<string[]>([]);
    const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
    const [step, setStep] = useState<'input' | 'selection'>('input');

    const handleGenerate = async () => {
        if (!traits) return;

        setLoading(true);
        try {
            const res = await fetch('/api/generate-quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    victimName,
                    trueTraits: traits,
                }),
            });

            if (!res.ok) throw new Error('Generation failed');

            const { quotes } = await res.json();
            setGeneratedQuotes(quotes);
            setStep('selection');
        } catch (error) {
            console.error(error);
            alert('Failed to generate quotes');
        } finally {
            setLoading(false);
        }
    };

    const toggleQuote = (quote: string) => {
        if (selectedQuotes.includes(quote)) {
            setSelectedQuotes(selectedQuotes.filter(q => q !== quote));
        } else {
            if (selectedQuotes.length >= 8) return; // Max limit just in case
            setSelectedQuotes([...selectedQuotes, quote]);
        }
    };

    const handleConfirm = () => {
        onQuotesGenerated(selectedQuotes);
        onClose();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <h3 className="font-heading font-bold text-lg">Roast Assistant</h3>
            </div>

            {step === 'input' ? (
                <>
                    <p className="text-gray-600 text-sm">
                        Tell us 3 things <strong>{victimName}</strong> actually LOVES or does all the time, and we'll turn them into hilarious opposite quotes.
                    </p>

                    <div className="relative">
                        <Textarea
                            value={traits}
                            onChange={(e) => setTraits(e.target.value)}
                            placeholder="Loves weed, tv, Coke Zero..."
                            className="min-h-[120px] bg-white border-2 border-black rounded-xl p-4 text-lg focus:ring-yellow-400"
                        />
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={!traits || loading}
                        className="w-full text-lg py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        {loading ? 'Generating...' : 'Generate Roasts'}
                        <Sparkles className="ml-2 w-4 h-4" />
                    </Button>
                </>
            ) : (
                <>
                    <p className="text-gray-600 text-sm">
                        Tap to select roasts for <strong>{victimName}</strong>:
                    </p>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {generatedQuotes.map((quote, i) => {
                            const isSelected = selectedQuotes.includes(quote);
                            return (
                                <div
                                    key={i}
                                    onClick={() => toggleQuote(quote)}
                                    className={`
                    p-4 rounded-xl border-2 cursor-pointer transition-all relative
                    ${isSelected
                                            ? 'bg-yellow-50 border-yellow-400 shadow-[2px_2px_0px_0px_#FACC15]'
                                            : 'bg-white border-gray-200 hover:border-black'
                                        }
                  `}
                                >
                                    <p className="text-sm font-medium pr-6">{quote}</p>
                                    <div className={`
                    absolute top-3 right-3 w-5 h-5 rounded border-2 flex items-center justify-center
                    ${isSelected
                                            ? 'bg-yellow-400 border-black'
                                            : 'border-gray-300'
                                        }
                  `}>
                                        {isSelected && <Check className="w-3 h-3 text-black" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setStep('input')}
                            className="flex-1"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={selectedQuotes.length === 0}
                            className="flex-[2] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        >
                            Add {selectedQuotes.length} Roasts
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
