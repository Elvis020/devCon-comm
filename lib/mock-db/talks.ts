import { readData, writeData } from './index';
import { Talk, TalkStatus } from '@/types';
import { generateId, now } from '@/lib/utils';

const FILE = 'talks';

export async function getAllTalks(): Promise<Talk[]> {
  return readData<Talk>(FILE);
}

export async function getTalkById(id: string): Promise<Talk | undefined> {
  const talks = await readData<Talk>(FILE);
  return talks.find(t => t.id === id);
}

export async function getTalksByEvent(eventId: string): Promise<Talk[]> {
  const talks = await readData<Talk>(FILE);
  return talks.filter(t => t.event_id === eventId);
}

export async function getTalksBySpeaker(email: string): Promise<Talk[]> {
  const talks = await readData<Talk>(FILE);
  return talks.filter(t => t.speaker_email === email);
}

export async function createTalk(
  data: Omit<Talk, 'id' | 'created_at' | 'updated_at' | 'status' | 'reminder_sent_count' | 'last_reminder_sent_at'>
): Promise<Talk> {
  const talks = await readData<Talk>(FILE);
  const newTalk: Talk = {
    ...data,
    id: generateId(),
    status: 'submitted',
    reminder_sent_count: 0,
    last_reminder_sent_at: null,
    created_at: now(),
    updated_at: now(),
  };
  talks.push(newTalk);
  await writeData(FILE, talks);
  return newTalk;
}

export async function updateTalk(
  id: string,
  updates: Partial<Omit<Talk, 'id' | 'created_at'>>
): Promise<Talk> {
  const talks = await readData<Talk>(FILE);
  const index = talks.findIndex(t => t.id === id);

  if (index === -1) {
    throw new Error(`Talk ${id} not found`);
  }

  talks[index] = {
    ...talks[index],
    ...updates,
    updated_at: now(),
  };

  await writeData(FILE, talks);
  return talks[index];
}

export async function deleteTalk(id: string): Promise<void> {
  const talks = await readData<Talk>(FILE);
  const filtered = talks.filter(t => t.id !== id);
  await writeData(FILE, filtered);
}
