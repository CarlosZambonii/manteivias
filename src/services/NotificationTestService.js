import { supabase } from '@/lib/customSupabaseClient';

export const NotificationTestService = {
  /**
   * Triggers a specific scheduled check function.
   * @param {string} functionName - The name of the Supabase Edge Function to invoke.
   * @returns {Promise<object>} - The result from the function invocation.
   */
  async triggerScheduledCheck(functionName) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { test: true }, // Pass a test flag if needed by the function
      });

      if (error) {
        throw new Error(`Error invoking ${functionName}: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error(`[NotificationTestService] Error in ${functionName}:`, error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Sends a custom notification directly to a user for testing.
   * @param {object} payload - The notification details.
   * @param {string} payload.userId - The ID of the user to notify.
   * @param {string} payload.title - The notification title.
   * @param {string} payload.message - The notification body message.
   * @returns {Promise<object>} - The result from the send-push-notification function.
   */
  async sendCustomTestNotification({ userId, title, message }) {
    if (!userId || !title || !message) {
      return { success: false, error: 'User ID, title, and message are required.' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          title,
          message,
          data: { url: '/test-panel' } // Custom data for test notifications
        },
      });

      if (error) {
        throw new Error(`Error sending custom notification: ${error.message}`);
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('[NotificationTestService] Error sending custom notification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Fetches the current day's point registration status for a given user.
   * @param {string} userId - The ID of the user to check.
   * @returns {Promise<object>} - The user's status for the day.
   */
  async getUserTodayStatus(userId) {
    if (!userId) {
      return { error: 'User ID required.' };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    try {
      const { data, error } = await supabase
        .from('registros_ponto')
        .select('*')
        .eq('usuario_id', userId)
        .gte('hora_inicio_real', todayStart.toISOString())
        .lte('hora_inicio_real', todayEnd.toISOString())
        .order('hora_inicio_real', { ascending: false });

      if (error) {
        throw error;
      }
      
      const hasPushSubscription = await this.checkUserSubscription(userId);

      // FIX: Safely check if data is null or empty before accessing it.
      if (!data || data.length === 0) {
        return { 
          status: 'Sem registo hoje', 
          records: [], 
          recordCount: 0,
          hasPushSubscription 
        };
      }
      
      const latestRecord = data[0];
      let recordStatus;

      // FIX: Determine record status more clearly.
      if (latestRecord.status_validacao === 'Pendente') {
        recordStatus = 'Registo Pendente de Validação';
      } else if (latestRecord.hora_fim_real) {
        recordStatus = `Registo Fechado às ${new Date(latestRecord.hora_fim_real).toLocaleTimeString()}`;
      } else {
        recordStatus = 'Registo Ativo (Aberto)';
      }

      return { 
        status: recordStatus, 
        records: data,
        recordCount: data.length,
        hasPushSubscription
      };

    } catch (error) {
      console.error('[NotificationTestService] Error fetching user status:', error);
      return { error: error.message, records: [], recordCount: 0 };
    }
  },

  /**
   * Checks if a user has at least one push subscription.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<boolean>}
   */
  async checkUserSubscription(userId) {
     const { data, error, count } = await supabase
        .from('push_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (error) {
          console.error("Error checking subscription:", error);
          return false;
      }
      
      return count > 0;
  }
};