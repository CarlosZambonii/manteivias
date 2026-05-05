-- Tabela de logs de acessos (login/sessão por utilizador)
CREATE TABLE IF NOT EXISTS logs_acessos (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT,
  perfil      TEXT,
  dispositivo TEXT DEFAULT 'Desktop',
  sessao_ativa BOOLEAN DEFAULT TRUE,
  obra_id     BIGINT,
  data_hora   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de logs de ações (auditoria de operações)
CREATE TABLE IF NOT EXISTS logs_acoes (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT,
  acao        TEXT NOT NULL,
  entidade    TEXT,
  modulo      TEXT,
  descricao   TEXT DEFAULT '',
  obra_id     BIGINT,
  data_hora   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance nas queries por data e por utilizador
CREATE INDEX IF NOT EXISTS idx_logs_acessos_data_hora ON logs_acessos (data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_logs_acessos_user_id   ON logs_acessos (user_id);
CREATE INDEX IF NOT EXISTS idx_logs_acessos_obra_id   ON logs_acessos (obra_id);

CREATE INDEX IF NOT EXISTS idx_logs_acoes_data_hora   ON logs_acoes (data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_logs_acoes_user_id     ON logs_acoes (user_id);
CREATE INDEX IF NOT EXISTS idx_logs_acoes_obra_id     ON logs_acoes (obra_id);
CREATE INDEX IF NOT EXISTS idx_logs_acoes_acao        ON logs_acoes (acao);

-- Ativar RLS
ALTER TABLE logs_acessos ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_acoes   ENABLE ROW LEVEL SECURITY;

-- Qualquer utilizador autenticado pode inserir (o app regista em nome do utilizador)
CREATE POLICY "insert_logs_acessos" ON logs_acessos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "insert_logs_acoes" ON logs_acoes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins (admin_star, admin, admin_c) podem ler todos os logs
CREATE POLICY "select_logs_acessos_admins" ON logs_acessos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_uuid = auth.uid()
        AND usuarios.tipo_usuario IN ('admin_star', 'admin', 'admin_c')
    )
  );

CREATE POLICY "select_logs_acoes_admins" ON logs_acoes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_uuid = auth.uid()
        AND usuarios.tipo_usuario IN ('admin_star', 'admin', 'admin_c')
    )
  );
