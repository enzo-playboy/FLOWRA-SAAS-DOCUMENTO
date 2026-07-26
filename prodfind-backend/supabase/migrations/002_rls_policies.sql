-- =============================================
-- PRODFIND: RLS (Row Level Security) POLICIES
-- =============================================
-- Execute ESTE ARQUIVO após a Migration 001
-- Configura segurança a nível de linha no Supabase

-- =============================================
-- HABILITA RLS EM TODAS AS TABELAS
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_breaker ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_locks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLICIES: USERS
-- =============================================

-- Usuários só veem seus próprios dados
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Usuários só atualizam seus próprios dados
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Usuários criam sua própria conta
CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Service role pode tudo (backend)
CREATE POLICY "users_service_all" ON users
  FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- POLICIES: SUBSCRIPTIONS
-- =============================================

-- Usuários veem apenas suas assinaturas
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários criam assinaturas pra si mesmos
CREATE POLICY "subscriptions_insert_own" ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários atualizam suas assinaturas
CREATE POLICY "subscriptions_update_own" ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role pode tudo
CREATE POLICY "subscriptions_service_all" ON subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- POLICIES: USER_FAVORITES
-- =============================================

-- Usuários veem apenas seus favoritos
CREATE POLICY "favorites_select_own" ON user_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários adicionam favoritos pra si mesmos
CREATE POLICY "favorites_insert_own" ON user_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários removem seus favoritos
CREATE POLICY "favorites_delete_own" ON user_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role pode tudo
CREATE POLICY "favorites_service_all" ON user_favorites
  FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- POLICIES: TABELAS INTERNAS (só service_role)
-- =============================================

-- Apenas service role acessa (backend controla)
CREATE POLICY "idempotency_service_all" ON idempotency_keys
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "eventlog_service_all" ON event_log
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "dlq_service_all" ON dead_letter_queue
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "circuitbreaker_service_all" ON circuit_breaker
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "cachelocks_service_all" ON cache_locks
  FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- HABILITA REALTIME PRA TABELAS IMPORTANTES
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_favorites;

-- =============================================
-- GRANTS PRA SERVICE ROLE
-- =============================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =============================================
-- ANON PODE LER DADOS PÚBLICOS (se necessário)
-- =============================================

-- Se o frontend precisar de acesso anônimo a alguma tabela
-- GRANT SELECT ON TABLE trending_products TO anon;
