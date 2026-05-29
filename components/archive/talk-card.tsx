import { Talk } from '@/types';
import { getSlidesViewUrl } from '@/lib/utils';
import { SpeakerAvatar } from '@/components/ui/speaker-avatar';

interface TalkCardProps {
  talk: Talk;
}

export function TalkCard({ talk }: TalkCardProps) {
  const slidesUrl = getSlidesViewUrl(talk);

  return (
    <div className="bg-dc-dark-1 border-2 border-dc-dark-3 hover:border-dc-yellow/30 transition-colors overflow-hidden group">
      {/* Header section */}
      <div className="border-b-2 border-dc-dark-3 p-6 pb-5">
        <h3 className="text-xl font-bold text-white mb-4 font-mono text-balance leading-tight">
          {talk.title}
        </h3>

        {/* Speaker info */}
        <div className="flex items-center gap-4">
          <SpeakerAvatar
            name={talk.speaker_name}
            email={talk.speaker_email}
            githubUsername={talk.github_username}
            size={56}
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-dc-yellow font-mono text-sm font-bold truncate">
              {talk.speaker_name}
            </p>
            {talk.bio && (
              <p className="text-white/50 text-xs font-mono mt-1 truncate">
                {talk.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content section */}
      {talk.abstract && (
        <div className="p-6 border-b-2 border-dc-dark-3">
          <p className="text-white/80 text-sm text-pretty leading-relaxed">
            {talk.abstract}
          </p>
        </div>
      )}

      {/* Action section */}
      {slidesUrl && (
        <div className="p-6 bg-dc-dark-2/30">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <a
              href={slidesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-dc-yellow text-dc-dark font-mono font-bold hover:shadow-glow transition-shadow uppercase tracking-wide"
            >
              <span>View Slides</span>
              <span>→</span>
            </a>
            <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-green-400/20 bg-green-900/10">
              <span className="text-green-400 font-mono text-sm">✓</span>
              <span className="text-green-400 font-mono text-xs uppercase tracking-wide">Available</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
