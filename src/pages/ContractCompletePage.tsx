import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, FileText, Loader2, AlertTriangle } from 'lucide-react';

/*
interface Contract {
  id: string;
  template_id: string;
  user_id: string;
  lead_data_json: any;
  client_data_json: any;
  user_data_json: any;
  user_signature_base64: string;
  signature_base64?: string;
  pdf_url?: string; // Adicionado para armazenar a URL do PDF gerado
  signed_at: string;
  client_ip: string;
}

interface ContractTemplate {
  name: string;
  content_text: string;
}
*/

export function ContractCompletePage() {
  const { token } = useParams<{ token: string }>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (token) {
      loadContractUrl();
    }
  }, [token, retryCount]);

  const loadContractUrl = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const { data: contractBundle, error: rpcError } = await supabase
        .rpc('get_public_contract_data', { p_token: token })
        .single();

      if (rpcError) throw rpcError;

      const contractData = contractBundle?.contract;

      // 🔥 CORREÇÃO: A verificação principal agora é apenas o status.
      // A URL do PDF é opcional, pois o cliente pode ter baixado o arquivo
      // diretamente no passo anterior se o bucket não estiver configurado.
      if (contractData?.status !== 'signed') {
        if (retryCount < 5) {
          console.warn(`[CompletePage] Contrato não está pronto. Tentativa ${retryCount + 1}/5...`);
          setTimeout(() => setRetryCount(prev => prev + 1), 2000); // Espera 2s e tenta de novo
          return;
        } else {
          throw new Error('Não foi possível carregar o PDF do contrato após várias tentativas.');
        }
      }

      // Define a URL do PDF se ela existir. Se não, o botão de download ficará desabilitado,
      // mas a página mostrará a mensagem de sucesso.
      setPdfUrl(contractData.pdf_url || null);

    } catch (err) {
      console.error('Erro ao carregar contrato completo:', err);
      setError('Não foi possível encontrar o contrato finalizado.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        {loading ? (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Finalizando...</h2>
            <p className="text-gray-600">Aguarde enquanto preparamos seu documento final.</p>
          </>
        ) : error ? (
          <>
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao Finalizar</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => setRetryCount(0)}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </>
        ) : (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Contrato Assinado com Sucesso!</h2>
            <p className="text-gray-600 mb-6">
              Seu contrato foi finalizado. Clique no botão abaixo para baixar sua cópia em PDF.
            </p>
            <button
              onClick={handleDownload}
              disabled={!pdfUrl}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FileText className="w-6 h-6" />
              {pdfUrl ? 'Baixar Contrato em PDF' : 'PDF não arquivado'}
            </button>
            {!pdfUrl && (
              <p className="text-xs text-gray-500 mt-2">O contrato é válido, mas o PDF não foi salvo no servidor. O cliente já deve ter baixado sua cópia.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}