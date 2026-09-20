import React, { useEffect, useMemo, useState } from 'react';
import { getPublishedNotices } from '../services/noticeService';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import './NoticeSearch.css';

function searchableNotice(notice) {
  const structured = notice.structuredNotice || {};
  return JSON.stringify({
    title: notice.title,
    organization: notice.organization,
    type: notice.type || notice.opportunityType,
    deadline: notice.deadline,
    structured,
    criteria: notice.criteria,
    description: notice.description || notice.shortDescription,
    instructions: structured.instructions,
    documents: structured.documents
  }).toLowerCase();
}

function statusLabel(notice) {
  return notice.status === 'published' || !notice.status ? 'Published' : notice.status;
}

export default function NoticeSearch({ onNavigateNotice }) {
  const [notices, setNotices] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getPublishedNotices()
      .then((data) => active && setNotices((data.notices || []).filter((notice) => notice.status === 'published' || !notice.status)))
      .catch((requestError) => active && setError(requestError.message || 'Notices could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return notices;
    return notices.filter((notice) => searchableNotice(notice).includes(normalizedQuery));
  }, [notices, query]);

  if (loading) return <LoadingState count={3} />;
  if (error) return <ErrorState title="Notice search unavailable" message={error} onRetry={() => window.location.reload()} />;

  return (
    <section className="notice-search" aria-labelledby="notice-search-title">
      <header className="notice-search-heading">
        <div>
          <span className="notice-search-eyebrow">Published notices</span>
          <h1 id="notice-search-title">Find a notice</h1>
          <p>Search titles, organizations, requirements, deadlines, and structured notice details.</p>
        </div>
        <span className="notice-search-count">{results.length} result{results.length === 1 ? '' : 's'}</span>
      </header>

      <label className="notice-search-input-label" htmlFor="notice-search-input">Search notices</label>
      <input
        id="notice-search-input"
        className="notice-search-input"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Try TCS, internship, CSE, scholarship, CGPA, or deadline"
      />

      <div className="notice-search-results" aria-live="polite">
        {results.map((notice) => (
          <button
            className="notice-search-result"
            key={notice.id}
            type="button"
            onClick={() => onNavigateNotice(notice.id)}
          >
            <span className="notice-search-result-main">
              <strong>{notice.title || 'Untitled notice'}</strong>
              <span>{notice.organization || 'Organization not specified'}</span>
            </span>
            <span className="notice-search-result-field"><small>Type</small>{notice.type || notice.opportunityType || '—'}</span>
            <span className="notice-search-result-field"><small>Deadline</small>{notice.deadline || '—'}</span>
            <span className="notice-search-status">{statusLabel(notice)}</span>
          </button>
        ))}
        {!results.length && <p className="notice-search-empty">No published notices match “{query}”.</p>}
      </div>
    </section>
  );
}
