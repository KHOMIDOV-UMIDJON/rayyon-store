import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { authApi } from '../../api'

export default function LoginPage() {
    const navigate = useNavigate()
    const setAuth = useAuthStore(s => s.setAuth)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username.trim() || !password.trim()) return
        setError(''); setLoading(true)
        try {
            const user = await authApi.login({ username: username.trim(), password, deviceId: 'store-web' })
            setAuth(user); navigate('/kanban')
        } catch (err: any) {
            setError(err?.response?.data?.message ?? err?.message ?? 'Login failed')
        } finally { setLoading(false) }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4"
             style={{ background: 'radial-gradient(ellipse at 50% 0%, #052e16 0%, #030712 60%)' }}>
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M3 17L7 9L12 14L17 10L21 17" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                        <circle cx="7" cy="9" r="1.5" fill="white"/>
                        <circle cx="17" cy="10" r="1.5" fill="white"/>
                    </svg>
                </div>
                <div>
                    <div className="text-white text-[16px] font-semibold">Rayyon Express</div>
                    <div className="text-green-500 text-[10px] tracking-widest font-medium">STORE</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-[380px] p-7 shadow-sm">
                <h1 className="text-[20px] font-bold text-gray-900 mb-1">Welcome back</h1>
                <p className="text-[13px] text-gray-400 mb-6">Sign in to manage your store orders</p>

                {error && (
                    <div className="mb-4 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 text-[12px] text-red-600 font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                            Username
                        </label>
                        <input
                            type="text" value={username} onChange={e => setUsername(e.target.value)}
                            placeholder="Enter your username" autoFocus
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-700 outline-none bg-gray-50 focus:border-brand focus:bg-white transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full px-3 py-2.5 pr-16 border border-gray-200 rounded-xl text-[13px] text-gray-700 outline-none bg-gray-50 focus:border-brand focus:bg-white transition-colors"
                            />
                            <button type="button" onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 hover:text-gray-600">
                                {showPw ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit" disabled={loading || !username.trim() || !password.trim()}
                        className="w-full py-2.5 bg-brand text-white rounded-xl text-[13px] font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors mt-1">
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
            </div>
            <p className="text-gray-600 text-[11px] mt-6">v1.0.0 · Rayyon Store</p>
        </div>
    )
}
