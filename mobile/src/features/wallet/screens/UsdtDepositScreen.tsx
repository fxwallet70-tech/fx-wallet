import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

import {launchImageLibrary} from 'react-native-image-picker';

import {Ionicons} from '@react-native-vector-icons/ionicons';

import Theme from '../../../core/theme/theme';
import {SERVER_BASE_URL} from '../../../core/api/axios';
import {getUsdtPayment} from '../services/usdtPaymentService';
import {submitPaymentProof, getMyProofs} from '../services/paymentProofService';
import PressableScale from '../../../shared/components/animations/PressableScale';
import HoverWiggle from '../../../shared/components/animations/HoverWiggle';
import GlassCard from '../../../shared/components/Card/GlassCard';
import SupportSheet from '../../../shared/components/SupportSheet';
import {
  preloadRewardedVideo,
  showRewardedVideo,
} from '../../../shared/ads/adsService';

const UsdtDepositScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [proofImageUri, setProofImageUri] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscUpi, setIfscUpi] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myProofs, setMyProofs] = useState<any[]>([]);

  const loadMyProofs = async () => {
    try {
      const response = await getMyProofs();
      setMyProofs(response.proofs || []);
    } catch (error) {
      console.log('Load proofs error:', error);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getUsdtPayment();
        setImage(response.data.image);
        setDescription(response.data.description || '');
      } catch (error) {
        setErrorMessage('Unable to load USDT payment details.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
    loadMyProofs();
    preloadRewardedVideo();
  }, []);

  const handlePickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
    });

    if (result.assets && result.assets.length > 0) {
      setProofImageUri(result.assets[0].uri || null);
    }
  };

  const buildAccountDetails = () => {
    const lines: string[] = [];

    if (accountName.trim()) {
      lines.push(`Name: ${accountName.trim()}`);
    }

    if (bankName.trim()) {
      lines.push(`Bank Name: ${bankName.trim()}`);
    }

    if (accountNumber.trim()) {
      lines.push(`Account Number: ${accountNumber.trim()}`);
    }

    if (ifscUpi.trim()) {
      lines.push(`IFSC / UPI ID: ${ifscUpi.trim()}`);
    }

    return lines.join('\n');
  };

  const handleSubmitProof = async () => {
    if (!proofImageUri) {
      Alert.alert('Validation', 'Please select your payment screenshot.');
      return;
    }

    if (!bankName.trim() && !accountNumber.trim() && !ifscUpi.trim()) {
      Alert.alert(
        'Validation',
        'Please fill at least one account detail (Name, Bank Name, Account Number, or IFSC / UPI ID).',
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await submitPaymentProof(proofImageUri, buildAccountDetails());

      Alert.alert(
        'Submitted',
        'Your payment proof has been shared with our team. We will review it shortly.',
      );

      setProofImageUri(null);
      setAccountName('');
      setBankName('');
      setAccountNumber('');
      setIfscUpi('');
      setIsDetailsOpen(false);
      loadMyProofs();
      showRewardedVideo();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit payment proof.',
      );
    } finally {
      setIsSubmitting(false);
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
      <Text style={styles.title}>USDT Deposit</Text>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : (
        <>
          {image ? (
            <Image
              source={{uri: `${SERVER_BASE_URL}${image}`}}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderBox}>
              <Text style={styles.placeholderText}>
                No payment details available yet.
              </Text>
            </View>
          )}

          {description ? (
            <HoverWiggle>
            <GlassCard style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{description}</Text>
            </GlassCard>
            </HoverWiggle>
          ) : null}

          {/* Share payment proof section */}
          <HoverWiggle>
          <GlassCard style={styles.proofCard}>
            <Text style={styles.sectionTitle}>
              Share Payment Screenshot
            </Text>

            <PressableScale
              style={styles.pickImageButton}
              onPress={handlePickImage}>
              <Text style={styles.pickImageText}>
                {proofImageUri ? 'Change Screenshot' : 'Select Screenshot'}
              </Text>
            </PressableScale>

            {proofImageUri ? (
              <Image
                source={{uri: proofImageUri}}
                style={styles.proofPreview}
                resizeMode="cover"
              />
            ) : null}

            <PressableScale
              style={styles.detailsHeader}
              onPress={() => setIsDetailsOpen(open => !open)}>
              <Text style={styles.detailsHeaderTitle}>
                Your Account Details
              </Text>

              <Ionicons
                name={isDetailsOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Theme.colors.primary}
              />
            </PressableScale>

            {isDetailsOpen ? (
              <View>
                <Text style={styles.detailLabel}>Name</Text>
                <TextInput
                  style={styles.detailInput}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={Theme.colors.grey}
                  value={accountName}
                  onChangeText={setAccountName}
                />

                <Text style={styles.detailLabel}>Bank Name</Text>
                <TextInput
                  style={styles.detailInput}
                  placeholder="e.g. HDFC Bank"
                  placeholderTextColor={Theme.colors.grey}
                  value={bankName}
                  onChangeText={setBankName}
                />

                <Text style={styles.detailLabel}>Account Number</Text>
                <TextInput
                  style={styles.detailInput}
                  placeholder="e.g. 50100234567890"
                  placeholderTextColor={Theme.colors.grey}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="number-pad"
                />

                <Text style={styles.detailLabel}>IFSC / UPI ID</Text>
                <TextInput
                  style={styles.detailInput}
                  placeholder="e.g. HDFC0001234 or name@upi"
                  placeholderTextColor={Theme.colors.grey}
                  value={ifscUpi}
                  onChangeText={setIfscUpi}
                  autoCapitalize="characters"
                />
              </View>
            ) : null}

            <PressableScale
              style={styles.submitButton}
              onPress={handleSubmitProof}
              disabled={isSubmitting}>
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </Text>
            </PressableScale>
          </GlassCard>
          </HoverWiggle>

          {myProofs.length > 0 ? (
            <HoverWiggle>
            <GlassCard style={styles.historyCard}>
              <Text style={styles.sectionTitle}>
                Your Submissions
              </Text>

              {myProofs.map((proof) => (
                <View key={proof._id} style={styles.historyRow}>
                  <Image
                    source={{uri: `${SERVER_BASE_URL}${proof.screenshot}`}}
                    style={styles.historyThumb}
                  />

                  <View style={styles.historyInfo}>
                    <Text style={styles.historyDate}>
                      {new Date(proof.createdAt).toLocaleDateString()}
                    </Text>

                    <View
                      style={[
                        styles.statusBadge,
                        proof.status === 'approved' && styles.statusApproved,
                        proof.status === 'rejected' && styles.statusRejected,
                        proof.status === 'pending' && styles.statusPending,
                      ]}>
                      <Text style={styles.statusText}>
                        {proof.status === 'approved'
                          ? 'Approved'
                          : proof.status === 'rejected'
                          ? 'Rejected'
                          : 'Pending Review'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </GlassCard>
            </HoverWiggle>
          ) : null}

          <HoverWiggle>
          <PressableScale
            style={styles.supportButton}
            onPress={() => setIsSupportOpen(true)}>
            <Text style={styles.supportText}>Customer Support</Text>
          </PressableScale>
          </HoverWiggle>
        </>
      )}

      <SupportSheet
        visible={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </ScrollView>
  );
};

export default UsdtDepositScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
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
  image: {
    width: '100%',
    height: 400,
    borderRadius: 14,
    backgroundColor: Theme.colors.card,
  },
  placeholderBox: {
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    padding: 40,
    alignItems: 'center',
  },
  placeholderText: {
    color: Theme.colors.grey,
    textAlign: 'center',
  },
  descriptionCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
  },
  descriptionText: {
    color: Theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 20,
  },
  proofCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
  },
  sectionTitle: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 2,
  },
  detailsHeaderTitle: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  detailLabel: {
    color: Theme.colors.grey,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
  },
  detailInput: {
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
    borderRadius: 10,
    padding: 12,
    color: Theme.colors.text,
    backgroundColor: Theme.colors.inputBg,
    marginBottom: 12,
  },
  pickImageButton: {
    borderWidth: 1.5,
    borderColor: 'rgba(110,66,22,0.85)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255,250,240,0.35)',
  },
  pickImageText: {
    color: Theme.colors.text,
    fontWeight: '600',
  },
  proofPreview: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  historyCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  historyThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    color: Theme.colors.grey,
    fontSize: 12,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPending: {
    backgroundColor: 'rgba(166, 54, 6, 0.08)',
  },
  statusApproved: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
  },
  statusRejected: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.onLightText,
  },
  supportButton: {
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  supportText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});