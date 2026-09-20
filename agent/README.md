# Local Strands Notice Extraction

NoticeLens uses the open-source AWS Strands Agents SDK only for extracting facts from unstructured college notices. It runs against a local Ollama model and does not use Bedrock, OpenAI, Gemini, hosted APIs, or cloud deployment.

The agent does:

- Extract the fields defined in `notice_schema.json`.
- Return `null` or `[]` when a fact is absent or ambiguous.
- Produce JSON that is validated before the application receives it.

The agent does not:

- Determine student eligibility.
- Publish notices.
- Invent requirements that are not in the source text.

## Local Strands mode

Install the Python dependency and a local Ollama model:

```bash
pip install -r agent/requirements.txt
ollama serve
ollama pull llama3.2
```

Use Python 3.10+ for real Strands mode. PDF text extraction uses `pypdf`; image text extraction uses the locally installed Tesseract binary through `pytesseract` (for example, install Tesseract OCR locally and ensure `tesseract` is on `PATH`). Neither sends notice content to a hosted service.

Run extraction directly from text or a local text-based notice file:

```bash
python -m agent.cli --mode STRANDS --text "Paste a college notice here"
python -m agent.cli --mode STRANDS --file sample-data/sample_notices/placement_drive.txt
```

The backend uses the same runner through `POST /api/notices/extract`. `OLLAMA_HOST` is restricted to localhost/loopback, preventing accidental use of a hosted model. Malformed JSON, missing fields, wrong types, unexpected fields, unsafe URLs, and extraction failures are rejected with no notice being created or published. Set `OLLAMA_MODEL` when needed.

## Demo mode

When a local model is unavailable, opt into the deterministic demonstration fallback:

```bash
$env:DEMO_MODE="true"          # PowerShell
set DEMO_MODE=true              # cmd.exe
```

The response is visibly labeled `DEMO_MODE fallback (not Strands execution)`. It is never labeled as real Strands output.
