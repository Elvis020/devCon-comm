'use client';

import { Talk } from '@/types';
import { useState } from 'react';
import { getSlidesViewUrl } from '@/lib/utils';
import { SpeakerAvatar } from '@/components/ui/speaker-avatar';

interface TalkReviewCardProps {
  talk: Talk;
  onStatusChange: (talkId: string, status: 'accepted' | 'rejected') => Promise<void>;
}

export function TalkReviewCard({ talk, onStatusChange }: TalkReviewCardProps) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onStatusChange(talk.id, 'accepted');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onStatusChange(talk.id, 'rejected');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    submitted: 'bg-yellow-900/30 text-dc-yellow border border-dc-yellow/30',
    accepted: 'bg-green-900/30 text-green-400 border border-green-400/30',
    rejected: 'bg-red-900/30 text-red-400 border border-red-400/30',
    slides_received: 'bg-blue-900/30 text-blue-400 border border-blue-400/30',
    published: 'bg-purple-900/30 text-purple-400 border border-purple-400/30',
  };

  return (
    <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-6 hover:border-dc-yellow/30 transition-colors group">
      {/* Title row with avatar and status */}
      <div className="flex items-start gap-3 mb-3">
        <SpeakerAvatar
          name={talk.speaker_name}
          email={talk.speaker_email}
          githubUsername={talk.github_username}
          size={40}
          className="flex-shrink-0 mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-bold text-white font-mono text-balance leading-tight">
              {talk.title}
            </h3>
            <span className={`px-3 py-1 text-xs font-mono font-bold uppercase flex-shrink-0 ${statusColors[talk.status]}`}>
              {talk.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-dc-gray-light font-mono">
            <span className="text-dc-yellow">by</span> {talk.speaker_name} <span className="text-dc-gray">·</span> {talk.speaker_email}
          </p>
        </div>
      </div>

      {/* Abstract */}
      {talk.abstract && (
        <p className="text-white/80 text-sm mb-4 leading-relaxed">
          {talk.abstract}
        </p>
      )}

      {/* Bio */}
      {talk.bio && (
        <p className="text-white/70 text-sm mb-4 leading-relaxed">
          <span className="text-dc-yellow font-mono font-bold">Bio:</span> {talk.bio}
        </p>
      )}

      {/* Actions */}
      {talk.status === 'submitted' && (
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="bg-green-900/30 text-green-400 border-2 border-green-400/30 px-6 py-2 font-bold font-mono hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wide"
          >
            {loading ? 'Processing...' : 'Accept'}
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="bg-red-900/30 text-red-400 border-2 border-red-400/30 px-6 py-2 font-bold font-mono hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wide"
          >
            {loading ? 'Processing...' : 'Reject'}
          </button>
        </div>
      )}

      {talk.status === 'accepted' && (
        <div className="flex items-center gap-2 mt-5">
          {talk.slides_uploaded_at ? (
            <>
              <span className="text-green-400 font-mono text-sm">✓</span>
              <span className="text-green-400 font-mono font-bold text-sm uppercase">Slides Uploaded</span>
            </>
          ) : (
            <>
              <span className="text-dc-yellow font-mono text-sm">⚠</span>
              <span className="text-dc-yellow font-mono font-bold text-sm uppercase">Waiting for Slides</span>
            </>
          )}
        </div>
      )}

      {talk.status === 'slides_received' && (
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => onStatusChange(talk.id, 'published' as any)}
            className="bg-purple-900/30 text-purple-400 border-2 border-purple-400/30 px-6 py-2 font-bold font-mono hover:bg-purple-900/50 transition-all uppercase tracking-wide"
          >
            Publish to Archive
          </button>
          {getSlidesViewUrl(talk) && (
            <a
              href={getSlidesViewUrl(talk)!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dc-yellow font-mono text-sm hover:text-dc-yellow-glow transition-colors uppercase"
            >
              View Slides →
            </a>
          )}
        </div>
      )}

      {talk.status === 'published' && getSlidesViewUrl(talk) && (
        <div className="mt-5">
          <a
            href={getSlidesViewUrl(talk)!}
            target="_blank"
            rel="noopener noreferrer"
            className="text-dc-yellow font-mono text-sm hover:text-dc-yellow-glow transition-colors uppercase"
          >
            View Slides →
          </a>
        </div>
      )}
    </div>
  );
}
