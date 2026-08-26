/**
 * NativeModule declaration for the Start.io (StartApp) ads bridge.
 */
import {NativeModules} from 'react-native';

interface StartIoAdsModuleType {
  loadInterstitial(): void;
  showInterstitial(): void;
  loadRewardedVideo(): void;
  showRewardedVideo(): void;
}

const StartIoAds: StartIoAdsModuleType | undefined =
  NativeModules.StartIoAds;

export default StartIoAds;
