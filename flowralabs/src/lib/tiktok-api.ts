/**
 * DropHunter AI — Módulo de Integração TikTok Shop API (Seller Center API)
 * Flowra Labs (2026)
 */

export interface TikTokAuthConfig {
  appKey: string;
  appSecret: string;
  redirectUri: string;
}

export interface TikTokTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  openId: string;
  sellerName: string;
  sellerId: string;
}

export interface TikTokOrder {
  orderId: string;
  orderStatus: string;
  buyerName: string;
  shippingAddress: string;
  skuId: string;
  quantity: number;
  totalAmountBRL: number;
}

export class TikTokShopService {
  private appKey: string;
  private appSecret: string;
  private apiBaseUrl = "https://open-api.tiktokglobalshop.com/api/v2";

  constructor(appKey?: string, appSecret?: string) {
    this.appKey = appKey || process.env.TIKTOK_APP_KEY || "";
    this.appSecret = appSecret || process.env.TIKTOK_APP_SECRET || "";
  }

  /**
   * 1. Gera a URL de Autorização OAuth2 para o lojista conectar sua TikTok Shop
   */
  getAuthorizationUrl(redirectUri: string, state: string = "random_state"): string {
    const authUrl = `https://services.tiktokshop.com/open/authorize?app_key=${this.appKey}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    return authUrl;
  }

  /**
   * 2. Troca o Authorization Code pelo Access Token e Refresh Token
   */
  async getAccessToken(authCode: string, redirectUri: string): Promise<TikTokTokenResponse> {
    if (!this.appKey || !this.appSecret) {
      console.warn("[TikTok API] Chaves não configuradas. Retornando Mock de autenticação.");
      return {
        accessToken: "mock_tiktok_access_token_abc123",
        refreshToken: "mock_tiktok_refresh_token_xyz789",
        expiresIn: 86400,
        openId: "mock_open_id",
        sellerName: "Flowra Labs Store BR",
        sellerId: "BR_778899_SELLER",
      };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/token/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_key: this.appKey,
          app_secret: this.appSecret,
          auth_code: authCode,
          grant_type: "authorization_code",
        }),
      });

      const data = await response.json();
      if (data.code !== 0) {
        throw new Error(data.message || "Erro de autenticação na API do TikTok Shop");
      }

      return {
        accessToken: data.data.access_token,
        refreshToken: data.data.refresh_token,
        expiresIn: data.data.expires_in,
        openId: data.data.open_id,
        sellerName: data.data.seller_name || "TikTok Seller",
        sellerId: data.data.seller_id,
      };
    } catch (error) {
      console.error("[TikTok API Token Error]:", error);
      throw error;
    }
  }

  /**
   * 3. Sincroniza Pedidos da TikTok Shop para disparar fulfillment
   */
  async getOrders(accessToken: string, shopId: string): Promise<TikTokOrder[]> {
    if (!this.appKey) {
      // Simula pedidos de teste para a homologação do painel do SaaS
      return [
        {
          orderId: "TT-9988221",
          orderStatus: "AWAITING_SHIPMENT",
          buyerName: "Vera Silva",
          shippingAddress: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100",
          skuId: "cj-001-bone-conduction",
          quantity: 1,
          totalAmountBRL: 219.90,
        },
      ];
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const url = `${this.apiBaseUrl}/orders/search?app_key=${this.appKey}&timestamp=${timestamp}&shop_id=${shopId}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tts-access-token": accessToken,
        },
        body: JSON.stringify({
          order_status: "AWAITING_SHIPMENT", // Apenas pedidos aguardando despacho
          page_size: 20,
        }),
      });

      const data = await response.json();
      if (data.code !== 0) {
        throw new Error(data.message || "Erro ao buscar pedidos no TikTok Shop");
      }

      return data.data.order_list.map((item: any) => ({
        orderId: item.order_id,
        orderStatus: item.order_status,
        buyerName: item.recipient_address.name,
        shippingAddress: `${item.recipient_address.address_detail}, ${item.recipient_address.district} - ${item.recipient_address.city} / ${item.recipient_address.state}`,
        skuId: item.item_list[0].sku_id,
        quantity: item.item_list[0].quantity,
        totalAmountBRL: parseFloat(item.payment_info.original_total_product_price),
      }));
    } catch (error) {
      console.error("[TikTok API Orders Error]:", error);
      throw error;
    }
  }
}
