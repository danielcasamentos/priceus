export interface BusinessSettings {
  business_name?: string;
  person_type?: string;
  cpf?: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  pix_key?: string;
  bank_name?: string;
  bank_agency?: string;
  bank_account?: string;
  bank_account_type?: string;
}

export interface ClientData {
  nome_completo?: string;
  cpf?: string;
  rg?: string;
  endereco_completo?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  data_evento?: string;
  local_evento?: string;
  endereco_evento?: string;
  cidade_evento?: string;
  horario_inicio?: string;
  observacoes?: string;
}

export interface LeadData {
  nome_cliente?: string;
  email?: string;
  telefone?: string;
  data_evento?: string;
  cidade?: string;
  cidade_evento?: string;
  orcamento_total?: number;
  valor_total?: number;
  produtos?: any[];
  servicos?: any[];
  desconto_cupom?: number;
  forma_pagamento?: string;
  acrescimo_pagamento?: number;
  ajuste_sazonal?: number;
  ajuste_geografico?: number;
  subtotal?: number;
  ocultar_valores_intermediarios?: boolean;
}

/**
 * Remove emojis e outros caracteres especiais que não são bem renderizados em PDFs.
 */
const removeEmojis = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
};

export function replaceContractVariables(
  template: string,
  businessSettings: BusinessSettings,
  clientData: ClientData,
  leadData: LeadData
): string {
  let result = template;

  console.log('=== REPLACE CONTRACT VARIABLES ===');
  console.log('Lead Data Received:', JSON.stringify(leadData, null, 2));
  console.log('Client Data Received:', JSON.stringify(clientData, null, 2));
  console.log('Business Settings:', JSON.stringify(businessSettings, null, 2));

  const cpfCnpjUsuario = businessSettings.person_type === 'fisica'
    ? (businessSettings.cpf || '')
    : (businessSettings.cnpj || '');

  const ocultarValores = leadData.ocultar_valores_intermediarios || false;

  const variables: Record<string, string> = {
    '{{NOME_USUARIO}}': businessSettings.business_name || '',
    '{{CPF_CNPJ_USUARIO}}': cpfCnpjUsuario,
    '{{ENDERECO_USUARIO}}': businessSettings.address || '',
    '{{CIDADE_USUARIO}}': businessSettings.city || '',
    '{{ESTADO_USUARIO}}': businessSettings.state || '',
    '{{CEP_USUARIO}}': businessSettings.zip_code || '',
    '{{TELEFONE_USUARIO}}': businessSettings.phone || '',
    '{{EMAIL_USUARIO}}': businessSettings.email || '',
    '{{PIX_USUARIO}}': businessSettings.pix_key || '',
    '{{BANCO_USUARIO}}': businessSettings.bank_name || '',
    '{{AGENCIA_USUARIO}}': businessSettings.bank_agency || '',
    '{{CONTA_USUARIO}}': businessSettings.bank_account || '',

    '{{NOME_CLIENTE}}': leadData.nome_cliente || '',
    '{{EMAIL_CLIENTE}}': leadData.email || clientData.email || '',
    '{{TELEFONE_CLIENTE}}': leadData.telefone || clientData.telefone || '',

    '{{NOME_COMPLETO_CLIENTE}}': clientData.nome_completo || leadData.nome_cliente || '',
    '{{CPF_CLIENTE}}': clientData.cpf || '',
    '{{RG_CLIENTE}}': clientData.rg || '',
    '{{ENDERECO_COMPLETO_CLIENTE}}': clientData.endereco_completo || '',
    '{{CEP_CLIENTE}}': clientData.cep || '',

    '{{DATA_EVENTO}}': (() => {
      const dataEvento = clientData.data_evento || leadData.data_evento;
      if (!dataEvento) return '';
      try {
        return new Date(dataEvento + 'T00:00:00').toLocaleDateString('pt-BR');
      } catch (e) {
        console.error('Erro ao formatar data_evento:', dataEvento, e);
        return String(dataEvento);
      }
    })(),
    '{{CIDADE_EVENTO}}': clientData.cidade_evento || leadData.cidade_evento || leadData.cidade || '',
    '{{LOCAL_EVENTO}}': clientData.local_evento || '',
    '{{ENDERECO_EVENTO}}': clientData.endereco_evento || '',
    '{{HORARIO_INICIO}}': clientData.horario_inicio || '',
    '{{OBSERVACOES_CLIENTE}}': clientData.observacoes || '',

    '{{SUBTOTAL}}': ocultarValores ? '' : (() => {
      const subtotal = leadData.subtotal;
      if (!subtotal) return '';
      const valor = typeof subtotal === 'string' ? parseFloat(subtotal) : subtotal;
      return isNaN(valor) ? '' : `R$ ${valor.toFixed(2).replace('.', ',')}`;
    })(),
    '{{VALOR_TOTAL}}': (() => {
      const valorTotal = leadData.orcamento_total || leadData.valor_total;
      if (!valorTotal) return '';
      const valor = typeof valorTotal === 'string' ? parseFloat(valorTotal) : valorTotal;
      return isNaN(valor) ? '' : `R$ ${valor.toFixed(2).replace('.', ',')}`;
    })(),
    '{{DESCONTO_CUPOM}}': ocultarValores || !leadData.desconto_cupom
      ? ''
      : `R$ ${leadData.desconto_cupom.toFixed(2).replace('.', ',')}`,
    '{{ACRESCIMO_PAGAMENTO}}': ocultarValores || !leadData.acrescimo_pagamento
      ? ''
      : `R$ ${leadData.acrescimo_pagamento.toFixed(2).replace('.', ',')}`,
    '{{AJUSTE_SAZONAL}}': ocultarValores || !leadData.ajuste_sazonal
      ? ''
      : `R$ ${leadData.ajuste_sazonal.toFixed(2).replace('.', ',')}`,
    '{{AJUSTE_GEOGRAFICO}}': ocultarValores || !leadData.ajuste_geografico
      ? ''
      : `R$ ${leadData.ajuste_geografico.toFixed(2).replace('.', ',')}`,
    '{{FORMA_PAGAMENTO}}': leadData.forma_pagamento || '',
  };

  if (leadData.produtos && leadData.produtos.length > 0) {
    const produtosLista = leadData.produtos
      .map((p: any) => {
        const cleanNome = removeEmojis(p.nome); // 🔥 REMOVE EMOJIS DO NOME DO PRODUTO
        if (ocultarValores) {
          // Quando ocultar valores intermediários está ativo, mostrar apenas o nome do produto
          return `- ${cleanNome}`;
        } else {
          // Quando ocultar valores está desativado, mostrar nome e preço
          return `- ${cleanNome}: R$ ${p.preco?.toFixed(2).replace('.', ',')}`;
        }
      })
      .join('\n');
    variables['{{PRODUTOS_LISTA}}'] = produtosLista;
  } else {
    variables['{{PRODUTOS_LISTA}}'] = '';
  }

  if (leadData.servicos && leadData.servicos.length > 0) {
    const servicosLista = leadData.servicos
      .map((s: any) => {
        if (ocultarValores) {
          // Quando ocultar valores intermediários está ativo, mostrar apenas o nome do serviço
          return `- ${s.nome}`;
        } else {
          // Quando ocultar valores está desativado, mostrar nome e preço
          return `- ${s.nome}: R$ ${s.preco?.toFixed(2).replace('.', ',')}`;
        }
      })
      .join('\n');
    variables['{{SERVICOS_LISTA}}'] = servicosLista;
  } else {
    variables['{{SERVICOS_LISTA}}'] = '';
  }

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, value);
  });

  console.log('=== VARIABLES GENERATED ===');
  console.log('{{DATA_EVENTO}}:', variables['{{DATA_EVENTO}}']);
  console.log('{{CIDADE_EVENTO}}:', variables['{{CIDADE_EVENTO}}']);
  console.log('{{VALOR_TOTAL}}:', variables['{{VALOR_TOTAL}}']);
  console.log('{{SUBTOTAL}}:', variables['{{SUBTOTAL}}']);
  console.log('{{PRODUTOS_LISTA}}:', variables['{{PRODUTOS_LISTA}}']);
  console.log('{{FORMA_PAGAMENTO}}:', variables['{{FORMA_PAGAMENTO}}']);
  console.log('=== ALL VARIABLES ===');
  Object.entries(variables).forEach(([key, value]) => {
    if (value) console.log(`${key}: ${value.substring(0, 100)}`);
  });

  return result;
}

export function getAvailableVariables(): { key: string; description: string; category: string }[] {
  return [
    { key: '{{NOME_USUARIO}}', description: 'Nome/Razão Social do usuário', category: 'Usuario' },
    { key: '{{CPF_CNPJ_USUARIO}}', description: 'CPF ou CNPJ do usuário', category: 'Usuario' },
    { key: '{{ENDERECO_USUARIO}}', description: 'Endereço do usuário', category: 'Usuario' },
    { key: '{{CIDADE_USUARIO}}', description: 'Cidade do usuário', category: 'Usuario' },
    { key: '{{ESTADO_USUARIO}}', description: 'Estado do usuário', category: 'Usuario' },
    { key: '{{CEP_USUARIO}}', description: 'CEP do usuário', category: 'Usuario' },
    { key: '{{TELEFONE_USUARIO}}', description: 'Telefone do usuário', category: 'Usuario' },
    { key: '{{EMAIL_USUARIO}}', description: 'Email do usuário', category: 'Usuario' },
    { key: '{{PIX_USUARIO}}', description: 'Chave PIX do usuário', category: 'Usuario' },
    { key: '{{BANCO_USUARIO}}', description: 'Nome do banco', category: 'Usuario' },
    { key: '{{AGENCIA_USUARIO}}', description: 'Agência bancária', category: 'Usuario' },
    { key: '{{CONTA_USUARIO}}', description: 'Conta bancária', category: 'Usuario' },

    { key: '{{NOME_COMPLETO_CLIENTE}}', description: 'Nome completo do cliente', category: 'Cliente' },
    { key: '{{CPF_CLIENTE}}', description: 'CPF do cliente', category: 'Cliente' },
    { key: '{{RG_CLIENTE}}', description: 'RG do cliente', category: 'Cliente' },
    { key: '{{ENDERECO_COMPLETO_CLIENTE}}', description: 'Endereço completo do cliente', category: 'Cliente' },
    { key: '{{CEP_CLIENTE}}', description: 'CEP do cliente', category: 'Cliente' },
    { key: '{{TELEFONE_CLIENTE}}', description: 'Telefone do cliente', category: 'Cliente' },
    { key: '{{EMAIL_CLIENTE}}', description: 'Email do cliente', category: 'Cliente' },

    { key: '{{LOCAL_EVENTO}}', description: 'Nome do local do evento', category: 'Evento' },
    { key: '{{ENDERECO_EVENTO}}', description: 'Endereço do evento', category: 'Evento' },
    { key: '{{CIDADE_EVENTO}}', description: 'Cidade do evento', category: 'Evento' },
    { key: '{{DATA_EVENTO}}', description: 'Data do evento', category: 'Evento' },
    { key: '{{HORARIO_INICIO}}', description: 'Horário de início', category: 'Evento' },
    { key: '{{OBSERVACOES_CLIENTE}}', description: 'Observações do cliente', category: 'Evento' },

    { key: '{{SUBTOTAL}}', description: 'Subtotal (antes de ajustes)', category: 'Financeiro' },
    { key: '{{VALOR_TOTAL}}', description: 'Valor total do serviço', category: 'Financeiro' },
    { key: '{{DESCONTO_CUPOM}}', description: 'Desconto aplicado', category: 'Financeiro' },
    { key: '{{ACRESCIMO_PAGAMENTO}}', description: 'Acréscimo da forma de pagamento', category: 'Financeiro' },
    { key: '{{AJUSTE_SAZONAL}}', description: 'Ajuste sazonal (por data)', category: 'Financeiro' },
    { key: '{{AJUSTE_GEOGRAFICO}}', description: 'Ajuste geográfico (por localização)', category: 'Financeiro' },
    { key: '{{FORMA_PAGAMENTO}}', description: 'Forma de pagamento', category: 'Financeiro' },
    { key: '{{PRODUTOS_LISTA}}', description: 'Lista de produtos contratados', category: 'Financeiro' },
    { key: '{{SERVICOS_LISTA}}', description: 'Lista de serviços contratados', category: 'Financeiro' },
  ];
}
