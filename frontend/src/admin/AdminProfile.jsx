import { useEffect, useState } from 'react'
import { KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { authApi } from '../services/api.js'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { formatDate } from '../utils/format.js'

const EMPTY_FORM = {
  username: '',
  email: '',
  current_password: '',
  new_password: '',
  confirm_password: ''
}

export default function AdminProfile() {
  const { refresh } = useAdminAuth()
  const { showToast } = useToast()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.title = 'Admin — Profile'
    authApi.profile()
      .then((data) => {
        setProfile(data)
        setForm((current) => ({
          ...current,
          username: data.username || '',
          email: data.email || ''
        }))
      })
      .catch(() => setProfile(false))
  }, [])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (form.new_password && form.new_password !== form.confirm_password) {
      showToast('The new passwords do not match.', 'error')
      return
    }

    setSaving(true)
    try {
      const result = await authApi.updateProfile(form)
      setProfile((current) => ({ ...current, ...result.admin }))
      setForm((current) => ({
        ...current,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }))
      await refresh()
      showToast(result.password_changed ? 'Profile and password updated.' : 'Profile updated.')
    } catch (error) {
      showToast(error?.message || 'Unable to update the profile.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (profile === null) return <LoadingState label="Loading profile…" />

  if (profile === false) {
    return <div className="admin-content"><p>Unable to load the admin profile.</p></div>
  }

  return (
    <section className="admin-profile-page">
      <div className="admin-content admin-profile-content">
        <header className="admin-profile-hero">
          <div>
            <span className="admin-profile-eyebrow">Account / Security</span>
            <h2>Studio profile</h2>
            <p>Manage the identity and credentials used to access this workspace.</p>
          </div>
          <div className="admin-profile-avatar" aria-hidden="true">
            {(profile.username || 'A').charAt(0).toUpperCase()}
          </div>
        </header>

        <div className="admin-profile-grid">
          <aside className="admin-profile-summary">
            <span className="admin-profile-summary__label">Signed in as</span>
            <strong>{profile.username}</strong>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <div className="admin-profile-summary__meta">
              <ShieldCheck size={17} />
              <span>Administrator<br />Member since {formatDate(profile.created_at)}</span>
            </div>
          </aside>

          <form className="admin-profile-form" onSubmit={handleSubmit}>
            <div className="admin-profile-section-head">
              <div>
                <span>Profile information</span>
                <h3>Account details</h3>
              </div>
              <UserRound size={20} />
            </div>

            <div className="admin-profile-fields">
              <label>
                <span>Username</span>
                <div className="admin-profile-input-wrap">
                  <UserRound size={16} />
                  <input name="username" value={form.username} onChange={updateField} required maxLength={60} />
                </div>
              </label>
              <label>
                <span>Email address</span>
                <div className="admin-profile-input-wrap">
                  <Mail size={16} />
                  <input type="email" name="email" value={form.email} onChange={updateField} required maxLength={160} />
                </div>
              </label>
            </div>

            <div className="admin-profile-section-head admin-profile-section-head--password">
              <div>
                <span>Optional</span>
                <h3>Change password</h3>
              </div>
              <KeyRound size={20} />
            </div>

            <div className="admin-profile-fields admin-profile-fields--password">
              <label>
                <span>New password</span>
                <input type="password" name="new_password" value={form.new_password} onChange={updateField} minLength={8} placeholder="Leave blank to keep current" />
              </label>
              <label>
                <span>Confirm new password</span>
                <input type="password" name="confirm_password" value={form.confirm_password} onChange={updateField} minLength={8} placeholder="Repeat new password" />
              </label>
            </div>

            <label className="admin-profile-current-password">
              <span>Current password <small>Required to save any changes</small></span>
              <input type="password" name="current_password" value={form.current_password} onChange={updateField} required autoComplete="current-password" />
            </label>

            <div className="admin-profile-actions">
              <p>Your current session stays active after saving.</p>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
