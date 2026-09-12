import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {RootStackParamList} from '../../../core/navigation/types';
import Theme from '../../../core/theme/theme';
import api from '../../../core/api/axios';

import CustomInput from '../../../shared/components/Input/CustomInput';
import CustomButton from '../../../shared/components/Button/CustomButton';
import FadeInView from '../../../shared/components/animations/FadeInView';
import PressableScale from '../../../shared/components/animations/PressableScale';
import GlassCard from '../../../shared/components/Card/GlassCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({navigation}: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loginUser = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert(
        'Validation Error',
        'Please enter email and password.',
      );
      return;
    }

    try {
      setIsLoading(true);

      console.log('LOGIN REQUEST:', cleanEmail);

      const response = await api.post('/auth/login', {
        email: cleanEmail,
        password,
      });

      console.log('LOGIN RESPONSE:', response.data);

      const token = response.data?.token;
      const refreshToken = response.data?.refreshToken;
      const user = response.data?.user;

      if (!response.data?.success) {
        Alert.alert(
          'Login Failed',
          response.data?.message || 'Login was not successful.',
        );
        return;
      }

      if (!token) {
        Alert.alert(
          'Login Error',
          'Server response does not contain a token.',
        );
        return;
      }

      if (!user) {
        Alert.alert(
          'Login Error',
          'Server response does not contain user data.',
        );
        return;
      }

      try {
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem(
          'userData',
          JSON.stringify(user),
        );

        // Lets the session be renewed silently once the access token expires.
        if (refreshToken) {
          await AsyncStorage.setItem('refreshToken', refreshToken);
        }
      } catch (storageError: any) {
        console.log('STORAGE ERROR:', storageError);

        Alert.alert(
          'Storage Error',
          storageError?.message ||
            'Login succeeded, but token could not be saved.',
        );
        return;
      }

      Alert.alert(
        'Success',
        `Welcome ${user.fullName || 'User'}`,
        [
          {
            text: 'Continue',
            onPress: () => {
              try {
                navigation.replace('Main');
              } catch (navigationError: any) {
                console.log(
                  'NAVIGATION ERROR:',
                  navigationError,
                );

                Alert.alert(
                  'Navigation Error',
                  navigationError?.message ||
                    'Main screen route was not found.',
                );
              }
            },
          },
        ],
      );
    } catch (error: any) {
      console.log('FULL LOGIN ERROR:', error);
      console.log('ERROR MESSAGE:', error?.message);
      console.log('ERROR CODE:', error?.code);
      console.log('ERROR RESPONSE:', error?.response?.data);
      console.log('ERROR STATUS:', error?.response?.status);

      let message = '';

      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.response?.status) {
        message = `Server error ${error.response.status}`;
      } else if (error?.code === 'ECONNABORTED') {
        message = 'Request timed out.';
      } else if (
        error?.code === 'ERR_NETWORK' ||
        error?.message === 'Network Error'
      ) {
        message = 'Cannot connect to backend server.';
      } else if (error?.message) {
        message = error.message;
      } else {
        message = 'Unknown login error occurred.';
      }

      Alert.alert('Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <StatusBar
        backgroundColor="transparent"
        translucent
        barStyle="light-content"
      />

      <View style={styles.logoContainer}>
        <Text style={styles.logo}>FX WALLET</Text>
        <Text style={styles.subtitle}>Welcome Back</Text>
      </View>

      <FadeInView delay={80}>
        <GlassCard style={styles.card}>
        <CustomInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <CustomInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <PressableScale
          disabled={isLoading}
          onPress={() =>
            navigation.navigate('ForgotPassword')
          }>
          <Text style={styles.forgot}>
            Forgot Password?
          </Text>
        </PressableScale>

        {isLoading ? (
          <View style={styles.loadingButton}>
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
            <Text style={styles.loadingText}>
              Logging in...
            </Text>
          </View>
        ) : (
          <CustomButton
            title="LOGIN"
            onPress={loginUser}
          />
        )}

        <PressableScale
          disabled={isLoading}
          onPress={() =>
            navigation.navigate('Register')
          }>
          <Text style={styles.register}>
            Don't have an account? Register
          </Text>
        </PressableScale>
        </GlassCard>
      </FadeInView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    padding: 25,
  },

  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },

  logo: {
    color: Theme.colors.primary,
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: 4,
  },

  subtitle: {
    color: Theme.colors.onLightText,
    marginTop: 10,
    fontSize: 18,
  },

  card: {
    backgroundColor: Theme.colors.glass,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
    ...Theme.shadows.card,
  },

  forgot: {
    color: Theme.colors.primary,
    textAlign: 'right',
    marginBottom: 20,
    marginTop: 5,
  },

  register: {
    color: Theme.colors.text,
    textAlign: 'center',
    marginTop: 20,
  },

  loadingButton: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },
});