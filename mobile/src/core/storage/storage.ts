import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveToken = async (token: string) => {
  await AsyncStorage.setItem('authToken', token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem('authToken');
};

export const removeToken = async () => {
  await AsyncStorage.removeItem('authToken');
};

/**
 * The refresh token outlives the access token: it is what lets an expired
 * session be renewed instead of sending the user back to Login.
 */
export const saveRefreshToken = async (token: string) => {
  await AsyncStorage.setItem('refreshToken', token);
};

export const getRefreshToken = async () => {
  return await AsyncStorage.getItem('refreshToken');
};

export const removeRefreshToken = async () => {
  await AsyncStorage.removeItem('refreshToken');
};

export const clearStorage = async () => {
  await AsyncStorage.clear();
};