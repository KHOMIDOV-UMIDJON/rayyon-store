import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutGrid, Package, Users, LogOut, Store } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { authApi, storeApi } from '../../api'
import { useQuery } from '@tanstack/react-query'

function NavItem({ to, icon, label, badge }: {
    to: string; icon: ReactNode; label: string; badge?: number
}) {
    return (
        <NavLink to={to} className={({ isActive }) =>
            `flex items-center gap-2 px-2 py-2 rounded-lg text-[12px] mb-0.5 transition-colors ${
                isActive ? 'bg-green-50 text-brand font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}>
            {icon}
            <span className="flex-1">{label}</span>
            {badge !== undefined && badge > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">{badge}</span>
            )}
        </NavLink>
    )
}

export default function Sidebar() {
    const { user, refreshToken, clearAuth } = useAuthStore()
    const navigate = useNavigate()

    const { data: store } = useQuery({
        queryKey: ['my-store'],
        queryFn: storeApi.getMyStore,
    })

    const { data: orders = [] } = useQuery({
        queryKey: ['store-orders'],
        queryFn: storeApi.getOrders,
        refetchInterval: 30_000,
    })

    const activeCount = orders.filter(o =>
        ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status)
    ).length

    const handleLogout = async () => {
        try { if (refreshToken) await authApi.logout(refreshToken) }
        finally { clearAuth(); navigate('/login') }
    }

    const initials = (name: string) =>
        name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'SM'

    return (
        <div className="w-48 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 h-screen">
            {/* Brand */}
            <div className="flex items-center gap-2 px-3 py-3.5 border-b border-gray-100">
                <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M3 17L7 9L12 14L17 10L21 17" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                        <circle cx="7" cy="9" r="1.5" fill="white"/>
                        <circle cx="17" cy="10" r="1.5" fill="white"/>
                    </svg>
                </div>
                <div>
                    <div className="text-[11px] font-semibold text-gray-900 leading-tight truncate max-w-[100px]">
                        {store?.nameUz ?? 'Rayyon Store'}
                    </div>
                    <div className="text-[9px] text-gray-400 tracking-wide mt-0.5">STORE APP</div>
                </div>
            </div>

            {/* Nav */}
            <div className="flex-1 px-2 py-2.5 overflow-y-auto">
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-wider px-2 mb-1">Orders</p>
                <NavItem to="/kanban" icon={<LayoutGrid size={13} />} label="Live board" badge={activeCount} />

                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-wider px-2 mb-1 mt-3">Store</p>
                <NavItem to="/inventory" icon={<Package size={13} />} label="Inventory" />
                <NavItem to="/staff"     icon={<Users size={13} />}   label="Staff" />
                <NavItem to="/store"     icon={<Store size={13} />}   label="My store" />
            </div>

            {/* User footer */}
            <div className="px-2 py-2 border-t border-gray-100">
                <div className="flex items-center gap-2 px-2 py-2 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-green-50 border-[1.5px] border-green-400 flex items-center justify-center text-[10px] font-bold text-brand flex-shrink-0">
                        {initials(user?.fullName ?? '')}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-gray-700 truncate">{user?.fullName}</div>
                        <div className="text-[9px] text-gray-400">Store Manager</div>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                </div>
                <button onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[11px] text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors mt-1">
                    <LogOut size={12} />Sign out
                </button>
            </div>
        </div>
    )
}
