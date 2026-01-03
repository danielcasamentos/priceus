import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, TrendingUp, Star, Loader2 } from 'lucide-react';

interface QuoteCardInsightsProps {
  templateId: string;
}

interface AnalyticsSummary {
  totalVisualizacoes: number;
  taxaConversao: number;
  produtoMaisPopular?: string;
}

export function QuoteCardInsights({ templateId }: QuoteCardInsightsProps) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!templateId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error } = await supabase
          .from('analytics_orcamentos')
          .select('orcamento_enviado, produtos_selecionados')
          .eq('template_id', templateId)
          .gte('data_acesso', thirtyDaysAgo.toISOString());

        if (error) throw error;

        if (!data || data.length === 0) {
          setSummary({ totalVisualizacoes: 0, taxaConversao: 0 });
          return;
        }

        const totalVisualizacoes = data.length;
        const totalConversoes = data.filter(a => a.orcamento_enviado).length;
        const taxaConversao = totalVisualizacoes > 0 ? (totalConversoes / totalVisualizacoes) * 100 : 0;

        const productCounts = new Map<string, number>();
        data.forEach(a => {
          if (a.produtos_selecionados) {
            for (const [productName, quantity] of Object.entries(a.produtos_selecionados as Record<string, number>)) {
              productCounts.set(productName, (productCounts.get(productName) || 0) + quantity);
            }
          }
        });

        let produtoMaisPopular: string | undefined;
        if (productCounts.size > 0) {
          produtoMaisPopular = [...productCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
        }

        setSummary({
          totalVisualizacoes,
          taxaConversao,
          produtoMaisPopular,
        });

      } catch (err) {
        console.error(`Erro ao buscar insights para template ${templateId}:`, err);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [templateId]);

  if (loading) {
    return (
      <div className="p-3 bg-gray-50 rounded-b-lg flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        <span className="text-xs text-gray-500 ml-2">Carregando insights...</span>
      </div>
    );
  }

  if (!summary || summary.totalVisualizacoes === 0) {
    return (
      <div className="p-3 bg-gray-50 rounded-b-lg text-xs text-gray-500 text-center">
        Ainda não há dados de insights para este orçamento.
      </div>
    );
  }

  return (
    <div className="p-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
      <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Insights (30 dias)</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2" title="Total de Visitas">
          <Eye className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <div>
            <div className="font-semibold text-gray-800">{summary.totalVisualizacoes}</div>
            <div className="text-gray-500">Visitas</div>
          </div>
        </div>
        <div className="flex items-center gap-2" title="Taxa de Conversão">
          <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
          <div>
            <div className="font-semibold text-gray-800">{summary.taxaConversao.toFixed(0)}%</div>
            <div className="text-gray-500">Conversão</div>
          </div>
        </div>
        {summary.produtoMaisPopular && (
          <div className="col-span-2 flex items-center gap-2 pt-2 border-t border-gray-200 mt-1" title={`Produto mais popular: ${summary.produtoMaisPopular}`}>
            <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold text-gray-800 truncate">
                {summary.produtoMaisPopular}
              </div>
              <div className="text-gray-500">Mais popular</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}