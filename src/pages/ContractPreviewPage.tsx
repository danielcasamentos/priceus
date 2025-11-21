import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import 'jspdf/dist/polyfills.es.js'; // 🔥 CORREÇÃO: Caminho correto para Vite/ES Modules
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QRCodeCanvas } from 'qrcode.react';
import { replaceContractVariables, type BusinessSettings, type ClientData, type LeadData } from '../lib/contractVariables';
import { CheckCircle, Loader2, FileWarning, Eye } from 'lucide-react';

// Estilos para o container do contrato que será convertido para PDF
const contractStyles = `
  .contract-preview-container {
    width: 210mm; /* Largura de uma folha A4 */
    min-height: 297mm; /* Altura de uma folha A4 */
    padding: 20mm;
    background-color: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    font-family: 'Helvetica', 'Arial', sans-serif;
    font-size: 12pt;
    /* 🔥 CORREÇÃO: Garante que o texto quebre corretamente dentro do contêiner */
    word-wrap: break-word;
    line-height: 1.5;
    color: #000;
    box-sizing: border-box;
    text-align: justify;
  }
  .contract-preview-container h1, .contract-preview-container h2, .contract-preview-container h3 {
    text-align: center;
    margin-bottom: 24pt;
  }
  .contract-preview-container p {
    margin-bottom: 12pt;
  }
  .contract-preview-container table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12pt;
  }
  .contract-preview-container td, .contract-preview-container th {
    border: 1px solid #ccc;
    padding: 8pt;
  }
  .contract-preview-container .signature-block {
    margin-top: 50pt;
    text-align: center;
  }
  .signature-line {
    border-bottom: 1px solid #000;
    width: 300px;
    margin: 0 auto 5pt auto;
  }
`;

interface Contract {
  id: string;
  template_id: string;
  lead_id: string;
  user_id: string;
  token: string;
  lead_data_json: any;
  client_data_json: any;
  user_data_json: any;
  user_signature_base64: string;
  signature_base64?: string; // Assinatura do cliente, agora vem da página anterior
  status: 'pending' | 'preview' | 'signed' | 'expired';
  pdf_url?: string;
  expires_at: string;
}

interface ContractTemplate {
  name: string;
  content_text: string;
}

export function ContractPreviewPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation(); // 🔥 NOVO: Para receber dados da página anterior
  const [contract, setContract] = useState<Contract | null>(null);
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({});
  const [processedContent, setProcessedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const contractPreviewRef = useRef<HTMLDivElement>(null);

  // 🔥 NOVO: Pega os dados do cliente do estado da navegação
  const clientDataFromState = location.state?.clientData as ClientData | undefined;
  const clientSignatureFromState = location.state?.clientSignature as string | undefined;
  const clientIpFromState = location.state?.clientIp as string | undefined;

  useEffect(() => {
    // Validação: se não houver dados do cliente, o fluxo está quebrado.
    if (!clientDataFromState || !clientSignatureFromState) {
      setError('Dados do cliente não encontrados. Por favor, volte e preencha o formulário novamente.');
      setLoading(false);
      return;
    }
    loadContractForPreview();
  }, [token]);

  useEffect(() => {
    if (template && contract && businessSettings && clientDataFromState) {
      const leadData: LeadData = contract.lead_data_json || {};

      console.log('🔄 [Preview Page] Gerando conteúdo do contrato com dados em memória:');
      console.log('Lead Data:', leadData);
      console.log('Client Data:', clientDataFromState);
      console.log('Business Settings:', businessSettings);

      const processed = replaceContractVariables(
        template.content_text,
        businessSettings,
        clientDataFromState,
        leadData
      );
      setProcessedContent(processed);
    }
  }, [template, contract, businessSettings, clientDataFromState]);

  const loadContractForPreview = async () => {
    if (!token) {
      setError('Token inválido.');
      setLoading(false);
      return;
    }

    try {
      const { data: contractBundle, error: rpcError } = await supabase
        .rpc('get_public_contract_data', { p_token: token })
        .single();

      if (rpcError) throw rpcError;

      if (!contractBundle || !contractBundle.contract) {
        setError('Contrato não encontrado ou inválido.');
        setLoading(false);
        return;
      }

      const { contract: contractData, template: templateData, business_settings: businessData } = contractBundle;

      setContract(contractData);
      setTemplate(templateData);
      setBusinessSettings(businessData || {});
    } catch (err) {
      console.error('Erro ao carregar dados para preview:', err);
      setError('Ocorreu um erro ao carregar os dados do contrato.');
    } finally {
      setLoading(false);
    }
  };

  const generateAndUploadPDF = async (): Promise<string | null> => {
    if (!contractPreviewRef.current || !contract) {
      console.error('❌ Referência do contrato ou dados do contrato ausentes.');
      return null;
    }

    setGenerating(true);
    console.log('🚀 [PDF Generation] Iniciando processo de geração e upload de PDF...');

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const element = contractPreviewRef.current;

      console.log('📄 [PDF DEBUG] Elemento HTML a ser renderizado:', element.outerHTML.substring(0, 500) + '...');
      console.log(`📐 [PDF DEBUG] Dimensões do contêiner: Largura=${element.scrollWidth}px, Altura=${element.scrollHeight}px`);

      await pdf.html(element, {
        autoPaging: 'text',
        html2canvas: {
          scale: 0.254, // 🔥 CORREÇÃO: Escala mais precisa (210mm / (96dpi * 25.4mm/in))
          useCORS: true,
          letterRendering: true,
        },
        x: 0,
        y: 0,
        width: 210, // A4 width in mm
        windowWidth: element.scrollWidth, // 🔥 CORREÇÃO: Usa a largura real do elemento
      });

      const pdfBlob = pdf.output('blob');
      const filePath = `contracts/${contract.id}.pdf`;

      console.log('☁️ [PDF Generation] Iniciando upload para o Supabase Storage...');
      const { error: uploadError } = await supabase.storage
        .from('contract-pdfs')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('❌ Erro ao fazer upload do PDF:', uploadError);
        throw new Error('Falha ao fazer upload do PDF.');
      }

      const { data: publicUrlData } = supabase.storage
        .from('contract-pdfs')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Não foi possível obter a URL pública do PDF.');
      }

      console.log('🔗 [PDF Generation] URL pública do PDF:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;

    } catch (error) {
      console.error('❌ Erro fatal ao gerar ou fazer upload do PDF:', error);
      setError('Ocorreu um erro crítico ao gerar o PDF. Por favor, tente novamente.');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveAndFinalize = async () => {
    if (!contract || !clientDataFromState || !clientSignatureFromState) {
      setError('Faltam dados essenciais para finalizar o contrato.');
      return;
    }

    setGenerating(true);
    try {
      // 1. Gera o PDF e força o download para o cliente (lógica do ContractViewerModal)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const element = contractPreviewRef.current!;
      const container = document.createElement('div');
      container.style.width = '210mm';
      container.style.padding = '20mm';
      container.style.fontFamily = "'Helvetica', 'Arial', sans-serif";
      container.style.fontSize = '12pt';
      container.style.lineHeight = '1.5';
      container.style.textAlign = 'justify';
      container.style.wordWrap = 'break-word';
      container.innerHTML = element.innerHTML;

      await pdf.html(container, {
        autoPaging: 'text',
        html2canvas: { scale: 0.254, useCORS: true, letterRendering: true },
        width: 210,
        windowWidth: 800,
      });

      pdf.save(`contrato-${contract.id.substring(0, 8)}.pdf`);
      console.log('✅ [Cliente] PDF gerado e download iniciado para o cliente.');

      // 2. Tenta salvar no bucket em segundo plano (não bloqueia o cliente)
      const pdfBlob = pdf.output('blob');
      const filePath = `contracts/${contract.id}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('contract-pdfs').upload(filePath, pdfBlob, { upsert: true });

      let finalPdfUrl: string | null = null;
      if (uploadError) {
        console.warn('⚠️ [Bucket] Falha ao salvar PDF no bucket:', uploadError.message);
      } else {
        const { data: publicUrlData } = supabase.storage.from('contract-pdfs').getPublicUrl(filePath);
        finalPdfUrl = publicUrlData?.publicUrl || null;
        console.log('✅ [Bucket] PDF arquivado com sucesso no bucket.');
      }

      // 3. Atualiza o banco de dados com o status final
      await supabase.from('contracts').update({
        client_data_json: clientDataFromState,
        signature_base64: clientSignatureFromState,
        client_ip: clientIpFromState,
        pdf_url: finalPdfUrl,
        status: 'signed',
        signed_at: new Date().toISOString(),
      }).eq('id', contract.id);

      console.log('✅ [DB] Contrato finalizado no banco de dados.');
      navigate(`/contrato/${token}/completo`);

    } catch (err: any) {
      console.error('❌ [Finalize] Erro fatal durante o processo de finalização:', err);
      setError(`Ocorreu um erro ao finalizar o contrato: ${err.message}. Por favor, tente novamente.`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"> <Loader2 className="animate-spin h-10 w-10" /> </div>;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-red-50 text-red-800 p-4">
        <FileWarning className="h-16 w-16 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Erro no Contrato</h2>
        <p className="text-center max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 py-10">
      <style>{contractStyles}</style>
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-lg p-8 rounded-lg mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-center">Revise e Aprove seu Contrato</h1>
          </div>
          <p className="text-center text-gray-600 mb-6">
            Confira todos os dados e a formatação do contrato abaixo. Este é o documento final. Se tudo estiver correto, aprove para gerar o PDF oficial e concluir a assinatura.
          </p>
          <div className="flex justify-center">
            <button
              onClick={handleApproveAndFinalize} // A função agora faz tudo
              disabled={generating}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating ? <Loader2 className="animate-spin" /> : <CheckCircle />}
              {generating ? 'Finalizando...' : 'Aprovar e Finalizar'}
            </button>
          </div>
        </div>

        {/* O container que será impresso em PDF (movido para dentro do div principal) */}
        <div ref={contractPreviewRef} className="contract-preview-container mx-auto">
          <div dangerouslySetInnerHTML={{ __html: processedContent }} />

          {/* Bloco de Assinaturas */}
          <div className="signature-block grid grid-cols-2 gap-8 pt-16">
            <div>
              {contract?.user_signature_base64 && (
                <img src={contract.user_signature_base64} alt="Assinatura do Contratado" className="mx-auto h-20"/>
              )}
              <div className="signature-line"></div>
              <p className="text-sm">{contract?.user_data_json?.business_name || 'Contratado'}</p>
              <p className="text-sm">
                {contract?.user_data_json?.person_type === 'fisica' ? `CPF: ${contract?.user_data_json?.cpf}` : `CNPJ: ${contract?.user_data_json?.cnpj}`}
              </p>
            </div>
            <div>
              {clientSignatureFromState && (
                <img src={clientSignatureFromState} alt="Assinatura do Contratante" className="mx-auto h-20"/>
              )}
              <div className="signature-line"></div>
              <p className="text-sm">{clientDataFromState?.nome_completo || 'Contratante'}</p>
              <p className="text-sm">CPF: {clientDataFromState?.cpf}</p>
            </div>
          </div>

          {/* 🔥 NOVO: Carimbo de Autenticação Digital (idêntico ao do ContractViewerModal) */}
          {contract && (
            <div style={{ marginTop: '60pt', paddingTop: '20pt', borderTop: '1px dashed #ccc', fontSize: '9pt', color: '#555', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontWeight: 'bold', marginBottom: '15pt', fontSize: '11pt' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '8px' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <span>Carimbo de Autenticação Digital</span>
                </h4>
                <p><strong>ID do Contrato:</strong> <span style={{ fontFamily: 'monospace' }}>{contract.id}</span></p>
                <p><strong>Data e Hora da Assinatura:</strong> {format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</p>
                <p><strong>Endereço IP do Assinante:</strong> {clientIpFromState || 'Não registrado'}</p>
                <p>
                  <strong>Assinado por:</strong> {clientDataFromState?.nome_completo || 'Contratante'}
                  {clientDataFromState?.cpf && ` (CPF: ${clientDataFromState.cpf})`}
                </p>
                <p style={{ marginTop: '10pt', fontStyle: 'italic' }}>Este documento foi assinado eletronicamente através da plataforma PriceUs.</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <QRCodeCanvas
                  value={`${window.location.origin}/verificar/${contract.token}`}
                  size={100}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"L"}
                  includeMargin={true}
                />
                <p style={{ marginTop: '5px', fontSize: '8pt' }}>Verifique a autenticidade</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
