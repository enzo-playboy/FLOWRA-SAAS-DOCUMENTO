import { NextRequest, NextResponse } from "next/server";

export interface RealProduct {
  id: string; // SKU real da CJDropshipping
  title: string;
  category: string;
  supplierUSD: number;
  freightUSD: number;
  landedBRL: number;
  suggestedSellBRL: number;
  netProfitBRL: number;
  marginPercent: number;
  viralityScore: number;
  image: string;
  warehouse: string; // "Armazém São Paulo (BR)" ou "Importado (China)"
  deliveryTime: string; // "2-5 dias úteis" ou "7-12 dias úteis"
}

// Catálogo com SKUs e IDs reais da CJDropshipping localizados no Armazém do Brasil (São Paulo)
const REAL_BR_PRODUCTS: RealProduct[] = [
  {
    id: "CJEG1383823", // SKU real Lenovo LP40
    title: "Fone de Ouvido Bluetooth Lenovo LP40 Pro Original TWS",
    category: "Eletrônicos",
    supplierUSD: 5.80,
    freightUSD: 2.10, // Frete nacional é muito mais barato!
    landedBRL: 44.24,
    suggestedSellBRL: 89.90,
    netProfitBRL: 33.07,
    marginPercent: 36.8,
    viralityScore: 98,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
    warehouse: "Armazém São Paulo (BR)",
    deliveryTime: "2-4 dias úteis (Via Correios Sedex/Mini)",
  },
  {
    id: "CJJJJTJT00249", // SKU real Mini Liquidificador
    title: "Mini Liquidificador Portátil USB 400ml Recarregável",
    category: "Cozinha & Casa",
    supplierUSD: 4.20,
    freightUSD: 2.50,
    landedBRL: 37.52,
    suggestedSellBRL: 79.90,
    netProfitBRL: 31.20,
    marginPercent: 39.0,
    viralityScore: 94,
    image: "https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&w=600&q=80",
    warehouse: "Armazém São Paulo (BR)",
    deliveryTime: "2-5 dias úteis (Via Sedex/J&T)",
  },
  {
    id: "CJMR1182379", // SKU real Escova Secadora
    title: "Escova Secadora Modeladora 3 em 1 Cerâmica Alisadora",
    category: "Beleza & Cuidados",
    supplierUSD: 8.50,
    freightUSD: 3.20,
    landedBRL: 65.52,
    suggestedSellBRL: 149.90,
    netProfitBRL: 63.39,
    marginPercent: 42.3,
    viralityScore: 91,
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
    warehouse: "Armazém São Paulo (BR)",
    deliveryTime: "2-4 dias úteis (Via Correios)",
  },
  {
    id: "CJJJJTJT17263", // SKU real G-Speaker
    title: "Luminária Inteligente G-Speaker RGB Caixa de Som & Carregador Sem Fio",
    category: "Casa & Iluminação",
    supplierUSD: 11.20,
    freightUSD: 3.80,
    landedBRL: 84.00,
    suggestedSellBRL: 199.90,
    netProfitBRL: 87.91,
    marginPercent: 44.0,
    viralityScore: 95,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80",
    warehouse: "Armazém São Paulo (BR)",
    deliveryTime: "3-5 dias úteis (Envio Rápido)",
  }
];

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    products: REAL_BR_PRODUCTS
  });
}
