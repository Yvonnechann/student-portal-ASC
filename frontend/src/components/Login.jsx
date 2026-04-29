import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // [VULN-2] The server returns distinct messages for unknown user vs wrong password.
        // This component faithfully renders whatever the server says, aiding enumeration.
        setError(data.error);
      } else {
        onLogin(data.user, data.token);
      }
    } catch {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <div className="login-logo">
          <h1>Uni<span>Portal</span></h1>
          <p>Student University Management System</p>
        </div>

        <div className="login-hint">
          <strong>Demo Accounts</strong>
          student1@uni.edu / student2@uni.edu / lecturer@uni.edu<br />
          Password: <code>password123</code>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              className="form-control"
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@uni.edu"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              className="form-control"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 6 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
