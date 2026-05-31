'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
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
                <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black rounded-xl p-8 max-w-md text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-red-500 text-5xl mb-4">✗</div>
                        <h2 className="text-2xl font-heading font-black mb-2">Something went wrong</h2>
                        <p className="text-gray-600 mb-6">{generationError}</p>
                        <Button
                            onClick={() => {
                                setLoading(false);
                                setGenerationError(null);
                                setBookStatus(null);
                            }}
                            className="w-full"
                        >
                            Try again
                        </Button>
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
            <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center p-4">
                <div className="bg-white border-2 border-black rounded-xl p-8 max-w-md w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-center mb-8">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mb-4" />
                        <h2 className="text-2xl font-heading font-black mb-2">
                            Creating your roast book...
                        </h2>
                        <p className="text-gray-600">
                            This usually takes 30-60 seconds
                        </p>
                    </div>
                    <div className="space-y-4">
                        {stepStates.map((step, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                    step.state === 'complete' ? 'bg-green-100 border-green-500' :
                                    step.state === 'active' ? 'bg-yellow-100 border-yellow-500' :
                                    'bg-gray-100 border-gray-300'
                                }`}>
                                    {step.state === 'complete' && <Check className="w-4 h-4 text-green-600" />}
                                    {step.state === 'active' && <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />}
                                </div>
                                <span className={`font-medium ${
                                    step.state === 'complete' ? 'text-gray-400' :
                                    step.state === 'active' ? 'text-black' :
                                    'text-gray-300'
                                }`}>
                                    {step.label}
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
        <div className="min-h-screen bg-[#FFFDF5] font-body text-black flex flex-col">
            {/* Header */}
            <header className="px-6 py-4 flex items-center border-b-2 border-black bg-white">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors mr-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden border border-black">
                    <div
                        className="bg-yellow-400 h-full transition-all duration-300"
                        style={{ width: '100%' }}
                    />
                </div>
                <span className="ml-4 font-bold whitespace-nowrap">Step 4/4</span>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
                <div className="bg-white border-2 border-black rounded-xl p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h1 className="text-3xl font-heading font-black mb-2">
                        Last step - upload a photo of {victimName || 'them'}
                    </h1>
                    <p className="text-gray-600 mb-8">
                        We use it to generate the illustrated scenes. Any clear photo works - doesn't need to be perfect.
                    </p>

                    <div className="space-y-6">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="photo-upload"
                        />

                        {showCropUI ? (
                            <div className="space-y-3">
                                <div className="w-full rounded-xl overflow-hidden border-2 border-black bg-black flex items-center justify-center">
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

                                <Button
                                    onClick={handleCropConfirm}
                                    className="w-full text-lg py-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                >
                                    Crop &amp; Continue
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>

                                <button
                                    type="button"
                                    onClick={handleSkipCrop}
                                    className="w-full text-sm text-gray-600 hover:text-black py-1 transition-colors"
                                >
                                    Skip crop &rarr;
                                </button>

                                <button
                                    type="button"
                                    onClick={handleChangePhoto}
                                    className="w-full text-sm text-gray-500 hover:text-black underline underline-offset-2 py-1 transition-colors"
                                >
                                    &larr; Change photo
                                </button>
                            </div>
                        ) : (
                            <>
                                <label
                                    htmlFor="photo-upload"
                                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors relative overflow-hidden group"
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
                                            <div className="bg-white p-4 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-flex mb-3 group-hover:scale-110 transition-transform">
                                                <Upload className="h-6 w-6 text-black" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-900">
                                                Click to upload photo
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                JPG or PNG
                                            </p>
                                        </div>
                                    )}
                                </label>

                                <Button
                                    onClick={handleSubmit}
                                    disabled={!imageFile}
                                    className="w-full text-lg py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all mt-4"
                                    size="lg"
                                >
                                    Continue
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>

                                {imageFile && (
                                    <button
                                        type="button"
                                        onClick={handleChangePhoto}
                                        className="w-full text-sm text-gray-500 hover:text-black underline underline-offset-2 py-1 transition-colors text-center"
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
