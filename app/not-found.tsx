import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="h-screen overflow-hidden bg-dc-dark flex items-center justify-center px-4">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(249, 225, 94, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249, 225, 94, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative text-center max-w-2xl">
        {/* Large 404 */}
        <div className="mb-8">
          <h1 className="text-9xl sm:text-[12rem] font-black text-dc-yellow/20 leading-none select-none">
            404
          </h1>
        </div>

        {/* Error Message */}
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Page Not <span className="text-dc-yellow">Found</span>
          </h2>
          <p className="text-dc-gray-light text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-dc-yellow text-dc-dark px-8 py-4 font-bold hover:shadow-glow transition-all uppercase tracking-wide text-center"
          >
            ← Back to Home
          </Link>
          <Link
            href="/archive"
            className="bg-dc-dark-1 border-2 border-dc-yellow text-dc-yellow px-8 py-4 font-bold hover:shadow-glow-sm transition-all uppercase tracking-wide text-center"
          >
            Browse Archive
          </Link>
        </div>
      </div>
    </div>
  );
}
