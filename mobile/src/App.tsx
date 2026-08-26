import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import AppNavigator from './core/navigation/AppNavigator';
import AppBackground from './shared/components/AppBackground';
import {preloadInterstitial} from './shared/ads/adsService';

const App = () => {
  useEffect(() => {
    preloadInterstitial();
  }, []);

  return (
    <SafeAreaProvider>
      <AppBackground>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AppBackground>
    </SafeAreaProvider>
  );
};

export default App;