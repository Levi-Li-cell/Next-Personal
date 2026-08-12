type CacheEnvelope<T> = {
  savedAt: number
  value: T
}

export function readClientCache<T>(key: string, maxAgeMs: number): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const cached = JSON.parse(raw) as CacheEnvelope<T>
    if (!cached || typeof cached.savedAt !== 'number' || Date.now() - cached.savedAt > maxAgeMs) {
      localStorage.removeItem(key)
      return null
    }
    return cached.value
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

export function writeClientCache<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try {
    const cached: CacheEnvelope<T> = { savedAt: Date.now(), value }
    localStorage.setItem(key, JSON.stringify(cached))
  } catch {
    // Storage may be unavailable in private browsing; network data still works.
  }
}
