// Cálculo de margem de lucro estimada.
// MVP: cálculo simplificado com disclaimer.

export type MarginResult = {
  mlPrice: number;
  supplierCost: number;
  shippingEstimate: number;
  mlFees: number;
  estimatedProfit: number;
  marginPercent: number;
  disclaimer: string;
};

// Taxas do ML por categoria (estimativas — fonte: tabela oficial ML 2024)
const ML_FEES: Record<string, number> = {
  "MLB-CELLPHONES": 0.14, // 14% comissão
  "MLB-ELECTRONICS": 0.13,
  "MLB-COMPUTER": 0.12,
  "MLB-APPLIANCES": 0.11,
  DEFAULT: 0.13, // 13% médio
};

// Custo fixo estimado por venda no ML
const FIXED_COST_PER_SALE = 5; // R$5 (custo fixo estimado)

/**
 * Calcula margem de lucro estimada.
 *
 * IMPORTANTE: Este é um cálculo ESTIMATIVO.
 * O resultado real depende de:
 * - Preço exato do fornecedor (varia por vendedor)
 * - Frete internacional (varia por peso/região)
 * - Impostos de importação (ICMS, II, PIS/COFINS)
 * - Câmbio USD/BRL no momento da compra
 *
 * Usar APENAS como referência, não como dado exato.
 */
export function calculateMargin(
  mlPrice: number,
  supplierCostBRL: number,
  domainId: string | null,
  shippingBRL: number = 50 // frete estimado padrão
): MarginResult {
  // Comissão do ML
  const feeKey = domainId || "DEFAULT";
  const feeRate = ML_FEES[feeKey] || ML_FEES.DEFAULT;
  const mlFee = mlPrice * feeRate;

  // Custo total
  const totalCost = supplierCostBRL + shippingBRL + mlFee + FIXED_COST_PER_SALE;

  // Lucro estimado
  const profit = mlPrice - totalCost;

  // Margem percentual
  const marginPercent = mlPrice > 0 ? (profit / mlPrice) * 100 : 0;

  return {
    mlPrice,
    supplierCost: supplierCostBRL,
    shippingEstimate: shippingBRL,
    mlFees: Math.round(mlFee),
    estimatedProfit: Math.round(profit),
    marginPercent: Math.round(marginPercent * 10) / 10,
    disclaimer:
      "⚠️ Margem ESTIMATIVA. Preço do fornecedor, frete e impostos podem variar. Valide antes de comprar.",
  };
}

/**
 * Wrapper legado (usado em search/route.ts).
 * Assinatura antiga: calcMargin({ price, cost })
 */
export function calcMargin({
  price,
  cost,
  domainId,
  shipping,
}: {
  price: number;
  cost: number;
  domainId?: string;
  shipping?: number;
}) {
  const result = calculateMargin(price, cost, domainId ?? null, shipping ?? 50);
  // Mapeia pro formato legado que search/route.ts espera
  return {
    imposto_importacao: 0,
    icms: 0,
    taxa_correios: 0,
    custo_total: result.supplierCost + result.shippingEstimate,
    margem_liquida: result.estimatedProfit,
    margem_pct: result.marginPercent,
  };
 }
