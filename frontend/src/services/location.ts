/**
 * Location Service — real-time GPS tracking for location-aware weather.
 * Uses browser Geolocation watchPosition API + Nominatim reverse geocoding.
 * No API keys required.
 */

export interface UserLocation {
  lat: number
  lon: number
  city: string
  source: 'gps' | 'default'
  accuracy?: number      // metres
  updatedAt?: number     // Date.now()
}

const STORAGE_KEY = 'smartshield_location'
const GPS_PERM_KEY = 'smartshield_gps_allowed'

export const DEFAULT_LOCATION: UserLocation = {
  lat: 19.076,
  lon: 72.8777,
  city: 'Mumbai',
  source: 'default',
}

/* ── Haversine distance ──────────────────────────────────────────────────── */
function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/* ── Reverse geocode (BigDataCloud) ──────────────────────────────────────── */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    )
    const data = await res.json()
    return data.city || data.locality || data.principalSubdivision || 'Your Location'
  } catch {
    return 'Your Location'
  }
}

/* ── Location Service ────────────────────────────────────────────────────── */
export const locationService = {
  getSaved(): UserLocation | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as UserLocation) : null
    } catch {
      return null
    }
  },

  save(loc: UserLocation) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(GPS_PERM_KEY)
  },

  /** Was GPS permission previously granted? (so we skip the modal on revisit) */
  isGPSAllowed(): boolean {
    return localStorage.getItem(GPS_PERM_KEY) === 'true'
  },

  markGPSAllowed() {
    localStorage.setItem(GPS_PERM_KEY, 'true')
  },

  /**
   * Start continuous real-time GPS tracking using watchPosition.
   * Fires `onUpdate` whenever the user moves more than `minDistanceMeters`.
   * Also fires immediately on first fix.
   * Returns a cleanup function — call it on component unmount to stop tracking.
   */
  watchLocation(
    onUpdate: (loc: UserLocation) => void,
    minDistanceMeters = 50
  ): () => void {
    if (!navigator.geolocation) {
      console.warn('[SmartShield] Geolocation not supported')
      return () => {}
    }

    let prevLat = 0
    let prevLon = 0
    let firstFix = true

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon, accuracy } = pos.coords

        // Skip if hasn't moved enough (except on very first fix)
        if (!firstFix && distanceMeters(prevLat, prevLon, lat, lon) < minDistanceMeters) {
          return
        }

        prevLat = lat
        prevLon = lon
        firstFix = false

        const city = await reverseGeocode(lat, lon)
        const loc: UserLocation = {
          lat,
          lon,
          city,
          source: 'gps',
          accuracy: Math.round(accuracy),
          updatedAt: Date.now(),
        }

        locationService.save(loc)
        onUpdate(loc)
      },
      (err) => {
        console.warn('[SmartShield] GPS watch error:', err.message)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15_000,   // accept cached position up to 15s old
        timeout: 15_000,
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  },

  /**
   * One-shot GPS fetch (used as fallback / initial permission request).
   */
  async requestGPS(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          const loc: UserLocation = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            city,
            source: 'gps',
            accuracy: Math.round(pos.coords.accuracy),
            updatedAt: Date.now(),
          }
          resolve(loc)
        },
        (err) => reject(new Error(err.message || 'Could not get GPS location')),
        { timeout: 12_000, enableHighAccuracy: true }
      )
    })
  },

  toQueryParams(loc: UserLocation): string {
    return `lat=${loc.lat}&lon=${loc.lon}&city=${encodeURIComponent(loc.city)}`
  },
}
