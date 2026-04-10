'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { captureEvent, Events } from '@/lib/posthog';
import { getOrCreateSessionToken } from '@/lib/session-token';
import ReactCrop from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getCroppedImg } from '@/lib/crop-utils';

export default function UploadPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [victimName, setVictimName] = useState('');
    const [victimGender, setVictimGender] = useState<'male' | 'female' | 'neutral'>('neutral');

    // Raw file straight from the file picker (used only during crop)
    const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
    const [rawFileName, setRawFileName] = useState<string>('photo.jpg');
    const [rawFile, setRawFile] = useState<File | null>(null);

    // Crop state
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

    // Committed (post-crop) state — what gets uploaded
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const showCropUI = rawImageSrc !== null && imageFile === null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset any previous crop
        setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
        setCompletedCrop(null);
        setImageFile(null);
        setImagePreview(null);
        setRawFileName(file.name);
        setRawFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setRawImageSrc(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Reset input value so re-selecting the same file triggers onChange
        e.target.value = '';
    };

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        // Default completedCrop to full rendered image so "Crop & Continue" works immediately
        const { width, height } = e.currentTarget;
        setCompletedCrop({ unit: 'px', x: 0, y: 0, width, height });
    }, []);

    const handleCropConfirm = async () => {
        if (!imgRef.current || !completedCrop || completedCrop.width === 0) return;
        try {
            const croppedFile = await getCroppedImg(imgRef.current, completedCrop, rawFileName);
            const preview = URL.createObjectURL(croppedFile);
            setImageFile(croppedFile);
            setImagePreview(preview);
            setRawImageSrc(null);
            setRawFile(null);
        } catch (err) {
            console.error('Crop failed:', err);
            alert('Could not crop the image. Please try again.');
        }
    };

    const handleSkipCrop = () => {
        if (!rawFile || !rawImageSrc) return;
        const preview = URL.createObjectURL(rawFile);
        setImageFile(rawFile);
        setImagePreview(preview);
        setRawImageSrc(null);
        setRawFile(null);
    };

    const handleChangePhoto = () => {
        const input = document.getElementById('image-upload') as HTMLInputElement | null;
        if (input) input.value = '';
        setRawImageSrc(null);
        setRawFile(null);
        setImageFile(null);
        setImagePreview(null);
        setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
        setCompletedCrop(null);
        input?.click();
    };

    const handleUpload = async () => {
        if (!victimName || !imageFile) {
            alert('Please enter a name and upload a photo');
            return;
        }

        const maxSize = 4 * 1024 * 1024;
        if (imageFile.size > maxSize) {
            alert('Image is too large. Please upload an image smaller than 4MB.');
            return;
        }

        captureEvent(Events.BOOK_CREATION_STARTED, { victim_name: victimName });

        setLoading(true);
        console.log('Starting upload...', { victimName, fileSize: imageFile.size });

        try {
            const sessionToken = getOrCreateSessionToken();

            const formData = new FormData();
            formData.append('victimName', victimName);
            formData.append('victimGender', victimGender);
            formData.append('image', imageFile);
            formData.append('session_token', sessionToken);

            console.log('Sending request to /api/upload...');

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            }).finally(() => clearTimeout(timeoutId));

            console.log('Upload response status:', uploadRes.status);

            if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                console.error('Upload failed with response:', errorText);
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
                }
                throw new Error(errorData.error || 'Upload failed');
            }

            const responseData = await uploadRes.json();
            console.log('Upload successful, bookId:', responseData.bookId);
            const { bookId } = responseData;

            try { captureEvent(Events.PHOTO_UPLOADED, { book_id: bookId }); } catch {}

            console.log('Starting image analysis...');
            const analyzeRes = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId }),
            });

            if (!analyzeRes.ok) {
                const analyzeError = await analyzeRes.json();
                console.error('Analysis failed:', analyzeError);
                throw new Error(`Image analysis failed: ${analyzeError.error || 'Unknown error'}`);
            }

            console.log('Analysis complete, redirecting to quotes page');
            router.push(`/create/${bookId}/quotes`);
        } catch (error: any) {
            console.error('Upload error:', error);

            let errorMessage = 'Failed to upload. Please try again.';
            if (error.name === 'AbortError') {
                errorMessage = 'Upload timed out. Please check your internet connection and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert(`Error: ${errorMessage}\n\nDebug info:\n- File size: ${(imageFile.size / 1024 / 1024).toFixed(2)}MB\n- Name: ${victimName}\n\nPlease try again or contact support.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFDF5] font-body text-black flex flex-col">
            {/* Header */}
            <header className="px-6 py-4 flex items-center border-b-2 border-black bg-white">
                <Link href="/" className="p-2 hover:bg-black/5 rounded-full transition-colors mr-4">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden border border-black">
                    <div className="bg-yellow-400 h-full w-[20%]" />
                </div>
                <span className="ml-4 font-bold whitespace-nowrap">Step 1/3</span>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
                <div className="bg-white border-2 border-black rounded-xl p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h1 className="text-3xl font-heading font-black mb-2">
                        Who are we roasting?
                    </h1>
                    <p className="text-gray-600 mb-8">
                        We need a photo to generate the illustrations.
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

                        <div>
                            <label className="block text-sm font-bold mb-2">
                                Upload their photo
                            </label>

                            {/* Hidden file input — always present so handleChangePhoto can trigger it */}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                id="image-upload"
                            />

                            {showCropUI ? (
                                /* ── Inline crop UI ── */
                                <div className="space-y-3">
                                    {/* Crop area */}
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

                                    {/* Actions */}
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
                                /* ── Upload picker / preview ── */
                                <label
                                    htmlFor="image-upload"
                                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors relative overflow-hidden group"
                                >
                                    {imagePreview ? (
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
                            )}
                        </div>

                        {/* Continue button — only shown after crop is committed */}
                        {!showCropUI && (
                            <Button
                                onClick={handleUpload}
                                disabled={!victimName || !imageFile || loading}
                                className="w-full text-lg py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all mt-4"
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent mr-2" />
                                        Analyzing photo...
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
