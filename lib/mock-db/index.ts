import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Serializes writes inside this process; file-level atomic rename handles partial-write safety.
const writeQueues: Map<string, Promise<void>> = new Map();

async function enqueueWrite<T>(filename: string, fn: () => Promise<T>): Promise<T> {
  const queue = writeQueues.get(filename) || Promise.resolve();

  const nextPromise = queue.then(fn, fn);
  writeQueues.set(filename, nextPromise.then(() => {}, () => {}));

  return nextPromise;
}

export async function readData<T>(filename: string): Promise<T[]> {
  const filePath = path.join(DATA_DIR, `${filename}.json`);

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error(`Data file ${filePath} must contain a JSON array`);
    }

    return parsed as T[];
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return [];
    }

    throw error instanceof Error
      ? new Error(`Unable to read data file ${filePath}: ${error.message}`)
      : new Error(`Unable to read data file ${filePath}`);
  }
}

export async function writeData<T>(filename: string, data: T[]): Promise<void> {
  return enqueueWrite(filename, async () => {
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    const tempPath = `${filePath}.${Date.now()}-${Math.random().toString(16).slice(2)}.tmp`;

    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempPath, filePath);
  });
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
