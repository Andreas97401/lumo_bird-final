import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';
import Constants from 'expo-constants';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'congratulation' | 'motivation' | 'wake';
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  message?: string;
}

export interface NotificationConfig {
  title: string;
  body: string;
  sound?: string;
  priority?: 'default' | 'normal' | 'high';
  categoryId?: string;
}

export class NotificationService {
  private static readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  // Configuration des messages par type
  private static getNotificationConfig(
    type: NotificationData['type'], 
    fromUserName: string
  ): NotificationConfig {
    const configs: Record<NotificationData['type'], NotificationConfig> = {
      congratulation: {
        title: '🎉 Félicitations !',
        body: `${fromUserName} vous félicite pour vos progrès !`,
        sound: 'default',
        priority: 'high',
        categoryId: 'social',
      },
      motivation: {
        title: '💪 Message de motivation',
        body: `${fromUserName} vous envoie un message de motivation !`,
        sound: 'default',
        priority: 'normal',
        categoryId: 'social',
      },
      wake: {
        title: '⏰ Réveil !',
        body: `${fromUserName} vous réveille pour continuer vos objectifs !`,
        sound: 'default',
        priority: 'high',
        categoryId: 'alarm',
      },
    };

    return configs[type];
  }

  // Demander les permissions et enregistrer le token
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Permissions de notifications non accordées');
        return null;
      }
      
      const projectId = (Constants as any).easConfig?.projectId ??
        Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('Project ID Expo manquant');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      
      console.log('Token de notification obtenu:', {
        tokenLength: token.data.length,
        tokenStart: token.data.substring(0, 10) + '...'
      });
      
      return token.data;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des notifications:', error);
      return null;
    }
  }

  // Sauvegarder le token dans Supabase avec retry
  static async savePushToken(userId: string, token: string): Promise<boolean> {
    if (!userId || !token) {
      console.error('UserId ou token manquant pour la sauvegarde');
      return false;
    }

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`Tentative ${attempt}/${this.MAX_RETRY_ATTEMPTS} de sauvegarde du token pour l'utilisateur ${userId}`);
        
        const { error } = await supabase
          .from('user_push_tokens')
          .upsert({
            user_id: userId,
            push_token: token,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });
        
        if (error) {
          console.error(`Erreur tentative ${attempt}:`, {
            error: error.message,
            userId,
            tokenLength: token.length,
          });
          
          if (attempt === this.MAX_RETRY_ATTEMPTS) {
            return false;
          }
          
          // Attendre avant la prochaine tentative
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
          continue;
        }
        
        console.log('Token sauvegardé avec succès:', {
          userId,
          attempt,
          tokenLength: token.length,
        });
        
        return true;
      } catch (error) {
        console.error(`Exception tentative ${attempt}:`, {
          error,
          userId,
          tokenLength: token.length,
        });
        
        if (attempt === this.MAX_RETRY_ATTEMPTS) {
          return false;
        }
        
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
      }
    }
    
    return false;
  }

  // Récupérer le token push d'un utilisateur avec validation
  static async getPushToken(userId: string): Promise<string | null> {
    if (!userId) {
      console.error('[Notif] UserId manquant pour getPushToken');
      return null;
    }

    try {
      console.log(`[Notif] RPC get_push_token pour ${userId}`);

      const { data, error } = await supabase.rpc('get_push_token', {
        p_user_id: userId,
      });

      if (error) {
        console.error('[Notif] Erreur RPC get_push_token', { 
          userId, 
          error: error.message 
        });
        return null;
      }

      if (!data) {
        console.log(`[Notif] Aucun token trouvé pour ${userId}`);
        return null;
      }

      // Validation basique du format du token Expo
      const token = data as string;
      if (!token.startsWith('ExponentPushToken[') || !token.endsWith(']')) {
        console.error('[Notif] Format de token invalide', {
          userId,
          tokenStart: token.substring(0, 20) + '...'
        });
        return null;
      }

      console.log('[Notif] Token récupéré avec succès', {
        userId,
        tokenLength: token.length,
      });

      return token;
    } catch (error) {
      console.error('[Notif] Exception getPushToken', { userId, error });
      return null;
    }
  }

  // Envoyer une notification avec retry et validation
  static async sendNotificationToFriend(
    fromUserId: string,
    fromUserName: string,
    toUserId: string,
    type: NotificationData['type']
  ): Promise<boolean> {
    // Validation des paramètres
    if (!fromUserId || !fromUserName || !toUserId || !type) {
      console.error('Paramètres manquants pour l\'envoi de notification', {
        fromUserId: !!fromUserId,
        fromUserName: !!fromUserName,
        toUserId: !!toUserId,
        type: !!type
      });
      return false;
    }

    if (fromUserId === toUserId) {
      console.error('Impossible d\'envoyer une notification à soi-même');
      return false;
    }

    try {
      console.log(`Envoi notification: ${fromUserName} (${fromUserId}) → ${toUserId} (${type})`);
      
      // Récupérer le token de l'ami
      const pushToken = await this.getPushToken(toUserId);
      
      if (!pushToken) {
        console.error(`Token push non trouvé pour l'utilisateur ${toUserId}`);
        return false;
      }

      // Obtenir la configuration du message
      const config = this.getNotificationConfig(type, fromUserName);

      // Préparer le message
      const message = {
        to: pushToken,
        sound: config.sound || 'default',
        title: config.title,
        body: config.body,
        priority: config.priority || 'normal',
        data: {
          type,
          fromUserId,
          fromUserName,
          toUserId,
          categoryId: config.categoryId,
        },
      };

      // Envoyer avec retry
      const success = await this.sendPushNotificationWithRetry(message);
      
      if (success) {
        // Sauvegarder dans la base de données
        await this.saveNotificationToDatabase({
          type,
          fromUserId,
          fromUserName,
          toUserId,
          message: config.body,
        });
        
        console.log('Notification envoyée et sauvegardée avec succès');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      return false;
    }
  }

  // Envoyer push notification avec retry
  private static async sendPushNotificationWithRetry(message: any): Promise<boolean> {
    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`Tentative d'envoi ${attempt}/${this.MAX_RETRY_ATTEMPTS}`);
        
        const response = await fetch(this.EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Notification envoyée avec succès:', result);
          return true;
        }
        
        const errorText = await response.text();
        console.error(`Erreur HTTP ${response.status} tentative ${attempt}:`, errorText);
        
        if (response.status >= 400 && response.status < 500) {
          // Erreur client, ne pas retry
          console.error('Erreur client, arrêt des tentatives');
          return false;
        }
        
        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
        }
        
      } catch (error) {
        console.error(`Exception tentative ${attempt}:`, error);
        
        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
        }
      }
    }
    
    return false;
  }

  // Sauvegarder la notification dans la base de données
  static async saveNotificationToDatabase(notificationData: NotificationData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          type: notificationData.type,
          from_user_id: notificationData.fromUserId,
          from_user_name: notificationData.fromUserName,
          to_user_id: notificationData.toUserId,
          message: notificationData.message,
          created_at: new Date().toISOString(),
          read: false, // Ajouter un statut de lecture
        });
      
      if (error) {
        console.error('Erreur lors de la sauvegarde de la notification:', error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception lors de la sauvegarde de la notification:', error);
      return false;
    }
  }

  // Marquer une notification comme lue
  static async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Erreur lors du marquage de la notification:', error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception lors du marquage de la notification:', error);
      return false;
    }
  }

  // Récupérer les notifications non lues d'un utilisateur
  static async getUnreadNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('to_user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erreur lors de la récupération des notifications:', error.message);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception lors de la récupération des notifications:', error);
      return [];
    }
  }

  // Configurer les listeners de notifications avec navigation
  static setupNotificationListeners(onNotificationReceived?: (notification: any) => void) {
    // Notification reçue quand l'app est ouverte
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
      onNotificationReceived?.(notification);
    });

    // Notification cliquée
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification cliquée:', response);
      
      const data = response.notification.request.content.data;
      if (data?.type && data?.fromUserId) {
        // Marquer comme lue si on a l'ID
        if (data.notificationId) {
          this.markNotificationAsRead(data.notificationId);
        }
        
        // Callback pour la navigation personnalisée
        onNotificationReceived?.(response.notification);
      }
    });

    // Fonction de nettoyage
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  // Initialisation complète du service de notifications
  static async initializeNotifications(userId: string): Promise<boolean> {
    try {
      console.log('Initialisation des notifications pour:', userId);
      
      // 1. Demander les permissions et obtenir le token
      const token = await this.registerForPushNotifications();
      if (!token) {
        console.error('Impossible d\'obtenir le token de notification');
        return false;
      }
      
      // 2. Sauvegarder le token
      const saved = await this.savePushToken(userId, token);
      if (!saved) {
        console.error('Impossible de sauvegarder le token');
        return false;
      }
      
      console.log('Service de notifications initialisé avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
      return false;
    }
  }
}