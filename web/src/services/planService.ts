import api from "../api/axios";

export interface Plan {
  _id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  price: number;
  duration: number;
  durationHours?: number;
  durationMinutes?: number;
  returnAmount: number;
  displayOrder: number;
  status: boolean;
}

export const getPlans = async (): Promise<Plan[]> => {
  const res = await api.get("/plans");
  return res.data.plans || [];
};

export const subscribePlan = async (data: {
  planId: string;
  paymentMethod: "Wallet" | "Razorpay";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}): Promise<any> => {
  const res = await api.post("/subscriptions", data);
  return res.data;
};

export const createRazorpayOrder = async (planId: string) => {
  const res = await api.post("/payments/create-order", { planId });
  return res.data;
};

export const verifyRazorpayPayment = async (data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  planId: string;
}) => {
  const res = await api.post("/payments/verify", data);
  return res.data;
};
