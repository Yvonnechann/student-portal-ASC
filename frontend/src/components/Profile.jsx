import React, { useEffect, useState } from 'react';

export default function Profile({ user, token }) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setProfile(data);
        setName(data.name || '');
        setBio(data.bio || '');
        setPhone(data.phone || '');
        setWebsite(data.website || '');
      });
  }, [token]);

  async function handleUpdate(e) {
    e.preventDefault();
    setError(''); setStatus('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        // [VULN-5] No sanitisation — XSS payloads in any field are stored and later rendered
        body: JSON.stringify({ name, bio, phone, website }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStatus('Profile updated successfully.');
    } catch {
      setError('Failed to update profile');
    }
  }

  if (!profile) return <div className="card"><p>Loading profile…</p></div>;

  const initials = profile.name
    ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="card">
      <h2>My Profile</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div className="profile-avatar">{initials}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{profile.name}</div>
          <div style={{ fontSize: '0.85rem', color: '#889' }}>{profile.email}</div>
          <span className={`badge badge-${profile.role}`} style={{ marginTop: 4 }}>{profile.role}</span>
        </div>
      </div>

      {error  && <div className="alert alert-error">{error}</div>}
      {status && <div className="alert alert-success">{status}</div>}

      <form onSubmit={handleUpdate}>
        <div className="form-group">
          <label>Display Name</label>
          {/* [VULN-5] No maxLength or pattern enforcement */}
          <input className="form-control" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Bio</label>
          {/* [VULN-5] Bio field — HTML tags stored as-is and rendered with dangerouslySetInnerHTML */}
          <textarea className="form-control" value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="Tell us about yourself…" />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input className="form-control" value={phone} onChange={e => setPhone(e.target.value)}
                 placeholder="555-0100" />
        </div>
        <div className="form-group">
          <label>Website</label>
          {/* [VULN-5] No URL validation — javascript: URIs accepted */}
          <input className="form-control" value={website} onChange={e => setWebsite(e.target.value)}
                 placeholder="https://your-site.com" />
        </div>
        <button className="btn btn-success">Save Changes</button>
      </form>

      {/* Display profile fields rendered as HTML — demonstrates stored XSS */}
      {(profile.bio || profile.website || profile.phone) && (
        <div style={{ marginTop: 24, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: 10 }}>— Profile Preview —</p>
          {profile.bio && (
            <div style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: '0.82rem' }}>Bio: </strong>
              <span>{profile.bio}</span>
            </div>
          )}
          {profile.phone && (
            <div style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: '0.82rem' }}>Phone: </strong>
              <span>{profile.phone}</span>
            </div>
          )}
          {profile.website && (
            <div>
              <strong style={{ fontSize: '0.82rem' }}>Website: </strong>
              <a href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
