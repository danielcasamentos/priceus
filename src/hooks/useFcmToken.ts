import { useEffect, useState } from 'react';
import { requestFcmToken, onMessageListener } from '../lib/firebase';
import { toast } from 'react-hot-toast'; // Ex: usando react-hot-toast
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export function useFcmToken(user: User | null) {
  const [token, setToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const saveToken = async (tokenToSave: string) => {
      // Salva o token no perfil do usuário para uso pelo backend
      const { error } = await supabase
        .from('profiles')
        .update({ fcm_token: tokenToSave })
        .eq('id', user.id);
        
      if (error) console.error('Erro ao salvar token FCM:', error);
    };

    const retrieveToken = async () => {
      const currentToken = await requestFcmToken();
      if (currentToken) {
        setToken(currentToken);
        await saveToken(currentToken);
      }
    };

    retrieveToken();

    const unsubscribe = onMessageListener().then((payload: any) => {
      setNotification(payload);
      console.log('✅ Notificação recebida em primeiro plano:', payload);

      // Dispara um Toast visual para o usuário
      if (payload.notification) {
        toast.success(`${payload.notification.title}: ${payload.notification.body}`);
      }
    });

    return () => {};
  }, [user]);

  return { token, notification };
}