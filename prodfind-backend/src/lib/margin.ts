// Cálculo de margem líquida com imposto de importação BR (MVP/simplificado).
// II 60% + ICMS por estado + taxa dos Correios. Ajustar conforme regra real.

export type MarginInput = {
  price: number; // preço de venda no ML
  cost: number; // custo do fornecedor (CJ/AliExpress)
  state?: string; // UF do comprador (p/ ICMS) — default "SP"
};

const II_RATE = 0.6; // Imposto de Importação (60% sobre o custo)
const CORREIOS_TAX = 0.6; // taxa dos Correios (simplificada, ~60% sobre o custo)

// Tabela simples de ICMS por estado (alíquota interna). Completar conforme necessário.
const ICMS_BY_STATE: Record<string, number> = {
  AC: 0.17, AL: 0.17, AP: 0.17, AM: 0.18, BA: 0.18, CE: 0.17, DF: 0.18,
  ES: 0.17, GO: 0.17, MA: 0.17, MT: 0.17, MS: 0.17, MG: 0.18, PA: 0.17,
  PB: 0.17, PR: 0.19, PE: 0.18, PI: 0.17, RJ: 0.20, RN: 0.18, RS: 0.17,
  RO: 0.17, RR: 0.17, SC: 0.17, SP: 0.18, SE: 0.17, TO: 0.17,
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcMargin({ price, cost, state = "SP" }: MarginInput) {
  const icms = ICMS_BY_STATE[state.toUpperCase()] ?? 0.17;
  const ii = cost * II_RATE;
  const icmsValue = (cost + ii) * icms;
  const correios = cost * CORREIOS_TAX;
  const tax = ii + icmsValue + correios;
  const net = price - cost - tax;
  const marginPct = price > 0 ? (net / price) * 100 : 0;

  return {
    imposto_importacao: round2(ii),
    icms: round2(icmsValue),
    taxa_correios: round2(correios),
    custo_total: round2(cost + tax),
    margem_liquida: round2(net),
    margem_pct: round2(marginPct),
  };
}
