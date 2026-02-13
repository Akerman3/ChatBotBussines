# ===== Capacitor =====
-keep class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**
-keepclassmembers class com.getcapacitor.PluginCall { *; }
-keepclassmembers class com.getcapacitor.JSObject { *; }

# Mantener anotaciones/reflexión (para @CapacitorPlugin, @Keep, etc.)
-keepattributes *Annotation*, InnerClasses, EnclosingMethod
-keep @androidx.annotation.Keep class * { *; }
-keepclasseswithmembers class * { @androidx.annotation.Keep *; }

# ===== Cordova (para cordova-open-native-settings) =====
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**
-keep class cordova.plugins.settings.** { *; }
-keep class com.lampa.** { *; }
-dontwarn cordova.plugins.settings.**
-dontwarn com.lampa.**

# ===== Tu plugin nativo (TimeSettings) =====
-keep class com.alcalculadora.app.plugins.** { *; }

# (Opcional si usas Firebase/Play Services/Kotlin en otros módulos)
-dontwarn kotlin.**
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**
