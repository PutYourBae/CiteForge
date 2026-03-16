-- database/schema.sql
-- CiteForge SQLite schema — single-file database bundled with app

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

-- ─────────────────────────────────────────────────────────
-- Papers: core entity
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS papers (
  id              TEXT PRIMARY KEY,
  doi             TEXT UNIQUE,
  arxiv_id        TEXT,
  title           TEXT NOT NULL,
  abstract        TEXT,
  year            INTEGER,
  journal         TEXT,
  conference      TEXT,
  volume          TEXT,
  issue           TEXT,
  pages           TEXT,
  publisher       TEXT,
  access_status   TEXT NOT NULL DEFAULT 'unknown'
                  CHECK(access_status IN ('open_access', 'paid', 'unknown')),
  pdf_url         TEXT,
  publisher_url   TEXT,
  citation_count  INTEGER DEFAULT 0,
  pub_type        TEXT NOT NULL DEFAULT 'unknown'
                  CHECK(pub_type IN ('journal','conference','thesis','preprint','unknown')),
  sources         TEXT NOT NULL DEFAULT '[]',
  raw_snapshot    TEXT,
  fetched_at      DATETIME DEFAULT (datetime('now')),
  updated_at      DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_papers_doi        ON papers(doi);
CREATE INDEX IF NOT EXISTS idx_papers_year       ON papers(year DESC);
CREATE INDEX IF NOT EXISTS idx_papers_citations  ON papers(citation_count DESC);
CREATE INDEX IF NOT EXISTS idx_papers_access     ON papers(access_status);

-- ─────────────────────────────────────────────────────────
-- Authors (normalized)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS authors (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  orcid TEXT
);

CREATE TABLE IF NOT EXISTS paper_authors (
  paper_id  TEXT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES authors(id),
  position  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (paper_id, author_id)
);

-- ─────────────────────────────────────────────────────────
-- Paper relationships (research graph edges)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paper_relations (
  source_paper_id TEXT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  target_paper_id TEXT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  relation_type   TEXT NOT NULL
                  CHECK(relation_type IN ('cites','cited_by','similar_topic','co_cited','recommendation')),
  weight          REAL NOT NULL DEFAULT 1.0 CHECK(weight BETWEEN 0.0 AND 1.0),
  PRIMARY KEY (source_paper_id, target_paper_id, relation_type)
);

-- ─────────────────────────────────────────────────────────
-- User's saved library
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_papers (
  paper_id  TEXT PRIMARY KEY REFERENCES papers(id) ON DELETE CASCADE,
  tags      TEXT NOT NULL DEFAULT '[]',
  notes     TEXT,
  saved_at  DATETIME DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────
-- Search cache (TTL-based)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_cache (
  cache_key     TEXT PRIMARY KEY,
  query_text    TEXT NOT NULL,
  filters_json  TEXT,
  result_ids    TEXT NOT NULL,
  total_found   INTEGER,
  fetched_at    DATETIME DEFAULT (datetime('now')),
  expires_at    DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cache_expires ON search_cache(expires_at);

CREATE TABLE IF NOT EXISTS search_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  query_text   TEXT NOT NULL,
  filters      TEXT,
  result_count INTEGER,
  searched_at  DATETIME DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────
-- Download management
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS downloads (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  paper_id     TEXT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  file_path    TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK(status IN ('pending','downloading','done','failed','cancelled')),
  progress     REAL NOT NULL DEFAULT 0.0 CHECK(progress BETWEEN 0.0 AND 1.0),
  error_msg    TEXT,
  started_at   DATETIME DEFAULT (datetime('now')),
  completed_at DATETIME
);

-- ─────────────────────────────────────────────────────────
-- AI insights cache
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_insights (
  paper_id             TEXT PRIMARY KEY REFERENCES papers(id) ON DELETE CASCADE,
  short_summary        TEXT,
  research_summary     TEXT,
  key_contributions    TEXT,
  method_overview      TEXT,
  topics               TEXT NOT NULL DEFAULT '[]',
  citation_apa         TEXT,
  citation_ieee        TEXT,
  citation_mla         TEXT,
  citation_chicago     TEXT,
  citation_bibtex      TEXT,
  generated_at         DATETIME DEFAULT (datetime('now')),
  ai_mode              TEXT
);

-- ─────────────────────────────────────────────────────────
-- Application settings (key-value store)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Seed default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('ai_mode',          '"local_rules"'),
  ('gemini_key',       'null'),
  ('openai_key',       'null'),
  ('theme',            '"dark"'),
  ('download_folder',  'null'),
  ('enabled_sources',  '["semantic_scholar","openalex","arxiv","crossref","pubmed","core"]'),
  ('max_results',      '50'),
  ('cache_ttl_hours',  '24');
