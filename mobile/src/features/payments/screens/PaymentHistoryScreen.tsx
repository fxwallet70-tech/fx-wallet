import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';

import {useFocusEffect} from '@react-navigation/native';

import api from '../../../core/api/axios';
import Theme from '../../../core/theme/theme';
import PressableScale from '../../../shared/components/animations/PressableScale';
import HoverWiggle from '../../../shared/components/animations/HoverWiggle';
import GlassCard from '../../../shared/components/Card/GlassCard';

interface Payment {
  _id: string;
  amount: number;
  currency?: string;
  method: string;
  status: string;
  transactionId?: string;
  createdAt: string;
  plan?: {
    title?: string;
  };
}

interface PaymentHistoryResponse {
  success: boolean;
  payments?: Payment[];
  message?: string;
}

const PaymentHistoryScreen = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadPayments = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }

      setErrorMessage('');

      // Try dedicated endpoint first, fall back to dashboard
      let loaded = false;
      try {
        const response =
          await api.get<PaymentHistoryResponse>(
            '/payments/history',
          );
        if (response.data.success && response.data.payments) {
          setPayments(response.data.payments);
          loaded = true;
        }
      } catch {
        // fall through to dashboard
      }

      if (!loaded) {
        try {
          const dashRes = await api.get('/dashboard');
          if (dashRes.data.success && dashRes.data.data) {
            setPayments(dashRes.data.data.recentPayments || []);
            loaded = true;
          }
        } catch {
          // silently fail
        }
      }

      if (!loaded) {
        setErrorMessage('Unable to load payment history.');
      }
    } catch (error: any) {
      console.log(
        'Payment history error:',
        error.response?.data || error.message,
      );

      setErrorMessage(
        error.response?.data?.message ||
          'Unable to load payment history.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPayments();

      return undefined;
    }, []),
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadPayments(false);
  };

  const formatCurrency = (amount: number) => {
    return `₹${Number(amount || 0).toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );
  };

  const getStatusStyle = (status: string) => {
    const value = status?.toLowerCase();

    if (
      value === 'success' ||
      value === 'completed' ||
      value === 'paid'
    ) {
      return styles.successStatus;
    }

    if (
      value === 'failed' ||
      value === 'cancelled'
    ) {
      return styles.failedStatus;
    }

    return styles.pendingStatus;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={Theme.colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading payment history...
        </Text>
      </View>
    );
  }

  if (errorMessage && payments.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>
          Unable to load payments
        </Text>

        <Text style={styles.errorText}>
          {errorMessage}
        </Text>

        <PressableScale
          style={styles.retryButton}
          onPress={() => loadPayments()}>
          <Text style={styles.retryButtonText}>
            Try Again
          </Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>
          Payment History
        </Text>

        <Text style={styles.subtitle}>
          View all your wallet and Razorpay payments
        </Text>
      </View>

      <FlatList
        data={payments}
        keyExtractor={item => item._id}
        contentContainerStyle={
          payments.length === 0
            ? styles.emptyList
            : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              No payments found
            </Text>

            <Text style={styles.emptyText}>
              Your completed payments will appear
              here.
            </Text>
          </View>
        }
        renderItem={({item}) => (
          <HoverWiggle>
          <GlassCard style={styles.paymentCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>
                  {item.plan?.title ||
                    'Subscription Payment'}
                </Text>

                <Text style={styles.paymentMethod}>
                  {item.method || 'Payment'}
                </Text>
              </View>

              <Text style={styles.amount}>
                {formatCurrency(item.amount)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>
                Status
              </Text>

              <Text
                style={[
                  styles.statusBadge,
                  getStatusStyle(item.status),
                ]}>
                {item.status || 'Pending'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>
                Date
              </Text>

              <Text style={styles.value}>
                {formatDate(item.createdAt)}
              </Text>
            </View>

            {item.transactionId ? (
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Transaction ID
                </Text>

                <Text
                  numberOfLines={1}
                  style={styles.transactionValue}>
                  {item.transactionId}
                </Text>
              </View>
            ) : null}
          </GlassCard>
          </HoverWiggle>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      Theme.colors.background || '#f5f6fa',
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
  },

  heading: {
    color: Theme.colors.onLightText,
    fontSize: 25,
    fontWeight: '700',
  },

  subtitle: {
    marginTop: 5,
    color: Theme.colors.onLightGrey,
    fontSize: 13,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  paymentCard: {
    padding: 17,
    marginBottom: 14,
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
    ...Theme.shadows.card,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },

  planInfo: {
    flex: 1,
  },

  planTitle: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },

  paymentMethod: {
    marginTop: 5,
    color: Theme.colors.grey,
    fontSize: 12,
  },

  amount: {
    color: Theme.colors.primary,
    fontSize: 17,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    marginVertical: 14,
    backgroundColor: Theme.colors.hairline,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 10,
  },

  label: {
    color: Theme.colors.grey,
    fontSize: 12,
  },

  value: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: '500',
  },

  transactionValue: {
    maxWidth: '65%',
    color: Theme.colors.grey,
    fontSize: 11,
    fontWeight: '500',
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  successStatus: {
    color: '#16A34A',
    backgroundColor: 'rgba(22,163,74,0.12)',
  },

  failedStatus: {
    color: '#DC2626',
    backgroundColor: 'rgba(220,38,38,0.1)',
  },

  pendingStatus: {
    color: Theme.colors.primary,
    backgroundColor: 'rgba(166,54,6,0.08)',
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    backgroundColor:
      Theme.colors.background || '#f5f6fa',
  },

  loadingText: {
    marginTop: 12,
    color: Theme.colors.grey,
  },

  errorTitle: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },

  errorText: {
    marginTop: 8,
    color: Theme.colors.grey,
    textAlign: 'center',
    lineHeight: 20,
  },

  retryButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 11,
    backgroundColor: Theme.colors.primary,
    borderRadius: 9,
  },

  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },

  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  emptyContainer: {
    alignItems: 'center',
    padding: 30,
  },

  emptyTitle: {
    color: Theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
  },

  emptyText: {
    marginTop: 7,
    color: Theme.colors.grey,
    textAlign: 'center',
  },
});

export default PaymentHistoryScreen;