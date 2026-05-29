'use client';

import { useState } from 'react';
import { Talk, Event } from '@/types';
import { getSlidesViewUrl } from '@/lib/utils';
import Link from 'next/link';
import { SlideUploadModal } from '@/components/slides/slide-upload-modal';

export default function MyTalksPage() {
  const [email, setEmail] = useState('');
  const [talks, setTalks] = useState<(Talk & { event: Event })[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [uploadModalTalkId, setUploadModalTalkId] = useState<string | null>(null);

  const checkTalks = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/my-talks?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setTalks(data);
        setChecked(true);
      }
    } catch (err) {
      console.error('Failed to fetch talks:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshTalks = async () => {
    const response = await fetch(`/api/my-talks?email=${encodeURIComponent(email)}`);
    if (response.ok) {
      const data = await response.json();
      setTalks(data);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      submitted: { bg: 'bg-dc-dark-2', text: 'text-dc-gray', label: 'PENDING REVIEW' },
      accepted: { bg: 'bg-green-900/30', text: 'text-green-400', label: 'ACCEPTED' },
      rejected: { bg: 'bg-red-900/30', text: 'text-red-400', label: 'REJECTED' },
      slides_received: { bg: 'bg-blue-900/30', text: 'text-blue-400', label: 'SLIDES RECEIVED' },
      published: { bg: 'bg-purple-900/30', text: 'text-purple-400', label: 'PUBLISHED' },
    };
    const badge = badges[status as keyof typeof badges] || badges.submitted;
    return (
      <span className={`px-3 py-1 ${badge.bg} ${badge.text} font-mono text-xs font-bold border border-current`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-dc-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 font-mono flex items-center gap-3">
            <span className="text-dc-yellow">$</span> MY_TALKS
          </h1>
          <p className="text-dc-gray-light font-mono">View and manage your talk submissions</p>
        </div>

        {!checked ? (
          <div className="bg-dc-dark-1 border-2 border-dc-yellow p-8 sm:p-12 max-w-md mx-auto">
            <div className="mb-6 text-center">
              <div className="inline-block px-3 py-1 bg-dc-yellow text-dc-dark font-mono text-xs font-bold mb-4">
                SPEAKER ACCESS
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-mono">
                Check Your Talks
              </h2>
              <p className="text-dc-gray font-mono text-sm">
                Enter the email you used for CFP submissions
              </p>
            </div>

            <form onSubmit={checkTalks} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-dc-yellow font-mono text-xs font-bold mb-2 uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="speaker@example.com"
                  className="w-full bg-dc-dark-2 border-2 border-dc-dark-3 focus:border-dc-yellow text-white font-mono px-4 py-3 outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-dc-yellow text-dc-dark font-bold font-mono text-lg py-4 hover:shadow-glow transition-all disabled:opacity-50 uppercase tracking-wide"
              >
                {loading ? 'CHECKING...' : 'VIEW MY TALKS'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-dc-gray font-mono text-sm">{email}</span>
                <button
                  onClick={() => {
                    setChecked(false);
                    setTalks([]);
                    setEmail('');
                  }}
                  className="text-dc-yellow hover:text-dc-yellow-glow font-mono text-sm"
                >
                  CHANGE EMAIL
                </button>
              </div>
            </div>

            {talks.length === 0 ? (
              <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-dc-gray font-mono">No talk submissions found for this email</p>
                <Link
                  href="/"
                  className="inline-block mt-6 text-dc-yellow hover:text-dc-yellow-glow font-mono text-sm"
                >
                  VIEW EVENTS WITH OPEN CFP →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {talks.map((talk) => (
                  <div key={talk.id} className="bg-dc-dark-1 border-2 border-dc-dark-3 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2 font-mono">
                          {talk.title}
                        </h3>
                        <p className="text-dc-gray-light font-mono text-sm mb-3">
                          {talk.event.name}
                        </p>
                      </div>
                      <div>
                        {getStatusBadge(talk.status)}
                      </div>
                    </div>

                    <p className="text-white/80 text-sm mb-4 line-clamp-2">
                      {talk.abstract}
                    </p>

                    {(talk.status === 'accepted' || talk.status === 'slides_received') && (
                      <div className="mt-4 pt-4 border-t-2 border-dc-dark-3">
                        {getSlidesViewUrl(talk) ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-green-400 text-xl">✓</span>
                              <span className="text-dc-gray-light font-mono text-sm">Slides uploaded</span>
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={getSlidesViewUrl(talk)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-dc-dark-2 text-dc-yellow font-mono text-sm border border-dc-yellow/30 hover:border-dc-yellow"
                              >
                                VIEW
                              </a>
                              <button
                                onClick={() => setUploadModalTalkId(talk.id)}
                                className="px-4 py-2 bg-dc-dark-2 text-white font-mono text-sm border border-dc-dark-3 hover:border-dc-yellow/30"
                              >
                                UPDATE
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setUploadModalTalkId(talk.id)}
                            className="w-full px-6 py-3 bg-dc-yellow text-dc-dark font-bold font-mono hover:shadow-glow transition-shadow uppercase tracking-wide"
                          >
                            UPLOAD SLIDES
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {uploadModalTalkId && (
        <SlideUploadModal
          talkId={uploadModalTalkId}
          onClose={() => setUploadModalTalkId(null)}
          onSuccess={refreshTalks}
        />
      )}
    </div>
  );
}
