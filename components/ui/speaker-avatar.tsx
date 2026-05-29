'use client';

import { useState } from 'react';

interface SpeakerAvatarProps {
  name: string;
  email: string;
  githubUsername?: string | null;
  size?: number;
  className?: string;
}

export function SpeakerAvatar({
  name,
  email,
  githubUsername,
  size = 200,
  className = '',
}: SpeakerAvatarProps) {
  // Build the avatar resolution chain
  const getAvatarUrls = () => {
    const urls: string[] = [];

    // Tier 1: GitHub avatar (if username provided)
    if (githubUsername) {
      urls.push(`https://github.com/${githubUsername}.png?size=${size}`);
    }

    // Tier 2: Unavatar by email (checks 14+ sources)
    urls.push(`https://unavatar.io/${email}`);

    // Tier 3: UI-Avatars initials (guaranteed fallback - never fails)
    const initials = name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    urls.push(
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&size=${size}&background=1a1a2e&color=F9E15E&bold=true`
    );

    return urls;
  };

  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const avatarUrls = getAvatarUrls();
  const currentUrl = avatarUrls[currentUrlIndex];

  const handleError = () => {
    // Move to the next URL in the chain
    if (currentUrlIndex < avatarUrls.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1);
    }
  };

  return (
    <img
      src={currentUrl}
      alt={`${name}'s avatar`}
      onError={handleError}
      className={`rounded-full border-2 border-dc-dark-3 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
