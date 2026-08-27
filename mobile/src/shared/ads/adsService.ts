/**
 * High-level ads service wrapping the Start.io native bridge.
 * All calls are guarded so the app never crashes if the module
 * is unavailable (e.g. on iOS or in dev builds before a rebuild).
 */
import StartIoAds from './nativeModule';

export const adsEnabled = false;

const isAvailable = () => Boolean(StartIoAds) && adsEnabled;

/** Minimum seconds between two interstitial ads. */
const INTERSTITIAL_COOLDOWN_MS = 90 * 1000;

let interstitialReady = false;
let lastInterstitialShownAt = 0;

export const preloadInterstitial = () => {
  if (!isAvailable()) {
    return;
  }

  try {
    StartIoAds!.loadInterstitial();
    interstitialReady = true;
  } catch (error) {
    console.log('preloadInterstitial error:', error);
  }
};

export const showInterstitial = () => {
  const now = Date.now();

  if (!isAvailable() || !interstitialReady) {
    return;
  }

  if (now - lastInterstitialShownAt < INTERSTITIAL_COOLDOWN_MS) {
    return;
  }

  try {
    StartIoAds!.showInterstitial();
    lastInterstitialShownAt = now;
    interstitialReady = false;
    // Preload the next interstitial for the following navigation
    StartIoAds!.loadInterstitial();
    interstitialReady = true;
  } catch (error) {
    console.log('showInterstitial error:', error);
  }
};

export const preloadRewardedVideo = () => {
  if (!isAvailable()) {
    return;
  }

  try {
    StartIoAds!.loadRewardedVideo();
  } catch (error) {
    console.log('preloadRewardedVideo error:', error);
  }
};

export const showRewardedVideo = () => {
  if (!isAvailable()) {
    return;
  }

  try {
    StartIoAds!.showRewardedVideo();
  } catch (error) {
    console.log('showRewardedVideo error:', error);
  }
};
