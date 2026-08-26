package com.nexora.app.ads

import android.graphics.Color
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.startapp.sdk.ads.nativead.NativeAdDetails
import com.startapp.sdk.ads.nativead.NativeAdPreferences
import com.startapp.sdk.ads.nativead.StartAppNativeAd
import com.startapp.sdk.adsbase.Ad
import com.startapp.sdk.adsbase.adlisteners.AdEventListener

class StartIoNativeAdViewManager : SimpleViewManager<FrameLayout>() {

  override fun getName(): String {
    return "StartIoNativeAdView"
  }

  override fun createViewInstance(reactContext: ThemedReactContext): FrameLayout {
    val container = FrameLayout(reactContext)
    loadAndAttachAd(reactContext, container)
    return container
  }

  private fun loadAndAttachAd(context: ThemedReactContext, container: FrameLayout) {
    val prefs = NativeAdPreferences().setAutoBitmapDownload(true)
    val nativeAd = StartAppNativeAd(context)
    nativeAd.setPreferences(prefs)
    nativeAd.loadAd(object : AdEventListener {
      override fun onReceiveAd(ad: Ad) {
        val nativeAds = nativeAd.nativeAds
        if (nativeAds != null && nativeAds.isNotEmpty()) {
          val details = nativeAds[0]
          if (details != null) {
            val adView = buildAdView(context, details)
            container.removeAllViews()
            container.addView(adView)
          }
        }
      }

      override fun onFailedToReceiveAd(ad: Ad?) {
        // No ad available - render nothing
      }
    })
  }

  private fun buildAdView(context: ThemedReactContext, details: NativeAdDetails): View {
    val root = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
      setPadding(14, 12, 14, 12)
      setBackgroundColor(Color.rgb(255, 250, 240))
    }

    val image = ImageView(context).apply {
      layoutParams = LinearLayout.LayoutParams(84.dp(context), 84.dp(context)).apply {
        marginEnd = 12.dp(context)
      }
      scaleType = ImageView.ScaleType.FIT_CENTER
    }

    details.imageBitmap?.let { image.setImageBitmap(it) }

    root.addView(image)

    val info = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
    }

    val title = TextView(context).apply {
      text = details.title
      textSize = 15f
      setTextColor(Color.rgb(58, 46, 40))
      typeface = android.graphics.Typeface.DEFAULT_BOLD
    }

    val description = TextView(context).apply {
      text = details.description
      textSize = 12f
      setTextColor(Color.rgb(120, 108, 100))
      maxLines = 3
      setPadding(0, 5.dp(context), 0, 0)
    }

    val ctaRow = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.END or Gravity.BOTTOM
      setPadding(0, 8.dp(context), 0, 0)
    }

    val cta = Button(context).apply {
      text = details.callToAction.ifBlank { "Learn More" }
      textSize = 12f
      setTextColor(Color.WHITE)
      setBackgroundColor(Color.rgb(166, 54, 6))
    }

    ctaRow.addView(cta)
    info.addView(title)
    info.addView(description)
    info.addView(ctaRow)
    root.addView(info)

    val clickableViews = listOf<View>(root, cta)
    details.registerViewForInteraction(root, clickableViews)

    return root
  }

  private fun Int.dp(context: ThemedReactContext): Int =
    (this * context.resources.displayMetrics.density).toInt()
}
