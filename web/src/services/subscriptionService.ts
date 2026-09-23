import api from "../api/axios";

export interface MySubscription {
  _id: string;
  plan: {
    _id: string;
    title: string;
    description?: string;
    price?: number;
    duration?: number;
    durationHours?: number;
    durationMinutes?: number;
    returnAmount?: number;
    image?: string;
  };
  startDate: string;
  endDate: string;
  status: "Active" | "Expired" | "Cancelled";
  amountPaid: number;
  returnAmount: number;
  paymentMethod: "Wallet" | "Razorpay";
  paymentStatus: "Pending" | "Paid" | "Failed";
  returnStatus: "Pending" | "Processing" | "Credited" | "Failed" | "NotApplicable";
  daysRemaining?: number;
}

export const getMySubscription = async (): Promise<{
  success: boolean;
  subscription: MySubscription;
}> => {
  const res = await api.get("/subscriptions/my-subscription");
  return res.data;
};

export const getSubscriptionHistory = async (): Promise<{
  success: boolean;
  subscriptions: MySubscription[];
}> => {
  const res = await api.get("/subscriptions/my-history");
  return res.data;
};
