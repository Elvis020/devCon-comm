'use client';

import { useState } from 'react';
import { EventCard } from '@/components/archive/event-card';
import type { Event, Talk } from '@/types';

interface ArchiveContentProps {
  eventsByYear: Record<number, Event[]>;
  eventsByYearAndMonth: Record<number, Record<number, Event[]>>;
  talkCounts: Record<string, number>;
  talksByEvent: Record<string, Talk[]>;
  years: number[];
}

export function ArchiveContent({ eventsByYear, eventsByYearAndMonth, talkCounts, talksByEvent, years }: ArchiveContentProps) {
  const [selectedYear, setSelectedYear] = useState<number>(years[0]); // Default to most recent year

  const selectedYearEvents = eventsByYear[selectedYear];

  return (
    <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
      {/* Refined Year Navigation */}
      <aside className="lg:w-56 lg:sticky lg:top-24 lg:self-start">
        {/* Mobile: Minimal horizontal scroll */}
        <div className="lg:hidden flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {years.map(year => {
            const yearEvents = eventsByYear[year];
            const totalTalks = yearEvents.reduce((sum, event) => sum + (talkCounts[event.id] || 0), 0);
            const isActive = selectedYear === year;
            return (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`flex-shrink-0 px-5 py-3 font-mono text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-dc-yellow text-dc-dark'
                    : 'border border-dc-yellow/20 text-dc-gray hover:border-dc-yellow/40 hover:text-white'
                }`}
              >
                {year}
              </button>
            );
          })}
        </div>

        {/* Desktop: Clean vertical list */}
        <nav className="hidden lg:block">
          <div className="mb-8">
            <div className="text-dc-yellow/40 font-mono text-[10px] font-bold uppercase tracking-[0.15em] mb-6">
              Years
            </div>
            <ul className="space-y-0.5">
              {years.map(year => {
                const yearEvents = eventsByYear[year];
                const totalTalks = yearEvents.reduce((sum, event) => sum + (talkCounts[event.id] || 0), 0);
                const isActive = selectedYear === year;

                return (
                  <li key={year}>
                    <button
                      onClick={() => setSelectedYear(year)}
                      className={`w-full text-left py-3 px-4 transition-all duration-200 group relative ${
                        isActive
                          ? 'text-dc-yellow'
                          : 'text-dc-gray hover:text-white'
                      }`}
                    >
                      {/* Subtle active indicator */}
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 transition-all duration-200 ${
                        isActive ? 'bg-dc-yellow' : 'bg-transparent'
                      }`} />

                      <div className="flex items-baseline justify-between gap-3 mb-1.5">
                        <span className="font-mono text-2xl font-bold tracking-tight">{year}</span>
                      </div>
                      <div className="font-mono text-[11px] text-dc-gray/60 tracking-wide">
                        {yearEvents.length} event{yearEvents.length !== 1 ? 's' : ''}
                        {totalTalks > 0 && (
                          <>
                            <span className="mx-1.5 text-dc-yellow/20">·</span>
                            {totalTalks} talk{totalTalks !== 1 ? 's' : ''}
                          </>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </aside>

      {/* Main Content - Refined event listing */}
      <main className="flex-1 min-w-0">
        {/* Minimal Year Header */}
        <header className="mb-12 lg:mb-16">
          <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none mb-4">
            {selectedYear}
          </h2>
          <div className="h-px bg-dc-yellow/10" />
        </header>

        {/* Simple Event List */}
        <div>
          {selectedYearEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-dc-gray font-mono">No events for {selectedYear}</p>
            </div>
          ) : (
            <div className="space-y-0">
              {selectedYearEvents.map((event, idx) => (
                <EventCard
                  key={event.id}
                  event={event}
                  talkCount={talkCounts[event.id] || 0}
                  talks={talksByEvent[event.id] || []}
                  featured={idx === 0}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
