import React, {
  useCallback,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import {useFocusEffect, useNavigation} from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Theme from '../../../core/theme/theme';
import api from '../../../core/api/axios';
import FadeInView from '../../../shared/components/animations/FadeInView';
import PressableScale from '../../../shared/components/animations/PressableScale';
import HoverWiggle from '../../../shared/components/animations/HoverWiggle';
import GlassCard from '../../../shared/components/Card/GlassCard';

interface DashboardUser {
  id: string;
  fullName: string;
  email: string;
  mobile?: string;
}

interface Plan {
  _id?: string;
  id?: string;

  name?: string;
  title?: string;
  price?: number;
  duration?: number;
  returnAmount?: number;

  description?: string;
  category?: string;
  image?: string;
}

interface DashboardWallet {
  balance: number;
  pendingReturn: number;
  pendingReturnCount: number;
  totalMaturityReturn: number;
}

interface CurrentSubscription {
  id: string;
  plan: Plan | null;

  startDate: string;
  endDate: string;

  status:
    | 'Pending'
    | 'Active'
    | 'Expired'
    | 'Cancelled';

  amountPaid: number;
  returnAmount: number;

  paymentMethod:
    | 'Wallet'
    | 'Razorpay';

  paymentStatus:
    | 'Pending'
    | 'Paid'
    | 'Failed';

  returnStatus:
    | 'Pending'
    | 'Processing'
    | 'Credited'
    | 'Failed'
    | 'NotApplicable';

  daysRemaining: number;
}

interface Transaction {
  _id: string;

  type:
    | 'credit'
    | 'debit';

  category?:
    | 'AdminCredit'
    | 'AdminDebit'
    | 'PlanPurchase'
    | 'MaturityReturn'
    | 'Refund'
    | 'Other';

  amount: number;
  description: string;
  createdBy: string;
  createdAt: string;
}

interface RecentPayment {
  _id: string;

  plan?: {
    _id: string;
    title: string;
  } | null;

  amount: number;

  method:
    | 'Wallet'
    | 'Razorpay';

  status:
    | 'Created'
    | 'Pending'
    | 'Success'
    | 'Failed'
    | 'Refunded';

  createdAt: string;
}

interface Announcement {
  _id: string;
  title: string;
  message: string;
  status?: boolean;
  createdAt?: string;
}

interface DashboardData {
  user: DashboardUser;
  wallet: DashboardWallet;

  subscriptions:
    CurrentSubscription[];

  recentTransactions:
    Transaction[];

  recentPayments:
    RecentPayment[];

  announcements?:
    Announcement[];
}

interface DashboardResponse {
  success: boolean;
  message?: string;
  data: DashboardData;
}

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const [dashboardData, setDashboardData] =
    useState<DashboardData | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');
  const [pendingCdmSubs, setPendingCdmSubs] = useState<CurrentSubscription[]>([]);

  const loadDashboard = async (
    showLoader = true,
  ) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }

      setErrorMessage('');

      const response =
        await api.get<DashboardResponse>(
          '/dashboard',
        );

      if (
        response.data.success &&
        response.data.data
      ) {
        setDashboardData(
          response.data.data,
        );
        // Clean up pending CDM entries that are now approved
        syncPendingCdm(response.data.data.subscriptions || []);
      } else {
        setErrorMessage(
          response.data.message ||
            'Unable to load dashboard.',
        );
      }
    } catch (error: any) {
      console.log(
        'Dashboard error:',
        error.response?.data ||
          error.message,
      );

      setErrorMessage(
        error.response?.data?.message ||
          'Unable to connect to the server.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
      loadPendingCdm();

      return undefined;
    }, []),
  );


  const loadPendingCdm = async () => {
    try {
      const stored = await AsyncStorage.getItem('pendingCdmSubscriptions');
      if (stored) {
        setPendingCdmSubs(JSON.parse(stored));
      }
    } catch (e) {
      console.log('Load pending CDM error:', e);
    }
  };

  // Clear pending CDM entries that now have a real subscription from backend
  const syncPendingCdm = async (serverSubs: CurrentSubscription[]) => {
    try {
      const stored = await AsyncStorage.getItem('pendingCdmSubscriptions');
      if (!stored) return;

      const pendingList: CurrentSubscription[] = JSON.parse(stored);
      if (pendingList.length === 0) return;

      // Check which pending entries now have a real subscription (approved)
      const serverPlanIds = serverSubs.map(s => s.plan?._id || s.plan?.id);
      const stillPending = pendingList.filter(
        p => !serverPlanIds.includes(p.plan?._id || p.plan?.id),
      );

      if (stillPending.length !== pendingList.length) {
        // Some were approved — update AsyncStorage
        await AsyncStorage.setItem('pendingCdmSubscriptions', JSON.stringify(stillPending));
        setPendingCdmSubs(stillPending);
      }
    } catch (e) {
      console.log('Sync pending CDM error:', e);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDashboard(false);
    loadPendingCdm();
  };

  const formatCurrency = (
    amount: number | undefined,
  ) => {
    return `₹${Number(
      amount || 0,
    ).toFixed(2)}`;
  };

  const formatDate = (
    value?: string,
  ) => {
    if (!value) {
      return '-';
    }

    return new Date(
      value,
    ).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTransactionTitle = (
    transaction: Transaction,
  ) => {
    switch (transaction.category) {
      case 'MaturityReturn':
        return 'Maturity Return';

      case 'PlanPurchase':
        return 'Plan Purchase';

      case 'AdminCredit':
        return 'Wallet Credit';

      case 'AdminDebit':
        return 'Wallet Debit';

      case 'Refund':
        return 'Refund';

      default:
        return transaction.description ||
          'Wallet Transaction';
    }
  };

  const getReturnStatusLabel = (
    status?: CurrentSubscription['returnStatus'],
  ) => {
    switch (status) {
      case 'Pending':
        return 'Return Pending';

      case 'Processing':
        return 'Return Processing';

      case 'Credited':
        return 'Return Credited';

      case 'Failed':
        return 'Return Failed';

      case 'NotApplicable':
        return 'No Return';

      default:
        return '-';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={Theme.colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  if (
    errorMessage &&
    !dashboardData
  ) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>
          Dashboard unavailable
        </Text>

        <Text style={styles.errorMessage}>
          {errorMessage}
        </Text>

        <PressableScale
          style={styles.retryButton}
          onPress={() =>
            loadDashboard()
          }>
          <Text
            style={styles.retryButtonText}>
            Try Again
          </Text>
        </PressableScale>
      </View>
    );
  }

  const user = dashboardData?.user;

  const wallet =
    dashboardData?.wallet;

  const serverSubscriptions =
    dashboardData?.subscriptions || [];

  // Merge server subs with local pending CDM subs (avoid duplicates)
  const serverPlanIds = serverSubscriptions.map(s => s.plan?._id || s.plan?.id);
  const uniquePending = pendingCdmSubs.filter(
    p => !serverPlanIds.includes(p.plan?._id || p.plan?.id),
  );
  const subscriptions = [...uniquePending, ...serverSubscriptions];

  const recentTransactions =
    dashboardData?.recentTransactions || [];

  const announcements =
    dashboardData?.announcements || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={Theme.colors.primary}
          colors={[Theme.colors.primary]}
        />
      }>
      <Text style={styles.greeting}>
        Hello,{' '}
        {user?.fullName ||
          'User'}{' '}
        👋
      </Text>

      <Text style={styles.welcomeText}>
        Welcome back to FX Wallet
      </Text>

      {announcements.length > 0 ? (
        <HoverWiggle>
        <GlassCard style={styles.announcementCard}>
          <Text style={styles.announcementLabel}>
            📢 Latest Announcement
          </Text>

          <Text style={styles.announcementTitle}>
            {announcements[0].title}
          </Text>

          <Text style={styles.announcementMessage}>
            {announcements[0].message}
          </Text>
        </GlassCard>
        </HoverWiggle>
      ) : null}

      <FadeInView delay={40}>
      <HoverWiggle>
      <PressableScale
        style={styles.walletCard}
        onPress={() =>
          navigation.navigate('Wallet')
        }>
        <View style={styles.walletHeader}>
          <View>
            <Text style={styles.walletLabel}>
              Available Balance
            </Text>

            <Text style={styles.walletAmount}>
              {formatCurrency(
                wallet?.balance,
              )}
            </Text>
          </View>

          <Text style={styles.openArrow}>
            ›
          </Text>
        </View>

        <View style={styles.walletDivider} />

        <View style={styles.walletBottomRow}>
          <View>
            <Text
              style={
                styles.walletSmallLabel
              }>
              Pending Return
            </Text>

            <Text
              style={
                styles.pendingReturnValue
              }>
              {formatCurrency(
                wallet?.pendingReturn,
              )}
            </Text>
          </View>

          <View style={styles.walletRightBox}>
            <Text
              style={
                styles.walletSmallLabel
              }>
              Returns Received
            </Text>

            <Text
              style={
                styles.receivedReturnValue
              }>
              {formatCurrency(
                wallet?.totalMaturityReturn,
              )}
            </Text>
          </View>
        </View>
      </PressableScale>
      </HoverWiggle>
      </FadeInView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          My Subscription
        </Text>

        <PressableScale
          onPress={() =>
            navigation.navigate(
              'MySubscription',
            )
          }>
          <Text style={styles.viewAllText}>
            View Details
          </Text>
        </PressableScale>
      </View>

      {subscriptions.length > 0 ? (
        subscriptions.map(subscription => (
          <FadeInView key={subscription.id} delay={120}>
          <HoverWiggle>
          <PressableScale
            onPress={() =>
              navigation.navigate(
                'MySubscription',
              )
            }>
            <GlassCard style={styles.subscriptionCard}>
            <View
              style={
                styles.subscriptionHeader
              }>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>
                  {subscription.plan?.title}
                </Text>

                <View style={styles.statusRow}>
                  <View style={[
                    styles.statusBadge,
                    subscription.status === 'Pending' && styles.pendingStatusBadge,
                    subscription.status === 'Expired' && styles.expiredStatusBadge,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      subscription.status === 'Pending' && styles.pendingStatusText,
                      subscription.status === 'Expired' && styles.expiredStatusText,
                    ]}>
                      {subscription.status === 'Pending' ? '⏳ Pending Approval' : subscription.status}
                    </Text>
                  </View>
                </View>
              </View>

              {subscription.status !== 'Pending' ? (
                <View style={styles.daysBadge}>
                  <Text style={styles.daysValue}>
                    {subscription.daysRemaining}
                  </Text>

                  <Text style={styles.daysText}>
                    days left
                  </Text>
                </View>
              ) : (
                <View style={[styles.daysBadge, styles.pendingDaysBadge]}>
                  <Text style={[styles.daysValue, styles.pendingDaysValue]}>
                    ?
                  </Text>

                  <Text style={styles.daysText}>
                    awaiting
                  </Text>
                </View>
              )}
            </View>

            {subscription.status === 'Pending' ? (
              <View style={styles.pendingInfoBox}>
                <Text style={styles.pendingInfoText}>
                  ⏳ Your CDM payment is under review. Plan will activate once approved.
                </Text>
              </View>
            ) : null}

            <View
              style={
                styles.subscriptionDivider
              }
            />

            <View style={styles.returnRow}>
              <View>
                <Text style={styles.returnLabel}>
                  Amount Paid
                </Text>

                <Text style={styles.paidValue}>
                  {formatCurrency(
                    subscription.amountPaid,
                  )}
                </Text>
              </View>

              <View style={styles.returnRight}>
                <Text style={styles.returnLabel}>
                  Expected Return
                </Text>

                <Text
                  style={
                    styles.expectedReturnValue
                  }>
                  {formatCurrency(
                    subscription.returnAmount,
                  )}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.returnStatusContainer,
                subscription.status === 'Pending' && styles.pendingReturnContainer,
              ]}>
              <Text
                style={[
                  styles.returnStatusText,
                  subscription.status === 'Pending' && styles.pendingReturnStatusText,
                ]}>
                {subscription.status === 'Pending'
                  ? '⏳ Waiting for Approval'
                  : getReturnStatusLabel(
                      subscription.returnStatus,
                    )}
              </Text>

              <Text
                style={[
                  styles.expiryDateText,
                  subscription.status === 'Pending' && styles.pendingExpiryDateText,
                ]}>
                {formatDate(
                  subscription.endDate,
                )}
              </Text>
            </View>
            </GlassCard>
          </PressableScale>
          </HoverWiggle>
          </FadeInView>
        ))
      ) : (
        <HoverWiggle>
        <GlassCard style={styles.noPlanCard}>
          <Text style={styles.noPlanTitle}>
            No Active Plan
          </Text>

          <Text style={styles.noPlanText}>
            Choose a plan to start your
            subscription.
          </Text>

          <PressableScale
            style={styles.choosePlanButton}
            onPress={() =>
              navigation.navigate('Plans')
            }>
            <Text
              style={
                styles.choosePlanButtonText
              }>
              View Plans
            </Text>
          </PressableScale>
        </GlassCard>
        </HoverWiggle>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Quick Actions
        </Text>
      </View>

      <FadeInView delay={200}>
      <View style={styles.quickActionsGrid}>
        <View style={styles.quickActionWrap}>
        <PressableScale
          style={styles.quickActionInner}
          onPress={() =>
            navigation.navigate('Plans')
          }>
          <GlassCard style={styles.quickActionCard}>
          <View style={styles.quickActionIconChip}>
          <Text style={styles.quickActionIcon}>
            P
          </Text>
          </View>

          <Text style={styles.quickActionTitle}>
            Plans
          </Text>

          <Text style={styles.quickActionText}>
            Browse plans
          </Text>
          </GlassCard>
        </PressableScale>
        </View>

        <View style={styles.quickActionWrap}>
        <PressableScale
          style={styles.quickActionInner}
          onPress={() =>
            navigation.navigate('Wallet')
          }>
          <GlassCard style={styles.quickActionCard}>
          <View style={styles.quickActionIconChip}>
          <Text style={styles.quickActionIcon}>
            W
          </Text>
          </View>

          <Text style={styles.quickActionTitle}>
            Wallet
          </Text>

          <Text style={styles.quickActionText}>
            View balance
          </Text>
          </GlassCard>
        </PressableScale>
        </View>

        <View style={styles.quickActionWrap}>
        <PressableScale
          style={styles.quickActionInner}
          onPress={() =>
            navigation.navigate(
              'MySubscription',
            )
          }>
          <GlassCard style={styles.quickActionCard}>
          <View style={styles.quickActionIconChip}>
          <Text style={styles.quickActionIcon}>
            S
          </Text>
          </View>

          <Text style={styles.quickActionTitle}>
            Subscription
          </Text>

          <Text style={styles.quickActionText}>
            Track maturity
          </Text>
          </GlassCard>
        </PressableScale>
        </View>

        <View style={styles.quickActionWrap}>
        <PressableScale
          style={styles.quickActionInner}
          onPress={() =>
            navigation.navigate(
              'PaymentHistory',
            )
          }>
          <GlassCard style={styles.quickActionCard}>
          <View style={styles.quickActionIconChip}>
          <Text style={styles.quickActionIcon}>
            H
          </Text>
          </View>

          <Text style={styles.quickActionTitle}>
            Payments
          </Text>

          <Text style={styles.quickActionText}>
            View history
          </Text>
          </GlassCard>
        </PressableScale>
        </View>
      </View>
      </FadeInView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Recent Transactions
        </Text>

        <PressableScale
          onPress={() =>
            navigation.navigate('Wallet')
          }>
          <Text style={styles.viewAllText}>
            View All
          </Text>
        </PressableScale>
      </View>

      {recentTransactions.length > 0 ? (
        recentTransactions.map(
          transaction => {
            const isCredit =
              transaction.type ===
              'credit';

            return (
              <HoverWiggle key={transaction._id}>
              <GlassCard
                style={
                  styles.transactionCard
                }>
                <View
                  style={[
                    styles.transactionIcon,
                    isCredit
                      ? styles.creditIcon
                      : styles.debitIcon,
                  ]}>
                  <Text
                    style={[
                      styles.transactionIconText,
                      isCredit
                        ? styles.creditText
                        : styles.debitText,
                    ]}>
                    {isCredit ? '+' : '−'}
                  </Text>
                </View>

                <View
                  style={
                    styles.transactionInfo
                  }>
                  <Text
                    style={
                      styles.transactionTitle
                    }>
                    {getTransactionTitle(
                      transaction,
                    )}
                  </Text>

                  <Text
                    style={
                      styles.transactionDate
                    }>
                    {formatDate(
                      transaction.createdAt,
                    )}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.transactionAmount,
                    isCredit
                      ? styles.creditText
                      : styles.debitText,
                  ]}>
                  {isCredit ? '+' : '−'}
                  {formatCurrency(
                    transaction.amount,
                  )}
                </Text>
              </GlassCard>
              </HoverWiggle>
            );
          },
        )
      ) : (
        <Text style={styles.noTransactionText}>
          No wallet transactions found.
        </Text>
      )}

      {errorMessage ? (
        <Text
          style={styles.smallError}>
          {errorMessage}
        </Text>
      ) : null}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(6, 11, 22, 0.85)',
  },

  content: {
   paddingHorizontal: 20,
   paddingTop: 8,
   paddingBottom: 110,
   },

  centerContainer: {
    flex: 1,
    backgroundColor:
      Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  loadingText: {
    color: Theme.colors.text,
    marginTop: 14,
    fontSize: 15,
  },

  errorTitle: {
    color: Theme.colors.text,
    fontSize: 22,
    fontWeight: '700',
  },

  errorMessage: {
    color: Theme.colors.grey,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
  },

  retryButton: {
    backgroundColor:
      Theme.colors.primary,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  retryButtonText: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },

  greeting: {
   color: Theme.colors.text,
   fontSize: 24,
   fontWeight: '800',
   marginTop: 2,
  },

  welcomeText: {
   color: Theme.colors.grey,
   fontSize: 13,
   marginTop: 2,
   marginBottom: 14,
  },

  announcementCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(20px) saturate(1.5)',
    webkitBackdropFilter: 'blur(20px) saturate(1.5)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },

  announcementLabel: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
  },

  announcementTitle: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },

  announcementMessage: {
    color: Theme.colors.grey,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

walletCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(20px) saturate(1.5)',
    webkitBackdropFilter: 'blur(20px) saturate(1.5)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },

  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  walletLabel: {
    color: Theme.colors.grey,
    fontSize: 13,
  },

  walletAmount: {
    color: Theme.colors.text,
    fontSize: 31,
    fontWeight: '800',
    marginTop: 5,
  },

  openArrow: {
    color: Theme.colors.text,
    fontSize: 34,
  },

  walletDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.10)',
    marginVertical: 17,
  },

  walletBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  walletRightBox: {
    alignItems: 'flex-end',
  },

  walletSmallLabel: {
    color: Theme.colors.grey,
    fontSize: 11,
  },

  pendingReturnValue: {
    color: Theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },

  receivedReturnValue: {
    color: Theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 12,
  },

  sectionTitle: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 12,
  },

  viewAllText: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },

subscriptionCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(20px) saturate(1.5)',
    webkitBackdropFilter: 'blur(20px) saturate(1.5)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },

  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  planInfo: {
    flex: 1,
  },

  planName: {
    color: Theme.colors.text,
    fontSize: 21,
    fontWeight: '800',
  },

  subscriptionStatus: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },

  daysBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  daysValue: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },

  daysText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 2,
  },

  subscriptionDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.10)',
    marginVertical: 16,
  },

  returnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  returnRight: {
    alignItems: 'flex-end',
  },

  returnLabel: {
    color: Theme.colors.grey,
    fontSize: 11,
  },

  paidValue: {
    color: Theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 5,
  },

  expectedReturnValue: {
    color: Theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 5,
  },

  returnStatusContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 11,
    padding: 11,
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  returnStatusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  pendingReturnContainer: {
    backgroundColor: 'rgba(232, 163, 61, 0.15)',
    borderColor: 'rgba(232, 163, 61, 0.4)',
  },

  pendingReturnStatusText: {
    color: '#E8A33D',
  },

  pendingExpiryDateText: {
    color: '#C4903A',
  },

  expiryDateText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
  },

  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  quickActionWrap: {
    width: '48%',
    marginBottom: 10,
  },

  quickActionInner: {
    width: '100%',
  },

  quickActionCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(20px) saturate(1.5)',
    webkitBackdropFilter: 'blur(20px) saturate(1.5)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },

  quickActionIconChip: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },

  quickActionIcon: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  quickActionTitle: {
    color: Theme.colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },

  quickActionText: {
    color: Theme.colors.grey,
    fontSize: 10,
    marginTop: 3,
  },

  transactionCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(20px) saturate(1.5)',
    webkitBackdropFilter: 'blur(20px) saturate(1.5)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },

  transactionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  creditIcon: {
    backgroundColor: 'rgba(212,175,55,0.13)',
  },

  debitIcon: {
    backgroundColor: 'rgba(220,38,38,0.12)',
  },

  transactionIconText: {
    fontSize: 18,
    fontWeight: '900',
  },

  transactionInfo: {
    flex: 1,
    marginHorizontal: 12,
  },

  transactionTitle: {
    color: Theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },

  transactionDate: {
    color: Theme.colors.grey,
    fontSize: 10,
    marginTop: 4,
  },

  transactionAmount: {
    fontSize: 14,
    fontWeight: '800',
  },

  creditText: {
    color: Theme.colors.text,
  },

  debitText: {
    color: '#DC2626',
  },

statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  statusBadge: {
    backgroundColor: 'rgba(22,163,74,0.12)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.25)',
  },

  statusText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },

  pendingStatusBadge: {
    backgroundColor: 'rgba(232, 163, 61, 0.12)',
    borderColor: 'rgba(232, 163, 61, 0.25)',
  },

  pendingStatusText: {
    color: '#E8A33D',
  },

  expiredStatusBadge: {
    backgroundColor: 'rgba(166,54,6,0.08)',
  },

  expiredStatusText: {
    color: Theme.colors.primary,
  },

  pendingDaysBadge: {
    backgroundColor: 'rgba(232, 163, 61, 0.15)',
    borderColor: 'rgba(232, 163, 61, 0.3)',
  },

  pendingDaysValue: {
    color: '#E8A33D',
  },

  pendingInfoBox: {
    backgroundColor: 'rgba(232, 163, 61, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(232, 163, 61, 0.2)',
  },

  pendingInfoText: {
    color: '#E8A33D',
    fontSize: 12,
    fontWeight: '600',
  },

  noPlanCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  noPlanTitle: {
    color: Theme.colors.text,
    fontSize: 19,
    fontWeight: '800',
  },

  noPlanText: {
    color: Theme.colors.grey,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },

  choosePlanButton: {
    backgroundColor:
      Theme.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 17,
  },

  choosePlanButtonText: {
    color: Theme.colors.text,
    fontWeight: '800',
  },

  noTransactionText: {
    color: Theme.colors.grey,
    textAlign: 'center',
    paddingVertical: 22,
  },

  smallError: {
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 5,
  },

  bottomSpace: {
    height: 10,
  },
});
