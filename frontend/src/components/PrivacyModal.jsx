import React, { useState, useRef, useEffect } from 'react'

export default function PrivacyModal({ isOpen, onClose, onAccept }) {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false)
  const [isChecked, setIsChecked] = useState(false)
  const privacyRef = useRef(null)

  // Reset states whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setIsScrolledToBottom(false)
      setIsChecked(false)

      // Reset scroll position
      requestAnimationFrame(() => {
        if (privacyRef.current) {
          privacyRef.current.scrollTop = 0
        }
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleScroll = () => {
    const element = privacyRef.current

    if (!element) return

    const { scrollTop, scrollHeight, clientHeight } = element

    // Allow agreement once user reaches the bottom
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      setIsScrolledToBottom(true)
    }
  }

  const handleConfirm = () => {
    if (isChecked && isScrolledToBottom) {
      onAccept()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '550px',
          height: '85vh',
          maxHeight: '700px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #e5e5e5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '1.25rem',
              color: '#111827'
            }}
          >
            Data Privacy Agreement
          </h3>

          <button
            onClick={onClose}
            aria-label="Close privacy agreement"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#9ca3af'
            }}
          >
            &times;
          </button>
        </div>

        {/* Scrollable Privacy Content */}
        <div
          ref={privacyRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'scroll',
            padding: '24px',
            fontSize: '0.95rem',
            lineHeight: '1.7',
            color: '#4b5563',
            backgroundColor: '#fafafa'
          }}
        >
          <h4
            style={{
              marginTop: 0,
              marginBottom: '12px',
              color: '#111827'
            }}
          >
            Data Privacy Policy
          </h4>

          <p>
            By continuing, you consent to the collection and
            processing of your personal information in
            accordance with the Data Privacy Act.
          </p>

          <p>
            We collect information such as your name,
            email address, phone number, preferred date,
            location, and other details you provide through
            our booking and estimate forms.
          </p>

          <p>
            We use this information solely to communicate
            with you regarding your inquiry, provide accurate
            estimates, process booking requests, and deliver
            our photography services.
          </p>

          <p>
            Your personal information will be securely
            stored within our internal system and will not
            be shared, sold, or distributed to third parties
            without your lawful consent, except where
            disclosure is required by law.
          </p>

          <p>
            You have the right to request access to,
            correction of, or deletion of your personal
            information, subject to applicable laws and
            legitimate business requirements.
          </p>

          <p>
            By submitting a booking or estimate request,
            you acknowledge that the information you provide
            is accurate and that you have read and understood
            this privacy notice.
          </p>

          {/* Extra content ensures a real scroll area */}
          <div style={{ height: '180px' }} />

          <div
            style={{
              padding: '16px',
              marginBottom: '20px',
              borderRadius: '6px',
              background: '#f3f4f6',
              textAlign: 'center',
              color: '#6b7280',
              fontStyle: 'italic'
            }}
          >
            {isScrolledToBottom
              ? 'You have reached the bottom. You may now agree to the Data Privacy Policy.'
              : 'Please scroll to the bottom to enable the agreement checkbox.'}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px',
            borderTop: '1px solid #e5e5e5',
            background: '#fff',
            flexShrink: 0
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px',
              cursor: isScrolledToBottom
                ? 'pointer'
                : 'not-allowed',
              opacity: isScrolledToBottom ? 1 : 0.6
            }}
          >
            <input
              type="checkbox"
              disabled={!isScrolledToBottom}
              checked={isChecked}
              onChange={(e) =>
                setIsChecked(e.target.checked)
              }
              style={{
                width: '18px',
                height: '18px'
              }}
            />

            <span
              style={{
                fontSize: '0.9rem',
                color: '#111827'
              }}
            >
              I have read and agree to the Data Privacy
              Policy.
            </span>
          </label>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={!isChecked || !isScrolledToBottom}
              className="btn btn--primary"
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                background:
                  isChecked && isScrolledToBottom
                    ? '#111827'
                    : '#9ca3af',
                color: '#fff',
                cursor:
                  isChecked && isScrolledToBottom
                    ? 'pointer'
                    : 'not-allowed'
              }}
            >
              I Agree & Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}