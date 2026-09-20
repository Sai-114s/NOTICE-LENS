import React, { useEffect, useMemo, useState } from 'react';
import { getNoticeImpact, getPublishedNotices } from '../services/noticeService';
import './AdminImpactAnalysis.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'eligible', label: 'Eligible' },
  { id: 'not-eligible', label: 'Not Eligible' },
  { id: 'needs-info', label: 'Needs Information' }
];

const STATUS_LABELS = {
  eligible: 'Eligible',
  'not-eligible': 'Not Eligible',
  'needs-info': 'Needs Information'
};

function formatValue(value) {
  return value === null || value === undefined ? '—' : value;
}

function SummaryCard({ label, value, status }) {
  return (
    <div className={`impact-summary-card impact-summary-${status || 'neutral'}`}>
      <span className="impact-summary-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function AdminImpactAnalysis() {
  const [notices, setNotices] = useState([]);
  const [selectedNoticeId, setSelectedNoticeId] = useState('');
  const [results, setResults] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getPublishedNotices()
      .then((data) => {
        if (!active) return;
        const published = (data.notices || []).filter((notice) => notice.status === 'published' || !notice.status);
        setNotices(published);
        setSelectedNoticeId((current) => current || published[0]?.id || '');
      })
      .catch((requestError) => active && setError(requestError.message || 'Published notices could not be loaded.'))
      .finally(() => active && setLoadingNotices(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedNoticeId) return undefined;
    let active = true;
    setLoadingImpact(true);
    setError('');
    getNoticeImpact(selectedNoticeId)
      .then((data) => active && setResults(data.results || []))
      .catch((requestError) => active && setError(requestError.message || 'Impact analysis could not be loaded.'))
      .finally(() => active && setLoadingImpact(false));
    return () => { active = false; };
  }, [selectedNoticeId]);

  const counts = useMemo(() => results.reduce((summary, result) => {
    summary.evaluated += 1;
    if (result.status === 'eligible') summary.eligible += 1;
    if (result.status === 'not-eligible') summary.notEligible += 1;
    if (result.status === 'needs-info') summary.needsInfo += 1;
    return summary;
  }, { evaluated: 0, eligible: 0, notEligible: 0, needsInfo: 0 }), [results]);

  const visibleResults = useMemo(
    () => filter === 'all' ? results : results.filter((result) => result.status === filter),
    [filter, results]
  );

  const selectedNotice = notices.find((notice) => notice.id === selectedNoticeId);

  return (
    <section className="admin-impact" aria-labelledby="impact-title">
      <header className="impact-heading">
        <div>
          <span className="impact-eyebrow">Admin analysis</span>
          <h1 id="impact-title">Notice impact</h1>
          <p>See how one published notice evaluates across the current student profiles.</p>
        </div>
        <div className="impact-data-label">Demo student data</div>
      </header>

      <div className="impact-toolbar">
        <label htmlFor="impact-notice">Published notice</label>
        <select
          id="impact-notice"
          value={selectedNoticeId}
          onChange={(event) => { setSelectedNoticeId(event.target.value); setFilter('all'); }}
          disabled={loadingNotices || notices.length === 0}
        >
          {notices.length === 0 && <option value="">No published notices</option>}
          {notices.map((notice) => <option key={notice.id} value={notice.id}>{notice.title}</option>)}
        </select>
      </div>

      {error && <div className="impact-error" role="alert">{error}</div>}

      {selectedNotice && (
        <div className="impact-context">
          <span>{selectedNotice.organization || 'Published notice'}</span>
          <strong>{selectedNotice.title}</strong>
        </div>
      )}

      <div className="impact-summary-grid" aria-label="Eligibility summary">
        <SummaryCard label="Students Evaluated" value={counts.evaluated} />
        <SummaryCard label="Eligible" value={counts.eligible} status="eligible" />
        <SummaryCard label="Not Eligible" value={counts.notEligible} status="not-eligible" />
        <SummaryCard label="Needs Information" value={counts.needsInfo} status="needs-info" />
      </div>

      <div className="impact-engine-note">Eligibility calculated by deterministic NoticeLens rules engine.</div>

      <div className="impact-filters" role="tablist" aria-label="Eligibility status filters">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={filter === item.id ? 'active' : ''}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="impact-table-wrap">
        {loadingImpact ? <p className="impact-empty">Calculating student outcomes…</p> : (
          <table className="impact-table">
            <caption className="sr-only">Student eligibility results for the selected published notice</caption>
            <thead>
              <tr><th>Student</th><th>Branch</th><th>Year</th><th>CGPA</th><th>Status</th><th>Reason</th></tr>
            </thead>
            <tbody>
              {visibleResults.map((result) => (
                <tr key={`${result.student}-${result.branch}`}>
                  <td className="impact-student">{formatValue(result.student)}</td>
                  <td>{formatValue(result.branch)}</td>
                  <td>{formatValue(result.year)}</td>
                  <td>{formatValue(result.cgpa)}</td>
                  <td><span className={`impact-status impact-status-${result.status}`}>{STATUS_LABELS[result.status] || result.status}</span></td>
                  <td className="impact-reason">{result.reason}</td>
                </tr>
              ))}
              {!visibleResults.length && <tr><td colSpan="6" className="impact-empty">No students match this filter.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
