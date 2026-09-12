import {createNavigationContainerRef} from '@react-navigation/native';

import {RootStackParamList} from './types';

/**
 * Shared navigation ref so code outside the React tree (such as the API
 * layer) is able to navigate.
 */
export const navigationRef =
  createNavigationContainerRef<RootStackParamList>();

/**
 * Sends the user back to the Login screen and clears the whole stack, so the
 * back button cannot return to an authenticated screen.
 *
 * Returns false when the container is not mounted yet.
 */
export const resetToLogin = (): boolean => {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.reset({
    index: 0,
    routes: [{name: 'Login'}],
  });

  return true;
};
