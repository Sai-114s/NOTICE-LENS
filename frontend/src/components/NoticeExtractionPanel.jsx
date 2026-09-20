import React, { useState } from 'react';
import { FileSearch, LoaderCircle, ShieldCheck } from 'lucide-react';
import { extractNotice } from '../services/noticeService';

const SAMPLE_NOTICE = `Campus placement drive by Vertex Core Technologies. Open to CSE and IT students in 3rd or 4th year with CGPA 7.5 or above and no active backlogs. Apply through the college placement portal before 23 September at 5 PM.`;

export const NoticeExtractionPanel = () => {
  const [text, setText] = useState(SAMPLE_NOTICE);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExtract = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await extractNotice(text));
    } catch (requestError) {
      setResult(null);
      setError(requestError.message || 'Unable to extract notice facts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notice-extraction-panel">
      <div className="notice-extraction-header">
        <div>
          <span className="notice-extraction-kicker"><FileSearch size={14} /> Local notice extraction</span>
          <h3>Turn a notice into a reviewable draft</h3>
          <p>Facts are extracted locally, validated against the strict schema, and never published automatically.</p>
        </div>
        <span className="extraction-source-label"><ShieldCheck size={14} /> Local-only extraction · source shown below</span>
      </div>

      <textarea
        className="notice-extraction-input"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Paste an unstructured college notice"
        aria-label="Unstructured college notice"
        rows={6}
      />
      <button type="button" className="btn-apply-cta extraction-submit" onClick={handleExtract} disabled={loading || !text.trim()}>
        {loading ? <LoaderCircle size={15} className="spin" /> : <FileSearch size={15} />}
        <span>{loading ? 'Extracting locally...' : 'Extract for admin review'}</span>
      </button>

      {error && <p className="extraction-error" role="alert">{error}</p>}
      {result && (
        <div className="extraction-result" aria-live="polite">
          <div className="extraction-result-header">
            <div>
              <span className="extraction-source-label">{result.extractionLabel}</span>
              <h4>{result.notice.title || 'Incomplete notice'}</h4>
            </div>
            <span className="review-status">Draft · review required</span>
          </div>
          <pre>{JSON.stringify(result.notice, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default NoticeExtractionPanel;
