import React, {
  useCallback,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import Theme from '../../../core/theme/theme';

import {
  getCurrentSubscription,
  Subscription,
} from '../../plans/services/planService';
import PressableScale from '../../../shared/components/animations/PressableScale';
import HoverWiggle from '../../../shared/components/animations/HoverWiggle';
import GlassCard from '../../../shared/components/Card/GlassCard';
import {
  formatPlanDuration,
  formatRemainingTime,
  getRemainingBadge,
} from '../../../shared/utils/duration';

const MySubscriptionScreen = () => {
  const navigation = useNavigation<any>();

  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const loadSubscription = async (
    showLoader = true,
  ) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }

      setErrorMessage('');

      const data =
        await getCurrentSubscription();

      setSubscription(data);
    } catch (error: any) {
      console.log(
        'Subscription load error:',
        error.response?.data ||
          error.message,
      );

      setErrorMessage(
        error.response?.data?.message ||
          'Unable to load subscription.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSubscription();

      return undefined;
    }, []),
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadSubscription(false);
  };

  const formatDate = (
    value?: string,
  ) => {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    );
  };

  const getReturnStatusLabel = (
    status?: Subscription['returnStatus'],
  ) => {
    switch (status) {
      case 'Pending':
        return 'Pending';

      case 'Processing':
        return 'Processing';

      case 'Credited':
        return 'Credited';

      case 'Failed':
        return 'Failed';

      case 'NotApplicable':
        return 'Not Applicable';

      default:
        return '-';
    }
  };

  const getPaymentMethodLabel = (
    method?: Subscription['paymentMethod'],
  ) => {
    if (method === 'Wallet') {
      return 'Wallet Balance';
    }

    if (method === 'Razorpay') {
      return 'Razorpay';
    }

    return '-';
  };

  const getReturnStatusColors = (
    status?: Subscription['returnStatus'],
  ) => {
    switch (status) {
      case 'Credited':
        return {
          backgroundColor: 'rgba(22,163,74,0.12)',
          textColor: '#16A34A',
        };

      case 'Failed':
        return {
          backgroundColor: 'rgba(220,38,38,0.1)',
          textColor: '#DC2626',
        };

      case 'Processing':
        return {
          backgroundColor: 'rgba(166,54,6,0.08)',
          textColor: Theme.colors.primary,
        };

      case 'Pending':
        return {
          backgroundColor: 'rgba(166,54,6,0.08)',
          textColor: Theme.colors.primary,
        };

      default:
        return {
          backgroundColor: 'rgba(154,122,82,0.14)',
          textColor: Theme.colors.grey,
        };
    }
  };

  const openPlans = () => {
    navigation.navigate('Main', { screen: 'Plans' });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={Theme.colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading subscription...
        </Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>
          Unable to load
        </Text>

        <Text style={styles.errorMessage}>
          {errorMessage}
        </Text>

        <PressableScale
          style={styles.primaryButton}
          onPress={() =>
            loadSubscription()
          }>
          <Text style={styles.primaryButtonText}>
            Try Again
          </Text>
        </PressableScale>
      </View>
    );
  }

  if (!subscription) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>
          No Active Plan
        </Text>

        <Text style={styles.emptyText}>
          You currently do not have an
          active subscription.
        </Text>

        <PressableScale
          style={styles.primaryButton}
          onPress={openPlans}>
          <Text style={styles.primaryButtonText}>
            Choose a Plan
          </Text>
        </PressableScale>
      </View>
    );
  }

  // If subscription is pending admin approval, show a different view
  if (subscription.status === 'Pending') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Theme.colors.primary}
            colors={[Theme.colors.primary]}
          />
        }>
        <Text style={styles.screenTitle}>
          My Subscription
        </Text>

        <Text style={styles.screenSubtitle}>
          Your plan is pending admin approval.
        </Text>

        <HoverWiggle>
        <GlassCard style={styles.planCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.planLabel}>
                Submitted Plan
              </Text>

              <Text style={styles.planTitle}>
                {subscription.plan?.title || 'Plan'}
              </Text>
            </View>

            <View style={[styles.statusBadge, styles.pendingStatusBadge]}>
              <Text style={[styles.statusText, styles.pendingStatusText]}>
                Pending
              </Text>
            </View>
          </View>

          <Text style={styles.description}>
            {subscription.plan?.description || 'Your plan submission is under review.'}
          </Text>

          <View style={styles.pendingInfoBox}>
            <Text style={styles.pendingInfoIcon}>⏳</Text>
            <View style={styles.pendingInfoContent}>
              <Text style={styles.pendingInfoTitle}>
                Waiting for Approval
              </Text>
              <Text style={styles.pendingInfoText}>
                Our team is reviewing your CDM payment receipt. Your plan will be activated once approved.
              </Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <DetailRow
              label="Amount Paid"
              value={`₹${Number(subscription.amountPaid || 0).toFixed(2)}`}
            />

            <DetailRow
              label="Expected Return"
              value={`₹${Number(subscription.returnAmount || subscription.plan?.returnAmount || 0).toFixed(2)}`}
              valueType="success"
            />

            <DetailRow
              label="Duration"
              value={formatPlanDuration(
                subscription.plan || {},
              )}
            />

            <DetailRow
              label="Payment Method"
              value="CDM"
            />

            <DetailRow
              label="Payment Status"
              value="Pending Review"
            />
          </View>

          <PressableScale
            style={styles.secondaryButton}
            onPress={() => Alert.alert(
              'Pending Approval',
              'Your CDM payment is being reviewed. The plan will activate automatically once the admin approves it.',
            )}>
            <Text style={styles.secondaryButtonText}>
              View Status
            </Text>
          </PressableScale>
        </GlassCard>
        </HoverWiggle>
      </ScrollView>
    );
  }

  const returnAmount = Number(
    subscription.returnAmount ??
      subscription.plan?.returnAmount ??
      0,
  );

  const returnStatusColors =
    getReturnStatusColors(
      subscription.returnStatus,
    );

  const isReturnCredited =
    subscription.returnStatus === 'Credited';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={
            Theme.colors.primary
          }
          colors={[
            Theme.colors.primary,
          ]}
        />
      }>
      <Text style={styles.screenTitle}>
        My Subscription
      </Text>

      <Text style={styles.screenSubtitle}>
        View your active plan details.
      </Text>

      <HoverWiggle>
      <GlassCard style={styles.planCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.planLabel}>
              Current Plan
            </Text>

            <Text style={styles.planTitle}>
              {subscription.plan?.title ||
                'Plan'}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              subscription.status === 'Expired' &&
                styles.expiredStatusBadge,
              subscription.status === 'Cancelled' &&
                styles.cancelledStatusBadge,
            ]}>
            <Text
              style={[
                styles.statusText,
                subscription.status === 'Expired' &&
                  styles.expiredStatusText,
                subscription.status ===
                  'Cancelled' &&
                  styles.cancelledStatusText,
              ]}>
              {subscription.status}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>
          {subscription.plan?.description ||
            'Your active FX Wallet subscription.'}
        </Text>

        <GlassCard style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text
              numberOfLines={1}
              style={styles.summaryValue}>
              {
                getRemainingBadge(
                  subscription.endDate,
                  {
                    days: 'Days Remaining',
                    short: 'Time Remaining',
                  },
                ).value
              }
            </Text>

            <Text style={styles.summaryLabel}>
              {
                getRemainingBadge(
                  subscription.endDate,
                  {
                    days: 'Days Remaining',
                    short: 'Time Remaining',
                  },
                ).caption
              }
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryBox}>
            <Text style={styles.returnSummaryValue}>
              ₹{returnAmount.toFixed(2)}
            </Text>

            <Text style={styles.summaryLabel}>
              Expected Return
            </Text>
          </View>
        </GlassCard>

        <View style={styles.detailsContainer}>
          <DetailRow
            label="Start Date"
            value={formatDate(
              subscription.startDate,
            )}
          />

          <DetailRow
            label="Expected Return Date"
            value={formatDate(
              subscription.endDate,
            )}
          />

          <DetailRow
            label="Duration"
            value={formatPlanDuration(
              subscription.plan || {},
            )}
          />

          <DetailRow
            label="Amount Paid"
            value={`₹${Number(
              subscription.amountPaid || 0,
            ).toFixed(2)}`}
          />

          <DetailRow
            label="Return Amount"
            value={`₹${returnAmount.toFixed(2)}`}
            valueType="success"
          />

          <DetailRow
            label="Payment Method"
            value={getPaymentMethodLabel(
              subscription.paymentMethod,
            )}
          />

          <DetailRow
            label="Payment Status"
            value={
              subscription.paymentStatus || '-'
            }
          />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Return Status
            </Text>

            <View
              style={[
                styles.returnStatusBadge,
                {
                  backgroundColor:
                    returnStatusColors.backgroundColor,
                },
              ]}>
              <Text
                style={[
                  styles.returnStatusText,
                  {
                    color:
                      returnStatusColors.textColor,
                  },
                ]}>
                {getReturnStatusLabel(
                  subscription.returnStatus,
                )}
              </Text>
            </View>
          </View>

          {subscription.returnCreditedAt && (
            <DetailRow
              label="Return Credited On"
              value={formatDate(
                subscription.returnCreditedAt,
              )}
              valueType="success"
            />
          )}

          {subscription.returnStatus ===
            'Failed' &&
            Boolean(
              subscription.returnFailureReason,
            ) && (
              <View style={styles.failureBox}>
                <Text style={styles.failureTitle}>
                  Return processing failed
                </Text>

                <Text style={styles.failureText}>
                  {subscription.returnFailureReason}
                </Text>
              </View>
            )}
        </View>

        <PressableScale
          style={styles.secondaryButton}
          onPress={() => {
            if (isReturnCredited) {
              Alert.alert(
                'Return Credited',
                `₹${returnAmount.toFixed(
                  2,
                )} has been credited to your wallet.`,
              );

              return;
            }

            if (
              subscription.status === 'Expired'
            ) {
              Alert.alert(
                'Subscription Completed',
                'Your subscription period has ended. Return processing status is shown above.',
              );

              return;
            }

            Alert.alert(
              'Subscription Active',
              `Your plan has ${formatRemainingTime(
                subscription.endDate,
              )} left. Expected return is ₹${returnAmount.toFixed(
                2,
              )}.`,
            );
          }}>
          <Text style={styles.secondaryButtonText}>
            {isReturnCredited
              ? 'Return Credited'
              : 'View Status'}
          </Text>
        </PressableScale>
      </GlassCard>
      </HoverWiggle>
    </ScrollView>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
  valueType?: 'default' | 'success';
}

const DetailRow = ({
  label,
  value,
  valueType = 'default',
}: DetailRowProps) => {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.detailValue,
          valueType === 'success' &&
            styles.successDetailValue,
        ]}>
        {value}
      </Text>
    </View>
  );
};

export default MySubscriptionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      Theme.colors.background,
  },

  contentContainer: {
    padding: 20,
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
    color: Theme.colors.onLightText,
    marginTop: 14,
  },

  screenTitle: {
    color: Theme.colors.onLightText,
    fontSize: 29,
    fontWeight: '800',
  },

  screenSubtitle: {
    color: Theme.colors.onLightGrey,
    fontSize: 14,
    marginTop: 7,
    marginBottom: 22,
  },

  planCard: {
    backgroundColor:
      Theme.colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
    ...Theme.shadows.card,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
  },

  planLabel: {
    color: Theme.colors.grey,
    fontSize: 13,
  },

  planTitle: {
    color: Theme.colors.text,
    fontSize: 25,
    fontWeight: '800',
    marginTop: 5,
  },

  statusBadge: {
    backgroundColor: 'rgba(22,163,74,0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.25)',
  },

  statusText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
  },

  description: {
    color: Theme.colors.grey,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 15,
  },

  daysContainer: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 22,
    marginTop: 22,
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
  },

  daysNumber: {
    color: Theme.colors.primary,
    fontSize: 38,
    fontWeight: '800',
  },

  daysLabel: {
    color: Theme.colors.grey,
    fontSize: 13,
    marginTop: 3,
  },

  detailsContainer: {
    marginTop: 22,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },

  detailLabel: {
    color: Theme.colors.grey,
    fontSize: 14,
  },

  detailValue: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },

  primaryButton: {
    backgroundColor:
      Theme.colors.primary,
    borderRadius: 14,
    minHeight: 50,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor:
      Theme.colors.primary,
    borderRadius: 14,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  secondaryButtonText: {
    color: Theme.colors.primary,
    fontWeight: '800',
  },

  errorTitle: {
    color: Theme.colors.onLightText,
    fontSize: 22,
    fontWeight: '700',
  },

  errorMessage: {
    color: Theme.colors.onLightGrey,
    textAlign: 'center',
    marginTop: 10,
  },

  emptyTitle: {
    color: Theme.colors.onLightText,
    fontSize: 23,
    fontWeight: '800',
  },

  emptyText: {
    color: Theme.colors.onLightGrey,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
  },

  pendingStatusBadge: {
    backgroundColor: 'rgba(232, 163, 61, 0.12)',
    borderWidth: 1,
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

  cancelledStatusBadge: {
    backgroundColor: 'rgba(220,38,38,0.1)',
  },

  cancelledStatusText: {
    color: '#DC2626',
  },

  summaryContainer: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    paddingVertical: 22,
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
  },

  summaryBox: {
    flex: 1,
    alignItems: 'center',
  },

  summaryDivider: {
    width: 1,
    height: 52,
    backgroundColor: Theme.colors.hairline,
  },

  summaryValue: {
    color: Theme.colors.primary,
    fontSize: 34,
    fontWeight: '800',
  },

  returnSummaryValue: {
    color: '#16A34A',
    fontSize: 23,
    fontWeight: '800',
  },

  summaryLabel: {
    color: Theme.colors.onLightGrey,
    fontSize: 12,
    marginTop: 5,
  },

  successDetailValue: {
    color: '#16A34A',
  },

  returnStatusBadge: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },

  returnStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  failureBox: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: 12,
    padding: 13,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.2)',
  },

  failureTitle: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },

  failureText: {
    color: '#B91C1C',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  pendingInfoBox: {
    backgroundColor: 'rgba(232, 163, 61, 0.08)',
    borderRadius: 14,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(232, 163, 61, 0.2)',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  pendingInfoIcon: {
    fontSize: 22,
    marginRight: 12,
    marginTop: 2,
  },

  pendingInfoContent: {
    flex: 1,
  },

  pendingInfoTitle: {
    color: '#E8A33D',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },

  pendingInfoText: {
    color: Theme.colors.grey,
    fontSize: 13,
    lineHeight: 19,
  },
});