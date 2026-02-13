package com.alcalculadora.app.plugins;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.ContentObserver;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.Keep;

import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;

@Keep
@CapacitorPlugin(name = "TimeSettings")
public class TimeSettingsPlugin extends Plugin {
  private static final String TAG = "TimeSettingsPlugin";
  private ContentObserver observer;

  private ContentResolver res() {
    Activity a = getActivity();
    if (a != null) return a.getContentResolver();
    return getContext().getContentResolver();
  }

  private boolean isAutoTimeEnabledSync() {
    boolean autoTime = false;
    try {
      autoTime = Settings.Global.getInt(res(), Settings.Global.AUTO_TIME) == 1;
    } catch (Settings.SettingNotFoundException ignore) {
      try {
        autoTime = Settings.System.getInt(res(), Settings.System.AUTO_TIME) == 1;
      } catch (Settings.SettingNotFoundException ignore2) { }
    }
    return autoTime;
  }

  @Override
  public void load() {
    super.load();
    registerObservers();
    boolean enabled = isAutoTimeEnabledSync();
    JSObject data = new JSObject();
    data.put("enabled", enabled);
    notifyListeners("timeConfigChanged", data);
    Log.d(TAG, "load -> enabled=" + enabled);
  }

  private void registerObservers() {
    if (observer != null) return;

    observer = new ContentObserver(new Handler(Looper.getMainLooper())) {
      @Override public void onChange(boolean selfChange, Uri uri) {
        boolean enabled = isAutoTimeEnabledSync();
        JSObject data = new JSObject();
        data.put("enabled", enabled);
        notifyListeners("timeConfigChanged", data);
        Log.d(TAG, "onChange -> enabled=" + enabled + " uri=" + uri);
      }
    };

    try { res().registerContentObserver(Settings.Global.getUriFor(Settings.Global.AUTO_TIME), false, observer); }
    catch (Exception e) { Log.w(TAG, "Observer Global.AUTO_TIME failed", e); }
    try { res().registerContentObserver(Settings.System.getUriFor(Settings.System.AUTO_TIME), false, observer); }
    catch (Exception e) { Log.w(TAG, "Observer System.AUTO_TIME failed", e); }

    // (Opcional) también podríamos observar zona horaria automática:
    // try { res().registerContentObserver(Settings.Global.getUriFor(Settings.Global.AUTO_TIME_ZONE), false, observer); } catch (Exception ignore) {}
    // try { res().registerContentObserver(Settings.System.getUriFor(Settings.System.AUTO_TIME_ZONE), false, observer); } catch (Exception ignore) {}
  }

  @Override
  protected void handleOnDestroy() {
    super.handleOnDestroy();
    if (observer != null) {
      try { res().unregisterContentObserver(observer); } catch (Exception ignored) {}
      observer = null;
    }
  }

  @PluginMethod
  public void ping(PluginCall call) {
    JSObject ret = new JSObject();
    ret.put("ok", true);
    Log.d(TAG, "ping()");
    call.resolve(ret);
  }

  @PluginMethod
  public void isAutoTimeEnabled(PluginCall call) {
    boolean enabled = isAutoTimeEnabledSync();
    JSObject ret = new JSObject();
    ret.put("enabled", enabled);
    Log.d(TAG, "isAutoTimeEnabled -> " + enabled);
    call.resolve(ret);
  }

  // Respaldo para abrir Ajustes (ya usas cordova-open-native-settings)
  @PluginMethod
  public void openDateSettings(PluginCall call) {
    try {
      Activity activity = getActivity();
      Intent intent = new Intent(Settings.ACTION_DATE_SETTINGS);

      if (activity != null) {
        try { activity.startActivity(intent); call.resolve(); return; }
        catch (ActivityNotFoundException e1) { Log.w(TAG, "ACTION_DATE_SETTINGS via activity falló", e1); }
      }
      try { intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); getContext().startActivity(intent); call.resolve(); return; }
      catch (Exception e2) { Log.w(TAG, "ACTION_DATE_SETTINGS via context falló", e2); }

      try {
        Intent comp = new Intent();
        comp.setClassName("com.android.settings", "com.android.settings.Settings$DateTimeSettingsActivity");
        if (activity != null) activity.startActivity(comp);
        else { comp.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); getContext().startActivity(comp); }
        call.resolve(); return;
      } catch (Exception e3) { Log.w(TAG, "DateTimeSettingsActivity falló", e3); }

      try {
        Intent generic = new Intent(Settings.ACTION_SETTINGS);
        if (activity != null) activity.startActivity(generic);
        else { generic.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); getContext().startActivity(generic); }
        call.resolve();
      } catch (Exception e4) {
        Log.e(TAG, "openDateSettings: falló todo", e4);
        call.reject("OPEN_SETTINGS_FAILED");
      }
    } catch (Exception e) {
      Log.e(TAG, "openDateSettings fatal", e);
      call.reject("OPEN_SETTINGS_FAILED");
    }
  }
}
