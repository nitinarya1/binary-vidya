'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import styles from './profile.module.css';
import { compressAvatar, formatBytes } from '../../lib/imageCompressor';
import {
  User as UserIcon,
  Mail,
  Calendar,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  BookOpen,
  Award,
  ShieldCheck,
  Sparkles,
  LogOut,
  ChevronRight,
  ArrowRight,
  Phone,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Aria&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nitin&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/identicon/svg?seed=BinaryCoder&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/shapes/svg?seed=CyberTech&backgroundColor=b6e3f4',
];

export default function UserProfilePage() {
  const router = useRouter();
  const { user, token, updateUser, logout, isLoading: authLoading } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer-not-to-say' | ''>('');
  const [avatar, setAvatar] = useState('');
  const [phone, setPhone] = useState('');

  // Initial loaded baseline for Discard / Reset
  const [initialData, setInitialData] = useState<{
    name: string;
    dateOfBirth: string;
    gender: string;
    avatar: string;
    phone: string;
  } | null>(null);

  // Page metrics & loading
  const [pageLoading, setPageLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: string;
    compressedSize: string;
    ratio: number;
  } | null>(null);

  const [stats, setStats] = useState({
    enrolledCount: 0,
    certificatesCount: 0,
  });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fetch full profile data
  useEffect(() => {
    async function loadProfile() {
      if (!user?.email) {
        setPageLoading(false);
        return;
      }

      try {
        setPageLoading(true);
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(user.email)}`, {
          headers,
        });
        const data = await res.json();

        if (data.success && data.user) {
          const u = data.user;
          const loaded = {
            name: u.name || user.name || '',
            dateOfBirth: u.dateOfBirth || user.dateOfBirth || '',
            gender: u.gender || user.gender || '',
            avatar: u.avatar || user.avatar || '',
            phone: u.phone || user.phone || '',
          };
          setName(loaded.name);
          setDateOfBirth(loaded.dateOfBirth);
          setGender((loaded.gender as any) || '');
          setAvatar(loaded.avatar);
          setPhone(loaded.phone);
          setInitialData(loaded);

          if (data.stats) {
            setStats({
              enrolledCount: data.stats.enrolledCount || 0,
              certificatesCount: data.stats.certificatesCount || 0,
            });
          }
        } else {
          // Fallback to AuthContext user
          const loaded = {
            name: user.name || '',
            dateOfBirth: user.dateOfBirth || '',
            gender: (user.gender as any) || '',
            avatar: user.avatar || '',
            phone: user.phone || '',
          };
          setName(loaded.name);
          setDateOfBirth(loaded.dateOfBirth);
          setGender((loaded.gender as any) || '');
          setAvatar(loaded.avatar);
          setPhone(loaded.phone);
          setInitialData(loaded);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setPageLoading(false);
      }
    }

    if (!authLoading) {
      loadProfile();
    }
  }, [user, token, authLoading]);

  // Handle Photo Upload with Auto-Compression
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMessage(null);
      const result = await compressAvatar(file);
      setAvatar(result.dataUrl);
      setCompressionInfo({
        originalSize: formatBytes(result.originalSize),
        compressedSize: formatBytes(result.compressedSize),
        ratio: result.reductionPercentage,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process image');
    }
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setAvatar('');
    setCompressionInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Choose preset avatar
  const handleSelectPresetAvatar = (url: string) => {
    setAvatar(url);
    setCompressionInfo(null);
  };

  // Reset form to loaded baseline
  const handleResetForm = () => {
    if (!initialData) return;
    setName(initialData.name);
    setDateOfBirth(initialData.dateOfBirth);
    setGender((initialData.gender as any) || '');
    setAvatar(initialData.avatar);
    setPhone(initialData.phone);
    setCompressionInfo(null);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // Save changes
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Full Legal Name cannot be empty.');
      return;
    }

    try {
      setSaveLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          email: user?.email,
          name: name.trim(),
          dateOfBirth: dateOfBirth.trim(),
          gender: gender,
          avatar: avatar,
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        // Update baseline
        setInitialData({
          name: data.user.name,
          dateOfBirth: data.user.dateOfBirth,
          gender: data.user.gender,
          avatar: data.user.avatar,
          phone: data.user.phone,
        });

        // Update global AuthContext & localStorage
        updateUser({
          name: data.user.name,
          dateOfBirth: data.user.dateOfBirth,
          gender: data.user.gender,
          avatar: data.user.avatar,
          phone: data.user.phone,
        });

        setSuccessMessage('Profile updated successfully! Your updated name will appear on all your certificates.');
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setErrorMessage(data.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Format date of birth helper
  const formatDatePreview = (dobStr: string) => {
    if (!dobStr) return '';
    try {
      const parts = dobStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    } catch (e) {}
    return dobStr;
  };

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navWrapper}>
          <Link href="/" className={styles.brandLink}>
            <div className={styles.brandLogo}>BV</div>
            <div>
              <div className={styles.brandName}>Binary Vidya</div>
              <div className={styles.brandTagline}>Technical Academy</div>
            </div>
          </Link>

          <div className={styles.navLinks}>
            <Link href="/courses" className={styles.navLink}>
              Courses
            </Link>
            <Link href="/my-learning" className={styles.navLink}>
              My Learning
            </Link>
            <Link href="/profile" className={`${styles.navLink} ${styles.navLinkActive}`}>
              Profile
            </Link>

            {user && (
              <div className={styles.userPill}>
                <div className={styles.userAvatar}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name || 'User'} />
                  ) : (
                    user.name ? user.name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <div className={styles.userName}>{user.name}</div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Sparkles size={13} /> Account &amp; Student Credentials
          </div>
          <h1 className={styles.heroTitle}>Student Profile &amp; Identity</h1>
          <p className={styles.heroSubtitle}>
            Manage your personal profile, full legal name, date of birth, gender, and avatar. This information is directly linked to your official course completion certificates and academic transcripts.
          </p>
        </div>
      </header>

      {/* Main Content Body */}
      {authLoading || pageLoading ? (
        <div style={{ padding: '80px 24px', textAlign: 'center', color: '#64748b' }}>
          Loading your student profile details...
        </div>
      ) : !user ? (
        <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '40px 24px' }}>
          <UserIcon size={54} color="#94a3b8" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Sign In to View Your Profile</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
            Please log in to your Binary Vidya account to manage your profile photo, legal name, date of birth, and credentials.
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#2563eb',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Go to Login <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <main className={styles.mainLayout}>
          <div className={styles.profileGrid}>
            {/* Left Sidebar: Profile Summary & Stats */}
            <aside className={styles.sidebarCard}>
              <div className={styles.largeAvatarContainer}>
                {avatar ? (
                  <img src={avatar} alt={name || 'User'} className={styles.largeAvatar} />
                ) : (
                  <div className={styles.largeAvatar}>
                    {name ? name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <button
                  type="button"
                  className={styles.cameraBadge}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile photo"
                >
                  <Camera size={16} />
                </button>
              </div>

              <h2 className={styles.profileDisplayName}>{name || 'Engineer'}</h2>
              <div className={styles.profileEmail}>{user.email}</div>

              <div
                className={`${styles.roleTag} ${
                  user.role === 'admin' ? styles.roleTagAdmin : styles.roleTagStudent
                }`}
              >
                <ShieldCheck size={13} />
                {user.role === 'admin' ? 'Super Admin' : 'Verified Student'}
              </div>

              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <div className={styles.statNum}>{stats.enrolledCount}</div>
                  <div className={styles.statLabel}>Enrolled Courses</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statNum}>{stats.certificatesCount}</div>
                  <div className={styles.statLabel}>Certificates</div>
                </div>
              </div>

              <div className={styles.infoBox}>
                <Award size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Official Transcripts Note:</strong> The legal name and details saved here will automatically appear on all your downloadable graduation certificates.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className={styles.profileLogoutBtn}
                id="profile-logout-btn"
              >
                <LogOut size={16} /> Sign Out of Account
              </button>
            </aside>

            {/* Right Main Form: Edit Profile */}
            <section className={styles.formCard}>
              {successMessage && (
                <div className={styles.alertSuccess}>
                  <CheckCircle2 size={18} />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className={styles.alertError}>
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveChanges}>
                {/* 1. Profile Photo Section */}
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <Camera size={18} color="#2563eb" />
                    <h3 className={styles.sectionTitle}>Profile Photo</h3>
                  </div>

                  <div className={styles.avatarControlRow}>
                    {avatar ? (
                      <img src={avatar} alt="Avatar Preview" className={styles.previewThumb} />
                    ) : (
                      <div
                        className={styles.previewThumb}
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '24px',
                        }}
                      >
                        {name ? name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}

                    <div className={styles.avatarActionBtns}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoSelect}
                        accept="image/png, image/jpeg, image/webp, image/gif"
                        style={{ display: 'none' }}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={styles.uploadPhotoBtn}
                      >
                        <Upload size={14} /> Upload Custom Photo
                      </button>

                      {avatar && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className={styles.removePhotoBtn}
                          title="Remove custom photo"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      )}

                      {compressionInfo && (
                        <div className={styles.compressionBadge}>
                          ⚡ Auto-Compressed: {compressionInfo.originalSize} → {compressionInfo.compressedSize} ({compressionInfo.ratio}% smaller)
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className={styles.presetGalleryTitle}>Or Select a Developer Avatar</div>
                    <div className={styles.presetGrid}>
                      {PRESET_AVATARS.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectPresetAvatar(url)}
                          className={`${styles.presetItem} ${avatar === url ? styles.presetItemActive : ''}`}
                          title={`Developer Avatar ${idx + 1}`}
                        >
                          <img src={url} alt={`Preset ${idx + 1}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Personal Information Section */}
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <UserIcon size={18} color="#2563eb" />
                    <h3 className={styles.sectionTitle}>Personal Details</h3>
                  </div>

                  {/* Legal Name */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Full Legal Name *</label>
                    <div className={styles.inputWrapper}>
                      <UserIcon size={16} className={styles.inputIcon} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Aditya Sharma"
                        className={styles.inputField}
                        required
                      />
                    </div>
                    <div className={styles.fieldHelper}>
                      Please enter your name accurately as you would like it to appear on your graduation certificates.
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Date of Birth</label>
                    <div className={styles.inputWrapper}>
                      <Calendar size={16} className={styles.inputIcon} />
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className={styles.inputField}
                      />
                    </div>
                    {dateOfBirth && (
                      <div className={styles.fieldHelper} style={{ color: '#2563eb', fontWeight: 600 }}>
                        Formatted: {formatDatePreview(dateOfBirth)}
                      </div>
                    )}
                  </div>

                  {/* Gender Selector */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Gender</label>
                    <div className={styles.genderGrid}>
                      {[
                        { id: 'male', label: 'Male', emoji: '👨' },
                        { id: 'female', label: 'Female', emoji: '👩' },
                        { id: 'other', label: 'Non-Binary / Other', emoji: '⚧️' },
                        { id: 'prefer-not-to-say', label: 'Prefer not to say', emoji: '🔒' },
                      ].map((item) => {
                        const isSelected = gender === item.id;
                        return (
                          <div
                            key={item.id}
                            className={`${styles.genderCard} ${isSelected ? styles.genderCardActive : ''}`}
                            onClick={() => setGender(item.id as any)}
                          >
                            <span className={styles.genderIcon}>{item.emoji}</span>
                            <span className={styles.genderLabel}>{item.label}</span>
                            {isSelected && (
                              <CheckCircle2 size={14} color="#2563eb" style={{ marginTop: '2px' }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Account Information */}
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <ShieldCheck size={18} color="#2563eb" />
                    <h3 className={styles.sectionTitle}>Account Credentials</h3>
                  </div>

                  {/* Email */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email Address</label>
                    <div className={styles.inputWrapper}>
                      <Mail size={16} className={styles.inputIcon} />
                      <input
                        type="email"
                        value={user.email}
                        readOnly
                        className={`${styles.inputField} ${styles.inputFieldReadOnly}`}
                      />
                    </div>
                    <div className={styles.fieldHelper}>
                      Your primary login email is verified and permanently linked to your account.
                    </div>
                  </div>

                  {/* Phone */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mobile Number (Optional)</label>
                    <div className={styles.inputWrapper}>
                      <Phone size={16} className={styles.inputIcon} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className={styles.inputField}
                      />
                    </div>
                    <div className={styles.fieldHelper}>
                      Used for critical account security alerts and OTP verification.
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className={styles.cancelBtn}
                    disabled={saveLoading}
                  >
                    <RotateCcw size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Reset
                  </button>

                  <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={saveLoading}
                  >
                    {saveLoading ? (
                      'Saving Changes...'
                    ) : (
                      <>
                        <Save size={16} /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </main>
      )}

      {/* Confirmation Modal Before Logout */}
      {showLogoutConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowLogoutConfirm(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIconBox}>
              <LogOut size={30} color="#ef4444" />
            </div>
            <h3 className={styles.modalTitle}>Are you sure you want to log out?</h3>
            <p className={styles.modalSubtitle}>
              You are about to sign out of your account (<strong>{user?.email}</strong>) on this device. You will need to sign back in with your credentials to access your courses and certificates.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className={styles.modalCancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  router.push('/login');
                }}
                className={styles.modalConfirmBtn}
                id="confirm-logout-btn"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
