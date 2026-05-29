import { getAllEvents } from '@/lib/mock-db/events';
import { getAllTalks } from '@/lib/mock-db/talks';
import { ArchiveContent } from '@/components/archive/archive-content';

export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
  const allEvents = await getAllEvents();
  const allTalks = await getAllTalks();

  const completedEvents = allEvents.filter(e => e.status === 'completed');
  completedEvents.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  // Talk counts and talks by event
  const talkCounts = completedEvents.reduce((acc, event) => {
    acc[event.id] = allTalks.filter(
      t => t.event_id === event.id && t.status === 'published'
    ).length;
    return acc;
  }, {} as Record<string, number>);

  const talksByEvent = completedEvents.reduce((acc, event) => {
    acc[event.id] = allTalks.filter(
      t => t.event_id === event.id && t.status === 'published'
    );
    return acc;
  }, {} as Record<string, typeof allTalks>);

  // Group events by year and month
  const eventsByYear = completedEvents.reduce((acc, event) => {
    const year = new Date(event.event_date).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(event);
    return acc;
  }, {} as Record<number, typeof completedEvents>);

  // Also create month groupings for display
  const eventsByYearAndMonth = completedEvents.reduce((acc, event) => {
    const eventDate = new Date(event.event_date);
    const year = eventDate.getFullYear();
    const month = eventDate.getMonth(); // 0-11

    if (!acc[year]) {
      acc[year] = {};
    }
    if (!acc[year][month]) {
      acc[year][month] = [];
    }
    acc[year][month].push(event);
    return acc;
  }, {} as Record<number, Record<number, typeof completedEvents>>);

  const years = Object.keys(eventsByYear)
    .map(Number)
    .sort((a, b) => b - a); // Most recent year first

  return (
    <div className="min-h-screen bg-dc-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        {/* Refined header with better spacing and typography */}
        <div className="mb-16 lg:mb-20 border-b border-dc-yellow/10 pb-8">
          <div className="flex items-start justify-between gap-8 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">
                Event Archive
              </h1>
              <p className="text-dc-gray-light text-base sm:text-lg leading-relaxed max-w-2xl">
                Browse past events and view presentation slides
              </p>
            </div>
            {completedEvents.length > 0 && (
              <div className="hidden sm:flex flex-col items-end gap-1 font-mono text-xs uppercase tracking-wider">
                <div className="text-dc-yellow font-bold">{completedEvents.length}</div>
                <div className="text-dc-gray/60">Events</div>
              </div>
            )}
          </div>
        </div>

        {completedEvents.length === 0 ? (
          <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-12 text-center">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-dc-gray font-mono">No completed events yet. Check back soon!</p>
          </div>
        ) : (
          <ArchiveContent
            eventsByYear={eventsByYear}
            eventsByYearAndMonth={eventsByYearAndMonth}
            talkCounts={talkCounts}
            talksByEvent={talksByEvent}
            years={years}
          />
        )}
      </div>
    </div>
  );
}
