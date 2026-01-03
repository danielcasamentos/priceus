import React, { useState } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { PriceBreakdown } from '../lib/whatsappMessageGenerator';

interface FloatingTotalPanelProps {
  isVisible: boolean;
  priceBreakdown: PriceBreakdown;
  itemsCount: number;
  className?: string;
}

export default function FloatingTotalPanel({
  isVisible,
  priceBreakdown,
  itemsCount,
  className,
}: FloatingTotalPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const CircularButton = () => (
    <button
      onClick={toggleExpand}
      className={cn(
        "w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-700 text-white flex flex-col items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300"
      )}
      aria-label="Ver resumo do orçamento"
    >
      <div className="relative">
        <ShoppingCart className="w-7 h-7" />
        {itemsCount > 0 && (
          <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
            {itemsCount}
          </span>
        )}
      </div>
      <span className="text-base font-bold mt-1">{formatCurrency(priceBreakdown.total)}</span>
    </button>
  );

  const ExpandedDetails = () => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setIsExpanded(false)}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Resumo do Orçamento</h3>
          <button onClick={() => setIsExpanded(false)} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(priceBreakdown.subtotal)}</span>
          </div>

          {priceBreakdown.ajusteSazonal !== 0 && (
            <div className="flex justify-between text-blue-600">
              <span>Ajuste Sazonal</span>
              <span>{priceBreakdown.ajusteSazonal > 0 ? '+' : ''}{formatCurrency(priceBreakdown.ajusteSazonal)}</span>
            </div>
          )}

          {(priceBreakdown.ajusteGeografico.percentual !== 0 || priceBreakdown.ajusteGeografico.taxa !== 0) && (
            <div className="flex justify-between text-purple-600">
              <span>Ajuste Regional</span>
              <span>
                {priceBreakdown.ajusteGeografico.percentual !== 0 && `${priceBreakdown.ajusteGeografico.percentual > 0 ? '+' : ''}${priceBreakdown.ajusteGeografico.percentual}% `}
                {priceBreakdown.ajusteGeografico.taxa !== 0 && `+ ${formatCurrency(priceBreakdown.ajusteGeografico.taxa)}`}
              </span>
            </div>
          )}

          {priceBreakdown.descontoCupom > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Desconto (Cupom)</span>
              <span>-{formatCurrency(priceBreakdown.descontoCupom)}</span>
            </div>
          )}

          {priceBreakdown.acrescimoFormaPagamento !== 0 && (
            <div className="flex justify-between text-orange-600">
              <span>Ajuste Pagamento</span>
              <span>{priceBreakdown.acrescimoFormaPagamento > 0 ? '+' : ''}{formatCurrency(priceBreakdown.acrescimoFormaPagamento)}</span>
            </div>
          )}

          <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between font-bold text-gray-900 text-base">
            <span>Total Final</span>
            <span>{formatCurrency(priceBreakdown.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-40 transition-all duration-300 ease-in-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none",
        className
      )}
    >
      <CircularButton />
      {isExpanded && <ExpandedDetails />}
    </div>
  );
}