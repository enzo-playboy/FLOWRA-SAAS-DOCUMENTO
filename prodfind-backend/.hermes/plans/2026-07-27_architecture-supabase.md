# ProdFind — Arquitetura Backend (Supabase)

> **Para Antigravity:** Executar SQLs e implementar padrões arquiteturais definidos aqui.

**Goal:** Definir schema Supabase + padrões arquiteturais (CQRS, idempotency, race condition, dual-write, DLQ, time attack, cache stampede) para o ProdFind.

**Architecture:** Backend separado do frontend (Lovable). Supabase como DB + Auth layer. Redis para cache. SuperTokens para auth social (Google). API layer em Next.js (routes).

**Tech Stack:** Supabase (PostgreSQL), Redis, SuperTokens, Next.js API Routes, Stripe/Asaas

---

## 1. VISÃO GERAL DA ARQUITETURA

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRODFIND ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   FRONTEND  │    │   API LAYER │    │   SUPABASE  │         │
│  │   (Lovable) │───▶│  (Next.js)  │───▶│  (Postgres) │         │
│  │  GSAP/Swiper│    │   Routes    │    │     DB      │         │
│  └─────────────┘    └──────┬──────┘    └─────────────┘         │
│                            │                                     │
│                            ▼                                     │
│                    ┌───────────────┐                             │
│                    │     REDIS     │                             │
│                    │  (Cache Layer)│                             │
│                    └───────────────┘                             │
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  SUPERTOKENS│    │    STRIPE   │    │  ML API     │         │
│  │  (Auth)     │    │  (Pagamento)│    │  (Dados)    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. PADRÕES ARQUITETURAIS

### 2.1 CQRS (Command Query Responsibility Segregation)

**O que é:** Separar operações de ESCRITA (commands) de operações de LEITURA (queries).

**Por quê no ProdFind:**
- Writes: criar conta, salvar produto, assinar plano
- Reads: buscar trending, ver detalhes produto, ver favoritos

**Implementação no Supabase:**

```sql
-- =============================================
-- CQRS: TABLES DE ESCRITA (COMMANDS)
-- =============================================

-- Tabela de usuários (write model)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  supertokens_id TEXT UNIQUE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'start', 'pro', 'agency')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de favoritos (write model)
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT,
  product_price DECIMAL(10,2),
  product_image TEXT,
  category_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Tabela de assinaturas (write model)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  asaas_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('start', 'pro', 'agency')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CQRS: VIEWS DE LEITURA (QUERIES)
-- =============================================

-- View: produtos trending (read model - materializada pra performance)
CREATE MATERIALIZED VIEW trending_products AS
SELECT 
  p.id,
  p.name,
  p.price,
  p.image_url,
  p.category_id,
  p.position,
  p.domain_id,
  p.seller_id,
  p.seller_name,
  p.seller_reputation,
  p.created_at,
  -- Dados pré-calculados pra leitura rápida
  (SELECT COUNT(*) FROM user_favorites uf WHERE uf.product_id = p.id) as favorite_count,
  (SELECT AVG(uf2.rating) FROM user_feedback uf2 WHERE uf2.product_id = p.id) as avg_rating
FROM products p
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.position ASC;

-- View: dashboard do usuário (read model)
CREATE VIEW user_dashboard AS
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  u.plan,
  (SELECT COUNT(*) FROM user_favorites uf WHERE uf.user_id = u.id) as total_favorites,
  (SELECT COUNT(*) FROM user_favorites uf WHERE uf.user_id = u.id AND uf.created_at > NOW() - INTERVAL '7 days') as favorites_this_week,
  s.status as subscription_status,
  s.current_period_end
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active';

-- Função pra refresh do materialized view (roda periodicamente)
CREATE OR REPLACE FUNCTION refresh_trending_products()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_products;
END;
$$ LANGUAGE plpgsql;
```

---

### 2.2 IDEMPOTENCY

**O que é:** Operações podem ser repetidas sem efeitos colaterais.

**Por quê no ProdFind:**
- Webhook do Stripe pode chegar várias vezes
- Usuário pode clicar "assinar" várias vezes
- ML API pode retornar dados duplicados

**Implementação:**

```sql
-- =============================================
-- IDEMPOTENCY: TABELA DE IDEMPOTENT KEYS
-- =============================================

CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  operation TEXT NOT NULL, -- 'subscription', 'payment', 'favorite'
  request_hash TEXT NOT NULL,
  response JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Índice pra busca rápida
CREATE INDEX idx_idempotency_key ON idempotency_keys(idempotency_key);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

-- Função pra verificar idempotência
CREATE OR REPLACE FUNCTION check_idempotency(
  p_key TEXT,
  p_user_id UUID,
  p_operation TEXT,
  p_request_hash TEXT
) RETURNS JSONB AS $$
DECLARE
  existing RECORD;
BEGIN
  -- Busca key existente
  SELECT * INTO existing 
  FROM idempotency_keys 
  WHERE idempotency_key = p_key;
  
  -- Se não existe, cria
  IF NOT FOUND THEN
    INSERT INTO idempotency_keys (idempotency_key, user_id, operation, request_hash)
    VALUES (p_key, p_user_id, p_operation, p_request_hash);
    RETURN '{"status": "new", "allowed": true}';
  END IF;
  
  -- Se existe e expirou, permite reprocessar
  IF existing.expires_at < NOW() THEN
    DELETE FROM idempotency_keys WHERE id = existing.id;
    INSERT INTO idempotency_keys (idempotency_key, user_id, operation, request_hash)
    VALUES (p_key, p_user_id, p_operation, p_request_hash);
    RETURN '{"status": "expired", "allowed": true}';
  END IF;
  
  -- Se existe e é a mesma request, retorna resposta cacheada
  IF existing.request_hash = p_request_hash AND existing.status = 'completed' THEN
    RETURN jsonb_build_object('status', 'duplicate', 'allowed', false, 'response', existing.response);
  END IF;
  
  -- Se existe e é request diferente, bloqueia
  IF existing.request_hash != p_request_hash THEN
    RETURN '{"status": "conflict", "allowed": false}';
  END IF;
  
  RETURN '{"status": "pending", "allowed": false}';
END;
$$ LANGUAGE plpgsql;
```

**Exemplo de uso no código:**

```typescript
// API Route: POST /api/subscribe
export async function POST(req: NextRequest) {
  const { plan, payment_method } = await req.json();
  const idempotencyKey = req.headers.get('idempotency-key');
  
  // 1. Verifica idempotência
  const check = await supabase.rpc('check_idempotency', {
    p_key: idempotencyKey,
    p_user_id: userId,
    p_operation: 'subscription',
    p_request_hash: hash({ plan, payment_method })
  });
  
  if (!check.data.allowed) {
    if (check.data.status === 'duplicate') {
      return NextResponse.json(check.data.response); // Retorna resposta cacheada
    }
    return NextResponse.json({ error: 'Conflict' }, { status: 409 });
  }
  
  // 2. Processa assinatura
  const subscription = await createSubscription(plan, payment_method);
  
  // 3. Salva resposta e marca como completa
  await supabase.from('idempotency_keys').update({
    response: subscription,
    status: 'completed'
  }).eq('idempotency_key', idempotencyKey);
  
  return NextResponse.json(subscription);
}
```

---

### 2.3 RACE CONDITION

**O que é:** Dois processos tentam modificar os mesmos dados ao mesmo tempo.

**Por quê no ProdFind:**
- Dois usuários salvam o mesmo produto ao mesmo tempo
- Webhook de pagamento + ação do usuário simultâneas
- Atualização de estoque/posição no ML

**Implementação:**

```sql
-- =============================================
-- RACE CONDITION: OTIMISTIC LOCKING
-- =============================================

-- Adiciona versão pra controle de concorrência
ALTER TABLE user_favorites ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE subscriptions ADD COLUMN version INTEGER DEFAULT 1;

-- Função segura pra adicionar favorito (com lock)
CREATE OR REPLACE FUNCTION add_favorite_safe(
  p_user_id UUID,
  p_product_id TEXT,
  p_product_name TEXT,
  p_product_price DECIMAL,
  p_product_image TEXT,
  p_category_id TEXT
) RETURNS JSONB AS $$
DECLARE
  existing_fav RECORD;
  new_fav RECORD;
BEGIN
  -- Tenta inserir (com lock na constraint)
  INSERT INTO user_favorites (user_id, product_id, product_name, product_price, product_image, category_id)
  VALUES (p_user_id, p_product_id, p_product_name, p_product_price, p_product_image, p_category_id)
  ON CONFLICT (user_id, product_id) DO NOTHING
  RETURNING * INTO new_fav;
  
  -- Se não inseriu (já existia), retorna o existente
  IF new_fav IS NULL THEN
    SELECT * INTO existing_fav 
    FROM user_favorites 
    WHERE user_id = p_user_id AND product_id = p_product_id;
    
    RETURN jsonb_build_object(
      'status', 'already_exists',
      'favorite', jsonb_build_object(
        'id', existing_fav.id,
        'created_at', existing_fav.created_at
      )
    );
  END IF;
  
  RETURN jsonb_build_object(
    'status', 'created',
    'favorite', jsonb_build_object(
      'id', new_fav.id,
      'created_at', new_fav.created_at
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Função segura pra atualizar assinatura (optimistic locking)
CREATE OR REPLACE FUNCTION update_subscription_safe(
  p_subscription_id UUID,
  p_new_status TEXT,
  p_expected_version INTEGER
) RETURNS JSONB AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE subscriptions 
  SET status = p_new_status, 
      version = version + 1,
      updated_at = NOW()
  WHERE id = p_subscription_id 
    AND version = p_expected_version;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  
  IF updated_rows = 0 THEN
    RETURN jsonb_build_object(
      'status', 'conflict',
      'error', 'Version mismatch - data was modified by another process'
    );
  END IF;
  
  RETURN jsonb_build_object('status', 'updated');
END;
$$ LANGUAGE plpgsql;
```

**Exemplo de uso no código:**

```typescript
// Adiciona favorito com proteção contra race condition
async function addFavorite(userId: string, product: Product) {
  const { data, error } = await supabase.rpc('add_favorite_safe', {
    p_user_id: userId,
    p_product_id: product.id,
    p_product_name: product.name,
    p_product_price: product.price,
    p_product_image: product.image,
    p_category_id: product.category_id
  });
  
  if (data.status === 'already_exists') {
    console.log('Produto já era favorito');
    return data.favorite;
  }
  
  return data.favorite;
}

// Atualiza assinatura com optimistic locking
async function updateSubscription(subId: string, newStatus: string, currentVersion: number) {
  const { data } = await supabase.rpc('update_subscription_safe', {
    p_subscription_id: subId,
    p_new_status: newStatus,
    p_expected_version: currentVersion
  });
  
  if (data.status === 'conflict') {
    throw new Error('Concorrencia detectada - tente novamente');
  }
  
  return data;
}
```

---

### 2.4 DUAL-WRITE

**O que é:** Escrever em múltiplos sistemas atomicamente.

**Por quê no ProdFind:**
- Quando usuário assina: gravar no Supabase E no Stripe
- Quando pagamento é aprovado: atualizar Supabase E enviar email
- Quando produto é salvo: gravar no Supabase E no cache Redis

**Implementação:**

```sql
-- =============================================
-- DUAL-WRITE: EVENT LOG PRA SINCRONIZAÇÃO
-- =============================================

-- Tabela de eventos (log de tudo que acontece)
CREATE TABLE event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'subscription.created', 'favorite.added', 'payment.completed'
  entity_type TEXT NOT NULL, -- 'user', 'subscription', 'favorite'
  entity_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Índices pra busca
CREATE INDEX idx_event_log_status ON event_log(status);
CREATE INDEX idx_event_log_type ON event_log(event_type);
CREATE INDEX idx_event_log_created ON event_log(created_at);

-- Função pra registrar evento (dual-write pattern)
CREATE OR REPLACE FUNCTION log_event(
  p_event_type TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_payload JSONB
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO event_log (event_type, entity_type, entity_id, payload)
  VALUES (p_event_type, p_entity_type, p_entity_id, p_payload)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Função pra processar eventos pendentes
CREATE OR REPLACE FUNCTION process_pending_events()
RETURNS TABLE(event_id UUID, event_type TEXT, payload JSONB) AS $$
BEGIN
  RETURN QUERY
  UPDATE event_log 
  SET status = 'processing'
  WHERE id IN (
    SELECT id FROM event_log 
    WHERE status = 'pending' 
      AND retry_count < max_retries
    ORDER BY created_at ASC 
    LIMIT 10
    FOR UPDATE SKIP LOCKED
  )
  RETURNING event_log.id, event_log.event_type, event_log.payload;
END;
$$ LANGUAGE plpgsql;
```

**Exemplo de uso no código:**

```typescript
// Dual-write: assinatura criada → Supabase + Stripe + Email
async function createSubscription(userId: string, plan: string) {
  // 1. Cria no Supabase
  const { data: sub } = await supabase
    .from('subscriptions')
    .insert({ user_id: userId, plan, status: 'active' })
    .select()
    .single();
  
  // 2. Registra evento (dual-write)
  await supabase.rpc('log_event', {
    p_event_type: 'subscription.created',
    p_entity_type: 'subscription',
    p_entity_id: sub.id,
    p_payload: jsonb_build_object(
      'user_id', userId,
      'plan', plan,
      'stripe_needs_creation', true
    )
  });
  
  // 3. Worker processa o evento (async)
  // - Cria assinatura no Stripe
  // - Envia email de boas-vindas
  // - Atualiza cache Redis
  
  return sub;
}
```

---

### 2.5 DLQ (Dead Letter Queue)

**O que é:** Fila pra operações que falharam e precisam de retry manual.

**Por quê no ProdFind:**
- Webhook do Stripe falhou
- Envio de email falhou
- ML API retornou erro

**Implementação:**

```sql
-- =============================================
-- DLQ: TABELA DE OPERAÇÕES FALHAS
-- =============================================

CREATE TABLE dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES event_log(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  error_message TEXT,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'resolved', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_retry_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT, -- 'manual', 'auto_retry', 'system'
  notes TEXT
);

-- Índices
CREATE INDEX idx_dlq_status ON dead_letter_queue(status);
CREATE INDEX idx_dlq_event_type ON dead_letter_queue(event_type);
CREATE INDEX idx_dlq_created ON dead_letter_queue(created_at);

-- Função pra mover evento pra DLQ
CREATE OR REPLACE FUNCTION move_to_dlq(
  p_event_id UUID,
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  dlq_id UUID;
  event_record RECORD;
BEGIN
  -- Busca o evento original
  SELECT * INTO event_record FROM event_log WHERE id = p_event_id;
  
  -- Insere no DLQ
  INSERT INTO dead_letter_queue (event_id, event_type, payload, error_message, error_stack)
  VALUES (p_event_id, event_record.event_type, event_record.payload, p_error_message, p_error_stack)
  RETURNING id INTO dlq_id;
  
  -- Atualiza status do evento original
  UPDATE event_log 
  SET status = 'failed', 
      error_message = p_error_message,
      retry_count = retry_count + 1
  WHERE id = p_event_id;
  
  RETURN dlq_id;
END;
$$ LANGUAGE plpgsql;

-- Função pra retry de evento do DLQ
CREATE OR REPLACE FUNCTION retry_from_dlq(p_dlq_id UUID)
RETURNS JSONB AS $$
DECLARE
  dlq_record RECORD;
BEGIN
  -- Busca registro do DLQ
  SELECT * INTO dlq_record FROM dead_letter_queue WHERE id = p_dlq_id;
  
  -- Verifica se pode retry
  IF dlq_record.retry_count >= dlq_record.max_retries THEN
    RETURN jsonb_build_object('status', 'max_retries_exceeded');
  END IF;
  
  -- Atualiza status pra retrying
  UPDATE dead_letter_queue 
  SET status = 'retrying', 
      retry_count = retry_count + 1,
      last_retry_at = NOW()
  WHERE id = p_dlq_id;
  
  -- Reativa evento original
  UPDATE event_log 
  SET status = 'pending'
  WHERE id = dlq_record.event_id;
  
  RETURN jsonb_build_object('status', 'queued_for_retry');
END;
$$ LANGUAGE plpgsql;
```

**Exemplo de uso no código:**

```typescript
// Processor de eventos com DLQ
async function processEvent(event: EventLog) {
  try {
    switch (event.event_type) {
      case 'subscription.created':
        await createStripeSubscription(event.payload);
        break;
      case 'payment.completed':
        await sendPaymentConfirmation(event.payload);
        break;
      default:
        console.log('Evento desconhecido:', event.event_type);
    }
    
    // Marca como completo
    await supabase
      .from('event_log')
      .update({ status: 'completed', processed_at: new Date().toISOString() })
      .eq('id', event.id);
      
  } catch (error) {
    // Move pra DLQ
    await supabase.rpc('move_to_dlq', {
      p_event_id: event.id,
      p_error_message: error.message,
      p_error_stack: error.stack
    });
  }
}

// Retry manual de evento do DLQ
async function retryDLQEvent(dlqId: string) {
  const { data } = await supabase.rpc('retry_from_dlq', { p_dlq_id: dlqId });
  
  if (data.status === 'max_retries_exceeded') {
    throw new Error('Max retries atingido - intervenção manual necessária');
  }
  
  // Re-processa o evento
  const event = await supabase
    .from('event_log')
    .select('*')
    .eq('id', data.event_id)
    .single();
  
  await processEvent(event.data);
}
```

---

### 2.6 TIME ATTACK (Timeout + Circuit Breaker)

**O que é:** Proteger contra APIs lentas ou fora do ar.

**Por quê no ProdFind:**
- ML API pode estar lenta
- Stripe webhook pode demorar
- Redis pode estar indisponível

**Implementação:**

```sql
-- =============================================
-- TIME ATTACK: CIRCUIT BREAKER STATE
-- =============================================

CREATE TABLE circuit_breaker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT UNIQUE NOT NULL, -- 'ml_api', 'stripe', 'redis', 'email'
  state TEXT DEFAULT 'closed' CHECK (state IN ('closed', 'open', 'half-open')),
  failure_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_threshold INTEGER DEFAULT 5, -- Falhas pra abrir circuito
  success_threshold INTEGER DEFAULT 3, -- Sucessos pra fechar circuito
  timeout_ms INTEGER DEFAULT 5000, -- Timeout padrão
  last_failure_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inicializa circuit breakers conhecidos
INSERT INTO circuit_breaker (service_name, failure_threshold, timeout_ms) VALUES
  ('ml_api', 5, 10000),      -- ML API: 5 falhas, 10s timeout
  ('stripe', 3, 15000),      -- Stripe: 3 falhas, 15s timeout
  ('redis', 10, 2000),       -- Redis: 10 falhas, 2s timeout
  ('email', 5, 5000);        -- Email: 5 falhas, 5s timeout

-- Função pra registrar falha
CREATE OR REPLACE FUNCTION record_circuit_failure(p_service TEXT)
RETURNS JSONB AS $$
DECLARE
  cb RECORD;
BEGIN
  UPDATE circuit_breaker 
  SET failure_count = failure_count + 1,
      last_failure_at = NOW(),
      updated_at = NOW()
  WHERE service_name = p_service
  RETURNING * INTO cb;
  
  -- Abre circuito se atingiu threshold
  IF cb.failure_count >= cb.failure_threshold AND cb.state = 'closed' THEN
    UPDATE circuit_breaker 
    SET state = 'open', opened_at = NOW()
    WHERE service_name = p_service;
    
    RETURN jsonb_build_object(
      'state', 'open',
      'message', 'Circuit breaker opened - service unavailable'
    );
  END IF;
  
  RETURN jsonb_build_object('state', cb.state, 'failures', cb.failure_count);
END;
$$ LANGUAGE plpgsql;

-- Função pra registrar sucesso
CREATE OR REPLACE FUNCTION record_circuit_success(p_service TEXT)
RETURNS JSONB AS $$
DECLARE
  cb RECORD;
BEGIN
  UPDATE circuit_breaker 
  SET success_count = success_count + 1,
      failure_count = 0,
      last_success_at = NOW(),
      updated_at = NOW()
  WHERE service_name = p_service
  RETURNING * INTO cb;
  
  -- Fecha circuito se atingiu threshold de sucesso (half-open → closed)
  IF cb.state = 'half-open' AND cb.success_count >= cb.success_threshold THEN
    UPDATE circuit_breaker 
    SET state = 'closed', failure_count = 0, success_count = 0
    WHERE service_name = p_service;
    
    RETURN jsonb_build_object('state', 'closed', 'message', 'Circuit breaker closed');
  END IF;
  
  RETURN jsonb_build_object('state', cb.state, 'successes', cb.success_count);
END;
$$ LANGUAGE plpgsql;

-- Função pra verificar se serviço está disponível
CREATE OR REPLACE FUNCTION is_service_available(p_service TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  cb RECORD;
BEGIN
  SELECT * INTO cb FROM circuit_breaker WHERE service_name = p_service;
  
  IF NOT FOUND THEN
    RETURN true; -- Serviço desconhecido = disponível
  END IF;
  
  -- Se circuito está aberto, verifica se pode tentar (half-open)
  IF cb.state = 'open' THEN
    IF cb.opened_at < NOW() - INTERVAL '30 seconds' THEN
      -- Tenta novamente (half-open)
      UPDATE circuit_breaker SET state = 'half-open' WHERE service_name = p_service;
      RETURN true;
    END IF;
    RETURN false; -- Ainda está open
  END IF;
  
  RETURN true; -- closed ou half-open
END;
$$ LANGUAGE plpgsql;
```

**Exemplo de uso no código:**

```typescript
// Wrapper com circuit breaker
async function callWithCircuitBreaker<T>(
  service: string,
  fn: () => Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  // 1. Verifica se serviço está disponível
  const { data: available } = await supabase
    .rpc('is_service_available', { p_service: service });
  
  if (!available) {
    throw new Error(`Service ${service} is circuit-broken`);
  }
  
  try {
    // 2. Executa com timeout
    const result = await Promise.race([
      fn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ]);
    
    // 3. Registra sucesso
    await supabase.rpc('record_circuit_success', { p_service: service });
    
    return result as T;
    
  } catch (error) {
    // 4. Registra falha
    await supabase.rpc('record_circuit_failure', { p_service: service });
    throw error;
  }
}

// Uso
const mlData = await callWithCircuitBreaker(
  'ml_api',
  () => fetch('https://api.mercadolibre.com/highlights/MLB1055'),
  10000
);
```

---

### 2.7 CACHE STAMPEDE

**O que é:** Muitas requisições batendo no DB quando cache expira.

**Por quê no ProdFind:**
- Trending products cache expira → 1000 usuários pedem ao mesmo tempo
- Preço de produto cache expira → múltiplas abas do usuário

**Implementação:**

```sql
-- =============================================
-- CACHE STAMPEDE: LOCK PRA PROTEÇÃO
-- =============================================

-- Tabela de cache locks
CREATE TABLE cache_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  locked_by TEXT NOT NULL, -- Identificador do processo
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  refresh_in_progress BOOLEAN DEFAULT false
);

-- Função pra adquirir lock de cache (prevenir stampede)
CREATE OR REPLACE FUNCTION acquire_cache_lock(
  p_cache_key TEXT,
  p_locked_by TEXT,
  p_ttl_seconds INTEGER DEFAULT 300
) RETURNS JSONB AS $$
DECLARE
  existing_lock RECORD;
BEGIN
  -- Tenta adquirir lock
  INSERT INTO cache_locks (cache_key, locked_by, expires_at)
  VALUES (p_cache_key, p_locked_by, NOW() + (p_ttl_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (cache_key) DO NOTHING;
  
  -- Verifica se adquiriu
  SELECT * INTO existing_lock 
  FROM cache_locks 
  WHERE cache_key = p_cache_key;
  
  IF NOT FOUND THEN
    -- Não deveria acontecer, mas trata
    RETURN jsonb_build_object('acquired', false);
  END IF;
  
  -- Se o lock é do mesmo processo, retorna sucesso
  IF existing_lock.locked_by = p_locked_by THEN
    RETURN jsonb_build_object('acquired', true, 'refresh_in_progress', existing_lock.refresh_in_progress);
  END IF;
  
  -- Se lock expirou, pode assumir
  IF existing_lock.expires_at < NOW() THEN
    UPDATE cache_locks 
    SET locked_by = p_locked_by, 
        expires_at = NOW() + (p_ttl_seconds || ' seconds')::INTERVAL,
        refresh_in_progress = false
    WHERE cache_key = p_cache_key;
    RETURN jsonb_build_object('acquired', true);
  END IF;
  
  -- Lock ativo de outro processo
  RETURN jsonb_build_object(
    'acquired', false,
    'locked_by', existing_lock.locked_by,
    'expires_at', existing_lock.expires_at
  );
END;
$$ LANGUAGE plpgsql;

-- Função pra marcar refresh em progresso
CREATE OR REPLACE FUNCTION mark_refresh_in_progress(p_cache_key TEXT)
RETURNS void AS $$
BEGIN
  UPDATE cache_locks 
  SET refresh_in_progress = true 
  WHERE cache_key = p_cache_key;
END;
$$ LANGUAGE plpgsql;

-- Função pra liberar lock
CREATE OR REPLACE FUNCTION release_cache_lock(p_cache_key TEXT, p_locked_by TEXT)
RETURNS void AS $$
BEGIN
  DELETE FROM cache_locks 
  WHERE cache_key = p_cache_key AND locked_by = p_locked_by;
END;
$$ LANGUAGE plpgsql;
```

**Exemplo de uso no código:**

```typescript
// Cache com proteção contra stampede
async function getCachedWithStampedeProtection<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const processId = `${process.pid}-${Date.now()}`;
  
  // 1. Tenta pegar do cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // 2. Tenta adquirir lock
  const { data: lock } = await supabase.rpc('acquire_cache_lock', {
    p_cache_key: cacheKey,
    p_locked_by: processId,
    p_ttl_seconds: ttlSeconds
  });
  
  if (!lock.acquired) {
    // Outro processo está refreshando - espera um pouco e tenta de novo
    await new Promise(r => setTimeout(r, 1000));
    const retryCached = await redis.get(cacheKey);
    if (retryCached) return JSON.parse(retryCached);
    
    // Se ainda não tem, vai direto no DB (fallback)
    return fetchFn();
  }
  
  // 3. Marca refresh em progresso
  await supabase.rpc('mark_refresh_in_progress', { p_cache_key: cacheKey });
  
  try {
    // 4. Busca dados frescos
    const freshData = await fetchFn();
    
    // 5. Salva no cache
    await redis.setex(cacheKey, ttlSeconds, JSON.stringify(freshData));
    
    return freshData;
    
  } finally {
    // 6. Libera lock
    await supabase.rpc('release_cache_lock', {
      p_cache_key: cacheKey,
      p_locked_by: processId
    });
  }
}

// Uso
const trending = await getCachedWithStampedeProtection(
  'trending:MLB1055',
  () => fetchTrendingFromML('MLB1055'),
  600 // 10 minutos
);
```

---

## 3. MIGRATIONS (SQL COMPLETO)

### 3.1 Migration Inicial

```sql
-- =============================================
-- PRODFIND: MIGRATION 001 - SCHEMA INICIAL
-- =============================================

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- USERS
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  supertokens_id TEXT UNIQUE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'start', 'pro', 'agency')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SUBSCRIPTIONS
-- =============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  asaas_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('start', 'pro', 'agency')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USER FAVORITES
-- =============================================
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT,
  product_price DECIMAL(10,2),
  product_image TEXT,
  category_id TEXT,
  notes TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- =============================================
-- IDEMPOTENCY KEYS
-- =============================================
CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  operation TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- =============================================
-- EVENT LOG (Dual-Write)
-- =============================================
CREATE TABLE event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- =============================================
-- DEAD LETTER QUEUE
-- =============================================
CREATE TABLE dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES event_log(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  error_message TEXT,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'resolved', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_retry_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  notes TEXT
);

-- =============================================
-- CIRCUIT BREAKER
-- =============================================
CREATE TABLE circuit_breaker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT UNIQUE NOT NULL,
  state TEXT DEFAULT 'closed' CHECK (state IN ('closed', 'open', 'half-open')),
  failure_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_threshold INTEGER DEFAULT 5,
  success_threshold INTEGER DEFAULT 3,
  timeout_ms INTEGER DEFAULT 5000,
  last_failure_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CACHE LOCKS (Stampede Protection)
-- =============================================
CREATE TABLE cache_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  locked_by TEXT NOT NULL,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  refresh_in_progress BOOLEAN DEFAULT false
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_supertokens ON users(supertokens_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_favorites_product ON user_favorites(product_id);
CREATE INDEX idx_idempotency_key ON idempotency_keys(idempotency_key);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);
CREATE INDEX idx_event_log_status ON event_log(status);
CREATE INDEX idx_event_log_type ON event_log(event_type);
CREATE INDEX idx_event_log_created ON event_log(created_at);
CREATE INDEX idx_dlq_status ON dead_letter_queue(status);
CREATE INDEX idx_dlq_event_type ON dead_letter_queue(event_type);
CREATE INDEX idx_dlq_created ON dead_letter_queue(created_at);
CREATE INDEX idx_circuit_breaker_service ON circuit_breaker(service_name);
CREATE INDEX idx_cache_locks_key ON cache_locks(cache_key);

-- =============================================
-- SEED: CIRCUIT BREAKERS INICIAIS
-- =============================================
INSERT INTO circuit_breaker (service_name, failure_threshold, timeout_ms) VALUES
  ('ml_api', 5, 10000),
  ('stripe', 3, 15000),
  ('redis', 10, 2000),
  ('email', 5, 5000);
```

---

## 4. CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Executar Migration 001 no Supabase
- [ ] Configurar Row Level Security (RLS)
- [ ] Configurar SuperTokens pra auth
- [ ] Configurar Redis pra cache
- [ ] Implementar CQRS nas API routes
- [ ] Implementar idempotency nas rotas de pagamento
- [ ] Implementar circuit breaker nas chamadas externas
- [ ] Implementar DLQ processor (cron job)
- [ ] Testes de race condition
- [ ] Testes de cache stampede

---

## 5. PRÓXIMOS PASSOS

1. **Antigravity executa SQL** → Migração 001
2. **Backend implementa rotas** → Usando padrões definidos
3. **Frontend consome APIs** → Lovable + GSAP/Swiper
4. **Testes** → Unit + Integration + Load

---

*Arquitetura definida em 27/07/2026*
*Para implementação pelo Antigravity + equipe*
