export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1S3KA0JwpG82WWRaH9JjeAEM',
    name: 'Professional',
    description: 'Orçamentos ilimitados, gestão completa de leads e integração WhatsApp',
    mode: 'subscription',
    price: 97.00,
    currency: 'BRL'
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};