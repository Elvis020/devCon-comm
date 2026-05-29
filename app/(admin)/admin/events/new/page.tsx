'use client';

import { EventForm } from '@/components/admin/event-form';
import { useRouter } from 'next/navigation';

export default function NewEventPage() {
  const router = useRouter();

  const handleSubmit = async (data: { name: string; description: string; event_date: string }) => {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const event = await response.json();
      router.push(`/admin/events/${event.id}`);
    } else {
      alert('Failed to create event');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6 font-mono flex items-center gap-3">
        <span className="text-dc-yellow">$</span> CREATE_NEW_EVENT
      </h1>
      <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 border-l-2 border-b-2 border-dc-yellow/20" />
        <EventForm onSubmit={handleSubmit} onCancel={() => router.back()} />
      </div>
    </div>
  );
}
