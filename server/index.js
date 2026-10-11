import { createApp } from './app.js'
import { loadConfig } from './config.js'

const config = loadConfig()
const { app, notifications, db } = createApp(config)

notifications.start()
const server = app.listen(config.port, () => {
  console.log(`[orbit] API listening on http://localhost:${config.port}`)
  console.log(`[orbit] WhatsApp mode: ${config.whatsapp.mode}${config.whatsapp.mode === 'mock' ? ' (messages are recorded, not sent)' : ''}`)
  console.log(`[orbit] AI checklist: ${config.ai.enabled && config.ai.hasCredentials ? config.ai.model : 'off — rule-based checklists only'}`)
})

function shutdown() {
  notifications.stop()
  server.close(() => {
    db.close()
    process.exit(0)
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
