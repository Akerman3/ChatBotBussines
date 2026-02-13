import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

// Registra el dispositivo para recibir push notifications
export const initPushNotifications = async (onTokenReceived: (token: string) => void) => {
    // Solo funciona en dispositivos nativos (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
        console.log('Push notifications solo funcionan en dispositivos nativos');
        return;
    }

    try {
        // Solicitar permisos
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
            console.log('Permisos de notificaciones no otorgados');
            return;
        }

        // Registrar para recibir push notifications
        await PushNotifications.register();

        // Listener cuando se obtiene el token de registro
        PushNotifications.addListener('registration', (token) => {
            console.log('🔔 Push registration token:', token.value);
            onTokenReceived(token.value);
        });

        // Listener para errores de registro
        PushNotifications.addListener('registrationError', (error) => {
            console.error('Error al registrar push notifications:', error);
        });

        // Listener cuando llega una notificación y la app está abierta
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('📬 Push notification recibida:', notification);
            // Aquí puedes mostrar una alerta o actualizar el UI
            alert(`${notification.title}\n${notification.body}`);
        });

        // Listener cuando el usuario toca una notificación
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('👆 Push notification tocada:', notification);
            // Aquí puedes navegar a una pantalla específica
        });

        console.log('✅ Push notifications inicializadas');
    } catch (error) {
        console.error('Error inicializando push notifications:', error);
    }
};

// Cancelar todas las notificaciones pendientes
export const clearAllNotifications = async () => {
    if (Capacitor.isNativePlatform()) {
        await PushNotifications.removeAllDeliveredNotifications();
    }
};
