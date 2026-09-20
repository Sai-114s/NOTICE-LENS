# NoticeLens — College Notice → Action Engine

NoticeLens turns a messy college notice into reviewed, personalized student actions. It is a local-only AWS First Commit Build It submission. The central rule is simple: **Strands extracts facts; deterministic Python rules determine eligibility.**

## 1. Problem

College notices are often long, inconsistent documents. Students can miss eligibility requirements, deadlines, or required documents, while staff must repeatedly interpret the same notice for different student records.

## 2. Solution

NoticeLens accepts notice text or a supported local document, extracts a closed structured-requirements object, requires an admin review before publication, and evaluates the published requirements against student records. Each student sees a result, the requirement-by-requirement explanation, the deadline, and an actionable checklist.

## 3. Architecture

```text
Messy notice document/text
          ↓
Local text/PDF/image extraction
          ↓
Local Strands agent + Ollama model
          ↓
Structured Notice JSON
          ↓
Closed-schema validation
          ↓
Admin review and publish gate
          ↓
Node/Express local API + data/store.json
          ↓
Python deterministic eligibility engine
          ↓
Personalized result + action plan
```

The React/Vite frontend calls the Node/Express backend. The backend calls the Python engine through an argument-based child process bridge. Eligibility is never calculated in React and is never delegated to an LLM.

## 4. Local setup

Prerequisites: Node.js, npm, Python 3.10 or newer, and PowerShell, cmd, or a Unix shell. The repository includes the demo data in `data/store.json`.

```bash
npm install
npm run setup
```

Copy the environment examples before starting:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

The example values are local demo tokens, not production secrets. Keep `.env` files uncommitted. Then start the application:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:5000`. For a deterministic demo without a local model, `backend/.env` uses `DEMO_MODE=true`. To use real Strands extraction, follow the Strands section below and change `DEMO_MODE=false`.

Run the repository tests:

```bash
npm test
npm --prefix frontend run lint
npm --prefix frontend run build
```

There is no frontend unit-test script in this repository; the frontend build and live browser flow are the available frontend checks.

## 5. Technology stack

- React 19 and Vite for the local frontend.
- Node.js and Express for the local HTTP API.
- Python 3 for the deterministic eligibility engine and notice extraction CLI.
- AWS Strands Agents SDK with Ollama, only in real local extraction mode.
- `pypdf`, Pillow, and pytesseract for optional local document text extraction.
- `data/store.json` for local notices, students, and action-item state.
- No database, cloud storage, hosted model API, or deployment service is implemented.

## 6. Strands usage

Strands has one job: extract structured facts from an untrusted notice. It returns the fields defined in `agent/notice_schema.json`, and the result is validated before the application can save or publish it.

Strands does **not** decide eligibility, publish notices, modify files, execute notice instructions, run arbitrary commands, or receive access to secrets. The prompt treats notice content as quoted untrusted data. The application labels real output **“Extracted by local Strands agent.”**

Real local mode:

```bash
pip install -r agent/requirements.txt
ollama serve
ollama pull llama3.2
python -m agent.cli --mode STRANDS --file sample-data/sample_notices/placement_drive.txt
```

`OLLAMA_HOST` is restricted to `localhost`, `127.0.0.1`, or `::1`. The current sample notice is intentionally small and does not contain every possible field; admin review is where missing or ambiguous facts are corrected.

If Strands or Ollama is unavailable, set `DEMO_MODE=true`. The fallback is deliberately conservative and is visibly labeled **“DEMO_MODE fallback (not Strands execution)”**. That label is truthful and must not be changed to imply Strands was used.

## 7. Eligibility engine

The Python engine in `eligibility_engine/` is the only eligibility source of truth. It evaluates structured notice criteria plus a student profile and returns `eligible`, `not_eligible`, or `needs_information`, with reasons and missing fields.

```text
student profile + published structured notice
                    ↓
       Python deterministic rules
                    ↓
       status, reasons, action items
```

The LLM is not in this decision loop. The Admin Impact Analysis view calls the same backend evaluation service for every demo student; it does not implement a second ruleset.

## 8. Student experience

Students can switch among the demo profiles Rahul Sharma, Arjun Kumar, and Priya Singh. The dashboard shows evaluated notices, status filters, search, and deadlines. Notice details make the eligibility result prominent, show each requirement result and reason, and provide an action plan whose completion persists in the local store after reload.

## 9. Admin experience

Admin Notice Management supports upload or pasted text, local extraction, schema validation, review/editing, draft save, and explicit publish. Admin Impact Analysis evaluates a selected published notice across all demo students and shows the individual rows and exact aggregate counts.

Admin writes require `ADMIN_TOKEN`. Student-specific reads and action-item writes require a matching student ID and token from `STUDENT_TOKENS`. Student directory responses expose selector fields only.

## 10. Demo flow

1. Start the app with the example local environment.
2. Open **Admin** and upload `sample-data/sample_notices/placement_drive.txt`, or paste a notice.
3. Confirm the extraction label. In `DEMO_MODE`, it must say `DEMO_MODE fallback (not Strands execution)`; in configured real mode, it says `Extracted by local Strands agent`.
4. Review or edit the structured fields, then save and publish.
5. Switch to Rahul Sharma: the TCS demo notice is eligible.
6. Switch to Arjun Kumar: the same notice is not eligible because Mechanical is not accepted.
7. Switch to Priya Singh: the same notice needs information because active backlogs are missing.
8. Open the notice detail, complete an action item, reload, and confirm it remains completed.
9. Open **Admin Impact Analysis**. For the TCS criteria and the three demo profiles, the expected counts are 1 eligible, 1 not eligible, and 1 needs information.

## 11. Build It architecture

This submission stays local by design. It uses React/Vite, Node/Express, local JSON persistence, a local Python process, local Strands/Ollama extraction when configured, and deterministic Python evaluation. It does not implement S3, DynamoDB, Bedrock, OpenSearch, Lambda, API Gateway, or any other Ship It cloud infrastructure. No AWS credentials are required.

## 12. Limitations

- Real Strands mode requires Python dependencies, Ollama, and a locally pulled model; those are not bundled.
- `DEMO_MODE` uses a small deterministic fallback and is not equivalent to an LLM extraction.
- Local JSON persistence is suitable for a demo, not concurrent production workloads.
- The example token scheme is local demo authorization, not a production identity provider.
- OCR requires a separately installed Tesseract binary on `PATH`.
- The frontend has build/lint and live-flow verification, but no dedicated frontend unit-test script.

## 13. Future improvements

- Add a real identity and session system appropriate for deployment.
- Replace JSON persistence with a transactional database if concurrency is needed.
- Add broader fixture coverage for PDFs, OCR, schema edge cases, and UI automation.
- Add audit history and review diffs for published notice changes.
- Improve extraction confidence and human review assistance without moving eligibility decisions into the model.

## Security and truthfulness notes

Uploaded files and pasted notices are untrusted. Uploads are limited to 10 MB, base64 is validated, structured output is closed-schema validated, model output is capped, and errors do not echo notice contents. URLs are validated but never fetched. The Python bridge uses `spawn` with argument arrays rather than a shell.

No API keys, passwords, private keys, or secret `.env` files belong in the repository. `.env` and `.env.local` are ignored; only non-secret `.env.example` templates are provided. The example tokens are placeholders for local demo use and must be replaced for any real deployment.
