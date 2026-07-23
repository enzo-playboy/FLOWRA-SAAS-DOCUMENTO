import { CJDropshippingService } from "./src/lib/cj-api";
import { TikTokShopService } from "./src/lib/tiktok-api";

async function runSimulation() {
  console.log("=== INICIANDO SIMULAÇÃO DE LOGÍSTICA & VENDAS (FLOWRA LABS) ===\n");

  const cjService = new CJDropshippingService();
  const tiktokService = new TikTokShopService();

  // 1. Simular pedido capturado da loja do cliente no TikTok Shop
  console.log("📡 [ETAPA 1] Capturando novos pedidos pendentes no TikTok Shop...");
  const orders = await tiktokService.getOrders("mock_token", "mock_shop_id");
  const sale = orders[0];
  console.log(`✓ Pedido encontrado: ID ${sale.orderId}`);
  console.log(`👤 Comprador: ${sale.buyerName}`);
  console.log(`📍 Endereço de Envio: ${sale.shippingAddress}`);
  console.log(`💰 Valor Pago pelo Cliente: R$ ${sale.totalAmountBRL.toFixed(2)}\n`);

  // 2. Executar auditoria de custos e impostos da importação
  console.log("🔍 [ETAPA 2] Calculando custos na China e impostos brasileiros (Remessa Conforme)...");
  const productPriceUSD = 9.50;
  const freightPriceUSD = 5.80;
  const usdRate = 5.60;

  const financial = cjService.calculateUnitEconomics(
    productPriceUSD,
    freightPriceUSD,
    usdRate,
    40, // 40% margem desejada
    0.14 // 14% taxa plataforma
  );

  console.log(`• Custo do Produto na China: R$ ${financial.productCostBRL.toFixed(2)} ($9.50)`);
  console.log(`• Frete CJ Packet para o Brasil: R$ ${financial.freightCostBRL.toFixed(2)} ($5.80)`);
  console.log(`• Imposto de Importação (20%): R$ ${financial.importTaxBRL.toFixed(2)}`);
  console.log(`• ICMS Estadual (20.48% efetivo): R$ ${financial.icmsTaxBRL.toFixed(2)}`);
  console.log(`➡️ CUSTO LANDED FINAL (Total que o Lojista paga à fábrica): R$ ${financial.totalLandedCostWithTaxBRL.toFixed(2)}\n`);

  // 3. Simular despacho automático de ordem na fábrica na China
  console.log("📦 [ETAPA 3] Enviando ordem de despacho via API para a CJDropshipping China...");
  const trackingNumber = "CJ987654321BR";
  console.log(`✓ Ordem de compra criada com sucesso na CJ!`);
  console.log(`✓ Código de Rastreio dos Correios Gerado: ${trackingNumber}`);
  console.log(`✓ Status da Ordem: PENDENTE DE PAGAMENTO DO CUSTO (R$ ${financial.totalLandedCostWithTaxBRL.toFixed(2)})`);
  console.log(`✓ Fábrica notificada e aguardando liberação do envio.\n`);

  // 4. Fechamento de Caixa do lojista
  const platformFeeBRL = sale.totalAmountBRL * 0.14;
  const payoutProfitBRL = sale.totalAmountBRL - financial.totalLandedCostWithTaxBRL - platformFeeBRL;
  
  console.log("=== RELATÓRIO DO FECHAMENTO FINANCEIRO ===");
  console.log(`💵 Faturamento Bruto (Entrada na conta do Lojista): R$ ${sale.totalAmountBRL.toFixed(2)}`);
  console.log(`💸 Taxa da Plataforma (14%): - R$ ${platformFeeBRL.toFixed(2)}`);
  console.log(`💸 Custo Pago à Fábrica (CJ): - R$ ${financial.totalLandedCostWithTaxBRL.toFixed(2)}`);
  console.log(`🟢 LUCRO LÍQUIDO NO BOLSO DO SEU CLIENTE: R$ ${payoutProfitBRL.toFixed(2)} (${financial.netMarginPercent}% de margem pura)`);
  console.log("==========================================");
}

runSimulation();
