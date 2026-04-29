import React, { useEffect, useState } from 'react';

export default function Grades({ user, token }) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/grades', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setGrades(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError('Failed to load grades'); setLoading(false); });
  }, [token]);

  function gradeBadge(g) {
    if (!g) return '';
    const upper = g.toUpperCase();
    if (upper.startsWith('A')) return 'badge badge-grade-a';
    if (upper.startsWith('B')) return 'badge badge-grade-b';
    return 'badge badge-grade-c';
  }

  if (loading) return <div className="card"><p>Loading grades…</p></div>;
  if (error)   return <div className="card"><div className="alert alert-error">{error}</div></div>;

  return (
    <div className="card">
      <h2>{user.role === 'lecturer' ? 'All Student Grades' : 'My Grades'}</h2>
      {grades.length === 0 ? (
        <div className="empty-state">No grades recorded yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              {user.role === 'lecturer' && <th>Student</th>}
              <th>Course</th>
              <th>Grade</th>
              <th>Score</th>
              <th>Semester</th>
            </tr>
          </thead>
          <tbody>
            {grades.map(g => (
              <tr key={g.id}>
                {user.role === 'lecturer' && (
                  <td>
                    <div style={{ fontWeight: 600 }}>{g.student_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#889' }}>{g.student_email}</div>
                  </td>
                )}
                <td>{g.course}</td>
                <td><span className={gradeBadge(g.grade)}>{g.grade}</span></td>
                <td>{g.score}%</td>
                <td>{g.semester}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
