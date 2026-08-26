package com.nexora.app.ads

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.startapp.sdk.ads.nativead.NativeAdDetails
import com.startapp.sdk.ads.nativead.NativeAdPreferences
import com.startapp.sdk.ads.nativead.StartAppNativeAd
import com.startapp.sdk.adsbase.Ad
import com.startapp.sdk.adsbase.StartAppAd
import com.startapp.sdk.adsbase.StartAppAd.AdMode
import com.startapp.sdk.adsbase.StartAppSDK
import com.startapp.sdk.adsbase.adlisteners.AdEventListener

class StartIoAdsModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var interstitialAd: StartAppAd? = null
  private var rewardedAd: StartAppAd? = null

  override fun getName(): String {
    return "StartIoAds"
  }

  init {
    StartAppSDK.init(reactContext, "151319358")
  }

  @ReactMethod
  fun loadInterstitial() {
    StartAppAd(reactContext).let { ad ->
      ad.loadAd(object : AdEventListener {
        override fun onReceiveAd(ad: Ad) {
          interstitialAd = ad as StartAppAd
          Log.d(TAG, "Interstitial loaded")
        }

        override fun onFailedToReceiveAd(ad: Ad?) {
          Log.e(TAG, "Interstitial failed to load")
        }
      })
    }
  }

  @ReactMethod
  fun showInterstitial() {
    val ad = interstitialAd
    if (ad != null) {
      ad.showAd()
      interstitialAd = null
    }
  }

  @ReactMethod
  fun loadRewardedVideo() {
    StartAppAd(reactContext).let { ad ->
      ad.loadAd(AdMode.REWARDED_VIDEO, object : AdEventListener {
        override fun onReceiveAd(ad: Ad) {
          rewardedAd = ad as StartAppAd
          Log.d(TAG, "Rewarded video loaded")
        }

        override fun onFailedToReceiveAd(ad: Ad?) {
          Log.e(TAG, "Rewarded video failed to load")
        }
      })
    }
  }

  @ReactMethod
  fun showRewardedVideo() {
    val ad = rewardedAd
    if (ad != null) {
      ad.showAd()
      rewardedAd = null
    }
  }

  companion object {
    private const val TAG = "StartIoAds"
  }
}
