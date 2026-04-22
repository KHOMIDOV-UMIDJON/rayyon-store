export interface AuthUser {
    userId: string
    fullName: string
    role: string
    accessToken: string
    refreshToken: string
    storeId?: string
}

export interface ApiResponse<T> {
    success: boolean
    message: string
    data?: T
}

export type OrderStatus =
    | 'CREATED' | 'CONFIRMED' | 'ASSIGNED' | 'PREPARING'
    | 'READY_FOR_PICKUP' | 'COURIER_ASSIGNED' | 'COURIER_ACCEPTED'
    | 'PICKED_UP' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'

export interface OrderItem {
    id: string
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    unitDisplay: string
}

export interface Order {
    orderId: string
    status: OrderStatus
    storeName: string
    storeId: string
    customerName: string
    customerPhone: string
    deliveryAddress: string
    deliveryLat?: number
    deliveryLng?: number
    subtotal: number
    deliveryFee: number
    totalAmount: number
    paymentMethod: string
    isPaid: boolean
    notes?: string
    items: OrderItem[]
    dispatcherId?: string
    dispatcherName?: string
    assignedDriverId?: string
    driverName?: string
    createdAt: string
    updatedAt: string
    waitSeconds?: number
}

export interface StoreInfo {
    id: string
    nameUz: string
    address: string
    city: string
    phone: string
    status: string
    managerId: string
}

export interface StaffMember {
    id: string
    fullName: string
    role: string
    phone: string
    isActive: boolean
    username: string
}
