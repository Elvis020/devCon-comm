export function getDeviceId(): string {
  const key = 'devcon-comm-device-id';
  const existing = localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}
