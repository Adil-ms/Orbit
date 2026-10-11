import { api } from '../services/orbitApi'

/**
 * Browser side of web push: trip reminders and checklist updates in the notification bar.
 * Needs HTTPS (or localhost). On iPhone, web push only works after "Add to Home Screen".
 */
export const pushSupported = () =>
  typeof window !== 'undefined' && window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

const toKey = (base64) => {
  const s = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

const registration = () => navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready)

/** 'unsupported' | 'blocked' | 'on' | 'off' for this browser. */
export async function pushStatus() {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'blocked'
  const reg = await navigator.serviceWorker.getRegistration('/')
  const sub = await reg?.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}

/** Asks permission, subscribes this browser and registers it with the server. Throws a readable Error. */
export async function enablePush() {
  if (!pushSupported()) throw new Error('This browser can’t show push notifications.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notifications are blocked. Allow them for this site in your browser settings.')
  const { publicKey } = await api.pushKey()
  if (!publicKey) throw new Error('Phone notifications aren’t set up on the server yet.')
  const reg = await registration()
  const existing = await reg.pushManager.getSubscription()
  const sub = existing ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(publicKey) }))
  await api.pushSubscribe(sub.toJSON())
}

/** Re-registers this browser's existing subscription with the server (e.g. after the session changed). */
export async function syncPush() {
  const reg = await navigator.serviceWorker.getRegistration('/')
  const sub = await reg?.pushManager.getSubscription()
  if (!sub || Notification.permission !== 'granted') return false
  await api.pushSubscribe(sub.toJSON())
  return true
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration('/')
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  await api.pushUnsubscribe(sub.endpoint)
  await sub.unsubscribe()
}
