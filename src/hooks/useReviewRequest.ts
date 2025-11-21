import { supabase } from '../lib/supabase';

export function useReviewRequest() {
  const solicitarAvaliacao = async (leadId: string): Promise<{ success: boolean; token?: string; error?: string }> => {
    try {
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('id, user_id, nome_cliente, telefone_cliente, status, avaliacao_id, pode_avaliar')
        .eq('id', leadId)
        .maybeSingle();

      if (leadError) throw leadError;

      if (!lead) {
        return { success: false, error: 'Lead não encontrado' };
      }

      if (lead.status !== 'convertido') {
        return { success: false, error: 'Apenas leads convertidos podem ser avaliados' };
      }

      if (lead.avaliacao_id) {
        return { success: false, error: 'Este cliente já avaliou o serviço' };
      }

      const { data: tokenData, error: tokenError } = await supabase
        .rpc('gerar_token_avaliacao', { lead_id_param: leadId });

      if (tokenError) throw tokenError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('nome_profissional, whatsapp_principal')
        .eq('id', lead.user_id)
        .maybeSingle();

      const reviewUrl = `${window.location.origin}/avaliar/${tokenData}`;
      const nomeCliente = lead.nome_cliente || 'Cliente';
      const nomeFornecedor = profile?.nome_profissional || 'fornecedor';

      const mensagem = `Olá ${nomeCliente}!

Ficamos muito felizes em ter trabalhado com você! 🎉

Sua opinião é muito importante para nós. Poderia avaliar nosso serviço? Leva apenas 2 minutos:

${reviewUrl}

Agradecemos desde já pelo seu feedback!

${nomeFornecedor}`;

      const whatsappUrl = `https://wa.me/${lead.telefone_cliente?.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;

      return { success: true, token: whatsappUrl };
    } catch (error) {
      console.error('Erro ao solicitar avaliação:', error);
      return { success: false, error: 'Erro ao gerar link de avaliação' };
    }
  };

  return { solicitarAvaliacao };
}
