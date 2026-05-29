'use client';

import { useEffect, useState } from 'react';
import { EventSpeaker, Event } from '@/types';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';

export default function SpeakersManagementPage({ params }: { params: { eventId: string } }) {
  const { showToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSpeakerEmail, setNewSpeakerEmail] = useState('');
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchEvent();
    fetchSpeakers();
  }, [params.eventId]);

  const fetchEvent = async () => {
    const response = await fetch(`/api/events/${params.eventId}`);
    if (response.ok) {
      const data = await response.json();
      setEvent(data);
    }
  };

  const fetchSpeakers = async () => {
    const response = await fetch(`/api/events/${params.eventId}/speakers`);
    if (response.ok) {
      const data = await response.json();
      setSpeakers(data);
    }
    setLoading(false);
  };

  const handleAddSpeaker = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const response = await fetch(`/api/events/${params.eventId}/speakers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newSpeakerEmail,
          name: newSpeakerName,
        }),
      });

      if (response.ok) {
        showToast('Speaker added successfully', 'success');
        setNewSpeakerEmail('');
        setNewSpeakerName('');
        fetchSpeakers();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to add speaker', 'error');
      }
    } catch (error) {
      showToast('Failed to add speaker', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveSpeaker = async (speakerId: string) => {
    if (!confirm('Are you sure you want to remove this speaker?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/events/${params.eventId}/speakers/${speakerId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        showToast('Speaker removed successfully', 'success');
        fetchSpeakers();
      } else {
        showToast('Failed to remove speaker', 'error');
      }
    } catch (error) {
      showToast('Failed to remove speaker', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-white font-mono">LOADING...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/events/${params.eventId}`}
          className="inline-flex items-center gap-2 text-dc-yellow hover:text-dc-yellow-glow font-mono transition-colors"
        >
          <span>←</span> BACK TO EVENT
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-white mb-2 font-mono">MANAGE SPEAKERS</h1>
      <p className="text-dc-gray-light font-mono mb-8">
        {event?.name || 'Loading...'}
      </p>

      {/* Add Speaker Form */}
      <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 border-l-2 border-b-2 border-dc-yellow/20" />

        <h2 className="text-xl font-bold text-white mb-4 font-mono flex items-center gap-3">
          <span className="text-dc-yellow">+</span> ADD_SPEAKER
        </h2>

        <form onSubmit={handleAddSpeaker} className="space-y-4">
          <div>
            <label className="block text-sm font-mono text-dc-gray-light mb-2">
              EMAIL <span className="text-dc-yellow">*</span>
            </label>
            <input
              type="email"
              value={newSpeakerEmail}
              onChange={(e) => setNewSpeakerEmail(e.target.value)}
              required
              className="w-full bg-dc-dark-2 border-2 border-dc-dark-3 px-4 py-2 text-white font-mono focus:border-dc-yellow focus:outline-none"
              placeholder="speaker@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-mono text-dc-gray-light mb-2">
              NAME <span className="text-dc-yellow">*</span>
            </label>
            <input
              type="text"
              value={newSpeakerName}
              onChange={(e) => setNewSpeakerName(e.target.value)}
              required
              className="w-full bg-dc-dark-2 border-2 border-dc-dark-3 px-4 py-2 text-white font-mono focus:border-dc-yellow focus:outline-none"
              placeholder="Speaker Name"
            />
          </div>

          <button
            type="submit"
            disabled={isAdding}
            className="bg-dc-yellow text-dc-dark px-6 py-2 font-bold font-mono uppercase hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? 'ADDING...' : 'ADD SPEAKER'}
          </button>
        </form>
      </div>

      {/* Speakers List */}
      <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 border-l-2 border-b-2 border-dc-yellow/20" />

        <h2 className="text-xl font-bold text-white mb-4 font-mono flex items-center gap-3">
          <span className="text-dc-yellow">#</span> APPROVED_SPEAKERS
          <span className="text-dc-gray text-sm">({speakers.length})</span>
        </h2>

        {speakers.length === 0 ? (
          <p className="text-dc-gray-light font-mono text-center py-8">
            NO SPEAKERS ADDED YET
          </p>
        ) : (
          <div className="space-y-3">
            {speakers.map((speaker) => (
              <div
                key={speaker.id}
                className="bg-dc-dark-2 border-2 border-dc-dark-3 p-4 flex items-center justify-between group hover:border-dc-yellow/30 transition-colors"
              >
                <div>
                  <p className="text-white font-mono font-bold">{speaker.name}</p>
                  <p className="text-dc-gray-light text-sm font-mono">{speaker.email}</p>
                </div>
                <button
                  onClick={() => handleRemoveSpeaker(speaker.id)}
                  className="px-4 py-2 bg-red-900/50 border-2 border-red-700 text-red-200 font-mono text-sm uppercase hover:bg-red-900 hover:border-red-500 transition-all"
                >
                  REMOVE
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
