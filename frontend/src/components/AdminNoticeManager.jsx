import React, { useEffect, useRef, useState } from 'react';
import { createNotice, extractNotice, publishNotice, updateNotice } from '../services/noticeService';
import './AdminNoticeManager.css';

const SUPPORTED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'text/plain']);
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const EMPTY_NOTICE = {
  title: '', organization: '', type: '', description: '', branches: '', years: '',
  min_cgpa: '', max_active_backlogs: '', min_10th_percentage: '', min_12th_percentage: '',
  required_degree: '', documents: '', deadline: '', application_url: '', application_method: '',
  instructions: '', contact: ''
};

const STEPS = [
  { label: 'Source Document', sub: 'Upload or Paste' },
  { label: 'Strands Extraction', sub: 'Local Agent' },
  { label: 'Review & Edit', sub: 'Verify Facts' },
  { label: 'Publish Notice', sub: 'Live Evaluation' }
];

const fieldGroups = [
  { legend: 'Notice details', fields: [['title', 'Title'], ['organization', 'Organization'], ['type', 'Type'], ['description', 'Description', 'textarea']] },
  { legend: 'Eligibility facts', fields: [['branches', 'Branches', 'list', 'Comma separated'], ['years', 'Years', 'list', 'For example: 3, 4'], ['min_cgpa', 'Minimum CGPA', 'number'], ['max_active_backlogs', 'Maximum active backlogs', 'number'], ['min_10th_percentage', '10th requirement', 'number'], ['min_12th_percentage', '12th requirement', 'number'], ['required_degree', 'Degree']] },
  { legend: 'Application details', fields: [['documents', 'Documents', 'list', 'One per line'], ['deadline', 'Deadline'], ['application_url', 'Application URL', 'url'], ['application_method', 'Application method'], ['instructions', 'Instructions', 'list', 'One per line'], ['contact', 'Contact']] }
];

function Icon({ name, size = 16 }) {
  const paths = {
    upload: <><path d="M12 16V3m0 0-4 4m4-4 4 4" /><path d="M4 14v5h16v-5" /></>,
    file: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5M9 12h6M9 16h6" /></>,
    retry: <><path d="M20 11a8 8 0 1 0 2 5" /><path d="M20 4v7h-7" /></>,
    save: <><path d="M5 3h12l2 2v16H5z" /><path d="M8 3v6h8V3m-7 13h6" /></>,
    publish: <><path d="M4 12 20 4l-5 16-3-6z" /><path d="m12 14 8-10" /></>,
    warning: <><path d="M12 3 2.8 20h18.4z" /><path d="M12 9v4m0 3h.01" /></>,
    check: <path d="m5 12 4 4L19 6" />
  };
  return <svg className="admin-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function asForm(notice) {
  return Object.fromEntries(Object.keys(EMPTY_NOTICE).map((field) => {
    const value = notice?.[field];
    if (Array.isArray(value)) return [field, field === 'instructions' || field === 'documents' ? value.join('\n') : value.join(', ')];
    return [field, value ?? ''];
  }));
}

function optionalString(value) {
  const trimmed = String(value || '').trim();
  return trimmed || null;
}

function optionalNumber(value, integer = false) {
  if (String(value).trim() === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || (integer && !Number.isInteger(parsed))) return null;
  return parsed;
}

function listValue(value, numeric = false) {
  const values = String(value || '').split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
  if (!numeric) return values;
  return [...new Set(values.map(Number).filter((item) => Number.isInteger(item) && item > 0))].sort((a, b) => a - b);
}

function normalizeForm(form) {
  return {
    title: optionalString(form.title), organization: optionalString(form.organization), type: optionalString(form.type), description: optionalString(form.description),
    branches: listValue(form.branches), years: listValue(form.years, true),
    min_cgpa: optionalNumber(form.min_cgpa), max_active_backlogs: optionalNumber(form.max_active_backlogs, true),
    min_10th_percentage: optionalNumber(form.min_10th_percentage), min_12th_percentage: optionalNumber(form.min_12th_percentage),
    required_degree: optionalString(form.required_degree), documents: listValue(form.documents), deadline: optionalString(form.deadline),
    application_url: optionalString(form.application_url), application_method: optionalString(form.application_method), instructions: listValue(form.instructions), contact: optionalString(form.contact)
  };
}

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The uploaded file could not be read.'));
    reader.onload = () => resolve(String(reader.result).split(',').pop());
    reader.readAsDataURL(file);
  });
}

function mimeForFile(file) {
  if (file?.type) return file.type;
  const extension = file?.name?.slice(file.name.lastIndexOf('.')).toLowerCase();
  return { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.txt': 'text/plain' }[extension] || '';
}

export const AdminNoticeManager = ({ onNavigateImpact }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [textPreview, setTextPreview] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [form, setForm] = useState(EMPTY_NOTICE);
  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState('');
  const [noticeId, setNoticeId] = useState(null);
  const [sourceLabel, setSourceLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const setUploadedFile = async (nextFile) => {
    setError('');
    setNoticeId(null);
    setForm(EMPTY_NOTICE);
    if (!nextFile) return;
    const mimeType = mimeForFile(nextFile);
    if (!SUPPORTED_TYPES.has(mimeType) || nextFile.size > MAX_FILE_BYTES) {
      setFile(null);
      setPreviewUrl(null);
      setTextPreview('');
      setPhase('failure');
      setError('Use a PDF, PNG, JPG, or TXT file no larger than 10 MB.');
      return;
    }
    if (nextFile.size === 0) {
      setFile(nextFile);
      setPhase('failure');
      setError('This file is empty. Upload a notice with readable content.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setPhase('uploading');
    setTextPreview(mimeType === 'text/plain' ? await nextFile.text() : '');
  };

  const runExtraction = async () => {
    if (!file && !pastedText.trim()) {
      setError('Upload a notice file or paste the notice text before extracting.');
      return;
    }
    setBusy(true);
    setError('');
    setPhase(file ? 'processing' : 'extracting');
    try {
      let payload;
      if (file) {
        const data = await readAsBase64(file);
        setPhase('extracting');
        payload = { file: { name: file.name, mimeType: mimeForFile(file), data } };
      } else {
        payload = { text: pastedText };
      }
      const result = await extractNotice(payload);
      setPhase('review');
      setForm(asForm(result.notice));
      setSourceLabel(result.extractionLabel);
    } catch (requestError) {
      setPhase('failure');
      setError(requestError.message || 'Extraction failed. Check the local Strands and OCR services, then retry.');
    } finally {
      setBusy(false);
    }
  };

  const recordFromForm = () => {
    const structuredNotice = normalizeForm(form);
    return {
      title: structuredNotice.title,
      organization: structuredNotice.organization,
      opportunityType: structuredNotice.type,
      shortDescription: structuredNotice.description,
      deadline: structuredNotice.deadline,
      application_url: structuredNotice.application_url,
      extractionSource: sourceLabel,
      originalDocumentName: file?.name || null,
      structuredNotice,
      criteria: {
        eligible_branches: structuredNotice.branches,
        eligible_years: structuredNotice.years,
        min_cgpa: structuredNotice.min_cgpa,
        max_active_backlogs: structuredNotice.max_active_backlogs,
        min_tenth_percentage: structuredNotice.min_10th_percentage,
        min_twelfth_percentage: structuredNotice.min_12th_percentage,
        eligible_degrees: structuredNotice.required_degree ? [structuredNotice.required_degree] : null
      }
    };
  };

  const saveDraft = async () => {
    if (phase !== 'review') return;
    setBusy(true);
    setError('');
    try {
      const record = recordFromForm();
      const result = noticeId ? await updateNotice(noticeId, record) : await createNotice(record);
      setNoticeId(result.notice.id);
    } catch (saveError) {
      setError(saveError.message || 'The draft could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    const normalized = normalizeForm(form);
    if (!normalized.title || !normalized.deadline) {
      setError('Title and deadline must be reviewed before publishing. Unknown optional requirements may remain empty.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const record = recordFromForm();
      let id = noticeId;
      if (!id) {
        const created = await createNotice(record);
        id = created.notice.id;
        setNoticeId(id);
      } else {
        await updateNotice(id, record);
      }
      await updateNotice(id, { ...record, status: 'reviewed' });
      await publishNotice(id);
      setPhase('published');
    } catch (publishError) {
      setError(publishError.message || 'The notice could not be published.');
    } finally {
      setBusy(false);
    }
  };

  const statusText = phase === 'uploading' ? 'Uploading' : phase === 'processing' ? 'Processing' : phase === 'extracting' ? 'Extracting' : phase === 'review' ? 'Review Required' : phase === 'published' ? 'Published' : phase === 'failure' ? 'Extraction Failed' : 'Awaiting upload';
  const fileMimeType = mimeForFile(file);
  const previewKind = fileMimeType === 'application/pdf' ? 'pdf' : fileMimeType.startsWith('image/') ? 'image' : fileMimeType === 'text/plain' ? 'text' : 'empty';

  return <section className="admin-notice-manager" aria-label="Admin notice management">
    <header className="admin-notice-heading admin-reveal">
      <div>
        <span className="admin-eyebrow">Notice management</span>
        <h1>Review the source. Publish only the facts.</h1>
        <p>Local file processing, Strands extraction, schema validation, and an explicit admin review gate.</p>
      </div>
      <span className={`admin-status admin-status-${phase}`}><span className="admin-status-dot" />{statusText}</span>
    </header>

    <ol className="admin-pipeline" aria-label="Notice processing stages">
      {STEPS.map((step, index) => {
        const activeIndex = phase === 'idle' ? 0 : phase === 'uploading' || phase === 'processing' || phase === 'extracting' ? 1 : phase === 'review' ? 2 : phase === 'published' ? 3 : -1;
        const isCompleted = index < activeIndex || phase === 'published';
        const isCurrent = index === activeIndex && phase !== 'published';
        return (
          <li key={step.label} className={`${isCompleted ? 'complete' : ''} ${isCurrent ? 'current' : ''}`}>
            <span>{isCompleted ? '✓' : index + 1}</span>
            <div>
              <strong>{step.label}</strong>
              <small>{step.sub}</small>
            </div>
          </li>
        );
      })}
    </ol>

    <div className="admin-workspace">
      <article className="admin-document-panel admin-reveal" style={{ '--index': 0 }}>
        <div className="admin-panel-title">
          <div><span className="admin-panel-overline">Original notice</span><h2>Document preview</h2></div>
          {file && <span className="admin-file-name"><Icon name="file" size={14} />{file.name}</span>}
        </div>

        {!file && !pastedText && <label className="admin-dropzone" htmlFor="notice-file-input">
          <Icon name="upload" size={22} />
          <strong>Choose a notice document</strong>
          <span>PDF, PNG, JPG, or TXT · up to 10 MB</span>
          <input ref={inputRef} id="notice-file-input" type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,application/pdf,image/png,image/jpeg,text/plain" onChange={(event) => setUploadedFile(event.target.files?.[0])} />
        </label>}

        {file && <div className="admin-preview-frame">
          {previewKind === 'image' && <img src={previewUrl} alt={`Original notice: ${file.name}`} />}
          {previewKind === 'pdf' && <iframe title={`Original notice: ${file.name}`} src={previewUrl} />}
          {previewKind === 'text' && <pre>{textPreview}</pre>}
          <label className="admin-replace-file" htmlFor="notice-file-input"><Icon name="upload" size={14} />Replace document<input ref={inputRef} id="notice-file-input" type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,application/pdf,image/png,image/jpeg,text/plain" onChange={(event) => setUploadedFile(event.target.files?.[0])} /></label>
        </div>}

        {!file && <div className="admin-text-source"><label htmlFor="pasted-notice">Or paste notice text</label><textarea id="pasted-notice" value={pastedText} onChange={(event) => { setPastedText(event.target.value); setError(''); }} placeholder="Paste the original notice exactly as received." rows={9} /></div>}

        <div className="admin-document-actions">
          <button type="button" className="admin-secondary-button" onClick={() => inputRef.current?.click()}><Icon name="upload" />{file ? 'Replace file' : 'Select file'}</button>
          <button type="button" className="admin-primary-button" disabled={busy || (!file && !pastedText.trim())} onClick={runExtraction}><Icon name={phase === 'failure' ? 'retry' : 'file'} />{phase === 'failure' ? 'Retry extraction' : 'Extract requirements'}</button>
        </div>
        {error && <div className="admin-error" role="alert"><Icon name="warning" /> <span>{error}</span></div>}
      </article>

      <article className="admin-extraction-panel admin-reveal" style={{ '--index': 1 }}>
        <div className="admin-panel-title admin-extraction-title">
          <div>
            <span className="admin-panel-overline">Structured notice</span>
            <h2>{sourceLabel || 'Extracted by local Strands agent'}</h2>
            <p>Review before publishing</p>
          </div>
          {phase === 'review' && <span className="admin-validation-mark"><Icon name="check" />Schema valid</span>}
          {phase === 'published' && <span className="admin-validation-mark"><Icon name="check" />Published</span>}
        </div>

        {phase === 'review' && (
          <div className="admin-review-callout">
            <div className="admin-review-callout-header">
              <span className="admin-review-callout-badge">
                <Icon name="check" size={13} />
                Extracted by local Strands agent
              </span>
              <span className="admin-review-callout-hint">Review before publishing · Edit if necessary</span>
            </div>
            <p className="admin-review-callout-text">
              Carefully review extracted criteria below. Modify any field directly if necessary before publishing to student dashboards.
            </p>
          </div>
        )}

        {phase === 'published' && (
          <div className="admin-published-callout">
            <div className="admin-published-badge">
              <Icon name="check" size={14} />
              <span>Notice Published Live</span>
            </div>
            <p className="admin-published-text">
              The notice has been published. Deterministic eligibility rules are now actively evaluating against all institutional student records.
            </p>
            {onNavigateImpact && (
              <button
                type="button"
                className="admin-primary-button"
                onClick={onNavigateImpact}
                style={{ marginTop: '14px' }}
              >
                <span>View Cohort Impact Analysis →</span>
              </button>
            )}
          </div>
        )}

        {phase !== 'review' && phase !== 'published' ? (
          <div className="admin-empty-extraction">
            <Icon name={phase === 'failure' ? 'warning' : 'file'} size={24} />
            <h3>{phase === 'failure' ? 'No draft was created' : 'Requirements appear here after extraction'}</h3>
            <p>{phase === 'failure' ? 'Your document is still available on the left. Resolve the local extraction issue and retry.' : 'Every field remains empty until the local pipeline returns validated JSON.'}</p>
          </div>
        ) : (
          <>
            <form className="admin-fields" onSubmit={(event) => event.preventDefault()}>
              {fieldGroups.map((group) => (
                <fieldset key={group.legend}>
                  <legend>{group.legend}</legend>
                  <div className="admin-fields-grid">
                    {group.fields.map(([name, label, kind = 'text', hint]) => (
                      <label key={name} className={kind === 'textarea' ? 'admin-field admin-field-wide' : 'admin-field'}>
                        <span>{label}</span>
                        {kind === 'textarea' ? (
                          <textarea value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} rows={4} />
                        ) : (
                          <input
                            type={kind === 'number' ? 'number' : kind === 'url' ? 'url' : 'text'}
                            inputMode={kind === 'number' ? 'decimal' : undefined}
                            value={form[name]}
                            placeholder={hint || 'Unknown'}
                            onChange={(event) => setForm({ ...form, [name]: event.target.value })}
                          />
                        )}
                        {hint && kind !== 'textarea' && <small>{hint}</small>}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </form>
            <footer className="admin-publish-bar">
              <div>
                <strong>{phase === 'published' ? 'Live on Student Feeds' : noticeId ? 'Draft saved locally' : 'Review in progress'}</strong>
                <span>{phase === 'published' ? 'Notice is now live for all eligible students.' : 'Save preserves the review state. Publish requires a reviewed title and deadline.'}</span>
              </div>
              <div className="admin-publish-actions">
                <button type="button" className="admin-secondary-button" disabled={busy || phase === 'published'} onClick={saveDraft}>
                  <Icon name="save" />Save Draft
                </button>
                <button type="button" className="admin-primary-button" disabled={busy || phase === 'published'} onClick={publish}>
                  <Icon name="publish" />{phase === 'published' ? 'Published' : 'Publish'}
                </button>
              </div>
            </footer>
          </>
        )}
      </article>
    </div>
  </section>;
};

export default AdminNoticeManager;
