import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Adds a Content-Security-Policy to the production build only (dev needs inline scripts for hot reload).
const csp = (supabaseUrl) => ({
  name: 'shellwise-csp',
  apply: 'build',
  transformIndexHtml: (html) => {
    const conn = ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co']
    try { const u = new URL(supabaseUrl); if (!u.hostname.endsWith('.supabase.co')) conn.push(u.origin) } catch { /* no custom URL */ }
    const policy = [
      "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:", "img-src 'self' data:", `connect-src ${conn.join(' ')}`,
      "frame-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'",
    ].join('; ')
    return html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${policy}">`)
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return { plugins: [react(), csp(env.VITE_SUPABASE_URL || '')], server: { port: 5173 } }
})
