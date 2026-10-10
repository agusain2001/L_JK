export const gameStorageKey = (userId?: string) =>
  `for-you-little-surprises:v1${userId ? `:${userId}` : ""}`;
