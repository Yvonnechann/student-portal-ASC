import React, { useEffect, useState } from 'react';

export default function Messages({ user, token }) {
  const [inbox, setInbox] = useState([]);
  const [users, setUsers] = useState([]);
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(user.role === 'lecturer' ? 'compose' : 'inbox');

  useEffect(() => {
    fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setInbox(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));

    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setUsers(list);
        if (list.length > 0) setRecipientId(String(list[0].id));
      });
  }, [token]);

  async function handleSend(e) {
    e.preventDefault();
    setError(''); setStatus('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        // [VULN-4] HTML/JS in subject or body is sent and stored as-is
        body: JSON.stringify({ recipient_id: recipientId, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStatus('Message sent successfully.');
      setSubject(''); setBody('');
    } catch {
      setError('Failed to send message');
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className={`btn${view === 'inbox' ? ' btn-primary' : ''}`}
          style={view !== 'inbox' ? { background: '#e8edf3', color: '#445' } : {}}
          onClick={() => setView('inbox')}
        >
          Inbox {inbox.length > 0 && `(${inbox.length})`}
        </button>
        <button
          className={`btn${view === 'compose' ? ' btn-primary' : ''}`}
          style={view !== 'compose' ? { background: '#e8edf3', color: '#445' } : {}}
          onClick={() => setView('compose')}
        >
          Compose
        </button>
      </div>

      {view === 'inbox' && (
        <div className="card">
          <h2>Inbox</h2>
          {loading ? (
            <p>Loading…</p>
          ) : inbox.length === 0 ? (
            <div className="empty-state">Your inbox is empty.</div>
          ) : (
            inbox.map(msg => (
              <div key={msg.id} className="msg-card">
                <div className="msg-card-header">
                  <span className="msg-from">From: {msg.sender_name} &lt;{msg.sender_email}&gt;</span>
                  <span className="msg-time">{new Date(msg.sent_at).toLocaleString()}</span>
                </div>
                <div className="msg-subject">Subject: {msg.subject}</div>
                <div className="msg-body">{msg.body}</div>
              </div>
            ))
          )}
        </div>
      )}

      {view === 'compose' && (
        <div className="card">
          <h2>Compose Message</h2>
          {error  && <div className="alert alert-error">{error}</div>}
          {status && <div className="alert alert-success">{status}</div>}
          <form onSubmit={handleSend}>
            <div className="form-group">
              <label>To</label>
              <select className="form-control" value={recipientId} onChange={e => setRecipientId(e.target.value)} required>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) — {u.role}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subject</label>
              {/* [VULN-4] No sanitisation on subject input */}
              <input
                className="form-control"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Message subject"
                required
              />
            </div>
            <div className="form-group">
              <label>Message Body</label>
              {/* [VULN-4] No sanitisation — raw HTML accepted and stored */}
              <textarea
                className="form-control"
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Type your message here… HTML tags are supported."
                required
              />
              <small style={{ color: '#889', fontSize: '0.78rem' }}>Tip: HTML formatting is supported in messages.</small>
            </div>
            <button className="btn btn-primary">Send Message</button>
          </form>
        </div>
      )}
    </>
  );
}
