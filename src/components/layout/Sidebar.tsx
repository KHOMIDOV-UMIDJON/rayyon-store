import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    Package,
    Users,
    Store as StoreIcon,
    LogOut,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { authApi, storeApi } from '../../api'

// ─────────────────────────────────────────────────────────────
// Nav config — keep route badges dynamic via the prop
// ─────────────────────────────────────────────────────────────
interface NavItemProps {
    to: string
    icon: ReactNode
    label: string
    livePulse?: boolean
}

function NavItem({ to, icon, label, livePulse }: NavItemProps) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] mb-0.5 transition-all duration-150 ${
                    isActive
                        ? 'bg-green-50 text-brand font-medium'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
            }
        >
            {icon}
            <span className="flex-1">{label}</span>
            {livePulse && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
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
        ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status),
    ).length

    const handleLogout = async () => {
        try { if (refreshToken) await authApi.logout(refreshToken) }
        finally { clearAuth(); navigate('/login') }
    }

    const initials =
        user?.fullName
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) ?? 'SM'

    return (
        <aside className="w-[220px] min-h-screen bg-white border-r border-gray-100 flex flex-col flex-shrink-0">

            {/* Brand */}
            <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-50">
                <div className="w-[30px] h-[30px] bg-brand rounded-[7px] flex items-center justify-center flex-shrink-0">
                    <LogoIcon />
                </div>
                <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 tracking-tight leading-none truncate">
                        {store?.nameUz ?? 'Rayyon Store'}
                    </p>
                    <p className="text-[9px] text-gray-400 tracking-[0.4px] mt-0.5">
                        STORE APP
                    </p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2.5 py-3 overflow-y-auto">

                <div className="mb-4">
                    <p className="text-[9px] font-semibold text-gray-300 tracking-[0.8px] px-2 mb-1">
                        ORDERS
                    </p>
                    <NavItem
                        to="/kanban"
                        icon={<LayoutDashboard size={15} strokeWidth={2} />}
                        label="Live board"
                        livePulse={activeCount > 0}
                    />
                </div>

                <div className="mb-4">
                    <p className="text-[9px] font-semibold text-gray-300 tracking-[0.8px] px-2 mb-1">
                        STORE
                    </p>
                    <NavItem
                        to="/inventory"
                        icon={<Package size={15} strokeWidth={2} />}
                        label="Inventory"
                    />
                    <NavItem
                        to="/staff"
                        icon={<Users size={15} strokeWidth={2} />}
                        label="Staff"
                    />
                    <NavItem
                        to="/store"
                        icon={<StoreIcon size={15} strokeWidth={2} />}
                        label="My store"
                    />
                </div>
            </nav>

            {/* User */}
            <div className="px-2.5 py-3 border-t border-gray-50">
                <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 cursor-pointer group">
                    <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center text-[11px] font-semibold text-brand flex-shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-gray-700 truncate">
                            {user?.fullName ?? 'Manager'}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                            Store Manager
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
                        title="Sign out"
                    >
                        <LogOut size={13} className="text-gray-400" />
                    </button>
                </div>
            </div>

        </aside>
    )
}

function LogoIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
                d="M3 17L7 9L12 14L17 10L21 17"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="7" cy="9" r="1.5" fill="white" />
            <circle cx="17" cy="10" r="1.5" fill="white" />
        </svg>
    )
}