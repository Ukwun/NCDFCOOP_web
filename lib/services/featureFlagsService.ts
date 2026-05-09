/**
 * Deterministic feature flag and experiment assignment service.
 *
 * Keeps user assignments stable by hashing userId + experiment key.
 */

export type ExperimentVariant = 'control' | 'treatment';

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getExperimentBucket(userId: string, experimentKey: string): number {
  return hashString(`${experimentKey}:${userId}`) % 100;
}

export function getExperimentVariant(
  userId: string,
  experimentKey: string,
  rolloutPercent: number = 50
): ExperimentVariant {
  if (!userId) return 'control';
  const bucket = getExperimentBucket(userId, experimentKey);
  return bucket < rolloutPercent ? 'treatment' : 'control';
}

export function isFeatureEnabled(
  userId: string,
  featureKey: string,
  rolloutPercent: number = 100
): boolean {
  if (!userId) return false;
  const bucket = getExperimentBucket(userId, featureKey);
  return bucket < rolloutPercent;
}
