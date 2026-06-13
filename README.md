# PermitPilot AI 🏗

> **Permit Readiness System** — Know exactly what permits you need before you build.

---

## 📁 File Structure

```
permitpilot/
├── index.html              ← Entire frontend app
├── server.js               ← Node.js server (serves static files + AI proxy)
├── package.json            ← Node config (no external dependencies)
├── render.yaml             ← Render deployment config
├── sw.js                   ← PWA service worker (offline support)
├── manifest.json           ← PWA manifest (installable)
├── icon.svg                ← App icon
├── .gitignore
└── README.md
```

---

## 🚀 Deployment Steps (Render)

### STEP 1 — Get a free Groq API Key

1. Go to **console.groq.com**
2. Sign up — **no credit card required**
3. Click **API Keys → Create API Key**
4. Copy your key — looks like: `gsk_xxxxxxxxxxxxxxxxxxxx`
5. **Save it** — you'll need it in Step 4

---

### STEP 2 — Push code to GitHub

1. Go to **github.com** → log in → **New repository**
2. Name it `permitpilot` → **Create repository**
3. Upload all files from this package (keep the folder structure)
4. **Commit changes**

Or with terminal:
```bash
git init
git add .
git commit -m "PermitPilot AI v2"
git remote add origin https://github.com/YOUR_USERNAME/permitpilot.git
git push -u origin main
```

---

### STEP 3 — Deploy on Render

1. Go to **render.com** → sign up / log in with GitHub
2. Click **New → Web Service**
3. Connect your GitHub account → select the `permitpilot` repository
4. Render auto-detects settings from `render.yaml`. Confirm:
   - **Name:** `permitpilot-ai`
   - **Runtime:** Node
   - **Build Command:** `echo "No build step needed"`
   - **Start Command:** `node server.js`
   - **Plan:** Free
5. Click **Create Web Service**

---

### STEP 4 — Add your Groq API Key in Render

1. In your Render service → click **Environment** (left sidebar)
2. Click **Add Environment Variable**
3. Fill in:
   - **Key:** `GROQ_API_KEY`
   - **Value:** your key from Step 1 (`gsk_...`)
4. Click **Save Changes**
5. Render will automatically redeploy — wait ~1 minute

Your app is live at: `https://permitpilot-ai.onrender.com`

---

## 🤖 Do You Need an API Key?

### Without API key — FULLY FUNCTIONAL ✅
Everything works with zero setup:
- All 14 permit rules
- Readiness score (0–100)
- Document checklist (live score updates)
- Inspection schedule
- Risk assessment
- Questions generator
- Export (TXT, JSON, HTML)
- Project history
- Rule library
- 6 languages (EN, ES, DE, NL, TR, BG)
- PWA / offline support

### With Groq API key — AI FEATURES ✅
- AI permit guidance (expert narrative analysis per project)
- AI chat (ask follow-up questions)

**Groq free tier:** 14,400 requests/day — more than enough.

---

## 🌍 Languages

Switch language using the buttons in the top-right corner:
**EN · ES · DE · NL · TR · BG**

Language preference is saved and remembered across sessions.

---

## 🛠 Local Development

```bash
# Install nothing — no dependencies
node server.js

# Open browser at:
# http://localhost:3000
```

Set `GROQ_API_KEY` as a local environment variable for AI features:
```bash
GROQ_API_KEY=gsk_... node server.js
```

---

## 🔧 Customize Permit Rules

Edit the `PERMIT_RULES` array in `index.html`. Each rule:

```javascript
{
  id: 'RULE-015',
  name: 'Rule Name',
  projectTypes: ['Home Renovation'],  // or ['_all_']
  trigger: (p) => p.structural && p.cost > 10000,
  triggerDesc: 'Human-readable trigger description',
  permits: [{ name: 'Building Permit', tag: 'req' }],
  documents: ['Site Plan', 'Structural Drawings'],
  inspections: [{ name: 'Framing Inspection', timing: 'Before covering walls' }],
  risks: [{ level: 'high', title: 'Risk Title', desc: 'Risk description.' }],
  risk: 'high',
}
```

---

## 💾 Data

All user data stored in browser `localStorage` — nothing leaves the device except AI calls routed through `/api/ai` on your Render server.

---

*PermitPilot AI v2.0 — MIT License*
