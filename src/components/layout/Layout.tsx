import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import Sidebar from './Sidebar'

export default function Layout() {
    const token = useAuthStore(s => s.token)
    if (!token) return <Navigate to="/login" replace />
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Outlet />
            </div>
        </div>
    )
}
