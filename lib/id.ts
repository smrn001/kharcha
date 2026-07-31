let counter = 0;

export function generateId(): string {
  counter = (counter + 1) % 0xffff;
  return `id-${Date.now().toString(36)}-${counter.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
