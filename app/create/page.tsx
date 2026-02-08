'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { captureEvent, Events } from '@/lib/posthog';

export default function UploadPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [victimName, setVictimName] = useState('');
    const [victimGender, setVictimGender] = useState<'male' | 'female' | 'neutral'>('neutral');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!victimName || !imageFile) {
            alert('Please enter a name and upload a photo');
            return;
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (imageFile.size > maxSize) {
            alert('Image is too large. Please upload an image smaller than 10MB.');
            return;
        }

        // Track book creation started
        captureEvent(Events.BOOK_CREATION_STARTED, {
            victim_name: victimName,
        });

        setLoading(true);
        console.log('Starting upload...', { victimName, fileSize: imageFile.size });

        try {
            // Upload image with timeout
            const formData = new FormData();
            formData.append('victimName', victimName);
            formData.append('victimGender', victimGender);
            formData.append('image', imageFile);

            console.log('Sending request to /api/upload...');

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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

            // CRITICAL: Wait for analysis to complete before redirecting
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
            // Redirect to quotes page after analysis completes
            router.push(`/create/${bookId}/quotes`);
        } catch (error: any) {
            console.error('Upload error:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);

            let errorMessage = 'Failed to upload. Please try again.';

            if (error.name === 'AbortError') {
                errorMessage = 'Upload timed out. Please check your internet connection and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            // Show detailed error to user
            alert(`Error: ${errorMessage}\n\nDebug info:\n- File size: ${(imageFile.size / 1024 / 1024).toFixed(2)}MB\n- Name: ${victimName}\n\nPlease try again or contact support.`);

            // If unauthorized, redirect to login
            if (errorMessage.includes('Unauthorized') || errorMessage.includes('sign in')) {
                router.push('/login?redirect=/create');
            }
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
                <span className="ml-4 font-bold whitespace-nowrap">Step 1/5</span>
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
                                Gender (for Hebrew books)
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
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="image-upload"
                                />
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
                            </div>
                        </div>

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
                    </div>
                </div>
            </main>
        </div>
    );
}
