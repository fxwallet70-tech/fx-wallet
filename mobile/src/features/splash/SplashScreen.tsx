import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  View,
} from 'react-native';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../core/navigation/types';
import {clearSession} from '../../core/session/session';
import {ensureValidSession} from '../../core/session/tokenRefresh';
import Theme from '../../core/theme/theme';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Splash'
>;

const SplashScreen = ({navigation}: Props) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    const checkAuth = async () => {
      // Renews quietly when the access token has expired but the session is
      // still alive, so a returning user lands straight in the app.
      const hasValidSession = await ensureValidSession();

      if (!hasValidSession) {
        await clearSession();
      }

      setTimeout(() => {
        if (hasValidSession) {
          navigation.replace('Main');
        } else {
          navigation.replace('Login');
        }
      }, 2400);
    };

    checkAuth();
  }, [navigation, opacity, translateY, scale]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity,
          transform: [{translateY}, {scale}],
        }}>
        <Text style={styles.logo}>FX WALLET</Text>

        <Text style={styles.subtitle}>
          Foreign Exchange Wallet
        </Text>
      </Animated.View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    color: Theme.colors.primary,
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: 5,
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 15,
    color: Theme.colors.onLightGrey,
    fontSize: 18,
    textAlign: 'center',
  },
});
