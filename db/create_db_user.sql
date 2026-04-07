-- =============================================
-- Script para criar usuário dedicado do banco
-- NÃO usar root em produção!
-- Execute como root/admin do MySQL:
--   mysql -u root -p < create_db_user.sql
-- =============================================

-- Criar usuário com senha forte (troque a senha abaixo!)
CREATE USER IF NOT EXISTS 'nutriudf_app'@'%' 
  IDENTIFIED BY 'TROQUE_ESTA_SENHA_POR_UMA_FORTE';

-- Permissões mínimas necessárias (apenas DML + leitura de estrutura)
GRANT SELECT, INSERT, UPDATE, DELETE ON nutriudf.* TO 'nutriudf_app'@'%';

-- Não conceder: CREATE, DROP, ALTER, GRANT, FILE, PROCESS, SUPER, etc.

FLUSH PRIVILEGES;

-- Verificar permissões
SHOW GRANTS FOR 'nutriudf_app'@'%';
