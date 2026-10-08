import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, getAuthToken, setAuthToken } from '../api';
import PropertyCard from '../components/PropertyCard';
import { User, Mail, Heart, LogOut, Edit3, Check, Sparkles } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }
    loadUserData();
  }, []);

  async function loadUserData() {
    setIsLoading(true);
    try {
      const [profileRes, favRes] = await Promise.all([
        api.getProfile(),
        api.getFavorites()
      ]);

      if (profileRes && profileRes.user) {
        setUser(profileRes.user);
        setEditName(profileRes.user.fullName || '');
      }
      if (favRes && favRes.favorites) {
        setFavorites(favRes.favorites.map((f) => f.propertySnapshot));
      }
    } catch (err) {
      console.error('Failed to load user profile', err);
      setAuthToken(null);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.updateProfile({ fullName: editName });
      if (res && res.user) {
        setUser(res.user);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogout() {
    setAuthToken(null);
    navigate('/');
  }

  function handleRemoveFav(propertyId) {
    setFavorites((prev) => prev.filter((p) => p.id !== propertyId));
  }

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-slate)' }}>Loading user profile & saved properties...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        {/* Profile Card */}
        <div className="card" style={{ padding: '32px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <img
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.fullName || 'User')}`}
                alt="Avatar"
                style={{ width: '72px', height: '72px', borderRadius: '50%', border: '3px solid var(--color-gold)', background: '#fff' }}
              />
              <div>
                {!isEditing ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy)' }}>
                        {user?.fullName}
                      </h1>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-slate)' }}
                        title="Edit Name"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-slate)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <Mail size={14} /> {user?.email}
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '15px' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px' }} disabled={isSaving}>
                      <Check size={14} /> Save
                    </button>
                    <button type="button" className="btn btn-outline" style={{ padding: '8px 14px' }} onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              style={{ color: 'var(--color-rose)', borderColor: '#fca5a5' }}
              onClick={handleLogout}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Saved Favorites Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Heart size={20} color="var(--color-rose)" fill="var(--color-rose)" />
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-navy)' }}>
              Saved Properties ({favorites.length})
            </h2>
          </div>

          {favorites.length === 0 ? (
            <div className="card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-slate)' }}>
              <Heart size={42} style={{ margin: '0 auto 12px', color: 'var(--color-slate-light)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-navy)' }}>
                No Saved Favorites Yet
              </h3>
              <p style={{ maxWidth: '420px', margin: '6px auto 20px', fontSize: '14px' }}>
                Browse verified properties across Maharashtra and click the heart icon to save them to your account.
              </p>
              <Link to="/properties" className="btn btn-primary">
                Browse Verified Properties
              </Link>
            </div>
          ) : (
            <div className="property-grid">
              {favorites.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  isFavorite={true}
                  onToggleFavorite={handleRemoveFav}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
