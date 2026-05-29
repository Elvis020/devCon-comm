import Link from 'next/link';
import { Event, Talk } from '@/types';
import { getEventTags } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  talkCount?: number;
  talks?: Talk[];
  featured?: boolean;
}

export function EventCard({ event, talkCount = 0, talks = [], featured = false }: EventCardProps) {
  // Format date in editorial style
  const eventDate = new Date(event.event_date);
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
  const day = eventDate.getDate();
  const year = eventDate.getFullYear();

  // Get 2-4 unique tags from talks
  const tags = getEventTags(talks);

  if (featured) {
    return (
      <Link
        href={`/archive/${event.id}`}
        className="block group mb-10 pb-10 border-b border-dc-yellow/10 hover:border-dc-yellow/20 transition-all duration-200"
      >
        <article>
          {/* Date */}
          <time className="block text-dc-yellow font-mono text-sm font-bold mb-4">
            {month} {day}, {year}
          </time>

          {/* Topics only */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <div key={tag} className="px-2.5 py-1.5 bg-dc-yellow/10 border border-dc-yellow/20 rounded-sm group-hover:bg-dc-yellow/15 transition-colors">
                  <span className="text-dc-yellow font-mono text-xs font-bold uppercase tracking-wider">
                    {tag}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </Link>
    );
  }

  return (
    <Link
      href={`/archive/${event.id}`}
      className="block group py-6 border-b border-dc-yellow/[0.08] hover:border-dc-yellow/20 transition-all duration-200"
    >
      <article className="grid md:grid-cols-[120px_1fr] gap-6">
        {/* Date */}
        <time className="text-dc-yellow font-mono text-sm font-bold">
          {month} {day}, {year}
        </time>

        {/* Topics */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <div key={tag} className="px-2.5 py-1.5 bg-dc-yellow/5 border border-dc-yellow/10 rounded-sm group-hover:bg-dc-yellow/10 group-hover:border-dc-yellow/20 transition-colors">
                <span className="text-dc-yellow font-mono text-xs font-bold uppercase tracking-wider">
                  {tag}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}
