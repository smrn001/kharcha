export function compareVersions(a: string, b: string): number {
  const cleanA = a.replace(/^v/, '');
  const cleanB = b.replace(/^v/, '');

  const partsA = cleanA.split('.').map((part) => parseInt(part, 10));
  const partsB = cleanB.split('.').map((part) => parseInt(part, 10));

  const length = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < length; i++) {
    const partA = partsA[i] ?? 0;
    const partB = partsB[i] ?? 0;
    if (partA !== partB) {
      return partA < partB ? -1 : 1;
    }
  }
  return 0;
}

export function isNewerThan(candidate: string, current: string): boolean {
  return compareVersions(candidate, current) > 0;
}
