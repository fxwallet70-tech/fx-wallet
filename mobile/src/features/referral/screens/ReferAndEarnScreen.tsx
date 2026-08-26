import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Share,
} from 'react-native';

import Theme from '../../../core/theme/theme';
import {getMyReferralSummary} from '../services/referralService';
import PressableScale from '../../../shared/components/animations/PressableScale';
import HoverWiggle from '../../../shared/components/animations/HoverWiggle';
import GlassCard from '../../../shared/components/Card/GlassCard';

const ReferAndEarnScreen = () => {
  const [referralCode, setReferralCode] = useState('');
  const [totalEarned, setTotalEarned] = useState(0);
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getMyReferralSummary();
        setReferralCode(response.referralCode);
        setTotalEarned(response.totalEarned);
        setReferredUsers(response.referredUsers || []);
      } catch (error) {
        console.log('Referral summary error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join FX Wallet using my referral code ${referralCode} and start growing your wealth today!`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}>
      <Text style={styles.title}>Refer &amp; Earn</Text>

      <HoverWiggle>
      <GlassCard style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <Text style={styles.codeValue}>{referralCode}</Text>

        <PressableScale style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share with Friends</Text>
        </PressableScale>
      </GlassCard>
      </HoverWiggle>

      <HoverWiggle>
      <GlassCard style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>Total Earned</Text>
        <Text style={styles.earningsValue}>₹{totalEarned.toFixed(2)}</Text>
      </GlassCard>
      </HoverWiggle>

      <Text style={styles.sectionTitle}>Your Referrals</Text>

      {referredUsers.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            You haven't referred anyone yet. Share your code to start earning!
          </Text>
        </View>
      ) : (
        referredUsers.map((r, index) => (
          <View key={index} style={styles.referralRow}>
            <View>
              <Text style={styles.referralName}>{r.fullName}</Text>
              <Text style={styles.referralDate}>
                Joined {new Date(r.joinedAt).toLocaleDateString()}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                r.status === 'Rewarded'
                  ? styles.statusRewarded
                  : styles.statusPending,
              ]}>
              <Text style={styles.statusText}>{r.status}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default ReferAndEarnScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: Theme.colors.onLightText,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 20,
  },
  codeCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  codeLabel: {
    color: Theme.colors.grey,
    fontSize: 13,
    marginBottom: 8,
  },
  codeValue: {
    color: Theme.colors.primary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  earningsCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  earningsLabel: {
    color: Theme.colors.grey,
    fontSize: 13,
    marginBottom: 6,
  },
  earningsValue: {
    color: '#16A34A',
    fontSize: 30,
    fontWeight: '800',
  },
  sectionTitle: {
    color: Theme.colors.onLightText,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyBox: {
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    padding: 24,
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
    ...Theme.shadows.card,
  },
  emptyText: {
    color: Theme.colors.grey,
    textAlign: 'center',
  },
  referralRow: {
    backgroundColor: Theme.colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
    ...Theme.shadows.card,
  },
  referralName: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  referralDate: {
    color: Theme.colors.grey,
    fontSize: 12,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusPending: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  statusRewarded: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.text,
  },
});