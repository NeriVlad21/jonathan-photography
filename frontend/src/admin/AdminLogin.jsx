import { useState } from 'react'
import {
  Navigate,
  useNavigate
} from 'react-router-dom'

import {
  LockKeyhole,
  User,
  ArrowRight
} from 'lucide-react'

import {
  useAdminAuth
} from '../context/AdminAuthContext.jsx'

export default function AdminLogin() {
  const {
    admin,
    login
  } = useAdminAuth()

  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (admin) {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    if (!username.trim() || !password) {
      setError(
        'Please enter your username and password.'
      )
      return
    }

    setSubmitting(true)

    try {
      await login(
        username.trim(),
        password
      )

      navigate(
        '/admin/dashboard'
      )
    } catch (err) {
      setError(
        err?.message ||
        'Unable to sign in. Please check your credentials.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login-page">

      <style>{`

        /*
        ============================================================
        ADMIN LOGIN
        ============================================================
        */

        .admin-login-page {
          min-height: 100vh;

          display: flex;

          align-items: center;
          justify-content: center;

          padding:
            32px 20px;

          box-sizing: border-box;

          background:
            var(--c-bg, #f7f7f5);

          color:
            var(--c-text, #111);
        }

        /*
        ============================================================
        CARD
        ============================================================
        */

        .admin-login-card {
          width: min(
            100%,
            430px
          );

          padding:
            42px;

          border:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            var(--c-bg, #fff);

          box-shadow:
            0 20px 60px
            rgba(
              0,
              0,
              0,
              0.07
            );

          box-sizing: border-box;
        }

        /*
        ============================================================
        BRAND
        ============================================================
        */

        .admin-login-brand {
          margin-bottom: 6px;

          line-height: 1;
        }

        .admin-login-brand span {
          display: block;

          margin-top: 6px;

          color:
            var(--c-gray, #777);
        }

        .admin-login-heading {
          margin:
            30px 0 6px;
        }

        .admin-login-subtitle {
          margin:
            0 0 28px;

          color:
            var(--c-gray, #777);

          max-width: 40ch;
        }

        /*
        ============================================================
        FORM
        ============================================================
        */

        .admin-login-form {
          display: flex;

          flex-direction: column;

          gap: 18px;
        }

        .admin-login-field {
          display: flex;

          flex-direction: column;

          gap: 7px;
        }

        .admin-login-label {
          color:
            var(--c-text, #111);
        }

        .admin-login-input-wrap {
          position: relative;
        }

        .admin-login-input-icon {
          position: absolute;

          left: 13px;

          top: 50%;

          transform:
            translateY(-50%);

          color:
            #999;

          pointer-events: none;
        }

        .admin-login-input {
          width: 100%;

          min-height: 48px;

          padding:
            0 14px 0 42px;

          box-sizing: border-box;

          border:
            1px solid
            #d8d8d8;

          border-radius:
            8px;

          outline: none;

          background:
            #fafafa;

          color:
            var(--c-text, #111);

          font: inherit;

          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .admin-login-input:hover {
          background:
            #fff;

          border-color:
            #c8c8c8;
        }

        .admin-login-input:focus {
          background:
            #fff;

          border-color:
            var(--c-text, #111);

          box-shadow:
            0 0 0 3px
            rgba(
              0,
              0,
              0,
              0.045
            );
        }

        .admin-login-input::placeholder {
          color:
            #aaa;
        }

        /*
        ============================================================
        ERROR
        ============================================================
        */

        .admin-login-error {
          margin:
            -2px 0 0;

          padding:
            11px 13px;

          border:
            1px solid
            rgba(
              190,
              30,
              30,
              0.18
            );

          background:
            rgba(
              190,
              30,
              30,
              0.05
            );

          color:
            #a52828;

          border-radius:
            7px;
        }

        /*
        ============================================================
        SUBMIT
        ============================================================
        */

        .admin-login-submit {
          display: flex;

          align-items: center;
          justify-content: center;

          gap: 9px;

          width: 100%;

          min-height: 50px;

          margin-top: 2px;

          padding:
            0 18px;

          border: 0;

          border-radius:
            8px;

          cursor: pointer;

          transition:
            transform 0.2s ease,
            opacity 0.2s ease,
            box-shadow 0.2s ease;
        }

        .admin-login-submit:hover:not(:disabled) {
          transform:
            translateY(-1px);

          box-shadow:
            0 8px 20px
            rgba(
              0,
              0,
              0,
              0.10
            );
        }

        .admin-login-submit:active:not(:disabled) {
          transform:
            translateY(0);
        }

        .admin-login-submit:disabled {
          opacity:
            0.65;

          cursor:
            wait;
        }

        .admin-login-submit-icon {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          transition:
            transform 0.2s ease;
        }

        .admin-login-submit:hover:not(:disabled)
        .admin-login-submit-icon {
          transform:
            translateX(3px);
        }

        /*
        ============================================================
        FOOTER
        ============================================================
        */

        .admin-login-footer {
          margin-top:
            26px;

          padding-top:
            18px;

          border-top:
            1px solid
            var(--c-hairline, #e5e5e5);

          color:
            var(--c-gray, #777);

          text-align:
            center;
        }

        /*
        ============================================================
        RESPONSIVE
        ============================================================
        */

        @media (max-width: 520px) {

          .admin-login-page {
            align-items:
              flex-start;

            padding:
              24px 14px;
          }

          .admin-login-card {
            padding:
              30px 22px;
          }

          .admin-login-heading {
            margin-top:
              24px;
          }

        }

        /*
        ============================================================
        REDUCED MOTION
        ============================================================
        */

        @media (
          prefers-reduced-motion: reduce
        ) {

          .admin-login-input,
          .admin-login-submit,
          .admin-login-submit-icon {
            transition: none;
          }

        }

      `}</style>

      <main className="admin-login-card">

        {/* BRAND */}

        <div className="admin-login-brand">
          JONATHAN

          <span>
            Photography
          </span>
        </div>

        {/* HEADING */}

        <h1 className="admin-login-heading">
          Admin Dashboard
        </h1>

        <p className="admin-login-subtitle">
          Sign in to manage bookings,
          portfolio content, services,
          and studio settings.
        </p>

        {/* FORM */}

        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
          noValidate
        >

          {/* USERNAME */}

          <div className="admin-login-field">

            <label
              htmlFor="username"
              className="admin-login-label"
            >
              Username
            </label>

            <div className="admin-login-input-wrap">

              <User
                size={17}
                className="admin-login-input-icon"
                aria-hidden="true"
              />

              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                className="admin-login-input"
                value={username}
                onChange={(event) => {
                  setUsername(
                    event.target.value
                  )

                  if (error) {
                    setError('')
                  }
                }}
                placeholder="Enter your username"
              />

            </div>

          </div>

          {/* PASSWORD */}

          <div className="admin-login-field">

            <label
              htmlFor="password"
              className="admin-login-label"
            >
              Password
            </label>

            <div className="admin-login-input-wrap">

              <LockKeyhole
                size={17}
                className="admin-login-input-icon"
                aria-hidden="true"
              />

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="admin-login-input"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  )

                  if (error) {
                    setError('')
                  }
                }}
                placeholder="Enter your password"
              />

            </div>

          </div>

          {/* ERROR */}

          {error && (
            <p
              className="admin-login-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            className="
              btn
              btn--primary
              admin-login-submit
            "
            disabled={submitting}
          >

            <span>
              {submitting
                ? 'Signing In…'
                : 'Sign In'}
            </span>

            {!submitting && (
              <span className="admin-login-submit-icon">
                <ArrowRight
                  size={17}
                />
              </span>
            )}

          </button>

        </form>

        {/* FOOTER */}

        <div className="admin-login-footer">
          Jonathan Photography
          · Admin Access
        </div>

      </main>

    </div>
  )
}