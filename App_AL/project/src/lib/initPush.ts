// src/lib/initPush.ts
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

// ✅ Cache del token para evitar pedir permisos múltiples veces
let cachedToken: string | null = null;

export async function initPush(): Promise<string | null> {
  // Si ya tenemos el token en cache, retornarlo
  if (cachedToken) {
    console.log('[Push] Usando token en cache');
    return cachedToken;
  }

  try {
    // 1) Pedir permisos de notificaciones (Android 13+ y iOS)
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') {
      console.warn('[Push] Permiso de notificaciones no concedido');
      return null;
    }

    // 2) Crear canal de Android ANTES de registrar
    try {
      await LocalNotifications.createChannel({
        id: 'alcalc_general',
        name: 'AL Calculadora',
        description: 'Notificaciones generales de la app',
        importance: 4,
        visibility: 1,
        lights: true,
        vibration: true,
      });
      console.log('[Push] Canal alcalc_general creado/actualizado');
    } catch (e) {
      console.warn('[Push] No se pudo crear el canal (Android < 8?):', e);
    }

    // 3) Registrar y obtener el token usando una Promise
    const token = await new Promise<string | null>((resolve) => {
      // Timeout de 10 segundos por si algo falla
      const timeout = setTimeout(() => {
        console.warn('[Push] Timeout esperando token FCM');
        resolve(null);
      }, 10000);

      // Listener para cuando llega el token
      PushNotifications.addListener('registration', (registration) => {
        clearTimeout(timeout);
        console.log('[Push] Token FCM recibido:', registration.value?.substring(0, 20) + '...');
        resolve(registration.value || null);
      });

      // Listener para errores
      PushNotifications.addListener('registrationError', (err) => {
        clearTimeout(timeout);
        console.error('[Push] Error registrando push:', err);
        resolve(null);
      });

      // Registrar
      PushNotifications.register().catch((err) => {
        clearTimeout(timeout);
        console.error('[Push] Error en register():', err);
        resolve(null);
      });
    });

    // Guardar en cache
    cachedToken = token;

    // 4) Configurar listeners para notificaciones (no bloquean)
    PushNotifications.addListener('pushNotificationReceived', (notif) => {
      console.log('[Push] Recibida en foreground:', notif.title);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Push] Usuario tocó la notificación:', action.notification?.title);
    });

    return token;
  } catch (err) {
    console.error('[Push] Error general en initPush:', err);
    return null;
  }
}

// ✅ Función para obtener el token sin re-registrar (útil para debugging)
export function getCachedPushToken(): string | null {
  return cachedToken;
}

