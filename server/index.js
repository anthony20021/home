import express from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

try { process.loadEnvFile() } catch { /* pas de .env : variables système */ }

const { ADMIN_USER, ADMIN_PASSWORD, AUTH_SECRET, PORT = 3100 } = process.env
if (!ADMIN_USER || !ADMIN_PASSWORD || !AUTH_SECRET) {
  console.error('ADMIN_USER, ADMIN_PASSWORD et AUTH_SECRET doivent être définis dans .env')
  process.exit(1)
}

const root = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.join(root, '..', 'data', 'links.json')
const DIST = path.join(root, '..', 'dist')
const TOKEN_TTL = 1000 * 60 * 60 * 12 // 12 h

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest()
const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b))
const sign = (payload) => crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex')

function makeToken() {
  const exp = String(Date.now() + TOKEN_TTL)
  return `${exp}.${sign(exp)}`
}

function validToken(token = '') {
  const [exp, sig] = token.split('.')
  if (!exp || !sig || Number(exp) < Date.now()) return false
  return safeEqual(sig, sign(exp))
}

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '')
  if (!validToken(token)) return res.status(401).json({ error: 'Non autorisé' })
  next()
}

// Anti brute-force simple : 5 échecs / 15 min par IP
const fails = new Map()
const WINDOW = 15 * 60 * 1000

function sanitize(groups) {
  if (!Array.isArray(groups)) throw new Error('Format invalide')
  const str = (v, max) => String(v ?? '').trim().slice(0, max)
  return groups.map((g) => ({
    category: str(g.category, 60) || 'Sans nom',
    items: (Array.isArray(g.items) ? g.items : []).map((i) => {
      const url = str(i.url, 500)
      if (!/^https?:\/\//i.test(url)) throw new Error(`URL invalide : ${url}`)
      return { name: str(i.name, 80) || url, url, icon: str(i.icon, 8), desc: str(i.desc, 200) }
    }),
  }))
}

const app = express()
app.use(express.json({ limit: '200kb' }))

app.get('/api/links', async (_req, res) => {
  try {
    res.json(JSON.parse(await fs.readFile(DATA, 'utf8')))
  } catch {
    res.json([])
  }
})

app.post('/api/login', (req, res) => {
  const ip = req.ip
  const rec = fails.get(ip)
  if (rec && rec.count >= 5 && Date.now() - rec.first < WINDOW) {
    return res.status(429).json({ error: 'Trop de tentatives, réessaie plus tard' })
  }
  const { user, password } = req.body ?? {}
  // les deux comparaisons sont toujours évaluées
  const okUser = safeEqual(user ?? '', ADMIN_USER)
  const okPass = safeEqual(password ?? '', ADMIN_PASSWORD)
  if (!(okUser && okPass)) {
    const fresh = !rec || Date.now() - rec.first >= WINDOW
    fails.set(ip, fresh ? { count: 1, first: Date.now() } : { ...rec, count: rec.count + 1 })
    return res.status(401).json({ error: 'Identifiants incorrects' })
  }
  fails.delete(ip)
  res.json({ token: makeToken() })
})

app.put('/api/links', requireAuth, async (req, res) => {
  try {
    const clean = sanitize(req.body)
    await fs.writeFile(DATA, JSON.stringify(clean, null, 2))
    res.json(clean)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Front compilé (production)
app.use(express.static(DIST))
app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(DIST, 'index.html')))

app.listen(PORT, () => console.log(`Serveur sur http://localhost:${PORT}`))
