import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Heart, User, ShieldCheck, Menu, X } from 'lucide-react';
import { api, getAuthToken } from '../api';

export default function Navbar() {
  const location = useLocation();
  const [favCount, setFavCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getProfile()
        .then((res) => {
          if (res && res.user) setCurrentUser(res.user);
        })
        .catch(() => setCurrentUser(null));

      api.getFavorites()
        .then((res) => {
          if (res && res.favorites) setFavCount(res.favorites.length);
        })
        .catch(() => setFavCount(0));
    } else {
      setCurrentUser(null);
      setFavCount(0);
    }
  }, [location.pathname]);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Buy', path: '/properties' },
    { label: 'Market', path: '/market' },
    { label: 'Compare', path: '/compare' },
    { label: 'AI Advisor', path: '/ai-advisor' },
    { label: 'List Property', path: '/list-property' }
  ];

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="nav-brand">
          <Compass size={28} />
          <span>TerraFind</span>
          <span className="nav-brand-badge">NAGPUR</span>
        </Link>

        {/* Desktop Links */}
        <ul className="nav-links">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Nav Actions */}
        <div className="nav-actions">
          <Link
            to="/profile"
            className="btn btn-outline"
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-full)' }}
            title="Saved Favorites"
          >
            <Heart size={16} color="var(--color-rose)" fill={favCount > 0 ? "var(--color-rose)" : "none"} />
            <span>{favCount}</span>
          </Link>

          {currentUser ? (
            <Link
              to="/profile"
              className="btn btn-primary"
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
            >
              <User size={16} />
              <span>{currentUser.fullName || 'Profile'}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary"
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
            >
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className="btn btn-outline mobile-toggle"
            style={{ display: 'none', padding: '8px' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '72px',
            left: 0,
            right: 0,
            background: '#ffffff',
            borderBottom: '1px solid var(--color-border)',
            padding: '20px',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: location.pathname === item.path ? 'var(--color-navy)' : 'var(--color-slate)',
                  padding: '8px 0'
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
