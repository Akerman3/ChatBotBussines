package com.alcalculadora.app;

import android.database.ContentObserver;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

// 👇 NUEVO: import del plugin de galería
import com.alcalculadora.app.gallery.GalleryPlugin;
import androidx.core.splashscreen.SplashScreen;

public class MainActivity extends BridgeActivity {
  private static final String TAG = "ALMainActivityAutoTime";
  private ContentObserver autoTimeObserver;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    SplashScreen.installSplashScreen(this);
    super.onCreate(savedInstanceState);

    // 👇 NUEVO: registrar el plugin Gallery para MediaStore
    registerPlugin(GalleryPlugin.class);

    // Observa cambios en “Fecha y hora automática” y emite evento a JS
    registerAutoTimeObserver();
    // Emite estado inicial al cargar
    emitAutoTimeToJS(isAutoTimeEnabled());
  }

  @Override
  public void onResume() {
    super.onResume();
    // Al volver a la app, re-emite el estado (por si se cambió en Ajustes)
    emitAutoTimeToJS(isAutoTimeEnabled());
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    if (autoTimeObserver != null) {
      try {
        getContentResolver().unregisterContentObserver(autoTimeObserver);
      } catch (Exception ignore) {
      }
      autoTimeObserver = null;
    }
  }

  private boolean isAutoTimeEnabled() {
    boolean enabled = false;
    try {
      enabled = Settings.Global.getInt(getContentResolver(), Settings.Global.AUTO_TIME) == 1;
    } catch (Settings.SettingNotFoundException e) {
      try {
        enabled = Settings.System.getInt(getContentResolver(), Settings.System.AUTO_TIME) == 1;
      } catch (Settings.SettingNotFoundException ignored) {
      }
    }
    Log.d(TAG, "isAutoTimeEnabled -> " + enabled);
    return enabled;
  }

  private void registerAutoTimeObserver() {
    if (autoTimeObserver != null)
      return;

    autoTimeObserver = new ContentObserver(new Handler(Looper.getMainLooper())) {
      @Override
      public void onChange(boolean selfChange, Uri uri) {
        boolean enabled = isAutoTimeEnabled();
        Log.d(TAG, "AUTO_TIME changed -> " + enabled + " uri=" + uri);
        emitAutoTimeToJS(enabled);
      }
    };

    try {
      getContentResolver().registerContentObserver(
          Settings.Global.getUriFor(Settings.Global.AUTO_TIME), false, autoTimeObserver);
    } catch (Exception e) {
      Log.w(TAG, "Observer Global.AUTO_TIME failed", e);
    }

    try {
      getContentResolver().registerContentObserver(
          Settings.System.getUriFor(Settings.System.AUTO_TIME), false, autoTimeObserver);
    } catch (Exception e) {
      Log.w(TAG, "Observer System.AUTO_TIME failed", e);
    }
  }

  private void emitAutoTimeToJS(boolean enabled) {
    // Envia un CustomEvent a la WebView:
    // window.dispatchEvent(new
    // CustomEvent('alAutoTime',{detail:{enabled:true/false}}))
    final String js = "window.dispatchEvent(new CustomEvent('alAutoTime',{detail:{enabled:"
        + (enabled ? "true" : "false") + "}}));";
    runOnUiThread(() -> {
      if (getBridge() != null && getBridge().getWebView() != null) {
        getBridge().getWebView().evaluateJavascript(js, null);
      }
    });
  }
}
