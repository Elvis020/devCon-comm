import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Simple promise queue to prevent concurrent write corruption
const writeQueues: Map<string, Promise<void>> = new Map();

async function enqueueWrite<T>(filename: string, fn: () => Promise<T>): Promise<T> {
  const queue = writeQueues.get(filename) || Promise.resolve();

  const nextPromise = queue.then(fn, fn);
  writeQueues.set(filename, nextPromise.then(() => {}, () => {}));

  return nextPromise;
}

export async function readData<T>(filename: string): Promise<T[]> {
  try {
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T[];
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return [];
  }
}

export async function writeData<T>(filename: string, data: T[]): Promise<void> {
  return enqueueWrite(filename, async () => {
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  });
}
