import api from '../../../core/api/axios';

export interface Plan {
  _id: string;
  title: string;
  description: string;
  image?: string;
  category: string;
  price: number;
  duration: number;
  returnAmount?: number;
  displayOrder: number;
  status: boolean;
}

export type ReturnStatus =
  | 'Pending'
  | 'Processing'
  | 'Credited'
  | 'Failed'
  | 'NotApplicable';

export interface Subscription {
  _id: string;
  plan: Plan;
  startDate: string;
  endDate: string;
  amountPaid: number;
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  paymentMethod?: 'Wallet' | 'Razorpay';
  status: 'Pending' | 'Active' | 'Expired' | 'Cancelled';

  returnAmount?: number;
  returnStatus?: ReturnStatus;
  returnCreditedAt?: string;
  returnFailureReason?: string;
}

interface PlansResponse {
  success: boolean;
  message?: string;
  plans: Plan[];
}

interface SubscribeResponse {
  success: boolean;
  message: string;
  subscription: Subscription;
  walletBalance?: number;
}

interface CurrentSubscriptionResponse {
  success: boolean;
  message?: string;
  subscription: Subscription | null;
}

export const getActivePlans = async (): Promise<Plan[]> => {
  const response = await api.get<PlansResponse>(
    '/plans/active',
  );

  return response.data.plans || [];
};

export const purchasePlan = async (
  planId: string,
): Promise<SubscribeResponse> => {
  const response = await api.post<SubscribeResponse>(
    '/subscriptions',
    {
      planId,
    },
  );

  return response.data;
};

/*
 * Wallet purchase uses the same
 * /subscriptions route — backend deducts
 * the plan price from wallet balance
 * and activates the subscription.
 */
export const purchaseUsingWallet = async (
  planId: string,
): Promise<SubscribeResponse> => {
  const response = await api.post<SubscribeResponse>(
    '/subscriptions',
    {
      planId,
    },
  );

  return response.data;
};

export const getCurrentSubscription =
  async (): Promise<Subscription | null> => {
    const response =
      await api.get<CurrentSubscriptionResponse>(
        '/subscriptions/my-subscription',
      );

    return response.data.subscription || null;
  };

export const getSubscriptionHistory = async () => {
  const response = await api.get(
    '/subscriptions/my-history',
  );

  return response.data.subscriptions || [];
};