import { getEventById } from '@/lib/mock-db/events';
import { getTalksByEvent } from '@/lib/mock-db/talks';
import { TalkCard } from '@/components/archive/talk-card';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EventArchivePage({ params }: { params: { eventId: string } }) {
  const event = await getEventById(params.eventId);

  if (!event) {
    return (
      <div className="min-h-screen bg-dc-dark flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-white font-mono">EVENT NOT FOUND</p>
          <Link
            href="/archive"
            className="inline-block mt-6 text-dc-yellow hover:text-dc-yellow-glow font-mono"
          >
            ← BACK TO ARCHIVE
          </Link>
        </div>
      </div>
    );
  }

  const talks = await getTalksByEvent(params.eventId);
  const publishedTalks = talks.filter(t => t.status === 'published');

  return (
    <div className="min-h-screen bg-dc-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/archive"
          className="inline-flex items-center gap-2 text-dc-yellow hover:text-dc-yellow-glow font-mono mb-8 transition-colors"
        >
          <span>←</span> BACK TO ARCHIVE
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 font-mono">
            {event.name}
          </h1>
          <p className="text-dc-gray-light font-mono mb-4">
            <span className="text-dc-yellow">@</span> {formatDate(event.event_date)}
          </p>
          {event.description && (
            <p className="text-white/80 text-lg max-w-3xl">{event.description}</p>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white font-mono flex items-center gap-3">
            <span className="text-dc-yellow">$</span> PRESENTATIONS
            <span className="text-dc-gray text-lg">({publishedTalks.length})</span>
          </h2>
        </div>

        {publishedTalks.length === 0 ? (
          <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-12 text-center">
            <div className="text-6xl mb-4">📹</div>
            <p className="text-dc-gray font-mono">No presentations published yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {publishedTalks.map(talk => (
              <TalkCard key={talk.id} talk={talk} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
