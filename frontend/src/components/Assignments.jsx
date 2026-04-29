import React, { useEffect, useState } from 'react';

const COURSES = [
  'CS101 - Intro to Programming',
  'CS202 - Data Structures',
  'CS301 - Algorithms',
  'MATH101 - Calculus I',
  'MATH201 - Linear Algebra',
  'ENG101 - Engineering Fundamentals',
  'ENG210 - Circuit Analysis',
];

export default function Assignments({ user, token }) {
  const [assignments, setAssignments] = useState([]);
  const [course, setCourse] = useState(COURSES[0]);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function loadAssignments() {
    fetch('/api/assignments', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setAssignments(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError('Failed to load assignments'); setLoading(false); });
  }

  useEffect(loadAssignments, [token]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) { setError('Please select a file'); return; }
    setError(''); setStatus('');

    const form = new FormData();
    form.append('file', file);
    form.append('course', course);

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStatus(`File "${data.original_name}" uploaded successfully.`);
      setFile(null);
      e.target.reset();
      loadAssignments();
    } catch {
      setError('Upload failed');
    }
  }

  return (
    <>
      {user.role === 'student' && (
        <div className="card">
          <h2>Submit Assignment</h2>
          <div className="alert alert-info" style={{ marginBottom: 14 }}>
            Upload your assignment file. All file types accepted.
          </div>
          {error  && <div className="alert alert-error">{error}</div>}
          {status && <div className="alert alert-success">{status}</div>}
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label>Course</label>
              <select className="form-control" value={course} onChange={e => setCourse(e.target.value)}>
                {COURSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Assignment File</label>
              <input
                className="form-control"
                type="file"
                onChange={e => setFile(e.target.files[0])}
                required
              />
              <small style={{ color: '#889', fontSize: '0.78rem' }}>Any file type accepted (PDF, DOCX, ZIP, etc.)</small>
            </div>
            <button className="btn btn-success">Upload Assignment</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>{user.role === 'lecturer' ? 'All Submitted Assignments' : 'My Submissions'}</h2>
        {loading ? (
          <p>Loading…</p>
        ) : assignments.length === 0 ? (
          <div className="empty-state">No assignments submitted yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                {user.role === 'lecturer' && <th>Student</th>}
                <th>Course</th>
                <th>File</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id}>
                  {user.role === 'lecturer' && <td style={{ fontWeight: 600 }}>{a.student_name}</td>}
                  <td>{a.course}</td>
                  <td>
                    {/* [VULN-3] File is served as-is — no content-type enforcement */}
                    <a href={`/uploads/${a.filename}`} target="_blank" rel="noreferrer" style={{ color: '#1a3a5c' }}>
                      {a.original_name}
                    </a>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#667' }}>
                    {new Date(a.submitted_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
