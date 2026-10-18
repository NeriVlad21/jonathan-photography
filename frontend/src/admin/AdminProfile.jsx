import { useEffect, useState } from 'react'
import { KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api.js'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { formatDate } from '../utils/format.js'

// One field structure for every Profile input: label row, control row, then
// helper/error rows. Grouping keeps paired fields aligned whatever their helper text.
function ProfileField({ id, label, aside, icon: Icon, help, error, ...inputProps }) {
  const helpId = help ? `${id}-help` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className={`profile-field ${error ? 'has-error' : ''}`}>
      <div className="profile-field__label-row">
        <label htmlFor={id}>{label}</label>
        {aside && <span className="profile-field__aside">{aside}</span>}
      </div>
      <div className={`profile-field__control ${Icon ? 'has-icon' : ''}`}>
        {Icon && <Icon size={16} aria-hidden="true" />}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
          {...inputProps}
        />
      </div>
      {help && <p className="profile-field__help" id={helpId}>{help}</p>}
      {error && <p className="profile-field__error" id={errorId} role="alert"><span aria-hidden="true">!</span> {error}</p>}
    </div>
  )
}

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
  const location = useLocation()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

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
    setErrors((current) => (current[name] ? { ...current, [name]: '' } : current))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (form.new_password && form.new_password !== form.confirm_password) {
      setErrors({ confirm_password: 'The new passwords do not match.' })
      showToast('The new passwords do not match.', 'error')
      return
    }
    setErrors({})

    setSaving(true)
    try {
      const wasPasswordChangeRequired = Boolean(profile.must_change_password)
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
      if (wasPasswordChangeRequired && result.password_changed) {
        const returnTo = location.state?.returnTo
        const fallback = result.admin?.role === 'SUPER_ADMIN' ? '/admin/super-admin' : '/admin/dashboard'
        if (returnTo?.pathname) {
          navigate(
            { pathname: returnTo.pathname, search: returnTo.search || '', hash: returnTo.hash || '' },
            { replace: true, state: returnTo.state }
          )
        } else {
          navigate(fallback, { replace: true })
        }
      }
    } catch (error) {
      setErrors(error?.errors && typeof error.errors === 'object' ? error.errors : {})
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
            <h2>{profile.role === 'SUPER_ADMIN' ? 'Superadmin profile' : 'Studio profile'}</h2>
            <p>{profile.role === 'SUPER_ADMIN' ? 'Manage your platform sign-in and security details.' : 'Manage your personal sign-in details. Booking-alert routing is controlled separately by the Super Admin.'}</p>
          </div>
          <div className="admin-profile-avatar" aria-hidden="true">
            {(profile.username || 'A').charAt(0).toUpperCase()}
          </div>
        </header>

        {Boolean(Number(profile.must_change_password)) && <div className="content-safety-note" role="alert"><KeyRound size={18} /><span><strong>Password change required.</strong> Replace the temporary password below to unlock the navigation. After saving, you will continue to the section you selected.</span></div>}

        <div className="admin-profile-grid">
          <aside className="admin-profile-summary">
            <span className="admin-profile-summary__label">Signed in as</span>
            <strong>{profile.username}</strong>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <div className="admin-profile-summary__meta">
              <ShieldCheck size={17} />
              <span>{profile.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Studio Owner'}<br />Member since {formatDate(profile.created_at)}</span>
            </div>
          </aside>

          <form className="admin-profile-form" onSubmit={handleSubmit}>
            <div className="admin-profile-section-head">
              <div>
                <span>Profile information</span>
                <h3>Account details</h3>
              </div>
              <UserRound size={20} aria-hidden="true" />
            </div>

            <div className="admin-profile-fields">
              <ProfileField id="profile-username" label="Username" icon={UserRound} name="username" value={form.username} onChange={updateField} required maxLength={60} autoComplete="username" error={errors.username} />
              <ProfileField id="profile-email" label="Account email" icon={Mail} type="email" name="email" value={form.email} onChange={updateField} required maxLength={160} autoComplete="email" error={errors.email} help="Used to identify and contact this account. Changing it does not redirect booking notifications." />
            </div>

            <div className="admin-profile-section-head admin-profile-section-head--password">
              <div>
                <span>{profile.must_change_password ? 'Required before continuing' : 'Optional'}</span>
                <h3>Change password</h3>
              </div>
              <KeyRound size={20} aria-hidden="true" />
            </div>

            <div className="admin-profile-fields admin-profile-fields--password">
              <ProfileField id="profile-new-password" label="New password" type="password" name="new_password" value={form.new_password} onChange={updateField} minLength={12} required={Boolean(Number(profile.must_change_password))} autoComplete="new-password" placeholder={profile.must_change_password ? 'At least 12 characters' : 'Leave blank to keep current'} error={errors.new_password} />
              <ProfileField id="profile-confirm-password" label="Confirm new password" type="password" name="confirm_password" value={form.confirm_password} onChange={updateField} minLength={12} required={Boolean(Number(profile.must_change_password))} autoComplete="new-password" placeholder="Repeat new password" error={errors.confirm_password} />
            </div>

            <div className="admin-profile-fields admin-profile-fields--single">
              <ProfileField id="profile-current-password" label="Current password" aside="Required to save any changes" type="password" name="current_password" value={form.current_password} onChange={updateField} required autoComplete="current-password" error={errors.current_password} />
            </div>

            <div className="admin-profile-actions">
              <p>{profile.must_change_password ? 'This one-time security step unlocks the platform workspace.' : 'Your current session stays active after saving.'}</p>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving…' : profile.must_change_password ? 'Change password & continue' : 'Save profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
