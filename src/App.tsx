import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LoginPage from './pages/auth/LoginPage'
import KanbanPage from './pages/kanban/KanbanPage'
import OrdersPage from './pages/orders/OrdersPage'
import OrderDetailPage from './pages/kanban/OrderDetailPage'
import InventoryPage from './pages/inventory/InventoryPage'
import StaffPage from './pages/staff/StaffPage'
import StorePage from './pages/store/StorePage'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/kanban" replace />} />
                    <Route path="kanban" element={<KanbanPage />} />
                    <Route path="kanban/:orderId" element={<OrderDetailPage />} />
                    <Route path="orders" element={<OrdersPage />} />
                    <Route path="inventory" element={<InventoryPage />} />
                    <Route path="staff" element={<StaffPage />} />
                    <Route path="store" element={<StorePage />} />
                </Route>
                <Route path="*" element={<Navigate to="/kanban" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
