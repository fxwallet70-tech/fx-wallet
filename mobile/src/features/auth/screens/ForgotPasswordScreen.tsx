import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';

import Theme from '../../../core/theme/theme';
import CustomInput from '../../../shared/components/Input/CustomInput';
import CustomButton from '../../../shared/components/Button/CustomButton';
import {forgotPassword, resetPassword} from '../services/authService';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Validation', 'Please enter your registered email.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await forgotPassword(email.trim());

      // The server never reveals whether an account exists, so it answers the
      // same way for an unknown address - and sends nothing. Claiming an OTP was
      // sent here is a lie the user only discovers when no email ever arrives.
      if (!response.mobile) {
        Alert.alert(
          'Check Your Email',
          response.message ||
            'If that email is registered, a reset code is on its way.',
        );
        return;
      }

      setMobile(response.mobile);
      setStep('reset');

      // Deployments older than the email version answer with the code itself
      // instead of sending it. Surfacing it keeps the flow usable.
      if (response.resetCode) {
        console.warn(
          'Backend returned resetCode directly: /auth/forgot-password is not sending email on this server.',
        );

        Alert.alert(
          'Reset Code',
          `This server did not send an email. Your reset code is ${response.resetCode}. Valid for 10 minutes.`,
        );
        return;
      }

      Alert.alert(
        'Reset Code Sent',
        response.message ||
          'Check your inbox and spam folder for the 6-digit code.',
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Unable to send OTP.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (otp.trim().length !== 6) {
      Alert.alert('Validation', 'Please enter the 6-digit OTP.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Validation', 'Password must be at least 6 characters.');
      return;
    }

    try {
      setIsLoading(true);

      await resetPassword({
        mobile,
        otp: otp.trim(),
        newPassword,
      });

      Alert.alert('Success', 'Password reset successfully.', [
        {text: 'Login', onPress: () => navigation.navigate('Login')},
      ]);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Unable to reset password.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>

      {step === 'email' ? (
        <>
          <Text style={styles.subtitle}>
            Enter your registered email. We will send a 6-digit code to that
            email (free, no SMS).
          </Text>

          <CustomInput
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {isLoading ? (
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          ) : (
            <CustomButton
              title="Send Reset Code"
              onPress={handleSendOtp}
            />
          )}
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>
            Check your email inbox / spam for the 6-digit code, then set a new
            password.
          </Text>

          <CustomInput
            placeholder="Enter 6-digit code from email"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />

          <CustomInput
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          {isLoading ? (
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          ) : (
            <CustomButton title="Reset Password" onPress={handleReset} />
          )}
        </>
      )}
    </View>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: Theme.colors.onLightText,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: Theme.colors.onLightGrey,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
  },
});