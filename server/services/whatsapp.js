import { formatInZone } from '../lib/time.js'

// Item titles from these categories are never sent over WhatsApp (could reveal medical details).
const PRIVATE_CATEGORIES = new Set(['health'])

/** Builds message-safe checklist lines: no medical items, no user-typed text, no long digit runs. */
export function safeItemLines(items, limit = 6) {
  const lines = []
  let hidden = 0
  for (const i of items.filter((x) => x.applicable)) {
    if (PRIVATE_CATEGORIES.has(i.category) || i.origin === 'user') {
      hidden += 1
      continue
    }
    if (lines.length < limit) lines.push({ done: i.completed, title: i.title.replace(/\d{5,}/g, '•••').slice(0, 60) })
  }
  return { lines, hidden }
}

/**
 * Renders the reminder / update message. `vars` are the template parameters used in Cloud API mode
 * (template parameters can't contain line breaks, so list items are joined with " · ").
 */
export function renderMessage(kind, { trip, items, readiness, link }) {
  const destination = trip.destinationCity
  const { lines, hidden } = safeItemLines(items)
  const remaining = readiness.total - readiness.completed
  const when = formatInZone(trip.departureAt, trip.departureTz)

  if (kind === 'reminder') {
    const list = lines.map((l) => `${l.done ? '☑' : '☐'} ${l.title}`)
    const text = [
      '🧳 Did You Forget Something?',
      '',
      `Your trip to ${destination} is coming up (${when}).`,
      '',
      `Your preparation score: ${readiness.score}%`,
      '',
      ...list,
      ...(hidden ? [`+ ${hidden} more private item${hidden === 1 ? '' : 's'}`] : []),
      '',
      remaining > 0 ? `You still have ${remaining} item${remaining === 1 ? '' : 's'} to check.` : 'Everything on your checklist is checked!',
      '',
      `Open your checklist: ${link}`,
      '',
      'Your adventure is almost ready! ✈️',
    ].join('\n')
    const vars = [destination, `${readiness.score}%`, list.join(' · ') || '—', String(remaining), link]
    const push = {
      title: `Your trip to ${destination} is coming up`,
      body: remaining > 0 ? `${remaining} item${remaining === 1 ? '' : 's'} still to check · ${readiness.score}% prepared` : 'Everything on your checklist is checked!',
    }
    return { text, vars, push }
  }

  const list = lines.map((l) => `${l.title}${l.done ? ' ✔️' : ''}`)
  const text = [
    '🎉 Checklist updated!',
    '',
    ...list,
    '',
    `Preparation progress: ${readiness.completed} of ${readiness.total} items`,
    '',
    `Open your trip checklist: ${link}`,
    '',
    'Safe travels! ✈️',
  ].join('\n')
  const vars = [list.join(' · ') || '—', String(readiness.completed), String(readiness.total), link]
  const push = { title: `Checklist updated · ${destination}`, body: `${readiness.completed} of ${readiness.total} items checked` }
  return { text, vars, push }
}

/**
 * WhatsApp provider. "cloud" uses the WhatsApp Business Platform Cloud API with pre-approved templates
 * (required for business-initiated messages). "mock" records the message without sending it.
 * A successful send means the provider ACCEPTED the message — delivery is only confirmed via webhook.
 */
export function createWhatsApp(config, fetchImpl = globalThis.fetch) {
  const w = config.whatsapp

  async function send({ to, kind, rendered }) {
    if (w.mode !== 'cloud') {
      return { provider: 'mock', status: 'mock', providerMessageId: null }
    }
    const template = kind === 'reminder' ? w.reminderTemplate : w.updateTemplate
    const res = await fetchImpl(`https://graph.facebook.com/${w.apiVersion}/${w.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${w.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'template',
        template: {
          name: template,
          language: { code: w.templateLanguage },
          components: [{ type: 'body', parameters: rendered.vars.map((text) => ({ type: 'text', text })) }],
        },
      }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = new Error(body?.error?.message || `WhatsApp API responded ${res.status}`)
      // 4xx (except 429) are permanent: bad number, template not approved, no consent window, etc.
      err.permanent = res.status >= 400 && res.status < 500 && res.status !== 429
      throw err
    }
    return { provider: 'cloud', status: 'accepted', providerMessageId: body?.messages?.[0]?.id ?? null }
  }

  return { send, mode: w.mode }
}
