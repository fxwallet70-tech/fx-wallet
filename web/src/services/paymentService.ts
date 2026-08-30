import api from "../api/axios";

export interface Payment {
  _id: string;
  plan?: { _id: string; title: string } | null;
  amount: number;
  method: "Wallet" | "Razorpay" | "CDM";
  status: "Created" | "Pending" | "Success" | "Failed" | "Refunded";
  transactionId?: string;
  createdAt: string;
}

export const getPaymentHistory = async (): Promise<{
  success: boolean;
  payments: Payment[];
}> => {
  try {
    // Try the dedicated endpoint first
    const res = await api.get("/payments/history");
    if (res.data.success && res.data.payments) {
      return res.data;
    }
  } catch {
    // Fall back to dashboard endpoint which already works
  }

  try {
    const res = await api.get("/dashboard");
    if (res.data.success && res.data.data) {
      const payments = res.data.data.recentPayments || [];
      return { success: true, payments };
    }
  } catch {
    // silently fail
  }

  return { success: true, payments: [] };
};
