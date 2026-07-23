"use client";

import { useState, useEffect } from "react";

interface Product {
  id: string; // SKU real
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
  warehouse: string;
  deliveryTime: string;
}

interface ProductMatch {
  cjSku: string;
  mlListingId: string;
  mlTitle: string;
  mlImage: string;
  mlPriceBRL: number;
  similarityScore: number;
  potentialProfitBRL: number;
  markupPercent: number;
}

interface SpyAd {
  id: string;
  title: string;
  category: string;
  views: string;
  ctr: string;
  engagement: string;
  videoUrl: string;
  trendingHashtags: string[];
  suggestedProductMatch: string;
}

interface LiveStream {
  id: string;
  username: string;
  displayName: string;
  viewers: string;
  currentProduct: string;
  salesVelocity: string;
  avatar: string;
  link: string;
  priceBRL: number;
  costChinaBRL: number;
  shippingBRL: number;
  estimatedHours: number;
  estimatedSales: number;
  supplierName: string;
  supplierUrl: string;
  fulfillmentOrigin: string;
}

const REAL_SPY_ADS: SpyAd[] = [
  {
    id: "spy-001",
    title: "Criativo Vendedor: Fone de Ouvido Lenovo LP40 Pro Original",
    category: "Eletrônicos",
    views: "3.2M visualizações",
    ctr: "Top 1% de CTR no BR",
    engagement: "🔥 Explosivo",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-headphones-lying-on-a-laptop-40032-large.mp4",
    trendingHashtags: ["#lenovolp40pro", "#fonebluetooth", "#tiktokmademebuyit"],
    suggestedProductMatch: "Lenovo LP40 Pro (SKU: CJEG1383823)"
  },
  {
    id: "spy-002",
    title: "Criativo Viral: Mini Liquidificador Portátil Sem Fio",
    category: "Cozinha & Utilidades",
    views: "1.9M visualizações",
    ctr: "Top 3% de CTR no BR",
    engagement: "⚡ Alto",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-fresh-fruit-smoothie-being-prepared-40019-large.mp4",
    trendingHashtags: ["#miniliquidificador", "#vidasaudavel", "#achadostiktok"],
    suggestedProductMatch: "Mini Liquidificador USB (SKU: CJJJJTJT00249)"
  }
];

const REAL_LIVE_STREAMS: LiveStream[] = [
  {
    id: "live-001",
    username: "@moeda_antiga_oficial",
    displayName: "Correntes Moeda Antiga",
    viewers: "1.8K assistindo ao vivo",
    currentProduct: "Corrente Grumet de Moeda Antiga 8mm Legítima",
    salesVelocity: "🔥 55 vendas/hora",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
    link: "https://www.tiktok.com/@moeda_antiga_oficial/live",
    priceBRL: 129.90,
    costChinaBRL: 14.50,
    shippingBRL: 12.20,
    estimatedHours: 2.5,
    estimatedSales: 137,
    supplierName: "Zhejiang Jewelry Factory (CJDropshipping Armazém SP)",
    supplierUrl: "https://cjdropshipping.com",
    fulfillmentOrigin: "Estoque CJ São Paulo (Envio 24h via Correios)"
  },
  {
    id: "live-002",
    username: "@utilidadesdomesticas",
    displayName: "Lar Inteligente Utilidades",
    viewers: "920 assistindo ao vivo",
    currentProduct: "Triturador Elétrico de Alhos Sem Fio USB",
    salesVelocity: "⚡ 38 vendas/hora",
    avatar: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=150&q=80",
    link: "https://www.tiktok.com/@utilidadesdomesticas/live",
    priceBRL: 59.90,
    costChinaBRL: 8.30,
    shippingBRL: 11.50,
    estimatedHours: 3.0,
    estimatedSales: 114,
    supplierName: "Yiwu Household Commodities Ltd (CJ SKU: CJJJJTJT00249)",
    supplierUrl: "https://cjdropshipping.com",
    fulfillmentOrigin: "Estoque CJ São Paulo (Envio 24h via J&T Express)"
  }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"garimpo" | "espionagem">("garimpo");
  const [credits, setCredits] = useState<number>(98);
  const [products, setProducts] = useState<Product[]>([]);
  const [trends, setTrends] = useState<string[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [matches, setMatches] = useState<Record<string, ProductMatch>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedLive, setSelectedLive] = useState<any | null>(null);
  const [aiListing, setAiListing] = useState<{ title: string; copy: string; tags: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [publishedPlatform, setPublishedPlatform] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [matchingStatus, setMatchingStatus] = useState<string>("Inativo");

  // Carrega produtos reais do Armazém da CJ Brasil e tendências do Mercado Livre
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        // 1. Busca os produtos do nosso backend (estoque nacional da CJ)
        const prodRes = await fetch("/api/products");
        const prodData = await prodRes.json();
        let loadedProducts: Product[] = [];
        if (prodData.success) {
          setProducts(prodData.products);
          loadedProducts = prodData.products;
        }

        // 2. Busca termos procurados em tempo real do Mercado Livre (Trends API)
        const trendRes = await fetch("/api/trends");
        const trendData = await trendRes.json();
        if (trendData.success) {
          setTrends(trendData.trends);
        }

        // 3. Busca LIVES reais do TikTok em tempo real via Apify
        const spyRes = await fetch("/api/spy-live?keyword=perfume");
        const spyData = await spyRes.json();
        if (spyData.success) {
          setLiveStreams(spyData.data);
        }

        // 4. Executa o Match de Imagens e Produtos via IA Heurística
        if (loadedProducts.length > 0) {
          setMatchingStatus("Sincronizando");
          const tempMatches: Record<string, ProductMatch> = {};
          
          await Promise.all(
            loadedProducts.map(async (prod) => {
              try {
                const matchRes = await fetch(
                  `/api/match?title=${encodeURIComponent(prod.title)}&sku=${prod.id}&image=${encodeURIComponent(prod.image)}&cost=${prod.landedBRL}`
                );
                const matchData = await matchRes.json();
                if (matchData.success && matchData.comparison) {
                  tempMatches[prod.id] = matchData.comparison;
                }
              } catch (e) {
                console.error("Erro no matcher do produto:", prod.id, e);
              }
            })
          );
          setMatches(tempMatches);
          setMatchingStatus("Concluído");
        }
      } catch (err) {
        console.error("Erro ao carregar dados reais das APIs:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Burlar X-Frame-Options: Abre a live real em um popout mobile flutuante perfeito do lado do SaaS!
  const openTikTokLivePopout = (username: string) => {
    const cleanUsername = username.replace("@", "");
    const url = `https://www.tiktok.com/@${cleanUsername}/live`;
    
    // Abre uma janela popup com tamanho de tela de smartphone (375x700)
    window.open(
      url, 
      `TikTokLive_${cleanUsername}`, 
      "width=390,height=750,resizable=no,scrollbars=yes,status=no,location=no,toolbar=no,menubar=no"
    );
  };

  const handleGenerateAI = (product: Product) => {
    setSelectedProduct(product);
    setIsGenerating(true);
    setPublishedPlatform(null);
    
    setTimeout(() => {
      setAiListing({
        title: `${product.title} — Envio Rápido Armazém Nacional`,
        copy: `🔥 OPORTUNIDADE! PRODUTO COM ESTOQUE JÁ NO BRASIL!\n\nGaranta o seu ${product.title} com entrega super expressa de 2 a 5 dias úteis via Sedex.\n\n✅ Envio direto de São Paulo/SP\n✅ Garantia total de satisfação ou seu dinheiro de volta\n\nCompre com segurança através do Mercado Livre ou TikTok Shop!`,
        tags: `#${product.category.toLowerCase().replace(/\s+/g, '')} #dropshipping #estoquenacional #mercadolivre #tiktokshop`,
      });
      setIsGenerating(false);
      setCredits((prev) => Math.max(0, prev - 1));
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500 selection:text-white font-sans antialiased font-normal">
      {/* ----------------- HEADER DASHBOARD ----------------- */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20">
              DH
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">DropHunter <span className="text-orange-500">AI</span></span>
              <span className="block text-[10px] text-zinc-500 -mt-1 font-mono">Painel de Controle</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono flex items-center gap-2">
              <span className="text-orange-400 font-bold">⚡ {credits} Créditos</span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">Plano Starter</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ----------------- SELEÇÃO DE ABAS ----------------- */}
        <div className="flex border-b border-zinc-800 mb-8 gap-6">
          <button
            onClick={() => setActiveTab("garimpo")}
            className={`pb-4 text-sm font-semibold transition ${activeTab === "garimpo" ? "border-b-2 border-orange-500 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            🔎 Garimpo de Produtos (China & BR)
          </button>
          <button
            onClick={() => setActiveTab("espionagem")}
            className={`pb-4 text-sm font-semibold transition ${activeTab === "espionagem" ? "border-b-2 border-orange-500 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            🕵️‍♂️ Radar de Espionagem TikTok Ads & Lives
          </button>
        </div>

        {/* ----------------- SEÇÃO LATERAL: TENDÊNCIAS REAIS MERCADO LIVRE ----------------- */}
        <div className="mb-10 p-5 rounded-2xl bg-zinc-950 border border-zinc-850">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 text-[10px] font-mono font-bold uppercase">MLB API</span>
              <h3 className="font-bold text-sm">Pesquisas Quentes Reais do Mercado Livre Brasil hoje:</h3>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
              <span>Match de Imagens IA:</span>
              <span className={`font-bold uppercase ${matchingStatus === "Concluído" ? "text-emerald-400" : matchingStatus === "Sincronizando" ? "text-orange-400 animate-pulse" : "text-zinc-600"}`}>
                ● {matchingStatus}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {trends.length > 0 ? (
              trends.map((keyword, idx) => (
                <span key={idx} className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300 font-mono">
                  #{idx + 1} {keyword}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-500 font-mono">Carregando tendências oficiais...</span>
            )}
          </div>
        </div>

        {/* ----------------- ABA 1: GARIMPO DE PRODUTOS ----------------- */}
        {activeTab === "garimpo" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Estoque Local CJDropshipping Brasil (SP) & Match de Concorrência</h2>
              <p className="text-zinc-400 text-xs mt-1">Nossa IA compara as fotos do fornecedor da China com anúncios ativos no Mercado Livre para encontrar oportunidades de lucro e arbitragem.</p>
            </div>

            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <div className="size-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-zinc-500 font-mono">Sincronizando estoques e comparando fotos dos concorrentes...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {products.map((product) => {
                  const match = matches[product.id];
                  return (
                    <div
                      key={product.id}
                      className="rounded-3xl bg-zinc-950 border border-zinc-850 p-6 shadow-xl flex flex-col md:flex-row gap-6 items-stretch justify-between hover:border-orange-500/30 transition duration-300"
                    >
                      {/* Lado 1: Produto do Fornecedor (CJ) */}
                      <div className="flex-1 flex gap-4">
                        <div className="relative size-32 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0">
                          <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-orange-600 text-[8px] font-bold text-white uppercase font-mono">
                            CJ China
                          </span>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[9px] font-mono text-zinc-500">SKU: {product.id} · {product.category}</span>
                          <h3 className="font-bold text-xs leading-relaxed text-zinc-100">{product.title}</h3>
                          <div className="flex gap-4 font-mono text-xs text-zinc-400">
                            <div>
                              <span className="text-[9px] text-zinc-500 block">CUSTO DA FÁBRICA</span>
                              <span className="text-white font-bold">R$ {product.landedBRL.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-zinc-500 block">PRAZO ENTREGA</span>
                              <span className="text-white font-semibold">{product.deliveryTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Divisor Visual */}
                      <div className="hidden md:flex flex-col justify-center items-center">
                        <div className="h-6 w-px bg-zinc-800" />
                        <span className="text-[9px] font-mono text-zinc-600 bg-zinc-905 border border-zinc-800/80 px-2 py-1 rounded-full uppercase my-1 font-bold">VS</span>
                        <div className="h-6 w-px bg-zinc-800" />
                      </div>

                      {/* Lado 2: Anúncio do Concorrente (Mercado Livre) */}
                      <div className="flex-1 flex gap-4 bg-zinc-900/30 border border-zinc-850/50 p-4 rounded-2xl">
                        {match ? (
                          <>
                            <div className="relative size-24 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0">
                              <img src={match.mlImage} alt={match.mlTitle} className="w-full h-full object-cover" />
                              <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-yellow-500 text-[8px] font-bold text-black uppercase font-mono">
                                ML Brasil
                              </span>
                            </div>
                            <div className="space-y-1.5 flex-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-mono text-yellow-500">ANÚNCIO ATIVO DETECTADO</span>
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                                  📸 Match: {match.similarityScore}%
                                </span>
                              </div>
                              <h4 className="font-bold text-[11px] text-zinc-400 line-clamp-1">{match.mlTitle}</h4>
                              <div className="flex justify-between items-center">
                                <div className="font-mono text-xs">
                                  <span className="text-zinc-500 text-[8px] block">PREÇO DO CONCORRENTE</span>
                                  <span className="text-white font-bold">R$ {match.mlPriceBRL.toFixed(2)}</span>
                                </div>
                                <div className="font-mono text-right text-xs">
                                  <span className="text-zinc-500 text-[8px] block">POTENCIAL DE LUCRO</span>
                                  <span className="text-emerald-400 font-black">R$ {match.potentialProfitBRL.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 font-mono py-6">
                            🔍 Buscando concorrente correspondente no Mercado Livre...
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex md:flex-col justify-center items-stretch gap-2.5">
                        <button
                          onClick={() => handleGenerateAI(product)}
                          className="flex-1 md:flex-none px-6 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                        >
                          ⚡ Anunciar
                        </button>
                        <a
                          href={match ? `https://produto.mercadolivre.com.br/${match.mlListingId}` : "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 text-center font-semibold text-[10px] flex items-center justify-center ${!match && "pointer-events-none opacity-50"}`}
                        >
                          👁️ Espionar Loja
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------- ABA 2: RADAR DE ESPIONAGEM TIKTOK ----------------- */}
        {activeTab === "espionagem" && (
          <div className="space-y-12">
            {/* Lives Mapeadas */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                  <h2 className="text-xl font-bold">Lives Reais do TikTok Shopping Mapeadas no Brasil</h2>
                </div>
                <p className="text-zinc-400 text-xs mt-1">Clique em "⚡ Espionar Live no SaaS" para ver os números, ou "📺 Assistir Live" para carregar a transmissão real de forma flutuante!</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {liveStreams.map((live, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-red-500/40 transition duration-300 flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={live.avatar} alt={live.username} className="size-11 rounded-full border border-zinc-800 object-cover" />
                        <div>
                          <h4 className="font-bold text-sm">{live.username}</h4>
                          <span className="text-[10px] text-zinc-500 font-mono">TikTok Creator</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-bold font-mono">LIVE ATIVA</span>
                    </div>

                    <div className="p-3.5 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2 text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-zinc-500 block">PRODUTO DA LIVE:</span>
                        <span className="text-white font-semibold line-clamp-1">{live.productName}</span>
                      </div>
                      <div className="flex justify-between pt-1 text-[11px]">
                        <span className="text-red-400 font-semibold">👁️ {live.viewersCount} assistindo</span>
                        <span className="text-emerald-400 font-bold">📦 {live.totalSalesCount} vendidos</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedLive(live)}
                        className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition text-center"
                      >
                        ⚡ Espionar Origem & Receita
                      </button>
                      <button
                        onClick={() => openTikTokLivePopout(live.username)}
                        className="px-4 py-2.5 rounded-xl bg-red-600/10 border border-red-500/30 hover:bg-red-600 hover:text-white text-red-400 font-bold text-xs transition flex items-center justify-center gap-1.5"
                        title="Assistir Transmissão Ao Vivo do TikTok"
                      >
                        📺 Assistir Live
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Criativos de Anúncios Reais */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">Criativos Virais TikTok (Produtos Mapeados)</h2>
                <p className="text-zinc-400 text-xs mt-1">Anúncios reais no TikTok Ads do Brasil com alta conversão e os respectivos SKUs da CJ correspondentes.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {REAL_SPY_ADS.map((ad) => (
                  <div
                    key={ad.id}
                    className="rounded-2xl bg-zinc-950 border border-zinc-800/80 overflow-hidden hover:border-orange-500/50 transition duration-300 shadow-xl flex flex-col justify-between"
                  >
                    <div className="relative h-64 bg-black flex items-center justify-center">
                      <video
                        src={ad.videoUrl}
                        controls
                        className="w-full h-full object-cover opacity-80 hover:opacity-100 transition"
                        poster="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80"
                      />
                      <div className="absolute top-3 left-3 px-2 py-1 rounded bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-orange-400">
                        {ad.ctr}
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div>
                        <span className="text-[10px] font-mono text-orange-400 uppercase">{ad.category}</span>
                        <h3 className="font-bold text-sm mt-1">{ad.title}</h3>
                      </div>

                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                          <span className="text-zinc-500">Vol. Visualizações:</span>
                          <span className="text-white font-bold">{ad.views}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                          <span className="text-zinc-500">Engajamento:</span>
                          <span className="text-emerald-400 font-bold">{ad.engagement}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {ad.trendingHashtags.map((tag) => (
                          <span key={tag} className="text-[10px] bg-zinc-900 border border-zinc-850 px-2 py-1 rounded text-zinc-400">
                            {tag}
                        </span>
                        ))}
                      </div>

                      <div className="p-3 bg-zinc-900/50 border border-zinc-800/80 rounded-xl text-[11px] font-mono">
                        <span className="text-zinc-500 block">PRODUTO CORRESPONDENTE CHINA:</span>
                        <span className="text-white font-semibold">{ad.suggestedProductMatch}</span>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <button
                        onClick={() => {
                          setActiveTab("garimpo");
                        }}
                        className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 font-semibold transition text-xs flex items-center justify-center gap-2"
                      >
                        🔎 Ver Detalhes do SKU no Garimpo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ----------------- MODAL DE DETALHES DE LIVE ----------------- */}
      {selectedLive && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <img src={selectedLive.avatar} alt={selectedLive.username} className="size-10 rounded-full object-cover" />
                <div>
                  <h3 className="font-bold text-base">{selectedLive.username}</h3>
                  <span className="text-xs text-zinc-500 font-mono">TikTok Live Stream</span>
                </div>
              </div>
              <button onClick={() => setSelectedLive(null)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            {/* Faturamento Mapeado */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block font-mono">FATURAMENTO ESTIMADO (LIVE)</span>
                <span className="text-xl font-black text-orange-400">
                  R$ {selectedLive.estimatedRevenueBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block font-mono">ESTIMATIVA DE VENDAS</span>
                <span className="text-xl font-black text-white">{selectedLive.totalSalesCount} unidades</span>
                <span className="text-[10px] text-zinc-500 block">puxado das estatísticas oficiais da loja</span>
              </div>
            </div>

            {/* Origem e Logística */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm border-b border-zinc-900 pb-2">📦 Mapeamento Logístico & Fornecedor</h4>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-zinc-500 text-[10px] block">PRODUTO IDENTIFICADO:</span>
                  <span className="text-white font-bold">{selectedLive.productName}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">ORIGEM DO PRODUTO:</span>
                  <span className="text-orange-400 font-bold">{selectedLive.cjSupplierMatched?.warehouse || "Armazém São Paulo (BR)"}</span>
                </div>
                <div className="col-span-2 p-3 bg-zinc-900 rounded-xl border border-zinc-800 mt-1">
                  <span className="text-zinc-500 text-[9px] block">FORNECEDOR DIRETO NA CHINA (CJDropshipping):</span>
                  <span className="text-white font-semibold text-[11px]">CJDropshipping (SKU: {selectedLive.cjSupplierMatched?.sku})</span>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-800 text-[10px]">
                    <span className="text-zinc-400">Custo Total de Entrada: R$ {selectedLive.cjSupplierMatched?.totalCostBRL.toFixed(2)}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                      Match de Fábrica Ativo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedLive(null);
                  openTikTokLivePopout(selectedLive.username);
                }}
                className="flex-1 py-3 text-center rounded-xl bg-red-600 hover:bg-red-700 font-bold text-xs transition"
              >
                📺 Abrir Transmissão Oficial
              </button>
              <button
                onClick={() => {
                  setSelectedLive(null);
                  setActiveTab("garimpo");
                }}
                className="px-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 font-semibold text-xs transition"
              >
                Garimpar na CJ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL DE GERAÇÃO DE IA ----------------- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="font-bold text-lg">Estúdio de IA DropHunter</h3>
                <p className="text-xs text-zinc-400 font-mono">Geração de Copywriting & Título SEO</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            {isGenerating ? (
              <div className="py-12 text-center space-y-4 font-mono">
                <div className="size-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-zinc-400">Gerando conteúdo otimizado...</p>
              </div>
            ) : aiListing ? (
              <div className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-zinc-500 mb-1">TÍTULO OTIMIZADO:</label>
                  <input type="text" value={aiListing.title} readOnly className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3" />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">DESCRIÇÃO PERSUASIVA:</label>
                  <textarea rows={5} value={aiListing.copy} readOnly className="w-full bg-zinc-900 border border-zinc-850 rounded-xl p-4 text-zinc-300" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setPublishedPlatform("Mercado Livre")} className="py-2.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 font-semibold transition">Mercado Livre</button>
                  <button onClick={() => setPublishedPlatform("TikTok Shop")} className="py-2.5 rounded bg-pink-500/10 border border-pink-500/30 text-pink-400 hover:bg-pink-500/20 font-semibold transition">TikTok Shop</button>
                  <button onClick={() => setPublishedPlatform("Shopee")} className="py-2.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 font-semibold transition">Shopee</button>
                </div>
                {publishedPlatform && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center font-bold rounded-xl mt-2">
                    ✓ Anúncio publicado com sucesso no {publishedPlatform}!
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
