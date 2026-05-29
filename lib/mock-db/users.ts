import { readData, writeData } from './index';
import { User } from '@/types';
import { generateId, now } from '@/lib/utils';

const FILE = 'users';

export async function getAllUsers(): Promise<User[]> {
  return readData<User>(FILE);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const users = await readData<User>(FILE);
  return users.find(u => u.id === id);
}

export async function getUserByDeviceId(deviceId: string): Promise<User | undefined> {
  const users = await readData<User>(FILE);
  return users.find(u => u.device_id === deviceId);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const users = await readData<User>(FILE);
  return users.find(u => u.email === email);
}

export async function createUser(
  data: Partial<Omit<User, 'id' | 'created_at' | 'total_points' | 'events_participated' | 'is_claimed' | 'is_admin' | 'merged_into_user_id'>>
): Promise<User> {
  const users = await readData<User>(FILE);
  const newUser: User = {
    device_id: null,
    nickname: null,
    username: null,
    email: null,
    secret_question: null,
    secret_answer_hash: null,
    is_claimed: false,
    is_admin: false,
    merged_into_user_id: null,
    total_points: 0,
    events_participated: 0,
    ...data,
    id: generateId(),
    created_at: now(),
  };
  users.push(newUser);
  await writeData(FILE, users);
  return newUser;
}

export async function updateUser(
  id: string,
  updates: Partial<Omit<User, 'id' | 'created_at'>>
): Promise<User> {
  const users = await readData<User>(FILE);
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    throw new Error(`User ${id} not found`);
  }

  users[index] = {
    ...users[index],
    ...updates,
  };

  await writeData(FILE, users);
  return users[index];
}

export async function deleteUser(id: string): Promise<void> {
  const users = await readData<User>(FILE);
  const filtered = users.filter(u => u.id !== id);
  await writeData(FILE, filtered);
}
