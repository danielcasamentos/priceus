import { useEffect } from 'react';

declare global {
  interface Window {
    Tawk_API: any;
  }
}

interface TawkToChatProps {
  name?: string;
  email?: string;
}

export function TawkToChat({ name, email }: TawkToChatProps) {
  useEffect(() => {
    if (document.querySelector('script[src*="tawk.to"]')) {
      if (window.Tawk_API && window.Tawk_API.showWidget) {
        window.Tawk_API.showWidget();
      }
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://embed.tawk.to/660b0b5da0c6737bd126c21d/1hqc9j84r';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }

    window.Tawk_API = window.Tawk_API || {};
    
    // Adiciona um listener para o evento 'load' do Tawk.to
    window.Tawk_API.onLoad = () => {
      if (name || email) {
        // 🔥 CORREÇÃO: Adiciona uma verificação para garantir que a função setVisitor existe
        // antes de chamá-la. Isso evita o erro "i18next is not a function" que ocorre
        // se a API for chamada antes de estar 100% inicializada.
        if (window.Tawk_API && typeof window.Tawk_API.setVisitor === 'function') {
          window.Tawk_API.setVisitor({
            name: name,
            email: email,
          });
        }
      }
    };

    return () => {
      if (window.Tawk_API && window.Tawk_API.hideWidget) {
        window.Tawk_API.hideWidget();
      }
    };
  }, []);

  return null;
}
