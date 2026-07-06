import { useState, useRef, useCallback } from 'react'
import { userApi } from '../services/api'

interface Props {
  open: boolean
  onClose: () => void
  onLogin: (phone: string, code: string) => Promise<string | null>
}

export default function LoginModal({ open, onClose, onLogin }: Props) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSendCode = useCallback(async () => {
    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入有效的11位手机号')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await userApi.sendCode(phone)
      if (res.success) {
        setStep('code')
      } else {
        setError(res.error || '发送失败')
      }
    } catch {
      setError('网络错误，请确认后端已启动')
    } finally {
      setSending(false)
    }
  }, [phone])

  const handleLogin = useCallback(async () => {
    if (!code.trim()) {
      setError('请输入验证码')
      return
    }
    setLoading(true)
    setError('')
    const err = await onLogin(phone, code)
    if (err) {
      setError(err)
    } else {
      onClose()
      setPhone('')
      setCode('')
      setStep('phone')
    }
    setLoading(false)
  }, [phone, code, onLogin, onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: 360, maxWidth: '90vw', background: '#fff', borderRadius: 20,
        padding: '32px 28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.3s ease',
      }}>
        {/* 头部 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>📱</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#3d3630' }}>
            {step === 'phone' ? '手机号登录' : '输入验证码'}
          </h2>
          <p style={{ fontSize: 12, color: '#9c948c', marginTop: 4 }}>
            {step === 'phone' ? '首次登录自动创建账号' : `验证码已发送至 ${phone}`}
          </p>
        </div>

        {/* 手机号输入 */}
        {step === 'phone' && (
          <div>
            <label style={{ fontSize: 13, color: '#5c5348', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              手机号
            </label>
            <input
              ref={inputRef}
              type="tel"
              maxLength={11}
              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendCode() }}
              placeholder="请输入11位手机号"
              autoFocus
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: '2px solid #e8e3db', fontSize: 16, outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 0.2s',
                fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        {/* 验证码输入 */}
        {step === 'code' && (
          <div>
            <label style={{ fontSize: 13, color: '#5c5348', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              验证码
            </label>
            <input
              type="text"
              maxLength={4}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
              placeholder="输入4位验证码"
              autoFocus
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: '2px solid #e8e3db', fontSize: 24, outline: 'none',
                boxSizing: 'border-box', textAlign: 'center', letterSpacing: 8,
                fontFamily: 'inherit', transition: 'border-color 0.2s',
              }}
            />
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 8,
            background: '#fff5f5', color: '#d9534f', fontSize: 12,
            border: '1px solid #f8d7da', textAlign: 'center',
          }}>{error}</div>
        )}

        {/* 提示 */}
        <div style={{
          marginTop: error ? 8 : 16, padding: '8px 12px', borderRadius: 8,
          background: '#fdf8f0', fontSize: 11, color: '#9c948c', textAlign: 'center',
        }}>
          演示模式：验证码已打印在后端控制台
        </div>

        {/* 按钮 */}
        <div style={{ marginTop: 20 }}>
          {step === 'phone' ? (
            <button
              onClick={handleSendCode}
              disabled={sending || phone.length < 11}
              style={{
                width: '100%', padding: '13px', borderRadius: 12,
                background: sending || phone.length < 11 ? '#e8e3db' : '#c8963e',
                color: sending || phone.length < 11 ? '#ccc' : '#fff',
                border: 'none', fontSize: 16, fontWeight: 600,
                cursor: sending || phone.length < 11 ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}
            >{sending ? '发送中...' : '获取验证码'}</button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setStep('phone'); setError('') }}
                style={{
                  flex: 1, padding: '13px', borderRadius: 12,
                  background: '#f5f1eb', color: '#5c5348', border: 'none',
                  fontSize: 14, cursor: 'pointer',
                }}
              >返回</button>
              <button
                onClick={handleLogin}
                disabled={loading || code.length < 4}
                style={{
                  flex: 2, padding: '13px', borderRadius: 12,
                  background: loading || code.length < 4 ? '#e8e3db' : '#c8963e',
                  color: loading || code.length < 4 ? '#ccc' : '#fff',
                  border: 'none', fontSize: 16, fontWeight: 600,
                  cursor: loading || code.length < 4 ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >{loading ? '登录中...' : '登录'}</button>
            </div>
          )}
        </div>

        <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    </div>
  )
}
