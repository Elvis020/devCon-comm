'use client';

import { useEffect, useState } from 'react';
import { Talk } from '@/types';
import { TalkReviewCard } from '@/components/admin/talk-review-card';
import Link from 'next/link';

export default function TalksManagementPage({ params }: { params: { eventId: string } }) {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTalks();
  }, [params.eventId]);

  const fetchTalks = async () => {
    const response = await fetch(`/api/events/${params.eventId}`);
    if (response.ok) {
      const data = await response.json();
      setTalks(data.talks || []);
    }
    setLoading(false);
  };

  const handleStatusChange = async (talkId: string, status: string) => {
    const response = await fetch(`/api/talks/${talkId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      fetchTalks();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-white font-mono">LOADING...</p>
      </div>
    );
  }

  const submittedTalks = talks.filter(t => t.status === 'submitted');
  const acceptedTalks = talks.filter(t => t.status === 'accepted' || t.status === 'slides_received');
  const publishedTalks = talks.filter(t => t.status === 'published');
  const rejectedTalks = talks.filter(t => t.status === 'rejected');

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

      <h1 className="text-3xl font-bold text-white mb-6 font-mono flex items-center gap-3">
        <span className="text-dc-yellow">$</span> TALK_MANAGEMENT
      </h1>

      {submittedTalks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 font-mono flex items-center gap-3">
            <span className="text-dc-yellow">></span> PENDING_REVIEW
            <span className="text-dc-gray text-base">({submittedTalks.length})</span>
          </h2>
          <div className="space-y-4">
            {submittedTalks.map(talk => (
              <TalkReviewCard key={talk.id} talk={talk} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </div>
      )}

      {acceptedTalks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 font-mono flex items-center gap-3">
            <span className="text-green-400">></span> ACCEPTED_TALKS
            <span className="text-dc-gray text-base">({acceptedTalks.length})</span>
          </h2>
          <div className="space-y-4">
            {acceptedTalks.map(talk => (
              <TalkReviewCard key={talk.id} talk={talk} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </div>
      )}

      {publishedTalks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 font-mono flex items-center gap-3">
            <span className="text-purple-400">></span> PUBLISHED
            <span className="text-dc-gray text-base">({publishedTalks.length})</span>
          </h2>
          <div className="space-y-4">
            {publishedTalks.map(talk => (
              <TalkReviewCard key={talk.id} talk={talk} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </div>
      )}

      {rejectedTalks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 font-mono flex items-center gap-3">
            <span className="text-red-400">></span> REJECTED
            <span className="text-dc-gray text-base">({rejectedTalks.length})</span>
          </h2>
          <div className="space-y-4">
            {rejectedTalks.map(talk => (
              <TalkReviewCard key={talk.id} talk={talk} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </div>
      )}

      {talks.length === 0 && (
        <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-dc-gray font-mono">No talk submissions yet</p>
        </div>
      )}
    </div>
  );
}
