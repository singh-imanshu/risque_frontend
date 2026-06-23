import React, { useState, useRef, useEffect } from 'react';
import client from '../api/client.js';

export default function AuthScreen({ onAuth, toast }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP verification state
  const [otpStep, setOtpStep] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus first OTP input when entering OTP step
  useEffect(() => {
    if (otpStep && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [otpStep]);

  function handleOtpChange(index, value) {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      const code = otpDigits.join('');
      if (code.length === 6) submitOtp();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    // Focus last filled or the next empty
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  }

  async function submit() {
    if (!email || !password) return toast?.('Please fill in all fields.', 'error');
    setLoading(true);
    try {
      if (tab === 'login') {
        const data = await client.login(email, password);
        if (data && data.token) {
          onAuth?.(data);
        } else {
          throw new Error('Invalid payload received from server.');
        }
      } else {
        // Register — triggers OTP
        await client.register(email, password);
        toast?.('Verification code sent to your email!', 'success');
        setOtpStep(true);
        setOtpDigits(['', '', '', '', '', '']);
        setResendCooldown(30);
      }
    } catch (e) {
      toast?.(e.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp() {
    const code = otpDigits.join('');
    if (code.length < 6) return toast?.('Please enter the full 6-digit code.', 'error');
    setLoading(true);
    try {
      const data = await client.verifyOtp(email, code);
      if (data && data.token) {
        toast?.('Email verified successfully!', 'success');
        onAuth?.(data);
      } else {
        throw new Error('Verification failed. Please try again.');
      }
    } catch (e) {
      toast?.(e.message || 'Verification failed', 'error');
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    try {
      await client.resendOtp(email);
      toast?.('New verification code sent!', 'success');
      setResendCooldown(30);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (e) {
      toast?.(e.message || 'Failed to resend code', 'error');
    }
  }

  function onKey(e) {
    if (e.key === 'Enter') submit();
  }

  function backToRegister() {
    setOtpStep(false);
    setOtpDigits(['', '', '', '', '', '']);
  }

  // ── OTP Verification Screen ──
  if (otpStep) {
    return (
      <div className="auth-screen">
        <div className="auth-bg" />
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-mark">RISQUÉ</div>
            <div className="auth-logo-sub">Portfolio Risk Analytics</div>
          </div>

          <div className="otp-header">
            <div className="otp-icon">✉</div>
            <h2 className="otp-title">Verify your email</h2>
            <p className="otp-subtitle">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>

          <div className="otp-input-group" onPaste={handleOtpPaste}>
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                id={`otp-input-${i}`}
                ref={(el) => (inputRefs.current[i] = el)}
                className="otp-input"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <button
            id="otp-submit"
            className="btn btn-primary w-full"
            onClick={submitOtp}
            disabled={loading || otpDigits.join('').length < 6}
            style={{ justifyContent: 'center', marginTop: 16 }}
          >
            {loading ? <span className="spinner" /> : 'Verify & Sign In'}
          </button>

          <div className="otp-actions">
            <button
              id="otp-resend"
              className="otp-link"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
            </button>
            <button id="otp-back" className="otp-link" onClick={backToRegister}>
              ← Change email
            </button>
          </div>

          <div className="auth-footer">
            <p>Code expires in 10 minutes</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Login / Register Screen ──
  return (
    <div className="auth-screen">
      <div className="auth-bg" />

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">RISQUÉ</div>
          <div className="auth-logo-sub">Portfolio Risk Analytics</div>
        </div>

        <div className="auth-tabs">
          <button id="auth-tab-login" className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>
            Sign In
          </button>
          <button id="auth-tab-register" className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
            Register
          </button>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKey}
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKey}
            autoComplete="current-password"
          />
        </div>

        <button id="auth-submit" className="btn btn-primary w-full" onClick={submit} disabled={loading}
          style={{ justifyContent: 'center', marginTop: 8 }}>
          {loading ? <span className="spinner" /> : (tab === 'login' ? 'Sign In' : 'Create Account')}
        </button>

        <div className="auth-footer">
          <p>Secure authentication with JWT tokens</p>
        </div>
      </div>
    </div>
  );
}
