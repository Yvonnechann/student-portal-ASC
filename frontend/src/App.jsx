import React, { useState } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; color: #222; }

  .navbar {
    background: #1a3a5c;
    color: white;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  .navbar-brand { font-size: 1.2rem; font-weight: 700; letter-spacing: 0.5px; }
  .navbar-brand span { color: #f0c040; }
  .navbar-user { font-size: 0.85rem; opacity: 0.85; }
  .navbar-right { display: flex; align-items: center; gap: 16px; }
  .btn-logout {
    background: rgba(255,255,255,0.15);
    color: white;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 6px 14px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.82rem;
  }
  .btn-logout:hover { background: rgba(255,255,255,0.25); }

  .page-container { max-width: 1000px; margin: 32px auto; padding: 0 16px; }

  .card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    padding: 24px;
    margin-bottom: 24px;
  }
  .card h2 { font-size: 1.1rem; color: #1a3a5c; margin-bottom: 16px; border-bottom: 2px solid #e8edf3; padding-bottom: 10px; }

  .tab-bar { display: flex; gap: 4px; margin-bottom: 24px; flex-wrap: wrap; }
  .tab {
    padding: 9px 18px;
    border: none;
    background: #e8edf3;
    color: #445;
    border-radius: 6px 6px 0 0;
    cursor: pointer;
    font-size: 0.88rem;
    font-weight: 500;
  }
  .tab.active { background: white; color: #1a3a5c; border-bottom: 3px solid #1a3a5c; box-shadow: 0 -1px 4px rgba(0,0,0,0.08); }
  .tab:hover:not(.active) { background: #d4dce8; }

  .form-group { margin-bottom: 14px; }
  .form-group label { display: block; font-size: 0.82rem; font-weight: 600; color: #556; margin-bottom: 5px; }
  .form-control {
    width: 100%;
    padding: 9px 12px;
    border: 1px solid #cdd5df;
    border-radius: 5px;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .form-control:focus { border-color: #1a3a5c; }
  textarea.form-control { resize: vertical; min-height: 90px; }

  .btn {
    padding: 9px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.88rem;
    font-weight: 600;
    transition: opacity 0.15s;
  }
  .btn:hover { opacity: 0.88; }
  .btn-primary { background: #1a3a5c; color: white; }
  .btn-success { background: #2a8a4a; color: white; }
  .btn-sm { padding: 5px 12px; font-size: 0.8rem; }

  .alert {
    padding: 10px 14px;
    border-radius: 5px;
    font-size: 0.87rem;
    margin-bottom: 14px;
  }
  .alert-error { background: #fde8e8; color: #b30000; border-left: 4px solid #e53e3e; }
  .alert-success { background: #e8f5e9; color: #1b5e20; border-left: 4px solid #43a047; }
  .alert-info { background: #e3f0fb; color: #0d3a6b; border-left: 4px solid #1a3a5c; }

  table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
  th { background: #f0f3f8; color: #334; font-weight: 600; text-align: left; padding: 10px 12px; border-bottom: 2px solid #dde3ec; }
  td { padding: 10px 12px; border-bottom: 1px solid #edf1f7; vertical-align: top; }
  tr:hover td { background: #f7f9fc; }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
  }
  .badge-student { background: #dbeafe; color: #1d4ed8; }
  .badge-lecturer { background: #fef3c7; color: #92400e; }
  .badge-grade-a { background: #d1fae5; color: #065f46; }
  .badge-grade-b { background: #dbeafe; color: #1e40af; }
  .badge-grade-c { background: #fef9c3; color: #78350f; }

  .empty-state { text-align: center; padding: 40px; color: #88a; font-style: italic; }

  .login-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 100%);
  }
  .login-box { background: white; border-radius: 10px; padding: 40px; width: 100%; max-width: 400px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
  .login-logo { text-align: center; margin-bottom: 28px; }
  .login-logo h1 { font-size: 1.6rem; color: #1a3a5c; font-weight: 800; }
  .login-logo h1 span { color: #f0c040; }
  .login-logo p { font-size: 0.82rem; color: #889; margin-top: 4px; }
  .login-hint { background: #f0f3f8; border-radius: 6px; padding: 10px 14px; font-size: 0.8rem; color: #556; margin-bottom: 18px; }
  .login-hint strong { display: block; margin-bottom: 4px; color: #334; }

  .msg-card {
    border: 1px solid #e0e6f0;
    border-radius: 6px;
    padding: 14px 16px;
    margin-bottom: 12px;
    background: #fafbfd;
  }
  .msg-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .msg-from { font-weight: 600; font-size: 0.88rem; color: #1a3a5c; }
  .msg-time { font-size: 0.75rem; color: #99a; }
  .msg-subject { font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; }
  .msg-body { font-size: 0.85rem; color: #445; line-height: 1.5; }

  .profile-avatar {
    width: 64px; height: 64px;
    background: #1a3a5c;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 1.6rem; font-weight: 700;
    margin-bottom: 12px;
  }

  select.form-control { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M0 0l6 8 6-8z' fill='%23667'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
`;

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('portal_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('portal_token') || '');

  function handleLogin(userData, jwt) {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('portal_user', JSON.stringify(userData));
    localStorage.setItem('portal_token', jwt);
  }

  function handleLogout() {
    setUser(null);
    setToken('');
    localStorage.removeItem('portal_user');
    localStorage.removeItem('portal_token');
  }

  return (
    <>
      <style>{styles}</style>
      {user ? (
        <>
          <nav className="navbar">
            <div className="navbar-brand">Uni<span>Portal</span></div>
            <div className="navbar-right">
              <span className="navbar-user">
                {user.name} &nbsp;
                <span className={`badge badge-${user.role}`}>{user.role}</span>
              </span>
              <button className="btn-logout" onClick={handleLogout}>Log out</button>
            </div>
          </nav>
          <Dashboard user={user} token={token} />
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}
