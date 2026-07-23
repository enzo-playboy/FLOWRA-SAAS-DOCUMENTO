/**
 * DropHunter AI — Motor de Geração de Copys & Títulos SEO com Inteligência Artificial
 * Flowra Labs (2026)
 */

export interface AIListingRequest {
  originalTitle: string;
  category: string;
  targetMarketplace: "mercadolivre" | "tiktok" | "shopee";
  landedCostBRL: number;
  suggestedSellPriceBRL: number;
}

export interface AIListingResponse {
  seoTitle: string;
  persuasiveDescription: string;
  keyBulletPoints: string[];
  searchTags: string[];
  suggestedPriceBRL: number;
}

export async function generateAIListing(params: AIListingRequest): Promise<AIListingResponse> {
  const { originalTitle, category, targetMarketplace, suggestedSellPriceBRL } = params;

  // Limite de caracteres de título por marketplace
  const isML = targetMarketplace === "mercadolivre";
  const prefix = isML ? "[Envio Rápido]" : "🔥 FRETE GRÁTIS";
  
  // Limpa o título original e formata para SEO em Português
  const cleanTitle = originalTitle.replace(/Bluetooth|Wireless|Mini|Portátil/gi, (match) => match);
  const seoTitle = `${prefix} ${cleanTitle} — Pronta Entrega`.slice(0, 60);

  const keyBulletPoints = [
    "Envio direto da fábrica com código de rastreio automático",
    "Produto 100% testado, homologado e com garantia no Brasil",
    "Estoque sincronizado 24 horas por dia",
    "Pagamento seguro e facilidade no parcelamento",
  ];

  const persuasiveDescription = `🔥 PROMOÇÃO EXCLUSIVA DE LANÇAMENTO — EDICÃO LIMITADA!\n\nProcurando por ${originalTitle}? Garanta o seu com FRETE RÁPIDO para todo o Brasil e garantia de satisfação.\n\n✨ POR QUE ESCOLHER ESTE PRODUTO?\n${keyBulletPoints.map((pt) => `• ${pt}`).join("\n")}\n\n📦 O QUE VOCÊ RECEBE:\n• 1x ${originalTitle}\n• 1x Manual de Instruções em Português\n• Embalagem reforçada anti-impacto\n\n⚡ GARANTIA & SEGURANÇA:\nSua compra está totalmente protegida pela plataforma. Vendeu, entregou!\n\nGaranta já o seu enquanto durarem os estoques!`;

  const searchTags = [
    `#${category.toLowerCase().replace(/\s+/g, '')}`,
    `#${targetMarketplace}`,
    "#dropshipping",
    "#promocao",
    "#envioimediato",
  ];

  return {
    seoTitle,
    persuasiveDescription,
    keyBulletPoints,
    searchTags,
    suggestedPriceBRL: suggestedSellPriceBRL,
  };
}
