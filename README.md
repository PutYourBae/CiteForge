# 🔬 CiteForge

**AI-powered academic paper search, citation generator, and desktop research assistant.**

> Find. Read. Cite. Done.

---

## ✨ Features

- **Multi-source search** — Searches 6+ databases in parallel (Semantic Scholar, OpenAlex, CrossRef, arXiv, PubMed, CORE).
- **Automatic deduplication** — Merges results from overlapping sources intelligently.
- **Relevance ranking** — Scores by keyword match, citation count, recency, and abstract similarity.
- **Citation generator** — Instant APA 7th, IEEE, MLA 9th, and Chicago 17th — one-click copy.
- **AI summaries** — Extractive (always), or abstractive via Ollama/Gemini/OpenAI (optional).
- **PDF download** — One-click download of open-access PDFs.
- **Saved library** — Bookmark papers, add notes, and manage your collection locally.
- **No install needed** — Portable Windows `.exe` — extract and run.

---

## 🚀 Quick Start (Users)

1. Go to [Releases](https://github.com/PutYourBae/CiteForge/releases) → download `CiteForge-1.0.0-win-portable.exe`.
2. Double-click to launch — no installation required.
3. Type your research topic → press Enter.

---

## 🛠️ Technology Stack

- **Framework**: Electron + React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, Framer Motion, Lucide React
- **State Management**: Zustand
- **Database**: `better-sqlite3` (Local storage)

---

## 🧑‍💻 Development Setup

### Prerequisites
- Node.js 20+
- npm 9+
- Windows build tools (for compiling native SQLite bindings)

### Install & Run
```bash
git clone https://github.com/PutYourBae/CiteForge.git
cd CiteForge

# Install dependencies and rebuild better-sqlite3 for Electron
npm install

# Start the Vite dev server and Electron app
npm run dev
```

### Build Executables
```bash
# Build Windows portable .exe
npm run electron:portable
# Output: release/CiteForge-x.x.x-win-portable.exe

# Build all platforms configured in electron-builder.yml (macOS/Linux)
npm run electron:build
```

---

## 📁 Project Structure

```text
CiteForge/
├── electron/          ← Electron main process (Node.js) & IPC handlers
├── src/               ← React renderer (Browser)
│   ├── core/          ← Search & AI engines (Discovery, AI Summaries, Citations)
│   ├── pages/         ← React Page components
│   ├── components/    ← UI components (Tailwind CSS, Framer Motion)
│   └── store/         ← Zustand state management
├── database/          ← SQLite schema & init
├── assets/            ← App icons
└── README.md
```

---

## 🤖 AI Mode Options

| Mode | Requires | Cost | Quality |
|------|----------|------|---------|
| **Local Rules** (default) | Nothing | Free | Basic extractive |
| **Ollama** | Ollama + `llama3.2:3b` installed locally | Free | Good |
| **Google Gemini Flash** | API key | ~$0.001/req | Excellent |
| **OpenAI GPT-4o Mini** | API key | ~$0.002/req | Excellent |

---

## 📖 Data Sources

| Source | Papers | Rate Limit | OA PDFs |
|--------|--------|------------|---------|
| Semantic Scholar | 200M+ | 100/5min | ✅ |
| OpenAlex | 240M+ | Unlimited | ✅ |
| CrossRef | 140M+ | Polite | Partial |
| arXiv | 2M+ | 3/sec | ✅ Always |
| PubMed | 36M+ | 10/sec | Partial |
| CORE | 30M+ | Free key | ✅ |

---

## 📄 License

MIT — free for personal and academic use.
