import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export interface Profile {
  id: string;
  nome_admin: string | null;
  nome_profissional: string | null;
  tipo_fotografia: string | null;
  instagram: string | null;
  whatsapp_principal: string | null;
  email_recebimento: string | null;
  profile_image_url: string | null;
  apresentacao: string | null;
  slug_usuario: string | null;
  perfil_publico: boolean | null;
  exibir_botao_perfil_completo: boolean | null;
  meta_description: string | null;
  visualizacoes_perfil: number | null;
  aceita_avaliacoes: boolean | null;
  aprovacao_automatica_avaliacoes: boolean | null;
  exibir_avaliacoes_publico: boolean | null;
  rating_minimo_exibicao: number | null;
  incentivo_avaliacao_ativo: boolean | null;
  incentivo_avaliacao_texto: string | null;
  status_assinatura: string | null;
  data_expiracao_trial: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  template_id: string;
  user_id: string;
  nome_cliente: string | null;
  email_cliente: string | null;
  telefone_cliente: string | null;
  tipo_evento: string | null;
  data_evento: string | null;
  cidade_evento: string | null;
  valor_total: number;
  orcamento_detalhe: any;
  status: 'novo' | 'contatado' | 'convertido' | 'perdido' | 'abandonado' | 'em_negociacao' | 'fazer_followup';
  data_orcamento: string;
  data_ultimo_contato: string | null;
  created_at: string;
  updated_at: string;
}
