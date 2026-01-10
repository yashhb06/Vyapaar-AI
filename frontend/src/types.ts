export interface Reminder {
    id: string;
    customerName: string;
    amount: string;
    dueDate: string;
    phone: string;
    status: 'pending' | 'paid' | 'overdue';
    originalText: string;
    createdAt: string;
}

export interface User {
    uid: string;
    phone: string;
    email?: string;
    name?: string;
}

export interface Vendor {
    id: string;
    userId: string;
    shopName: string;
    ownerName: string;
    phoneNumber: string;
    whatsappNumber?: string;
    email?: string;
    gstNumber?: string;
    upiId?: string;
    address?: any;
    preferredLanguage?: 'en' | 'hi';
    businessType?: string;
    isActive: boolean;
    createdAt: any;
    updatedAt: any;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    token?: string;
    user?: User;
    hasVendorProfile: boolean;
    vendorId?: string | null;
}

export interface InventoryItem {
    id: string;
    userId: string;
    vendorId: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
    threshold: number;
    lastUpdated: any;
    createdAt: any;
}

export interface PaymentReminder {
    id: string;
    userId: string;
    vendorId: string;
    customerName: string;
    amount: number;
    dueDate: any;
    phone: string;
    status: 'pending' | 'paid' | 'overdue';
    originalText?: string;
    lastReminderSent?: any;
    createdAt: any;
}

export interface Invoice {
    id: string;
    userId: string;
    vendorId: string;
    invoiceNumber: string;
    customerName: string;
    customerPhone?: string;
    amount: number;
    gst: number;
    totalAmount: number;
    status: 'Paid' | 'Pending' | 'Overdue';
    date: any;
    dueDate: any;
    items: InvoiceItem[];
    createdAt: any;
}

export interface InvoiceItem {
    name: string;
    quantity: number;
    price: number;
    total: number;
}

export interface Sale {
    id: string;
    vendorId: string;
    customerName?: string;
    customerId?: string;
    items: SaleItem[];
    paymentMethod: 'cash' | 'upi' | 'card';
    totalAmount: number;
    discount?: number;
    notes?: string;
    saleDate: any;
    createdAt: any;
}

export interface SaleItem {
    name: string;
    quantity: number;
    price: number;
    total: number;
}

export interface DashboardStats {
    todaySales: {
        value: number;
        transactions: number;
        change: string;
    };
    thisWeekSales: {
        value: number;
        transactions: number;
        change: string;
    };
    pendingPayments: {
        value: number;
        count: number;
        change: string;
    };
    lowStockItems: {
        count: number;
        items: Array<{
            name: string;
            quantity: number;
            threshold: number;
        }>;
    };
    totalInventory: {
        count: number;
        value: number;
    };
    recentActivity: Array<{
        type: string;
        customer: string;
        amount: string;
        time: string;
    }>;
}
