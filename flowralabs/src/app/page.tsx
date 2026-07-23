"use client";

import { useState } from "react";

export default function Home() {
  // Estado para o simulador interativo de lucros na própria Landing Page
  const [productCostUSD, setProductCostUSD] = useState<number>(10);
  const [freightCostUSD, setFreightCostUSD] = useState<number>(5);
  const usdRate = 5.60;

  // Cálculo ao vivo da Remessa Conforme + Lucro Lojista
  const totalCostUSD = productCostUSD + freightCostUSD;
  const costBRL = totalCostUSD * usdRate;
  const importTaxBRL = totalCostUSD <= 50 ? costBRL * 0.20 : (costBRL - 20 * usdRate) * 0.60;
  const icmsTaxBRL = ((costBRL + importTaxBRL) / (1 - 0.17)) * 0.17;
  const totalLandedBRL = costBRL + importTaxBRL + icmsTaxBRL;
  
  const suggestedSellPriceBRL = Number(((totalLandedBRL * 1.40) / (1 - 0.14)).toFixed(2));
  const mlFeeBRL = Number((suggestedSellPriceBRL * 0.14).toFixed(2));
  const netProfitBRL = Number((suggestedSellPriceBRL - totalLandedBRL - mlFeeBRL).toFixed(2));
  const marginPercent = Number(((netProfitBRL / suggestedSellPriceBRL) * 100).toFixed(1));

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500 selection:text-white font-sans antialiased">
      {/* ----------------- NAV ----------------- */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20">
              DH
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">DropHunter <span className="text-orange-500">AI</span></span>
              <span className="block text-[10px] text-zinc-500 -mt-1 font-mono">by Flowra Labs</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium">
            <a href="#como-funciona" className="hover:text-white transition">Como Funciona</a>
            <a href="#simulador" className="hover:text-white transition">Simulador de Margem</a>
            <a href="#precos" className="hover:text-white transition">Preços</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>

          <a
            href="#precos"
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 transition shadow-lg shadow-orange-500/20"
          >
            Começar Agora &rarr;
          </a>
        </div>
      </header>

      {/* ----------------- HERO (Gitness Style) ----------------- */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative overflow-hidden">
        {/* Glow ambient de fundo */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Lado Esquerdo: Título & CTA */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Sincronizado com Mercado Livre, TikTok Shop & Shopee
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
              Garimpo inteligente & despacho <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">automático com IA</span>
            </h1>

            <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
              Conecte sua loja às maiores fábricas da China. O DropHunter AI encontra produtos virais, calcula tributos da Remessa Conforme e despacha pedidos sem você tocar em caixas.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <a
                href="#precos"
                className="px-8 py-4 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600 transition text-center shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2"
              >
                Testar Grátis Agora <span>&rarr;</span>
              </a>
              <a
                href="#simulador"
                className="px-8 py-4 rounded-xl font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition text-center"
              >
                Simular Lucro Líquido
              </a>
            </div>

            <div className="pt-6 border-t border-zinc-900 flex items-center gap-6 text-xs text-zinc-500 font-mono">
              <span>✓ Sem taxa de configuração</span>
              <span>✓ Suporte oficial Brasil</span>
              <span>✓ Fator R 6% Simples</span>
            </div>
          </div>

          {/* Lado Direito: Status Pills Flutuantes (Gitness Style) */}
          <div className="relative space-y-4">
            {/* Trilha decorativa brilhante */}
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent rounded-3xl pointer-events-none" />

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-2xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-zinc-500 border-b border-zinc-900 pb-2">
                <span>EVENTOS EM TEMPO REAL</span>
                <span className="text-emerald-400">● LIVE ENGINE</span>
              </div>

              {/* Status Pill 1 */}
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between hover:border-orange-500/50 transition">
                <div className="flex items-center gap-3">
                  <span className="text-base">⚡</span>
                  <div>
                    <div className="text-white font-medium">Fone Condução Óssea Encontrado</div>
                    <div className="text-zinc-500 text-[11px]">Fábrica China · Frete 8 dias</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-bold">
                  42% Margem
                </span>
              </div>

              {/* Status Pill 2 */}
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between hover:border-orange-500/50 transition">
                <div className="flex items-center gap-3">
                  <span className="text-base">✨</span>
                  <div>
                    <div className="text-white font-medium">Anúncio SEO Gerado</div>
                    <div className="text-zinc-500 text-[11px]">Mercado Livre & TikTok Shop</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 font-bold">
                  Publicado
                </span>
              </div>

              {/* Status Pill 3 */}
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between hover:border-orange-500/50 transition">
                <div className="flex items-center gap-3">
                  <span className="text-base">📦</span>
                  <div>
                    <div className="text-white font-medium">Pedido Despachado Automático</div>
                    <div className="text-zinc-500 text-[11px]">Cliente em São Paulo / SP</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 font-bold">
                  Rastreio OK
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- LOGOS DE INTEGRAÇÃO ----------------- */}
      <section className="py-12 border-y border-zinc-900 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-8">
            INTEGRADO ÀS MAIORES PLATAFORMAS DE VENDA E FULFILLMENT
          </p>
          <div className="flex flex-wrap justify-center items-center gap-10 opacity-70 grayscale hover:grayscale-0 transition duration-300">
            <span className="text-lg font-bold tracking-wider font-mono">MERCADO LIVRE</span>
            <span className="text-lg font-bold tracking-wider font-mono">TIKTOK SHOP</span>
            <span className="text-lg font-bold tracking-wider font-mono">SHOPEE</span>
            <span className="text-lg font-bold tracking-wider font-mono">CJDROPSHIPPING</span>
            <span className="text-lg font-bold tracking-wider font-mono">OPENAI / GEMINI</span>
          </div>
        </div>
      </section>

      {/* ----------------- SIMULADOR INTERATIVO DE MARGEM ----------------- */}
      <section id="simulador" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <span className="text-xs font-mono text-orange-400 uppercase tracking-widest">Motor Fiscal ao Vivo</span>
          <h2 className="text-3xl font-bold">Simulador de Margem & Remessa Conforme</h2>
          <p className="text-zinc-400 text-sm">Teste como nossa IA calcula custos na China, impostos de importação e seu lucro final em R$.</p>
        </div>

        <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 grid md:grid-cols-2 gap-8 shadow-2xl">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-2">CUSTO PRODUTO CHINA (USD)</label>
              <input
                type="number"
                value={productCostUSD}
                onChange={(e) => setProductCostUSD(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-2">FRETE EXPEDIDO CHINA &rarr; BR (USD)</label>
              <input
                type="number"
                value={freightCostUSD}
                onChange={(e) => setFreightCostUSD(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="text-xs text-zinc-500 font-mono space-y-1">
              <div>Cotação Dólar: R$ 5,60</div>
              <div>Taxa do Marketplace: 14% (Mercado Livre / Shopee)</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex flex-col justify-between font-mono">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Custo com Frete (BRL):</span>
                <span>R$ {costBRL.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Imposto Importação (20%):</span>
                <span className="text-amber-400">R$ {importTaxBRL.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">ICMS Estadual (Efetivo 20.48%):</span>
                <span className="text-amber-400">R$ {icmsTaxBRL.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2 text-white font-bold">
                <span>Custo Total no Brasil:</span>
                <span>R$ {totalLandedBRL.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2 text-orange-400 font-bold">
                <span>Preço Venda Sugerido:</span>
                <span>R$ {suggestedSellPriceBRL.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-500">LUCRO LÍQUIDO</div>
                <div className="text-2xl font-bold text-emerald-400">R$ {netProfitBRL.toFixed(2)}</div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                {marginPercent}% Margem
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- PREÇOS ----------------- */}
      <section id="precos" className="py-20 px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-12 space-y-3">
          <span className="text-xs font-mono text-orange-400 uppercase tracking-widest">Planos Transparentes</span>
          <h2 className="text-3xl font-bold">Escale sua operação de Dropshipping</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Starter */}
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-6">
            <div>
              <h3 className="text-xl font-bold">Plano Starter</h3>
              <p className="text-zinc-400 text-xs mt-1">Ideal para quem está validando a loja no Mercado Livre</p>
            </div>
            <div className="text-4xl font-bold">
              R$ 97 <span className="text-sm font-normal text-zinc-500">/ mês</span>
            </div>
            <ul className="space-y-3 text-xs text-zinc-300 font-mono">
              <li>✓ 100 Créditos de IA por mês</li>
              <li>✓ Garimpo com cotação de frete ao vivo</li>
              <li>✓ Integração Mercado Livre & Shopee</li>
              <li>✓ Cálculo de Remessa Conforme Automático</li>
            </ul>
            <button className="w-full py-3.5 rounded-xl font-semibold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition">
              Assinar Plano Starter
            </button>
          </div>

          {/* Gestor Pro */}
          <div className="p-8 rounded-3xl bg-zinc-950 border-2 border-orange-500 relative space-y-6 shadow-2xl shadow-orange-500/10">
            <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-orange-500 text-[10px] font-bold uppercase tracking-wider">
              RECOMENDADO
            </span>
            <div>
              <h3 className="text-xl font-bold">Plano Gestor Pro</h3>
              <p className="text-zinc-400 text-xs mt-1">Para lojistas avançados e gestores de e-commerce</p>
            </div>
            <div className="text-4xl font-bold text-orange-500">
              R$ 197 <span className="text-sm font-normal text-zinc-500">/ mês</span>
            </div>
            <ul className="space-y-3 text-xs text-zinc-300 font-mono">
              <li>✓ Créditos de IA Ilimitados</li>
              <li>✓ Estúdio Claude & Gemini para Copys SEO</li>
              <li>✓ Integração Mercado Livre, TikTok Shop & Shopee</li>
              <li>✓ Fulfillment 100% Automático via API</li>
              <li>✓ Suporte VIP via WhatsApp</li>
            </ul>
            <button className="w-full py-3.5 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600 transition shadow-lg shadow-orange-500/20">
              Assinar Plano Gestor Pro
            </button>
          </div>
        </div>
      </section>

      {/* ----------------- FOOTER ----------------- */}
      <footer className="py-8 border-t border-zinc-900 text-center text-xs text-zinc-600 font-mono">
        <p>© 2026 Flowra Labs — DropHunter AI. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
