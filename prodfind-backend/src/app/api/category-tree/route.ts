import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/withRateLimit";

// Descobre/busca categorias do Mercado Livre para o usuário apontar o nicho.
//   GET /api/category-tree            -> 32 categorias topo
//   GET /api/category-tree?id=MLB1051 -> filhos da categoria (drill-down)
//   GET /api/category-tree?q=celular  -> busca por nome (topo + filhos diretos, cacheado)
//
// Metadados de categoria são PÚBLICOS (não exigem token). O único endpoint que
// lista as tops (/sites/MLB/categories) exige token, por isso as 32 tops estão
// embutidas aqui e os filhos vêm de /categories/{id} (público). Assim o
// category-tree funciona sem nenhuma credencial do ML.

const UA = "ProdFind/1.0 (+https://prodfind.com.br)";
const API = "https://api.mercadolibre.com";

// 32 categorias topo do MLB (estáveis). Fonte: /sites/MLB/categories.
const TOP_CATEGORIES: { id: string; name: string }[] = [
  { id: "MLB5672", name: "Acessórios para Veículos" },
  { id: "MLB271599", name: "Agro" },
  { id: "MLB1403", name: "Alimentos e Bebidas" },
  { id: "MLB1071", name: "Animais" },
  { id: "MLB1367", name: "Antiguidades e Coleções" },
  { id: "MLB1368", name: "Arte, Papelaria e Armarinho" },
  { id: "MLB1384", name: "Bebês" },
  { id: "MLB1246", name: "Beleza e Cuidado Pessoal" },
  { id: "MLB1132", name: "Brinquedos e Hobbies" },
  { id: "MLB1430", name: "Calçados, Roupas e Bolsas" },
  { id: "MLB1039", name: "Câmeras e Acessórios" },
  { id: "MLB1743", name: "Carros, Motos e Outros" },
  { id: "MLB1574", name: "Casa, Móveis e Decoração" },
  { id: "MLB1051", name: "Celulares e Telefones" },
  { id: "MLB1500", name: "Construção" },
  { id: "MLB5726", name: "Eletrodomésticos" },
  { id: "MLB1000", name: "Eletrônicos, Áudio e Vídeo" },
  { id: "MLB1276", name: "Esportes e Fitness" },
  { id: "MLB263532", name: "Ferramentas" },
  { id: "MLB12404", name: "Festas e Lembrancinhas" },
  { id: "MLB1144", name: "Games" },
  { id: "MLB1459", name: "Imóveis" },
  { id: "MLB1499", name: "Indústria e Comércio" },
  { id: "MLB1648", name: "Informática" },
  { id: "MLB218519", name: "Ingressos" },
  { id: "MLB1182", name: "Instrumentos Musicais" },
  { id: "MLB3937", name: "Joias e Relógios" },
  { id: "MLB1196", name: "Livros, Revistas e Comics" },
  { id: "MLB1168", name: "Música, Filmes e Seriados" },
  { id: "MLB264586", name: "Saúde" },
  { id: "MLB1540", name: "Serviços" },
  { id: "MLB1953", name: "Mais Categorias" },
];

type CatNode = { id: string; name: string; hasChildren: boolean; parentId: string | null };
let treeCache: { at: number; nodes: CatNode[] } | null = null;

async function mlFetch(path: string) {
  const res = await fetch(API + path, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`ML ${res.status} ${path}`);
  return res.json();
}

// topo (embutido) + filhos diretos (públicos). Cobre a maioria dos nichos.
async function getTree2(): Promise<CatNode[]> {
  if (treeCache && Date.now() - treeCache.at < 24 * 3600 * 1000) return treeCache.nodes;
  const lists = await Promise.all(
    TOP_CATEGORIES.map((t) =>
      mlFetch(`/categories/${t.id}`)
        .then((c: any) => ({ parent: t, kids: c.children_categories || [] }))
        .catch(() => ({ parent: t, kids: [] as any[] }))
    )
  );
  const nodes: CatNode[] = [];
  for (const { parent, kids } of lists) {
    nodes.push({ id: parent.id, name: parent.name, hasChildren: kids.length > 0, parentId: null });
    for (const k of kids) {
      nodes.push({ id: k.id, name: k.name, hasChildren: false, parentId: parent.id });
    }
  }
  treeCache = { at: Date.now(), nodes };
  return nodes;
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const blocked = await enforceRateLimit("trending", req);
  if (blocked) return blocked;

  const id = req.nextUrl.searchParams.get("id");
  const q = req.nextUrl.searchParams.get("q")?.trim();

  try {
    // drill-down: filhos da categoria (público)
    if (id) {
      const cat = await mlFetch(`/categories/${encodeURIComponent(id)}`);
      const children = (cat.children_categories || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        hasChildren: !!(c.children_categories && c.children_categories.length),
      }));
      const path = cat.path_from_root || [];
      return NextResponse.json({
        id: cat.id,
        name: cat.name,
        path: path.map((p: any) => ({ id: p.id, name: p.name })),
        hasChildren: children.length > 0,
        children,
      });
    }

    // busca por nome (topo + filhos diretos, cacheado em memória 24h)
    if (q) {
      const nodes = await getTree2();
      const term = q.toLowerCase();
      const matches = nodes
        .filter((n) => n.name.toLowerCase().includes(term))
        .slice(0, 20);
      return NextResponse.json({ query: q, matches });
    }

    // sem params: 32 categorias topo
    return NextResponse.json({ categories: TOP_CATEGORIES });
  } catch (e: any) {
    return NextResponse.json(
      { error: "falha ao consultar categorias do ML", detail: String(e?.message || e) },
      { status: 502 }
    );
  }
}
