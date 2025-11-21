export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  youtubeId: string;
  category: 'template' | 'agenda' | 'leads';
  tab?: 'produtos' | 'pagamentos' | 'cupons' | 'campos' | 'whatsapp' | 'precos' | 'config' | 'agenda' | 'leads';
  order: number;
  duration?: string;
}

export const VIDEO_TUTORIALS: VideoTutorial[] = [
  {
    id: 'intro-priceus',
    title: 'Apresentação do Priceus',
    description: 'Conheça o Priceus e entenda como ele pode transformar a forma como você envia orçamentos para seus clientes.',
    youtubeUrl: 'https://youtu.be/5epUNCZcf3o',
    youtubeId: '5epUNCZcf3o',
    category: 'template',
    order: 1
  },
  {
    id: 'criar-template',
    title: 'Criando um Novo Template',
    description: 'Aprenda a criar seu primeiro template de orçamento do zero, configurando todas as informações básicas.',
    youtubeUrl: 'https://youtu.be/5zSkIkKTzHc',
    youtubeId: '5zSkIkKTzHc',
    category: 'template',
    order: 2
  },
  {
    id: 'produtos-servicos',
    title: 'Configurando Produtos e Serviços',
    description: 'Descubra como adicionar, editar e organizar os produtos e serviços que você oferece no seu orçamento.',
    youtubeUrl: 'https://youtu.be/Qbxf9s3EdfQ',
    youtubeId: 'Qbxf9s3EdfQ',
    category: 'template',
    tab: 'produtos',
    order: 3
  },
  {
    id: 'formas-pagamento',
    title: 'Configurando Formas de Pagamento',
    description: 'Configure as opções de pagamento disponíveis: entrada, parcelamento, acréscimos e descontos.',
    youtubeUrl: 'https://youtu.be/QPHyAmGQygs',
    youtubeId: 'QPHyAmGQygs',
    category: 'template',
    tab: 'pagamentos',
    order: 4
  },
  {
    id: 'cupons-desconto',
    title: 'Configurando Cupons de Desconto',
    description: 'Crie cupons promocionais para oferecer descontos especiais e atrair mais clientes.',
    youtubeUrl: 'https://youtu.be/8R9EDzAWBZM',
    youtubeId: '8R9EDzAWBZM',
    category: 'template',
    tab: 'cupons',
    order: 5
  },
  {
    id: 'campos-personalizados',
    title: 'Configurando Campos Extras Personalizados',
    description: 'Adicione campos customizados ao formulário para coletar informações específicas dos seus clientes.',
    youtubeUrl: 'https://youtu.be/xZ5KqnXAhkI',
    youtubeId: 'xZ5KqnXAhkI',
    category: 'template',
    tab: 'campos',
    order: 6
  },
  {
    id: 'mensagem-whatsapp',
    title: 'Configurando Mensagem do WhatsApp',
    description: 'Personalize a mensagem que seus clientes enviarão pelo WhatsApp com todas as informações do orçamento.',
    youtubeUrl: 'https://youtu.be/sV3f_7GBowU',
    youtubeId: 'sV3f_7GBowU',
    category: 'template',
    tab: 'whatsapp',
    order: 7
  },
  {
    id: 'precos-localidade',
    title: 'Configurando Preços por Localidade',
    description: 'Configure preços diferenciados baseados na localização geográfica do seu cliente.',
    youtubeUrl: 'https://youtu.be/15LK-PtkShs',
    youtubeId: '15LK-PtkShs',
    category: 'template',
    tab: 'precos',
    order: 8
  },
  {
    id: 'precos-sazonais',
    title: 'Configurando Preços Sazonais',
    description: 'Defina variações de preço para alta e baixa temporada, otimizando sua rentabilidade.',
    youtubeUrl: 'https://youtu.be/Lb7ktSRe2zs',
    youtubeId: 'Lb7ktSRe2zs',
    category: 'template',
    tab: 'precos',
    order: 9
  },
  {
    id: 'configuracoes-finais',
    title: 'Configurações Finais',
    description: 'Aprenda sobre personalização do template, bloqueio de campos obrigatórios e ocultação de valores intermediários.',
    youtubeUrl: 'https://youtu.be/seEPWxcO2tM',
    youtubeId: 'seEPWxcO2tM',
    category: 'template',
    tab: 'config',
    order: 10
  },
  {
    id: 'configurar-agenda',
    title: 'Configurando a Agenda',
    description: 'Gerencie sua disponibilidade e permita que clientes escolham datas disponíveis no orçamento.',
    youtubeUrl: 'https://youtu.be/mhe_AXqh6xo',
    youtubeId: 'mhe_AXqh6xo',
    category: 'agenda',
    tab: 'agenda',
    order: 11
  },
  {
    id: 'painel-leads',
    title: 'Entendendo o Painel Leads',
    description: 'Aprenda a usar o painel de leads para acompanhar e gerenciar todos os orçamentos recebidos.',
    youtubeUrl: 'https://youtu.be/RpFUSFFpdZY',
    youtubeId: 'RpFUSFFpdZY',
    category: 'leads',
    tab: 'leads',
    order: 12
  }
];

export const getVideoByTab = (tab: string): VideoTutorial | undefined => {
  return VIDEO_TUTORIALS.find(video => video.tab === tab);
};

export const getVideosByCategory = (category: 'template' | 'agenda' | 'leads'): VideoTutorial[] => {
  return VIDEO_TUTORIALS.filter(video => video.category === category);
};

export const getVideoById = (id: string): VideoTutorial | undefined => {
  return VIDEO_TUTORIALS.find(video => video.id === id);
};
