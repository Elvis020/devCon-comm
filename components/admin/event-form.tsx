'use client';

import { useState } from 'react';
import { Event } from '@/types';

interface EventFormProps {
  event?: Event;
  onSubmit: (data: { name: string; description: string; event_date: string }) => Promise<void>;
  onCancel?: () => void;
}

export function EventForm({ event, onSubmit, onCancel }: EventFormProps) {
  const [name, setName] = useState(event?.name || '');
  const [description, setDescription] = useState(event?.description || '');
  const [eventDate, setEventDate] = useState(
    event?.event_date ? event.event_date.split('T')[0] : ''
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        name,
        description,
        event_date: new Date(eventDate).toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-xs font-mono font-bold text-dc-yellow mb-2 uppercase">
          Event Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-dc-dark-2 border-2 border-dc-dark-3 text-white px-4 py-3 font-mono focus:border-dc-yellow focus:outline-none transition-colors"
          placeholder="DevCongress 2026"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-xs font-mono font-bold text-dc-yellow mb-2 uppercase">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full bg-dc-dark-2 border-2 border-dc-dark-3 text-white px-4 py-3 font-mono focus:border-dc-yellow focus:outline-none transition-colors resize-none"
          placeholder="Annual developer conference focused on..."
        />
      </div>

      <div>
        <label htmlFor="event_date" className="block text-xs font-mono font-bold text-dc-yellow mb-2 uppercase">
          Event Date
        </label>
        <input
          type="date"
          id="event_date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
          className="w-full bg-dc-dark-2 border-2 border-dc-dark-3 text-white px-4 py-3 font-mono focus:border-dc-yellow focus:outline-none transition-colors"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-dc-yellow text-dc-dark px-6 py-3 font-bold font-mono hover:shadow-glow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
        >
          {loading ? 'SAVING...' : event ? 'UPDATE EVENT' : 'CREATE EVENT'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-dc-dark-2 border-2 border-dc-dark-3 text-white px-6 py-3 font-bold font-mono hover:border-dc-yellow/30 transition-colors uppercase tracking-wide"
          >
            CANCEL
          </button>
        )}
      </div>
    </form>
  );
}
