// Geração de links de busca para fornecedores.
// MVP: sem API, só gera links diretos pra cliente buscar sozinho.

export type SupplierLink = {
  source: "aliexpress" | "alibaba" | "ml_atacado";
  name: string;
  url: string;
  icon: string;
  description: string;
};

/**
 * Gera links de busca pra fornecedores baseado no nome do produto.
 * Não usa API — só monta URLs de busca.
 */
export function getSupplierLinks(productName: string): SupplierLink[] {
  // Limpa o nome: pega só as primeiras palavras-chave (máx 5)
  const keywords = productName
    .replace(/\s*[-–—|].*$/, "") // remove tudo depois de traço/pipe
    .split(/\s+/)
    .slice(0, 5)
    .join(" ")
    .trim();

  const encoded = encodeURIComponent(keywords);

  return [
    {
      source: "aliexpress",
      name: "AliExpress",
      url: `https://www.aliexpress.com/wholesale?SearchText=${encoded}`,
      icon: "🇨🇳",
      description: "Fornecedores da China (preço baixo, prazo 15-30 dias)",
    },
    {
      source: "alibaba",
      name: "Alibaba",
      url: `https://www.alibaba.com/trade/search?SearchText=${encoded}`,
      icon: "🏭",
      description: "Fornecedores verificados (MOQ alto, mais confiável)",
    },
    {
      source: "ml_atacado",
      name: "ML Atacado",
      url: `https://lista.mercadolivre.com.br/${encoded}_PriceRange_0-0_NoIndex_True#applied_filter_id%3DDEAL_PRICE%26applied_filter_name%3DPre%C3%A7o%26applied_filter_order%3D3%26applied_value_id%3D0-0%26applied_value_name%3D0-0`,
      icon: "🇧🇷",
      description: "Vendedores brasileiros (entrega rápida, 3-7 dias)",
    },
  ];
}

/**
 * Estimativa simples de preço de fornecedor (placeholder).
 * TODO: integrar com APIs reais (CJ/AliExpress) no futuro.
 * Por agora retorna uma estimativa baseada em heurística.
 */
export function estimateSupplierPrice(
  mlPrice: number,
  domainId: string | null
): {
  min: number;
  max: number;
  currency: string;
} {
  // Heurística: produtos de tecnologia geralmente custam 35-50% do preço ML
  // (isso é MUITO simplificado — precisa de dados reais no futuro)
  let multiplier = 0.4; // 40% do preço ML

  // Ajusta por categoria
  if (domainId?.includes("CELLPHONE")) multiplier = 0.38;
  else if (domainId?.includes("ELECTRONICS")) multiplier = 0.42;
  else if (domainId?.includes("COMPUTER")) multiplier = 0.45;

  const estimated = mlPrice * multiplier;

  return {
    min: Math.round(estimated * 0.85), // -15% margem
    max: Math.round(estimated * 1.15), // +15% margem
    currency: "BRL",
  };
}
