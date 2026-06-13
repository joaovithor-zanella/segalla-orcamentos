# Segalla - Sistema de Orçamentos - TODO

## Fase 1: Schema e Dependências
- [x] Criar schema do banco de dados (tabelas: paymentMethods, quotes, quoteItems)
- [x] Instalar dependências: node-firebird, xlsx, docx, pdfkit, @types/node

## Fase 2: Backend (tRPC Routers)
- [x] Router de usuários (admin): listar, criar, editar, excluir
- [x] Router de formas de pagamento (admin): listar, criar, editar, excluir
- [x] Router de integração Firebird: buscar produtos com filtros e paginação
- [x] Router de orçamentos: criar, listar, editar, salvar, buscar por ID
- [x] Middleware adminProcedure para proteger rotas de admin
- [x] Configuração do conector Firebird com comentários de configuração manual

## Fase 3: Frontend
- [x] Identidade visual Segalla (vermelho, azul, cinza) em index.css
- [x] DashboardLayout com sidebar e logo Segalla
- [x] Página de Login
- [x] Página de Catálogo de Produtos (busca, filtros, paginação)
- [x] Página de Novo Orçamento (adicionar produtos, qtd, obs, forma de pagamento)
- [x] Página de Histórico de Orçamentos
- [x] Página de Edição de Orçamento
- [x] Página de Gestão de Usuários (admin)
- [x] Página de Gestão de Formas de Pagamento (admin)
- [x] Roteamento em App.tsx

## Fase 4: Exportação
- [x] Exportação de orçamento em PDF (com logo e identidade Segalla)
- [x] Exportação de orçamento em Excel (.xlsx)
- [x] Exportação de orçamento em Word (.docx)
- [x] Endpoint Express para geração e download dos arquivos

## Fase 5: Testes e Entrega
- [x] Testes vitest para routers principais (14 testes passando)
- [x] Checkpoint final
- [x] Documentação de configuração do Firebird

## Fase 6: Correção de Erro "String Right Truncation"
- [x] Identificar causa do erro SQL code -303 (string right truncation)
- [x] Implementar padding de zeros para campo EMPRESA ("01"-"05")
- [x] Corrigir truncação de padrões LIKE para respeitar tamanho dos campos
- [x] Adicionar logging detalhado de SQL e parâmetros em caso de erro
- [x] Criar testes unitários para validar formatação de companyValue (6 testes)
- [x] Criar testes unitários para validar tamanho de padrões LIKE (2 testes)
- [x] Documentar correções em FIREBIRD_TRUNCATION_FIX.md
- [x] Validar que todos os 44 testes passam

## Fase 7: Correção de Erro ao Salvar Orçamentos
- [x] Identificar erro ao inserir quote_items (valores decimais incorretos)
- [x] Corrigir conversão de quantity, unitPrice e totalPrice para strings
- [x] Garantir que company e companyId sejam null quando não fornecidos
- [x] Aplicar correção em ambas as funções (create e update)
- [x] Criar testes unitários para validar formatação de quote_items (10 testes)
- [x] Validar que todos os 54 testes passam
