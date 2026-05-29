import { readData, writeData } from './index';
import { EventSpeaker } from '@/types';
import { generateId, now } from '@/lib/utils';

const FILE = 'speakers';

export async function getAllSpeakers(): Promise<EventSpeaker[]> {
  return readData<EventSpeaker>(FILE);
}

export async function getSpeakerById(id: string): Promise<EventSpeaker | undefined> {
  const speakers = await readData<EventSpeaker>(FILE);
  return speakers.find(s => s.id === id);
}

export async function getSpeakersByEvent(eventId: string): Promise<EventSpeaker[]> {
  const speakers = await readData<EventSpeaker>(FILE);
  return speakers.filter(s => s.event_id === eventId);
}

export async function getSpeakerByEmail(eventId: string, email: string): Promise<EventSpeaker | undefined> {
  const speakers = await readData<EventSpeaker>(FILE);
  return speakers.find(s => s.event_id === eventId && s.email.toLowerCase() === email.toLowerCase());
}

export async function addSpeaker(
  data: Omit<EventSpeaker, 'id' | 'added_at'>
): Promise<EventSpeaker> {
  const speakers = await readData<EventSpeaker>(FILE);

  // Check if speaker already exists for this event
  const existing = await getSpeakerByEmail(data.event_id, data.email);
  if (existing) {
    throw new Error('Speaker with this email already exists for this event');
  }

  const newSpeaker: EventSpeaker = {
    ...data,
    id: generateId(),
    added_at: now(),
  };

  speakers.push(newSpeaker);
  await writeData(FILE, speakers);
  return newSpeaker;
}

export async function removeSpeaker(id: string): Promise<void> {
  const speakers = await readData<EventSpeaker>(FILE);
  const filtered = speakers.filter(s => s.id !== id);

  if (filtered.length === speakers.length) {
    throw new Error(`Speaker ${id} not found`);
  }

  await writeData(FILE, filtered);
}
