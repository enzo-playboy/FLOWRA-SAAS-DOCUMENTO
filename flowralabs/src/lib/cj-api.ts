/**
 * DropHunter AI — Módulo de Integração CJDropshipping API & Motor de Cálculo Fiscal
 * Flowra Labs (2026)
 */

export interface CJProductVariant {
  vid: string;
  sku: string;
  variantName: string;
  variantPriceUSD: number;
  variantWeightGrams: number;
}

export interface CJFreightRequest {
  startCountryCode: string; // "CN"
  endCountryCode: string;   // "BR"
  vid: string;
  quantity: number;
}

export interface CJFreightOption {
  logisticName: string; // ex: "CJ Packet Ordinary"
  logisticPriceUSD: number;
  logisticDays: string; // ex: "7-12"
}

export interface FinancialBreakdown {
  productPriceUSD: number;
  freightPriceUSD: number;
  totalCostUSD: number;
  usdToBrlRate: number;
  
  // Em Reais (BRL)
  productCostBRL: number;
  freightCostBRL: number;
  totalLandedCostBeforeTaxBRL: number;
  
  // Remessa Conforme / Imposto de Importação BR
  importTaxBRL: number;
  icmsTaxBRL: number;
  totalTaxesBRL: number;
  totalLandedCostWithTaxBRL: number; // CUSTO FINAL DO LOJISTA
  
  // Sugestões de Venda & Margem
  suggestedSellPriceBRL: number;
  marketplaceFeeBRL: number; // ~14% ML/Shopee
  netProfitBRL: number;
  netMarginPercent: number;
}

const CJ_API_BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";

export class CJDropshippingService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CJ_API_KEY || "";
  }

  /**
   * Calcula o frete real via API da CJDropshipping para o Brasil
   */
  async calculateFreight(params: CJFreightRequest): Promise<CJFreightOption[]> {
    if (!this.apiKey) {
      return [
        {
          logisticName: "CJ Packet Ordinary",
          logisticPriceUSD: 5.80,
          logisticDays: "7-12"
        },
        {
          logisticName: "CJ Packet Fast",
          logisticPriceUSD: 8.20,
          logisticDays: "5-9"
        }
      ];
    }

    try {
      const response = await fetch(`${CJ_API_BASE_URL}/logistic/freightCalculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CJ-Access-Token": this.apiKey,
        },
        body: JSON.stringify({
          startCountryCode: params.startCountryCode || "CN",
          endCountryCode: params.endCountryCode || "BR",
          products: [
            {
              vid: params.vid,
              quantity: params.quantity || 1,
            },
          ],
        }),
      });

      const data = await response.json();
      if (!data.result) {
        throw new Error(data.message || "Erro ao calcular frete na CJ API");
      }

      return data.data.map((item: any) => ({
        logisticName: item.logisticName,
        logisticPriceUSD: parseFloat(item.logisticPrice),
        logisticDays: item.logisticAging,
      }));
    } catch (error) {
      console.error("[CJ API Error]:", error);
      throw error;
    }
  }

  /**
   * Motor de Cálculo de Custos, Remessa Conforme e Margem Líquida do Lojista
   */
  calculateUnitEconomics(
    productPriceUSD: number,
    freightPriceUSD: number,
    usdToBrlRate: number = 5.60,
    desiredMarginPercent: number = 40,
    marketplaceFeeRate: number = 0.14
  ): FinancialBreakdown {
    const totalCostUSD = productPriceUSD + freightPriceUSD;
    
    const productCostBRL = Number((productPriceUSD * usdToBrlRate).toFixed(2));
    const freightCostBRL = Number((freightPriceUSD * usdToBrlRate).toFixed(2));
    const totalLandedCostBeforeTaxBRL = Number((totalCostUSD * usdToBrlRate).toFixed(2));

    let importTaxBRL = 0;
    if (totalCostUSD <= 50) {
      importTaxBRL = totalLandedCostBeforeTaxBRL * 0.20;
    } else {
      const taxableUSD = Math.max(0, totalCostUSD - 20);
      importTaxBRL = (taxableUSD * 0.60) * usdToBrlRate;
    }

    const baseForICMS = (totalLandedCostBeforeTaxBRL + importTaxBRL) / (1 - 0.17);
    const icmsTaxBRL = baseForICMS * 0.17;
    
    const totalTaxesBRL = Number((importTaxBRL + icmsTaxBRL).toFixed(2));
    const totalLandedCostWithTaxBRL = Number((totalLandedCostBeforeTaxBRL + totalTaxesBRL).toFixed(2));

    const targetProfitBRL = totalLandedCostWithTaxBRL * (desiredMarginPercent / 100);
    const rawSuggestedPrice = (totalLandedCostWithTaxBRL + targetProfitBRL) / (1 - marketplaceFeeRate);
    const suggestedSellPriceBRL = Number(rawSuggestedPrice.toFixed(2));

    const marketplaceFeeBRL = Number((suggestedSellPriceBRL * marketplaceFeeRate).toFixed(2));
    const netProfitBRL = Number((suggestedSellPriceBRL - totalLandedCostWithTaxBRL - marketplaceFeeBRL).toFixed(2));
    const netMarginPercent = Number(((netProfitBRL / suggestedSellPriceBRL) * 100).toFixed(1));

    return {
      productPriceUSD,
      freightPriceUSD,
      totalCostUSD,
      usdToBrlRate,
      productCostBRL,
      freightCostBRL,
      totalLandedCostBeforeTaxBRL,
      importTaxBRL: Number(importTaxBRL.toFixed(2)),
      icmsTaxBRL: Number(icmsTaxBRL.toFixed(2)),
      totalTaxesBRL,
      totalLandedCostWithTaxBRL,
      suggestedSellPriceBRL,
      marketplaceFeeBRL,
      netProfitBRL,
      netMarginPercent,
    };
  }
}
