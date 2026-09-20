# NoticeLens — College Notice → Action Engine

NoticeLens turns a messy college notice into reviewed, personalized student actions. It is a local-only AWS First Commit **Build It** submission. The central rule is simple: **Strands extracts facts; deterministic Python rules determine eligibility.**

## 1. Problem

College notices are often long, inconsistent documents. Students miss eligibility requirements, deadlines, and required documents, while staff must repeatedly interpret the same notice for different student records.

## 2. Solution

NoticeLens accepts notice text or a supported local document, extracts a closed structured-requirements object, requires an admin review before publication, and evaluates the published requirements against student records. Each student sees their eligibility result, a requirement-by-requirement explanation, the deadline with urgency cues, and an actionable checklist whose completion state persists across reloads.

## 3. Architecture

```text
Messy notice document / pasted text
            ↓
Local text / PDF / image extraction  (pypdf, Pillow, pytesseract)
            ↓
AWS Strands Agent + local Ollama model  ──OR──  DEMO_MODE fallback
            ↓
Structured Notice JSON  (agent/notice_schema.json — 17 fields, closed schema)
            ↓
Closed-schema JSON validation
            ↓
Admin review / edit gate  →  Draft saved to data/store.json
            ↓
Explicit Publish action
            ↓
Node/Express API  (routes: /api/notices, /api/students, /api/eligibility)
            ↓
Python deterministic eligibility engine  (spawn child process, arg arrays)
            ↓
Personalized result  (eligible | not_eligible | needs_information)
  + requirement-by-requirement reasons
  + action plan
  + deadline urgency metadata
```

The React/Vite frontend calls the Node/Express backend. The backend calls the Python engine through a `spawn`-based child-process bridge (no shell injection). Eligibility is **never** calculated in React and is **never** delegated to an LLM.

## 4. Repository Layout

```
noticelens/
├── agent/                              # Strands extraction layer
│   ├── cli.py                          # Entry point: python -m agent.cli
│   ├── notice_agent.py                 # Strands agent definition + tool calls
│   ├── notice_schema.json              # 17-field closed JSON schema
│   ├── requirements.txt                # strands-agents, ollama, …
│   └── tests/
├── backend/                            # Node/Express API
│   ├── server.js                       # App entry, route mounts, global error handler
│   ├── controllers/                    # Request handlers
│   ├── middleware/                     # requestLogger, errorHandler
│   ├── models/                         # Data access over data/store.json
│   ├── routes/
│   │   ├── notices.js                  # /api/notices
│   │   ├── students.js                 # /api/students
│   │   └── eligibility.js             # /api/eligibility
│   ├── services/                       # engineBridge (spawn), extraction, …
│   ├── utils/
│   │   └── deadline.js                 # parseDeadline(), urgency labels
│   ├── .env.example
│   └── tests/
├── data/
│   └── store.json                      # Local JSON persistence (notices + students + action state)
├── eligibility_engine/                 # Deterministic Python evaluation
│   ├── eligibility.py                  # evaluate_eligibility() — only eligibility source of truth
│   ├── models.py                       # NoticeCriteria, StudentProfile, EligibilityResult
│   ├── cli.py                          # CLI bridge called by engineBridge
│   ├── requirements.txt
│   └── tests/
├── frontend/                           # React 19 + Vite
│   └── src/
│       ├── components/
│       │   ├── AppShell.jsx            # Top-level layout, routing, profile switching
│       │   ├── StudentDashboard.jsx    # Notice list, filters, search, status counts
│       │   ├── NoticeCard.jsx          # Card: org, title, type, requirements, deadline, status, "Why?"
│       │   ├── NoticeDetailView.jsx    # Full eligibility breakdown + persistent action plan
│       │   ├── NoticeSearch.jsx        # Search input with debounce
│       │   ├── AdminDashboard.jsx      # Admin hub
│       │   ├── AdminNoticeManager.jsx  # Upload / paste / extract / review / edit / publish
│       │   ├── AdminImpactAnalysis.jsx # Batch eligibility across all demo students
│       │   ├── NoticeExtractionPanel.jsx
│       │   ├── RequirementRow.jsx
│       │   ├── StatusBadge.jsx
│       │   ├── DeadlineBadge.jsx
│       │   ├── ActionItem.jsx
│       │   ├── StatCard.jsx
│       │   ├── Sidebar.jsx
│       │   ├── Topbar.jsx
│       │   ├── LoadingState.jsx
│       │   ├── EmptyState.jsx
│       │   └── ErrorState.jsx
│       ├── services/
│       │   └── actionItemService.js    # PATCH action-item completion
│       ├── utils/
│       └── index.css                   # Full design system (custom properties, tokens)
├── sample-data/
│   └── sample_notices/
│       └── placement_drive.txt
├── tests/
│   ├── test_eligibility.py             # Cross-cutting eligibility tests
│   └── test_api_health.js              # Backend health check smoke test
└── package.json                        # Root: npm run dev, npm test, npm run setup
```

## 5. Local Setup

**Prerequisites:** Node.js ≥ 18, npm, Python 3.10+, and PowerShell, cmd, or a Unix shell. The repository includes demo data in `data/store.json`.

```bash
npm install
npm run setup
```

Copy the environment examples before starting:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

The example values are local demo tokens, not production secrets. Keep `.env` files uncommitted. Then start:

```bash
npm run dev
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:5000 |
| Health   | http://localhost:5000/api/health |

`DEMO_MODE=true` in `backend/.env` enables a deterministic fallback requiring no model. To use real Strands extraction, see §8 and set `DEMO_MODE=false`.

## 6. Running Tests

```bash
# Python: root-level, eligibility engine, and agent tests + backend JS tests
npm test

# Frontend lint + production build check
npm --prefix frontend run lint
npm --prefix frontend run build
```

| File | Coverage |
|------|----------|
| `tests/test_eligibility.py` | Cross-cutting eligibility scenarios |
| `eligibility_engine/tests/` | Engine unit tests |
| `agent/tests/` | Agent / schema tests |
| `tests/test_api_health.js` | Backend health-check smoke test |
| `backend/tests/` | Backend integration tests |

There is no dedicated frontend unit-test script; the build and live browser flow are the available frontend checks.

## 7. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Lucide React icons |
| Backend | Node.js, Express, cors, dotenv |
| Persistence | `data/store.json` (local JSON) |
| Eligibility engine | Python 3 — deterministic rules only |
| Notice extraction | AWS Strands Agents SDK + local Ollama (`llama3.2`) |
| Document parsing | `pypdf`, Pillow, pytesseract (optional OCR) |
| Process bridge | Node `child_process.spawn` with arg arrays |
| Dev tooling | concurrently, ESLint |

No database, cloud storage, hosted model API, or deployment service is implemented.

## 8. Strands Usage

Strands has **one job**: extract structured facts from an untrusted notice. It returns the 17 fields defined in `agent/notice_schema.json`, and the result is validated against that closed schema before the application can save or publish it.

**Strands does NOT**: decide eligibility, publish notices, modify files, execute notice instructions, run arbitrary commands, or receive access to secrets. The prompt treats notice content as quoted untrusted data. Real Strands output is labeled **"Extracted by local Strands agent."**

### notice_schema.json fields

`title`, `organization`, `type`, `description`, `branches`, `years`, `min_cgpa`, `max_active_backlogs`, `min_10th_percentage`, `min_12th_percentage`, `required_degree`, `documents`, `deadline`, `application_url`, `application_method`, `instructions`, `contact`

### Real local extraction

```bash
pip install -r agent/requirements.txt
ollama serve
ollama pull llama3.2
python -m agent.cli --mode STRANDS --file sample-data/sample_notices/placement_drive.txt
```

`OLLAMA_HOST` is restricted to `localhost`, `127.0.0.1`, or `::1`. If Strands or Ollama is unavailable, set `DEMO_MODE=true`. The fallback is visibly labeled **"DEMO_MODE fallback (not Strands execution)"** — that label must not be changed to imply Strands was used.

## 9. Eligibility Engine

`eligibility_engine/eligibility.py` is the **only** eligibility source of truth. `evaluate_eligibility(criteria, student)` evaluates a `NoticeCriteria` object against a `StudentProfile` and returns an `EligibilityResult`.

### Criteria evaluated (in order)

| Criterion | Schema field |
|-----------|-------------|
| Branch | `eligible_branches` — with CSE-allied branch expansion |
| Year | `eligible_years` |
| Degree | `eligible_degrees` |
| CGPA | `min_cgpa` |
| Active backlogs | `max_active_backlogs` |
| 10th percentage | `min_tenth_percentage` |
| 12th percentage | `min_twelfth_percentage` |

### Status logic

```
any criterion failed              →  not_eligible
all pass, some data missing       →  needs_information
all pass, no data missing         →  eligible
```

The LLM is not in this decision loop. The Admin Impact Analysis view calls the same backend evaluation service for every demo student; it does not implement a second ruleset.

## 10. API Routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/health` | — | Service health + DEMO_MODE flag |
| GET | `/api/engine/status` | — | Python engine reachability check |
| GET | `/api/notices` | student token | List published notices |
| GET | `/api/notices/:id` | student token | Single notice |
| POST | `/api/notices` | admin token | Create / extract notice (draft) |
| PATCH | `/api/notices/:id` | admin token | Update fields / publish |
| GET | `/api/students` | admin token | Selector list (safe fields only) |
| GET | `/api/students/:id` | student token | Student profile |
| POST | `/api/eligibility` | student token | Evaluate one student × one notice |
| PATCH | `/api/eligibility/action-item` | student token | Mark action item complete |

Upload limit: 10 MB. Base64 content is validated before processing.

## 11. Student Experience

Students switch among the demo profiles **Rahul Sharma**, **Arjun Kumar**, and **Priya Singh** via the Topbar profile selector. The dashboard shows:

- Status filter tabs (All / Eligible / Not Eligible / Needs Info)
- Live search with debounce
- Deadline urgency badges (due tomorrow · urgent · approaching this week · N days remaining)
- `NoticeCard` with expandable **"Why am I seeing this?"** breakdown
- `NoticeDetailView` — full eligibility breakdown + persistent action plan

## 12. Admin Experience

**Admin Notice Manager** supports: upload or pasted text → local extraction → closed-schema validation → review/edit of every field → draft save → explicit publish.

**Admin Impact Analysis** evaluates a selected published notice across all demo students and shows individual eligibility rows and aggregate counts.

Admin writes require `ADMIN_TOKEN`. Student reads and action-item writes require a matching student ID and token from `STUDENT_TOKENS`. The student directory endpoint exposes selector fields only, never full profile data.

## 13. Demo Flow

1. Start with `npm run dev` using the example local environment.
2. Open **Admin → Notice Manager**, upload `sample-data/sample_notices/placement_drive.txt` or paste any notice text.
3. Confirm the extraction label:
   - `DEMO_MODE` → **"DEMO_MODE fallback (not Strands execution)"**
   - Real mode → **"Extracted by local Strands agent"**
4. Review or edit the 17 structured fields, then save as draft and publish.
5. Switch to **Rahul Sharma** — eligible (CSE, CGPA ≥ threshold, no backlogs).
6. Switch to **Arjun Kumar** — not eligible (Mechanical branch not accepted).
7. Switch to **Priya Singh** — needs information (active backlogs field missing).
8. Open the notice detail, complete an action item, reload, and confirm it persists.
9. Open **Admin → Impact Analysis** — expected counts: 1 eligible, 1 not eligible, 1 needs information.

## 14. Build It Architecture Notes

This submission stays local by design. It uses React/Vite, Node/Express, local JSON persistence, a local Python child process, and local Strands/Ollama extraction when configured. It does not implement S3, DynamoDB, Bedrock, OpenSearch, Lambda, API Gateway, or any other Ship It cloud infrastructure. No AWS credentials are required.

## 15. Limitations

- Real Strands mode requires Python dependencies, Ollama, and a locally pulled model — these are not bundled.
- `DEMO_MODE` uses a small deterministic fallback and is not equivalent to LLM extraction.
- Local JSON persistence is suitable for a demo, not concurrent production workloads.
- The example token scheme is local demo authorization, not a production identity provider.
- OCR requires Tesseract installed separately and available on `PATH`.
- No dedicated frontend unit-test script; build and live-flow verification are the available frontend checks.

## 16. Future Improvements

- Add a real identity and session system appropriate for deployment.
- Replace JSON persistence with a transactional database if concurrency is needed.
- Broader fixture coverage for PDFs, OCR, schema edge cases, and UI automation.
- Audit history and review diffs for published notice changes.
- Improve extraction confidence and human review assistance without moving eligibility decisions into the model.

## Security and Truthfulness Notes

Uploaded files and pasted notices are untrusted. Uploads are limited to 10 MB, base64 content is validated, structured output is closed-schema validated, model output is capped, and errors do not echo notice contents. URLs are validated but never fetched. The Python bridge uses `spawn` with argument arrays rather than a shell string — no shell injection.

No API keys, passwords, private keys, or secret `.env` files belong in the repository. `.env` and `.env.local` are gitignored; only non-secret `.env.example` templates are committed. The example tokens are placeholders for local demo use and must be replaced for any real deployment.
