import Link from 'next/link';
import { getAllEvents } from '@/lib/mock-db/events';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await getAllEvents();
  events.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  const statusColors = {
    draft: 'bg-dc-dark-2 text-dc-gray border border-dc-dark-3',
    cfp_open: 'bg-blue-900/30 text-blue-400 border border-blue-400/30',
    cfp_closed: 'bg-yellow-900/30 text-dc-yellow border border-dc-yellow/30',
    upcoming: 'bg-green-900/30 text-green-400 border border-green-400/30',
    live: 'bg-purple-900/30 text-purple-400 border border-purple-400/30',
    completed: 'bg-dc-dark-2 text-white border border-dc-dark-3',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white font-mono flex items-center gap-3">
          <span className="text-dc-yellow">$</span> EVENT_MANAGEMENT
        </h1>
        <Link
          href="/admin/events/new"
          className="bg-dc-yellow text-dc-dark px-6 py-3 font-bold font-mono hover:shadow-glow transition-shadow uppercase tracking-wide"
        >
          CREATE EVENT
        </Link>
      </div>

      <div className="bg-dc-dark-1 border-2 border-dc-dark-3">
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b-2 border-dc-dark-3 bg-dc-dark-2">
          <div className="col-span-4 font-mono text-xs text-dc-yellow font-bold uppercase">
            Event
          </div>
          <div className="col-span-3 font-mono text-xs text-dc-yellow font-bold uppercase">
            Date
          </div>
          <div className="col-span-3 font-mono text-xs text-dc-yellow font-bold uppercase">
            Status
          </div>
          <div className="col-span-2 font-mono text-xs text-dc-yellow font-bold uppercase text-right">
            Actions
          </div>
        </div>

        {/* Data Rows */}
        <div className="divide-y-2 divide-dc-dark-3">
          {events.map((event) => (
            <div key={event.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-dc-dark-2 transition-colors">
              <div className="col-span-4 flex flex-col justify-center">
                <div className="font-medium text-white font-mono">{event.name}</div>
                {event.description && (
                  <div className="text-sm text-dc-gray-light mt-1 line-clamp-1">{event.description}</div>
                )}
              </div>

              <div className="col-span-3 flex items-center">
                <span className="text-white font-mono text-sm">
                  <span className="text-dc-yellow">@</span> {formatDate(event.event_date)}
                </span>
              </div>

              <div className="col-span-3 flex items-center">
                <span className={`px-2 py-1 text-xs font-mono font-bold uppercase ${statusColors[event.status]}`}>
                  {event.status.replace('_', ' ')}
                </span>
              </div>

              <div className="col-span-2 flex items-center justify-end">
                <Link
                  href={`/admin/events/${event.id}`}
                  className="text-dc-yellow hover:text-dc-yellow-glow font-mono font-bold uppercase text-sm transition-colors"
                >
                  MANAGE →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dc-gray font-mono">No events yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
