/**
 * DropHunter AI — Módulo de Integração Mercado Livre API
 * Flowra Labs (2026)
 */

export interface MercadoLivreTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
}

export interface MercadoLivrePublishRequest {
  title: string;
  categoryId: string;
  price: number;
  availableQuantity: number;
  buyingMode: "buy_it_now";
  listingTypeId: "gold_special" | "gold_pro"; // Clássico ou Premium
  condition: "new";
  pictures: { source: string }[];
  description: string;
}

export class MercadoLivreService {
  private clientId: string;
  private clientSecret: string;
  private apiBaseUrl = "https://api.mercadolibre.com";

  constructor(clientId?: string, clientSecret?: string) {
    this.clientId = clientId || process.env.MERCADO_LIVRE_CLIENT_ID || "";
    this.clientSecret = clientSecret || process.env.MERCADO_LIVRE_CLIENT_SECRET || "";
  }

  /**
   * 1. URL de autorização para o lojista conectar sua conta do Mercado Livre Brasil (MLB)
   */
  getAuthorizationUrl(redirectUri: string): string {
    return `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  /**
   * 2. Troca o Authorization Code pelo Access Token do Mercado Livre
   */
  async getAccessToken(code: string, redirectUri: string): Promise<MercadoLivreTokenResponse> {
    if (!this.clientId || !this.clientSecret) {
      console.warn("[Mercado Livre API] Chaves não configuradas no .env. Retornando Mock.");
      return {
        accessToken: "mock_ml_access_token_mlb_12345",
        refreshToken: "mock_ml_refresh_token_mlb_67890",
        expiresIn: 21600, // 6 horas padrão do ML
        userId: "998877665",
      };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      const data = await response.json();
      if (!data.access_token) {
        throw new Error(data.message || "Erro ao obter token do Mercado Livre");
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        userId: String(data.user_id),
      };
    } catch (error) {
      console.error("[ML API Token Error]:", error);
      throw error;
    }
  }

  /**
   * 3. Busca termos mais procurados do Mercado Livre (Trends API) para otimização de SEO
   */
  async getTrendingKeywords(categoryId?: string): Promise<string[]> {
    try {
      const url = categoryId
        ? `${this.apiBaseUrl}/trends/MLB/${categoryId}`
        : `${this.apiBaseUrl}/trends/MLB`;
        
      const response = await fetch(url);
      const data = await response.json();
      
      // Retorna as top 10 palavras mais buscadas no ML Brasil
      return Array.isArray(data) ? data.slice(0, 10).map((item: any) => item.keyword) : [];
    } catch (error) {
      console.error("[ML Trends API Error]:", error);
      return ["fone bluetooth", "luminaria led", "massageador", "mini aspirador", "copo termico"];
    }
  }

  /**
   * 4. Publica um anúncio diretamente na conta do Mercado Livre do lojista
   */
  async publishItem(accessToken: string, item: MercadoLivrePublishRequest): Promise<string> {
    if (!this.clientId) {
      console.log("[Mercado Livre API] Modo simulação ativo. Item publicado com sucesso!");
      return "MLB-MOCK-123456789";
    }

    try {
      // 1. Criar o anúncio principal
      const response = await fetch(`${this.apiBaseUrl}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: item.title,
          category_id: item.categoryId,
          price: item.price,
          currency_id: "BRL",
          available_quantity: item.availableQuantity,
          buying_mode: item.buyingMode,
          listing_type_id: item.listingTypeId,
          condition: item.condition,
          pictures: item.pictures,
        }),
      });

      const data = await response.json();
      if (!data.id) {
        throw new Error(data.message || "Erro ao criar anúncio no Mercado Livre");
      }

      // 2. Anexar a descrição longa (o ML exige um endpoint separado para descrição)
      await fetch(`${this.apiBaseUrl}/items/${data.id}/description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          plain_text: item.description,
        }),
      });

      return data.id; // Retorna o ID oficial do anúncio do ML (ex: MLB382910)
    } catch (error) {
      console.error("[ML Publish Item Error]:", error);
      throw error;
    }
  }
}
