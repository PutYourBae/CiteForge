# 🔬 CiteForge

**AI-powered academic paper search, citation generator, and research assistant**

> Find. Read. Cite. Done.

---

## ✨ Features

- **Multi-source search** — searches 6+ databases in parallel (Semantic Scholar, OpenAlex, CrossRef, arXiv, PubMed, CORE)
- **Automatic deduplication** — merges results from overlapping sources intelligently
- **Relevance ranking** — scores by keyword match, citation count, recency, and abstract similarity
- **Citation generator** — instant APA 7th, IEEE, MLA 9th, and Chicago 17th — one-click copy
- **AI summaries** — extractive (always), or abstractive via Ollama/Gemini/OpenAI (optional)
- **PDF download** — one-click download of open-access PDFs
- **Saved library** — bookmark papers, add notes, manage your collection
- **No install needed** — portable `.exe` — extract and run

---

## 🚀 Quick Start (Users)

1. Go to [Releases](../../releases) → download `CiteForge-x.x.x-win-portable.exe`
2. Double-click — no installation required
3. Type your research topic → press Enter

---

## 🧑‍💻 Development Setup

### Prerequisites
- Node.js 20+
- npm 9+

### Install & Run
```bash
git clone https://github.com/your-username/CiteForge.git
cd CiteForge
npm install
npm run dev
```

### Build Portable Executable
```bash
# Windows portable .exe
npm run electron:portable

# Output: release/CiteForge-x.x.x-win-portable.exe
```

### Build all platforms (CI/CD)
```bash
npm run electron:build
```

---

## 📁 Project Structure

```
CiteForge/
├── electron/          ← Electron main process (Node.js)
│   ├── main.ts        ← App entry & window creation
│   ├── preload.ts     ← Secure IPC bridge
│   └── ipc/           ← IPC handler modules
├── src/               ← React renderer (browser)
│   ├── core/          ← Search & AI engines
│   │   ├── discovery/ ← Multi-source search engine
│   │   └── ai/        ← Citation, summary, graph engines
│   ├── pages/         ← Page components
│   ├── components/    ← UI components
│   └── store/         ← Zustand state management
├── database/          ← SQLite schema & init
└── assets/            ← App icons
```

---

## 🤖 AI Mode Options

| Mode | Requires | Cost | Quality |
|------|----------|------|---------|
| **Local Rules** (default) | Nothing | Free | Basic extractive |
| **Ollama** | Ollama + llama3.2:3b installed | Free | Good |
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
