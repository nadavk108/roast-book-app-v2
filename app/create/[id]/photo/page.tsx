'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Upload, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';
import ReactCrop from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getCroppedImg } from '@/lib/crop-utils';
import { captureEvent, Events } from '@/lib/posthog';

export default function PhotoPage() {
    const params = useParams();
    const router = useRouter();
    const bookId = params.id as string;

    const [victimName, setVictimName] = useState('');
    const [loading, setLoading] = useState(false);
    const [bookStatus, setBookStatus] = useState<string | null>(null);
    const [generationError, setGenerationError] = useState<string | null>(null);

    // Raw file from picker (crop phase)
    const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
    const [rawFileName, setRawFileName] = useState('photo.jpg');
    const [rawFile, setRawFile] = useState<File | null>(null);

    // Crop state
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

    // Committed (post-crop) state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const showCropUI = rawImageSrc !== null && imageFile === null;

    // Fetch victim name on mount
    useEffect(() => {
        fetch(`/api/book/${bookId}`)
            .then((r) => r.json())
            .then((data) => setVictimName(data?.victim_name || ''))
            .catch(() => {});
    }, [bookId]);

    // Poll for generation status while loading
    useEffect(() => {
        if (!loading || !bookId) return;
        let cancelled = false;

        const poll = async () => {
            try {
                const res = await fetch(`/api/book/${bookId}`);
                if (!res.ok || cancelled) return;
                const book = await res.json();
                setBookStatus(book.status);

                if (book.status === 'preview_ready' || book.status === 'complete') {
                    if (!cancelled) router.push(`/preview/${bookId}`);
                    return;
                }
                if (book.status === 'failed') {
                    if (!cancelled) setGenerationError(book.error_message || 'Generation failed. Please try again.');
                    return;
                }
                if (!cancelled) setTimeout(poll, 2000);
            } catch {
                if (!cancelled) setTimeout(poll, 2000);
            }
        };

        const initialDelay = setTimeout(poll, 1500);
        return () => {
            cancelled = true;
            clearTimeout(initialDelay);
        };
    }, [loading, bookId, router]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
        setCompletedCrop(null);
        setImageFile(null);
        setImagePreview(null);
        setRawFileName(file.name);
        setRawFile(file);
        const reader = new FileReader();
        reader.onloadend = () => { setRawImageSrc(reader.result as string); };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        setCompletedCrop({ unit: 'px', x: 0, y: 0, width, height });
    }, []);

    const handleCropConfirm = async () => {
        if (!imgRef.current || !completedCrop || completedCrop.width === 0) return;
        try {
            const croppedFile = await getCroppedImg(imgRef.current, completedCrop, rawFileName);
            setImageFile(croppedFile);
            setImagePreview(URL.createObjectURL(croppedFile));
            setRawImageSrc(null);
            setRawFile(null);
        } catch {
            alert('Could not crop the image. Please try again.');
        }
    };

    const handleSkipCrop = () => {
        if (!rawFile || !rawImageSrc) return;
        setImageFile(rawFile);
        setImagePreview(URL.createObjectURL(rawFile));
        setRawImageSrc(null);
        setRawFile(null);
    };

    const handleChangePhoto = () => {
        const input = document.getElementById('photo-upload') as HTMLInputElement | null;
        if (input) input.value = '';
        setRawImageSrc(null);
        setRawFile(null);
        setImageFile(null);
        setImagePreview(null);
        setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
        setCompletedCrop(null);
        input?.click();
    };

    const handleSubmit = async () => {
        if (!imageFile) return;

        const maxSize = 4 * 1024 * 1024;
        if (imageFile.size > maxSize) {
            alert('Image is too large. Please upload an image smaller than 4MB.');
            return;
        }

        setLoading(true);
        setGenerationError(null);

        try {
            // 1. Upload photo
            const formData = new FormData();
            formData.append('bookId', bookId);
            formData.append('image', imageFile);

            const uploadRes = await fetch('/api/upload-photo', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) {
                const err = await uploadRes.json();
                throw new Error(err.error || 'Photo upload failed');
            }

            try { captureEvent(Events.PHOTO_UPLOADED, { book_id: bookId }); } catch {}

            // 2. Analyze photo (must complete before generation)
            const analyzeRes = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId }),
            });

            if (!analyzeRes.ok) {
                const err = await analyzeRes.json();
                throw new Error(`Image analysis failed: ${err.error || 'Unknown error'}`);
            }

            // 3. Fire generate-preview (fire-and-forget)
            fetch('/api/generate-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, quotes: [], customGreeting: null }),
            }).catch(err => console.error('[Photo] generate-preview failed:', err));

            // 4. Stay on page — polling useEffect handles redirect to /preview/

        } catch (error: any) {
            alert(`Error: ${error.message || 'Failed to upload. Please try again.'}`);
            setLoading(false);
        }
    };

    // ── loading interstitial ──────────────────────────────────────────────────
    if (loading) {
        if (generationError) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-4">
                    <div className="bg-card border-[2.5px] border-foreground rounded-2xl p-8 max-w-md w-full text-center shadow-[6px_6px_0_#0E0E0E]">
                        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border-[2.5px] border-destructive flex items-center justify-center mx-auto mb-4 text-2xl">
                            ✗
                        </div>
                        <h2 className="font-heading font-black text-2xl mb-2">Something went wrong</h2>
                        <p className="text-foreground/60 mb-6 text-sm">{generationError}</p>
                        <button
                            type="button"
                            onClick={() => {
                                setLoading(false);
                                setGenerationError(null);
                                setBookStatus(null);
                            }}
                            className="w-full flex items-center justify-center gap-2 font-heading font-black text-base py-4 rounded-xl border-[2.5px] border-foreground bg-primary shadow-[4px_4px_0_#0E0E0E] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            );
        }

        const stepOrder = ['analyzing', 'generating_prompts', 'generating_images', 'preview_ready'];
        const currentIndex = stepOrder.indexOf(bookStatus || 'analyzing');
        const stepStates = [
            { label: `Matching roasts to scenes`, state: currentIndex > 0 ? 'complete' : currentIndex === 0 ? 'active' : 'pending' },
            { label: `Illustrating ${victimName || 'them'} into each page`, state: currentIndex > 1 ? 'complete' : currentIndex === 1 ? 'active' : 'pending' },
            { label: 'Rendering your free preview', state: currentIndex > 2 ? 'complete' : currentIndex === 2 ? 'active' : 'pending' },
        ];

        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-card border-[2.5px] border-foreground rounded-2xl p-8 max-w-md w-full shadow-[6px_6px_0_#0E0E0E]">
                    <div className="text-center mb-8">
                        <div className="inline-block w-16 h-16 rounded-2xl bg-primary border-[2.5px] border-foreground shadow-[4px_4px_0_#0E0E0E] mb-4 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full border-4 border-foreground border-t-transparent animate-spin" />
                        </div>
                        <h2 className="font-heading font-black text-2xl mb-2 tracking-tight">
                            Building the book...
                        </h2>
                        <p className="text-foreground/50 text-sm">
                            This usually takes 30 to 60 seconds
                        </p>
                    </div>
                    <div className="space-y-4">
                        {stepStates.map((s, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl border-[2px] flex items-center justify-center shrink-0 ${
                                    s.state === 'complete'
                                        ? 'bg-[#1FAE54]/10 border-[#1FAE54]'
                                        : s.state === 'active'
                                        ? 'bg-primary border-foreground'
                                        : 'bg-foreground/5 border-foreground/20'
                                }`}>
                                    {s.state === 'complete' && <Check className="w-4 h-4 text-[#1FAE54]" />}
                                    {s.state === 'active' && <Loader2 className="w-4 h-4 text-foreground animate-spin" />}
                                </div>
                                <span className={`font-medium text-sm ${
                                    s.state === 'complete' ? 'text-foreground/40 line-through' :
                                    s.state === 'active' ? 'text-foreground font-bold' :
                                    'text-foreground/30'
                                }`}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── main: photo upload ────────────────────────────────────────────────────
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
                    <div className="bg-primary h-full rounded-full border-r border-foreground/30" style={{ width: '100%' }} />
                </div>

                <span className="font-heading font-black text-sm whitespace-nowrap shrink-0">Step 4 of 4</span>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
                <div className="bg-card border-[2.5px] border-foreground rounded-2xl p-6 md:p-8 shadow-[6px_6px_0_#0E0E0E]">
                    <h1 className="font-heading font-black text-2xl md:text-3xl mb-2 tracking-tight">
                        Last step - a photo of {victimName || 'them'}
                    </h1>
                    <p className="text-foreground/50 mb-8 text-sm">
                        We use it to generate the illustrated scenes. Any clear photo works.
                    </p>

                    <div className="space-y-4">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="photo-upload"
                        />

                        {showCropUI ? (
                            <div className="space-y-3">
                                <div className="w-full rounded-xl overflow-hidden border-[2.5px] border-foreground bg-black flex items-center justify-center shadow-[4px_4px_0_#0E0E0E]">
                                    <ReactCrop
                                        crop={crop}
                                        onChange={(_, pct) => setCrop(pct)}
                                        onComplete={(px) => setCompletedCrop(px)}
                                        className="max-h-[60vh] max-w-full"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            ref={imgRef}
                                            src={rawImageSrc!}
                                            alt="Crop preview"
                                            onLoad={onImageLoad}
                                            style={{ maxHeight: '60vh', maxWidth: '100%', display: 'block' }}
                                        />
                                    </ReactCrop>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCropConfirm}
                                    className="w-full flex items-center justify-center gap-2 font-heading font-black text-base py-4 rounded-xl border-[2.5px] border-foreground bg-primary shadow-[4px_4px_0_#0E0E0E] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                                >
                                    Crop &amp; create book
                                    <ArrowRight className="h-5 w-5" />
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSkipCrop}
                                    className="w-full text-sm font-heading font-bold text-foreground/50 hover:text-foreground py-2 transition-colors"
                                >
                                    Skip crop &rarr;
                                </button>

                                <button
                                    type="button"
                                    onClick={handleChangePhoto}
                                    className="w-full text-sm font-medium text-foreground/40 hover:text-foreground underline underline-offset-2 py-1 transition-colors"
                                >
                                    &larr; Change photo
                                </button>
                            </div>
                        ) : (
                            <>
                                <label
                                    htmlFor="photo-upload"
                                    className="flex flex-col items-center justify-center w-full h-60 border-[2.5px] border-dashed border-foreground rounded-2xl cursor-pointer bg-muted hover:bg-muted/70 transition-colors relative overflow-hidden group"
                                >
                                    {imagePreview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-center p-4">
                                            <div className="bg-card p-4 rounded-2xl border-[2.5px] border-foreground shadow-[3px_3px_0_#0E0E0E] inline-flex mb-3 group-hover:scale-105 transition-transform">
                                                <Upload className="h-6 w-6 text-foreground" />
                                            </div>
                                            <p className="font-heading font-black text-sm text-foreground">
                                                Tap to upload photo
                                            </p>
                                            <p className="text-xs text-foreground/40 mt-1">
                                                JPG or PNG, max 4MB
                                            </p>
                                        </div>
                                    )}
                                </label>

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!imageFile}
                                    className={`w-full flex items-center justify-center gap-2 font-heading font-black text-lg py-4 rounded-xl border-[2.5px] transition-all ${
                                        imageFile
                                            ? 'bg-primary border-foreground shadow-[6px_6px_0_#0E0E0E] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#0E0E0E] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none cursor-pointer'
                                            : 'bg-[#ECE5CE] border-[#CDC4A6] text-[#B5AC8F] cursor-not-allowed'
                                    }`}
                                >
                                    Create the book
                                    <ArrowRight className="h-5 w-5" />
                                </button>

                                {imageFile && (
                                    <button
                                        type="button"
                                        onClick={handleChangePhoto}
                                        className="w-full text-sm font-medium text-foreground/40 hover:text-foreground underline underline-offset-2 py-1 transition-colors text-center"
                                    >
                                        Change photo
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
