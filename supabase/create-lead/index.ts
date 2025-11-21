// supabase/functions/create-lead/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Headers para permitir requisições de qualquer origem (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Tratar requisição OPTIONS (pre-flight) para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const leadPayload = await req.json();

    // Validação básica para garantir que os dados essenciais estão presentes
    if (!leadPayload.user_id || !leadPayload.template_id) {
      throw new Error('user_id e template_id são obrigatórios.');
    }

    // 🔒 PONTO CRÍTICO: Criar um cliente Supabase com a service_role.
    // Isso ignora as políticas de RLS para a inserção, permitindo que
    // a função salve o lead em nome do visitante anônimo.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Inserir os dados na tabela 'leads'
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(leadPayload) // O payload já contém o user_id do fotógrafo
      .select()
      .single();

    if (error) {
      // Se houver um erro no banco de dados (ex: tipo de dado errado), ele será lançado aqui.
      console.error('Erro do Supabase Admin ao criar lead:', error);
      throw error;
    }

    // ✅ ETAPA 2: Criar a notificação para o usuário (fotógrafo)
    if (data) {
      const notificationPayload = {
        user_id: leadPayload.user_id, // O ID do fotógrafo
        type: 'new_lead',
        message: `Você recebeu um novo lead de ${leadPayload.nome_cliente || 'um cliente'}!`,
        related_id: data.id, // ID do lead recém-criado
        link: '/dashboard/leads', // Link para a página de leads
      };

      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert(notificationPayload);

      if (notificationError) {
        // Log do erro de notificação, mas não interrompe o fluxo.
        // O lead foi criado, que é o mais importante.
        console.error('Erro ao criar notificação:', notificationError);
      }
    }

    // Retornar os dados do lead salvo com sucesso
    return new Response(JSON.stringify({ lead: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    // Capturar qualquer outro erro e retornar uma resposta de erro
    console.error('Erro na Edge Function:', err);
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
