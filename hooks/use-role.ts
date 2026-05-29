'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role } from '@/types';

interface RoleState {
  role: Role;
  setRole: (role: Role) => void;
  // For speaker simulation - track which speaker email we're "logged in as"
  speakerEmail: string | null;
  setSpeakerEmail: (email: string | null) => void;
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      role: 'player',
      setRole: (role) => set({ role }),
      speakerEmail: null,
      setSpeakerEmail: (speakerEmail) => set({ speakerEmail }),
    }),
    {
      name: 'devcon-comm-role-storage',
    }
  )
);

// Convenience hook
export function useRole() {
  return useRoleStore((state) => state.role);
}

export function useSpeakerEmail() {
  return useRoleStore((state) => state.speakerEmail);
}
