# i❤️baba — Baba Is You Fan Game

---

## Quick Start

```bash
npm install
cd server && npm install && cd ..
npm start
```

Open **https://localhost:3000**

> **Cert warning on first visit** (expected): Click **Advanced → Proceed to localhost (unsafe)**
> You only need to do this once. It's your own computer — completely safe.

That's it. No database setup needed — SQLite is created automatically at `server/data.db`.

---

## Mic / Voice controls not working?

The microphone requires HTTPS. The app already runs on HTTPS (`https://localhost:3000`).

**If you see "Mic blocked":**
- Click the 🔒 or ⚠️ icon in the address bar → **Allow microphone**

**If you're on Brave and mic still fails:**
Brave sometimes needs a properly trusted cert. Run this once:
```bash
# Install mkcert (one time)
brew install mkcert        # macOS
# or: choco install mkcert  # Windows
# or: apt install mkcert    # Linux

mkcert -install
mkcert localhost

# Move certs to project root
mv localhost.pem localhost-key.pem .
```
Then update `vite.config.js` to use them:
```js
server: {
  https: { cert: './localhost.pem', key: './localhost-key.pem' },
  ...
}
```
Restart `npm start` and the cert warning disappears permanently.

---

## Commands

| Command | What it does |
|---------|-------------|
| `npm start` | Start everything (Vite + API) at https://localhost:3000 |
| `npm run dev` | Frontend only (no auth/community) |
| `npm run server` | API only |
| `npm run build` | Build frontend → `dist/` for production |

---

## Deploy to Railway

### 1. Push to GitHub
```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOU/baba-web.git
git push -u origin main
```

### 2. New Railway project
- [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
- Select your repo — `railway.json` is detected automatically

### 3. Add PostgreSQL
**+ New → Database → Add PostgreSQL** — Railway injects `DATABASE_URL` automatically

### 4. Set environment variables
In your service → **Variables**:
```
JWT_SECRET=replace-with-something-long-and-random
NODE_ENV=production
```

### 5. Live
Railway gives you a URL like `https://baba-web.up.railway.app`. Redeploys on every `git push`.

---

## How the app works
1. `/register` → create account
2. `/editor` → build a map → **▶ Test** → win your level → **Publish** unlocks
3. `/community` → browse and vote on maps

**Controls:** Arrow keys / WASD — Move &nbsp;|&nbsp; Z — Undo &nbsp;|&nbsp; R — Restart
