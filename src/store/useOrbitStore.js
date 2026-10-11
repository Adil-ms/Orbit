import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DEFAULT_PREFERENCES } from '../data/options'

const WARN_BEFORE_MS = 5 * 60 * 1000

export const useOrbitStore = create(
  persist(
    (set, get) => ({
      // ── Preferences ────────────────────────────────────────────────────────
      preferences: DEFAULT_PREFERENCES,
      hasSearched: false,
      updatePreferences: (patch) => set((s) => ({ preferences: { ...s.preferences, ...patch } })),
      toggleInterest: (id) =>
        set((s) => {
          const list = s.preferences.interests
          const interests = list.includes(id) ? list.filter((i) => i !== id) : [...list, id]
          return { preferences: { ...s.preferences, interests } }
        }),
      toggleMood: (id) =>
        set((s) => {
          const list = s.preferences.moods ?? []
          const moods = list.includes(id) ? list.filter((m) => m !== id) : [...list, id]
          return { preferences: { ...s.preferences, moods } }
        }),
      markSearched: () => set({ hasSearched: true }),

      resetPreferences: () => set({ preferences: DEFAULT_PREFERENCES, hasSearched: false }),

      // ── Upcoming trip (My Journey hub) — no ticket, PNR or ID data is ever stored ──
      trip: null, // { mode, name, station, departure: 'HH:MM', reportBefore, isSample? }
      setTrip: (trip) => set({ trip }),
      clearTrip: () => set({ trip: null }),

      // ── Saved adventures ───────────────────────────────────────────────────
      saved: [], // [{ id, savedAt }]
      isSaved: (id) => get().saved.some((s) => s.id === id),
      // snapshot: optional copy of the activity (used for live OpenStreetMap places, which aren't bundled)
      toggleSaved: (id, snapshot) =>
        set((s) => ({
          saved: s.saved.some((x) => x.id === id)
            ? s.saved.filter((x) => x.id !== id)
            : [{ id, savedAt: Date.now(), ...(snapshot ? { snapshot } : {}) }, ...s.saved],
        })),
      removeSaved: (id) => set((s) => ({ saved: s.saved.filter((x) => x.id !== id) })),
      // Undo support: put a removed entry back where it was
      restoreSaved: (entry, index) =>
        set((s) => {
          const list = s.saved.filter((x) => x.id !== entry.id)
          list.splice(Math.min(index, list.length), 0, entry)
          return { saved: list }
        }),
      clearSaved: () => set({ saved: [] }),

      // ── Live adventure ─────────────────────────────────────────────────────
      soundEnabled: true,
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      active: null,
      startAdventure: ({ activity, plan, window, startLabel, startCoords }) => {
        const startedAt = Date.now()
        // Prefer the explicit return deadline if it is sooner than start + window
        let returnBy = startedAt + window.windowMinutes * 60000
        if (window.deadlineAt) returnBy = Math.min(returnBy, new Date(window.deadlineAt).getTime())
        const leaveBy = returnBy - (window.buffer + plan.travelOneWay) * 60000
        set({
          active: {
            activityId: activity.id,
            name: activity.name,
            area: activity.area,
            image: activity.image,
            coords: activity.coords ?? null,
            startLabel,
            startCoords: startCoords ?? null,
            travelMode: plan.travelMode,
            travelOneWay: plan.travelOneWay,
            plannedActivity: plan.activityMinutes,
            buffer: window.buffer,
            startedAt,
            arriveAt: startedAt + plan.travelOneWay * 60000,
            warnAt: leaveBy - WARN_BEFORE_MS,
            leaveBy,
            returnBy,
            status: 'active', // active → returning → completed
            alerts: { warned: false, leave: false, overdue: false },
          },
        })
      },
      markAlert: (key) =>
        set((s) => (s.active ? { active: { ...s.active, alerts: { ...s.active.alerts, [key]: true } } } : {})),
      setActiveStatus: (status) => set((s) => (s.active ? { active: { ...s.active, status } } : {})),
      // "Need 2 more minutes?" — eats into the safety buffer, never past the latest possible leave time
      latestLeaveBy: () => {
        const a = get().active
        return a ? a.returnBy - a.travelOneWay * 60000 : 0
      },
      snoozeLeave: (minutes) =>
        set((s) => {
          if (!s.active) return {}
          const latest = s.active.returnBy - s.active.travelOneWay * 60000
          const leaveBy = Math.min(Math.max(Date.now(), s.active.leaveBy) + minutes * 60000, latest)
          return {
            active: {
              ...s.active,
              leaveBy,
              warnAt: leaveBy - WARN_BEFORE_MS,
              alerts: { ...s.active.alerts, warned: true, leave: false },
            },
          }
        }),
      completeAdventure: () =>
        set((s) => (s.active ? { active: { ...s.active, status: 'completed', completedAt: Date.now() } } : {})),
      endAdventure: () => set({ active: null }),
    }),
    {
      name: 'orbit-state',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Older saved state may lack newer preference fields (e.g. moods) — fill them from defaults
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        preferences: { ...DEFAULT_PREFERENCES, ...(persisted?.preferences ?? {}) },
      }),
      partialize: (s) => ({
        preferences: s.preferences,
        hasSearched: s.hasSearched,
        saved: s.saved,
        trip: s.trip,
        active: s.active,
        soundEnabled: s.soundEnabled,
      }),
    },
  ),
)
