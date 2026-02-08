'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function GeneratingPage() {
    const params = useParams();
    const router = useRouter();
    const [status, setStatus] = useState('Initializing...');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Poll for status
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/book/${params.id}`);
                if (res.ok) {
                    const book = await res.json();

                    if (book.status === 'preview_ready') {
                        setProgress(100);
                        setStatus('Ready!');
                        router.push(`/preview/${params.id}`);
                    } else if (book.status === 'failed') {
                        setStatus('Generation failed. Please try again.');
                        clearInterval(interval);
                    } else {
                        // Simulate progress if still working
                        setProgress(p => Math.min(p + 5, 90));
                        // Update status text based on progress
                        if (progress < 30) setStatus('Analyzing victim...');
                        else if (progress < 60) setStatus('Generating illustrations...');
                        else setStatus('Composing roast book...');
                    }
                }
            } catch (error) {
                console.error('Poll error', error);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [params.id, router, progress]); // Added progress dependency to update message

    return (
        <div className="min-h-screen bg-[#FFFDF5] font-body text-black flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="relative w-32 h-32 mx-auto">
                    {/* Fun loader animation */}
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                    <div
                        className="absolute inset-0 border-4 border-yellow-400 rounded-full border-t-transparent animate-spin"
                    />
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">
                        {Math.round(progress)}%
                    </div>
                </div>

                <div>
                    <h1 className="text-3xl font-heading font-black mb-2">
                        Cooking up something hot 🔥
                    </h1>
                    <p className="text-gray-600 text-lg animate-pulse">
                        {status}
                    </p>
                </div>

                <div className="bg-white border-2 border-black rounded-xl p-4 shadow-brutal text-left">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI is analyzing facial features...</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
