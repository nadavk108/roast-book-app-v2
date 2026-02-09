import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Trash2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: { q?: string };
}) {
    // Get current user
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    console.log('[DASHBOARD] 🔍 User check:', user ? `✅ Authenticated as ${user.email}` : '❌ No user found');

    // Redirect to login if not authenticated
    if (!user) {
        console.log('[DASHBOARD] ↪️  Redirecting to login - no authenticated user');
        redirect('/login?redirect=/dashboard');
    }

    console.log('[DASHBOARD] ✅ Loading dashboard for:', user.email);

    const query = searchParams.q || '';

    // Fetch books - try to filter by user_id if column exists
    let queryBuilder = supabaseAdmin
        .from('roast_books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (query) {
        queryBuilder = queryBuilder.ilike('victim_name', `%${query}%`);
    }

    let { data: books, error } = await queryBuilder;

    // If error is about missing user_id column, fetch all books instead
    if (error?.code === '42703' && error?.message?.includes('user_id')) {
        console.warn('⚠️ user_id column does not exist. Fetching all books. Please run the database migration from supabase/migrations/add_user_tracking.sql');

        // Retry without user_id filter
        let retryBuilder = supabaseAdmin
            .from('roast_books')
            .select('*')
            .order('created_at', { ascending: false });

        if (query) {
            retryBuilder = retryBuilder.ilike('victim_name', `%${query}%`);
        }

        const { data: allBooks, error: retryError } = await retryBuilder;

        if (retryError) {
            console.error('Error fetching books:', retryError);
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
                    <div className="bg-card border-3 border-foreground rounded-2xl p-8 max-w-md text-center shadow-brutal">
                        <h1 className="font-heading text-2xl font-black mb-4">Error Loading Dashboard</h1>
                        <p className="text-muted-foreground mb-4">
                            Unable to load your roast books. Please try refreshing the page.
                        </p>
                        <Link href="/">
                            <Button>Go Home</Button>
                        </Link>
                    </div>
                </div>
            );
        }

        books = allBooks;
        error = null;
    }

    if (error) {
        console.error('Error fetching books:', error);
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
                <div className="bg-card border-3 border-foreground rounded-2xl p-8 max-w-md text-center shadow-brutal">
                    <h1 className="font-heading text-2xl font-black mb-4">Error Loading Dashboard</h1>
                    <p className="text-muted-foreground mb-4">
                        Unable to load your roast books. Please try refreshing the page.
                    </p>
                    <Link href="/">
                        <Button>Go Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    async function deleteBook(formData: FormData) {
        'use server';
        const bookId = formData.get('bookId') as string;
        if (!bookId) return;

        await supabaseAdmin.from('roast_books').delete().eq('id', bookId);
        redirect('/dashboard');
    }

    async function createNewBook() {
        'use server';
        redirect('/create');
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 bg-background">
                <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-heading font-black flex items-center gap-2">
                            Your Roast Books <span className="text-2xl">🔥</span>
                        </h1>
                        <p className="text-gray-600">
                            Manage your projects and start new roasts
                        </p>
                    </div>
                    <form action={createNewBook}>
                        <Button size="lg" className="w-full md:w-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                            <Plus className="w-5 h-5 mr-2" />
                            New Roast Book
                        </Button>
                    </form>
                </div>

                {/* Search */}
                <div className="mb-8 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <form>
                        <input
                            name="q"
                            defaultValue={query}
                            placeholder="Search projects..."
                            className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-yellow-400 text-lg transition-all"
                        />
                    </form>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {books?.map((book) => (
                        <div
                            key={book.id}
                            className="bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all relative group"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                {/* Thumbnail */}
                                <div className="w-16 h-16 rounded-xl border-2 border-black overflow-hidden bg-gray-100 flex-shrink-0">
                                    {book.victim_image_url ? (
                                        <img
                                            src={book.victim_image_url}
                                            alt={book.victim_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border border-black ${book.status === 'complete' ? 'bg-green-400' :
                                            book.status === 'paid' ? 'bg-yellow-400' :
                                                'bg-gray-200'
                                            }`}>
                                            {book.status === 'complete' ? 'Ready' : 'Active'}
                                        </span>
                                    </div>
                                    <h3 className="font-heading font-bold text-lg truncate mb-1">
                                        Things {book.victim_name} Would Never Say
                                    </h3>
                                    <p className="text-sm text-gray-500 truncate">
                                        Roasting: <span className="font-semibold text-black">{book.victim_name}</span>
                                    </p>
                                </div>

                                {/* Delete */}
                                <form action={deleteBook} className="relative z-20">
                                    <input type="hidden" name="bookId" value={book.id} />
                                    <button
                                        type="submit"
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        title="Delete project"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between text-sm text-gray-500 border-t-2 border-gray-100 pt-3 mt-2">
                                <div className="flex items-center gap-1">
                                    <span className="w-4 h-4 rounded-full border border-black flex items-center justify-center text-[10px] font-bold bg-white">
                                        {book.quotes?.length || 0}
                                    </span>
                                    quotes
                                </div>
                                <span>
                                    {formatDistanceToNow(new Date(book.created_at), { addSuffix: true })}
                                </span>
                            </div>

                            {/* Link Overlay */}
                            <Link
                                href={book.status === 'complete' || book.status === 'preview_ready'
                                    ? `/preview/${book.id}`
                                    : `/create/${book.id}/quotes`}
                                className="absolute inset-0 z-10"
                                aria-label="View project"
                            >
                                <span className="sr-only">View project</span>
                            </Link>
                        </div>
                    ))}

                    {books?.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-300 rounded-xl">
                            <p className="text-gray-500 text-lg mb-4">No roast books yet</p>
                            <form action={createNewBook}>
                                <Button className="bg-white border-2 border-black text-black hover:bg-gray-50">Create your first one</Button>
                            </form>
                        </div>
                    )}
                </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
