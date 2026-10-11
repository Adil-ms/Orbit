import { useCallback, useState } from 'react'

export const GEO_MESSAGES = {
  unsupported: 'Your browser doesn’t support location access. Please type your location instead.',
  denied: 'Location permission was denied. You can type your location instead, or allow access in your browser settings.',
  unavailable: 'We couldn’t determine your location right now. Please type it instead.',
  timeout: 'Finding your location took too long. Try again or type your location.',
  granted: 'Location found. Your coordinates stay on this device.',
}

/** Requests the browser location only when `request()` is called — never on load. */
export function useGeolocation() {
  const [state, setState] = useState({ status: 'idle', coords: null, accuracy: null })

  const request = useCallback(() => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation?.getCurrentPosition) {
        setState({ status: 'unsupported', coords: null })
        resolve(null)
        return
      }
      setState((s) => ({ ...s, status: 'requesting' }))
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude]
          setState({ status: 'granted', coords, accuracy: pos.coords.accuracy })
          resolve(coords)
        },
        (err) => {
          const status = err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable'
          setState({ status, coords: null })
          resolve(null)
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
      )
    })
  }, [])

  const reset = useCallback(() => setState({ status: 'idle', coords: null }), [])

  return { ...state, request, reset, message: GEO_MESSAGES[state.status] ?? null }
}
