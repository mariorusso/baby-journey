import { getDb } from "@/app/db/index";
import { moments } from "@/app/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

// Force Next.js to always fetch fresh data when this page loads
export const dynamic = "force-dynamic";

export default async function TimelinePage() {
    const db = getDb();
    // Fetch data directly from your New York Postgres Database
    const allMoments = await db.select().from(moments).orderBy(desc(moments.createdAt));

    // Your Cloudflare public URL
    const R2_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-sm px-4 py-4 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Baby Journey</h1>
                    <Link
                        href="/upload"
                        className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition"
                    >
                        + Add Photo
                    </Link>
                </div>
            </nav>

            {/* Timeline Feed */}
            <main className="max-w-2xl mx-auto px-4 mt-8 space-y-8">
                {allMoments.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                        <p>No moments yet! Go add your first photo.</p>
                    </div>
                ) : (
                    allMoments.map((moment) => (
                        <article key={moment.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Image */}
                            {moment.r2Key && (
                                <div className="w-full bg-gray-100">
                                    <img
                                        src={`${R2_URL}/${moment.r2Key}`}
                                        alt={moment.caption || "A special moment"}
                                        className="w-full h-auto object-cover max-h-[600px]"
                                        loading="lazy"
                                    />
                                </div>
                            )}

                            {/* Caption & Date */}
                            <div className="p-4">
                                <p className="text-gray-800 text-base">{moment.caption}</p>
                                <p className="text-gray-400 text-xs mt-2 uppercase tracking-wide">
                                    {moment.createdAt?.toLocaleDateString('en-US', {
                                        month: 'long', day: 'numeric', year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </article>
                    ))
                )}
            </main>
        </div>
    );
}