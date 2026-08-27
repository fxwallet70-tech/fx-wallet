import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import AppNavigator from './core/navigation/AppNavigator';
import AppBackground from './shared/components/AppBackground';

const App = () => {
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