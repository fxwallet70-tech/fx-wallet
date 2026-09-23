import api from "../api/axios";

export interface DashboardData {
  user: {
    id: string;
    fullName: string;
    email: string;
    mobile: string;
  };
  wallet: {
    balance: number;
    pendingReturn: number;
    pendingReturnCount: number;
    totalMaturityReturn: number;
  };
  subscriptions: Subscription[];
  recentTransactions: Transaction[];
  recentPayments: Payment[];
  announcements?: Announcement[];
}

export interface Subscription {
  id: string;
  plan: {
    _id?: string;
    id?: string;
    title?: string;
    name?: string;
    price?: number;
    duration?: number;
    durationHours?: number;
    durationMinutes?: number;
    returnAmount?: number;
    description?: string;
    category?: string;
    image?: string;
  } | null;
  startDate: string;
  endDate: string;
  status: "Active" | "Expired" | "Cancelled";
  amountPaid: number;
  returnAmount: number;
  paymentMethod: "Wallet" | "Razorpay";
  paymentStatus: "Pending" | "Paid" | "Failed";
  returnStatus: "Pending" | "Processing" | "Credited" | "Failed" | "NotApplicable";
  daysRemaining: number;
}

export interface Transaction {
  _id: string;
  type: "credit" | "debit";
  category?: "AdminCredit" | "AdminDebit" | "PlanPurchase" | "MaturityReturn" | "Refund" | "Other";
  amount: number;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  plan?: { _id: string; title: string } | null;
  amount: number;
  method: "Wallet" | "Razorpay";
  status: "Created" | "Pending" | "Success" | "Failed" | "Refunded";
  createdAt: string;
}

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  status?: boolean;
  createdAt?: string;
}

export const getDashboard = async (): Promise<DashboardData> => {
  const res = await api.get("/dashboard");
  if (res.data.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data.message || "Failed to load dashboard");
};
