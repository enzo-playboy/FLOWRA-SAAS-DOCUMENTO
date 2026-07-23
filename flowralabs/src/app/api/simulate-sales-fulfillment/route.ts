import { NextRequest, NextResponse } from "next/server";
import { CJDropshippingService } from "@/lib/cj-api";
import { TikTokShopService } from "@/lib/tiktok-api";

export async function POST(req: NextRequest) {
  try {
    const cjService = new CJDropshippingService();
    const tiktokService = new TikTokShopService();

    // 1. Simular a captura de um pedido no TikTok Shop
    const orders = await tiktokService.getOrders("mock_token", "mock_shop_id");
    const sale = orders[0]; // Fone de Ouvido por Condução Óssea

    // 2. Executar cálculo financeiro real do pedido (Custo China vs Venda)
    const productPriceUSD = 9.50; // Custo do fone na fábrica da China
    const freightPriceUSD = 5.80; // Custo de envio CJ Packet para o Brasil
    const usdToBrlRate = 5.60;
    
    const financialReport = cjService.calculateUnitEconomics(
      productPriceUSD,
      freightPriceUSD,
      usdToBrlRate,
      40, // 40% margem desejada
      0.14 // 14% taxa TikTok/ML
    );

    // 3. Simular a requisição de criação de ordem automática (Fulfillment) na API da CJDropshipping
    // Em produção, aqui enviamos o JSON contendo os dados do destinatário e os itens para a API da CJ.
    const cjOrderMock = {
      cjOrderNumber: "CJ-2026-99081273",
      logisticName: "CJ Packet Ordinary",
      trackingNumber: "CJ987654321BR",
      shipToAddress: {
        name: sale.buyerName,
        address: sale.shippingAddress,
        country: "Brazil",
      },
      status: "PENDING_PAYMENT_ON_CHINA", // Próxima ação do lojista é pagar o custo de custo (R$ 123.38) no painel
    };

    return NextResponse.json({
      success: true,
      step1_tiktok_webhook: {
        message: "Pedido capturado do TikTok Shop",
        orderId: sale.orderId,
        buyer: sale.buyerName,
        address: sale.shippingAddress,
        valueReceivedBRL: sale.totalAmountBRL,
      },
      step2_financial_audit: {
        message: "Custo landed e impostos calculados pelo DropHunter Engine",
        landedCostWithTaxesBRL: financialReport.totalLandedCostWithTaxBRL,
        importTaxBRL: financialReport.importTaxBRL,
        icmsTaxBRL: financialReport.icmsTaxBRL,
        netProfitBRL: financialReport.netProfitBRL,
        profitMargin: `${financialReport.netMarginPercent}%`,
      },
      step3_cj_fulfillment: {
        message: "Ordem de despacho criada automaticamente na CJDropshipping (China)",
        cjOrderId: cjOrderMock.cjOrderNumber,
        tracking: cjOrderMock.trackingNumber,
        status: cjOrderMock.status,
      },
      payout_summary: {
        sellerRevenueBRL: sale.totalAmountBRL,
        costPaidToChinaBRL: financialReport.totalLandedCostWithTaxBRL,
        payoutProfitBRL: Number((sale.totalAmountBRL - financialReport.totalLandedCostWithTaxBRL - (sale.totalAmountBRL * 0.14)).toFixed(2)),
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
