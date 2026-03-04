'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';

function LeafShape({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', pointerEvents: 'none', ...style }}>
      <path d="M20 2 C35 10, 38 30, 20 58 C2 30, 5 10, 20 2Z" fill="currentColor" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function InputField({
  type, placeholder, icon, value, onChange, isDark,
}: {
  type: string; placeholder: string; icon: React.ReactNode;
  value: string; onChange: (v: string) => void; isDark: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center',
      background: focused
        ? (isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)')
        : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
      border: focused
        ? '1.5px solid #10b981'
        : `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
      borderRadius: '14px',
      padding: '0 16px',
      transition: 'all 0.25s ease',
      boxShadow: focused ? '0 0 0 3px rgba(16,185,129,0.12)' : 'none',
    }}>
      <span style={{
        color: focused ? '#10b981' : (isDark ? '#6b7280' : '#9ca3af'),
        marginRight: '10px', flexShrink: 0, transition: 'color 0.25s',
      }}>
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          color: isDark ? '#f1f5f9' : '#1e293b',
          fontSize: '14px', padding: '14px 0', fontFamily: 'inherit',
        }}
      />
    </div>
  );
}

function SocialBtn({ name, isDark }: { name: 'Google' | 'GitHub'; isDark: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '8px', padding: '11px', borderRadius: '12px',
        background: hovered
          ? (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)')
          : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
        border: hovered
          ? `1px solid ${isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)'}`
          : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'}`,
        color: isDark ? '#cbd5e1' : '#374151',
        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.2s ease', fontFamily: 'inherit',
      }}
    >
      {name === 'Google' ? (
        <svg width="15" height="15" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.66-.22.66-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85.004 1.71.115 2.51.337 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.16.58.67.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
        </svg>
      )}
      {name}
    </button>
  );
}

function TabSwitcher({
  mode, onSwitch, isDark,
}: {
  mode: 'signin' | 'signup'; onSwitch: (m: 'signin' | 'signup') => void; isDark: boolean;
}) {
  const siRef = useRef<HTMLButtonElement>(null);
  const suRef = useRef<HTMLButtonElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = mode === 'signin' ? siRef.current : suRef.current;
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [mode]);

  return (
    <div style={{
      position: 'relative', display: 'flex',
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'}`,
      borderRadius: '100px', padding: '4px',
    }}>
      {/* sliding pill */}
      <div style={{
        position: 'absolute', top: '4px',
        left: `${pill.left}px`, width: `${pill.width}px`,
        height: 'calc(100% - 8px)', borderRadius: '100px',
        background: 'rgba(16,185,129,0.15)',
        border: '1.5px solid rgba(16,185,129,0.4)',
        transition: 'left 0.3s cubic-bezier(0.34,1.56,0.64,1), width 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        zIndex: 0,
      }} />
      {(['signin', 'signup'] as const).map((m) => (
        <button
          key={m}
          ref={m === 'signin' ? siRef : suRef}
          onClick={() => onSwitch(m)}
          style={{
            flex: 1, position: 'relative', padding: '8px 0',
            borderRadius: '100px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', border: 'none', background: 'transparent',
            color: mode === m ? '#10b981' : (isDark ? '#6b7280' : '#9ca3af'),
            transition: 'color 0.25s', zIndex: 1, fontFamily: 'inherit',
          }}
        >
          {m === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [animIn, setAnimIn] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function switchMode(next: 'signin' | 'signup') {
    if (next === mode) return;
    setAnimIn(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setMode(next);
      setAnimIn(true);
    }, 220);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const isSignup = mode === 'signup';

  // Leaf positions
  const leaves = [
    { size: 52, color: isDark ? '#10b981' : '#059669', top: '6%', left: '4%', rotate: -20, anim: 'leafFloat1', delay: 0 },
    { size: 34, color: isDark ? '#34d399' : '#10b981', top: '18%', left: '88%', rotate: 30, anim: 'leafFloat2', delay: 0.4 },
    { size: 44, color: isDark ? '#059669' : '#34d399', top: '72%', left: '7%', rotate: 50, anim: 'leafFloat3', delay: 0.8 },
    { size: 28, color: isDark ? '#6ee7b7' : '#10b981', top: '80%', left: '82%', rotate: -45, anim: 'leafFloat1', delay: 1.2 },
    { size: 60, color: isDark ? '#10b981' : '#059669', top: '45%', left: '92%', rotate: 10, anim: 'leafFloat2', delay: 0.6 },
    { size: 38, color: isDark ? '#34d399' : '#6ee7b7', top: '90%', left: '45%', rotate: -60, anim: 'leafFloat3', delay: 1.5 },
    { size: 22, color: isDark ? '#6ee7b7' : '#34d399', top: '12%', left: '55%', rotate: 25, anim: 'leafFloat1', delay: 0.2 },
  ];

  // Theme tokens
  const bg = isDark
    ? 'radial-gradient(ellipse at 20% 50%, rgba(5,150,105,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 10%, rgba(16,185,129,0.12) 0%, transparent 55%), #030712'
    : 'radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 10%, rgba(5,150,105,0.08) 0%, transparent 55%), #f0fdf4';
  const cardBg = isDark ? 'rgba(15,23,42,0.80)' : 'rgba(255,255,255,0.80)';
  const cardBorder = isDark ? 'rgba(16,185,129,0.20)' : 'rgba(16,185,129,0.25)';
  const cardShadow = isDark
    ? '0 0 0 1px rgba(16,185,129,0.08), 0 32px 64px rgba(0,0,0,0.50), 0 0 80px rgba(16,185,129,0.06)'
    : '0 0 0 1px rgba(16,185,129,0.10), 0 24px 48px rgba(0,0,0,0.10), 0 0 60px rgba(16,185,129,0.05)';
  const titleColor = isDark ? '#f1f5f9' : '#0f172a';
  const subtitleColor = isDark ? '#64748b' : '#64748b';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const dividerTextColor = isDark ? '#475569' : '#94a3b8';
  const orb1 = isDark ? 'rgba(16,185,129,0.10)' : 'rgba(16,185,129,0.08)';
  const orb2 = isDark ? 'rgba(52,211,153,0.08)' : 'rgba(5,150,105,0.06)';
  const leafOpacity = isDark ? 0.18 : 0.22;
  const backLinkColor = isDark ? '#64748b' : '#94a3b8';

  const toggleBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: '100px', fontSize: '12px',
    fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    color: isDark ? '#fde68a' : '#374151',
    transition: 'all 0.2s ease',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes leafFloat1 { 0%,100%{transform:translateY(0px) rotate(var(--r))} 50%{transform:translateY(-18px) rotate(var(--r))} }
        @keyframes leafFloat2 { 0%,100%{transform:translateY(0px) rotate(var(--r))} 50%{transform:translateY(14px) rotate(var(--r))} }
        @keyframes leafFloat3 { 0%,100%{transform:translateY(0px) rotate(var(--r))} 60%{transform:translateY(-10px) rotate(var(--r))} }
        @keyframes cardIn { from{opacity:0;transform:translateY(32px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .login-card { animation: cardIn 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .form-body { animation: fadeSlide 0.28s ease both; }
        .form-body.out { opacity:0; transform:translateY(10px); }
        .shimmer-btn {
          background: linear-gradient(90deg,#059669 0%,#10b981 40%,#34d399 60%,#10b981 80%,#059669 100%);
          background-size: 200% auto;
          transition: background-position 0.4s, box-shadow 0.2s, transform 0.15s;
        }
        .shimmer-btn:hover {
          background-position: right center;
          box-shadow: 0 8px 30px rgba(16,185,129,0.45);
          transform: translateY(-1px);
        }
        .shimmer-btn:active { transform: translateY(0); }
        input::placeholder { color: #9ca3af; }
        * { box-sizing: border-box; margin:0; padding:0; }

        /* Responsive card sizing */
        .login-page-wrapper {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px 16px;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }
        .login-card-inner {
          width: 100%;
          max-width: 420px;
          padding: 32px 24px 28px;
          border-radius: 24px;
          position: relative;
          z-index: 10;
        }
        @media (min-width: 480px) {
          .login-card-inner { padding: 40px 36px 36px; }
        }
        .top-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          z-index: 20;
        }
        .social-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .social-row > button { min-width: 0; }
        @media (max-width: 359px) {
          .social-row { flex-direction: column; }
          .social-row > button { width: 100%; }
        }
      `}</style>

      {/* Full-page background */}
      <div
        className="login-page-wrapper"
        style={{ background: bg, transition: 'background 0.4s ease' }}
      >
        {/* Top bar — Back link + Theme toggle */}
        <div className="top-bar">
          <Link
            href="/"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', color: backLinkColor,
              textDecoration: 'none', fontWeight: 500,
              transition: 'color 0.2s', fontFamily: 'inherit',
            }}
            onMouseOver={e => (e.currentTarget.style.color = '#10b981')}
            onMouseOut={e => (e.currentTarget.style.color = backLinkColor)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span style={{ display: 'none' }} className="sm:inline">Back to home</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <button
            onClick={toggleTheme}
            style={toggleBtnStyle}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.10)'; }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'; }}
          >
            {isDark ? <><SunIcon /><span>Light</span></> : <><MoonIcon /><span>Dark</span></>}
          </button>
        </div>

        {/* Floating leaf particles */}
        {leaves.map((l, i) => (
          <LeafShape key={i} style={{
            width: l.size, height: l.size * 1.5, color: l.color,
            top: l.top, left: l.left, opacity: leafOpacity,
            ['--r' as string]: `${l.rotate}deg`,
            animation: `${l.anim} ${4 + i * 0.7}s ease-in-out ${l.delay}s infinite`,
          } as React.CSSProperties} />
        ))}

        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 420, height: 420, borderRadius: '50%', background: `radial-gradient(circle,${orb1} 0%,transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-12%', right: '-8%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle,${orb2} 0%,transparent 70%)`, pointerEvents: 'none' }} />

        {/* ── Auth Card ── */}
        <div
          className="login-card login-card-inner"
          style={{
            background: cardBg,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${cardBorder}`,
            boxShadow: cardShadow,
            transition: 'background 0.35s, border-color 0.35s, box-shadow 0.35s',
          }}
        >
          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: '26px' }}>
            <h1 style={{ fontSize: 'clamp(20px,4vw,24px)', fontWeight: 700, color: titleColor, letterSpacing: '-0.4px', transition: 'color 0.3s' }}>
              <span style={{ color: '#10b981' }}>Leaf</span>line CRM
            </h1>
            <p style={{ marginTop: '5px', fontSize: '13px', color: subtitleColor, transition: 'color 0.3s' }}>
              {isSignup ? 'Create your account ' : 'Welcome back '}
            </p>
          </div>

          {/* Tabs */}
          <TabSwitcher mode={mode} onSwitch={switchMode} isDark={isDark} />

          {/* Form */}
          <div className={`form-body ${animIn ? '' : 'out'}`} key={mode} style={{ marginTop: '26px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              {isSignup && (
                <InputField type="text" placeholder="Full name" value={name} onChange={setName} isDark={isDark}
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                />
              )}
              <InputField type="email" placeholder="Email address" value={email} onChange={setEmail} isDark={isDark}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>}
              />
              <InputField type="password" placeholder="Password" value={password} onChange={setPassword} isDark={isDark}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
              />
            </div>

            {!isSignup && (
              <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <a href="#" style={{ fontSize: '12px', color: '#10b981', textDecoration: 'none', fontWeight: 500 }}
                  onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}>
                  Forgot password?
                </a>
              </div>
            )}

            <button
              className="shimmer-btn"
              style={{
                width: '100%', marginTop: '20px', padding: '14px', borderRadius: '14px',
                border: 'none', color: 'white', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.3px', fontFamily: 'inherit',
              }}
            >
              {isSignup ? 'Create Account' : '→ Sign In'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0' }}>
              <div style={{ flex: 1, height: '1px', background: dividerColor }} />
              <span style={{ fontSize: '11px', color: dividerTextColor, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>OR CONTINUE WITH</span>
              <div style={{ flex: 1, height: '1px', background: dividerColor }} />
            </div>

            {/* Social */}
            <div className="social-row">
              {(['Google', 'GitHub'] as const).map((n) => <SocialBtn key={n} name={n} isDark={isDark} />)}
            </div>

            {/* Switch hint */}
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: subtitleColor }}>
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              <button onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
                style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 600, cursor: 'pointer', fontSize: '13px', padding: 0, fontFamily: 'inherit' }}>
                {isSignup ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}