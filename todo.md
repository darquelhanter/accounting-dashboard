# Accounting Dashboard - TODO

## Fase 1: Gestão de Clientes
- [x] Criar schema do banco de dados para clientes
- [x] Implementar procedimentos tRPC para CRUD de clientes
- [x] Criar página de Gestão de Clientes com listagem
- [x] Melhorar interface CRUD com tabela profissional
- [x] Adicionar validações e tratamento de erros
- [x] Implementar busca e filtros na página de Clientes
- [x] Adicionar paginação
- [x] Adicionar skeleton loading e animações
- [ ] Implementar testes unitários para CRUD de clientes

## Fase 2: Gestão de Obrigações
- [x] Criar schema do banco de dados para obrigações
- [x] Implementar procedimentos tRPC para CRUD de obrigações
- [x] Criar página de Gestão de Obrigações com listagem
- [x] Adicionar filtros avançados (categoria, periodicidade, regime)
- [x] Adicionar busca e paginação
- [x] Adicionar skeleton loading e animações
- [x] Criar página de Gestão de Obrigações
- [x] Adicionar categorias (Fiscal, Acessória, Trabalhista)
- [x] Implementar testes unitários para CRUD de obrigações

## Fase 3: Checklist Mensal
- [x] Criar schema do banco de dados para checklist
- [x] Implementar procedimentos tRPC para checklist
- [x] Criar página de Checklist Mensal
- [x] Integrar com clientes e obrigações

## Fase 4: Controle de Mensalidades
- [ ] Criar schema do banco de dados para mensalidades
- [ ] Implementar procedimentos tRPC para mensalidades
- [ ] Criar página de Controle de Mensalidades
- [ ] Adicionar filtros por status (Pago, Pendente, Atrasado)

## Fase 5: Dashboard e Relatórios
- [ ] Conectar KPIs da página inicial ao banco de dados
- [ ] Implementar gráficos dinâmicos com dados reais
- [ ] Criar funcionalidade de exportação de relatórios
- [ ] Adicionar filtros avançados

## Fase 6: Importação de Excel
- [ ] Implementar upload de planilha Excel
- [ ] Parsear dados da planilha
- [ ] Sincronizar com banco de dados

## Melhorias Gerais
- [ ] Adicionar autenticação e controle de acesso
- [ ] Implementar notificações em tempo real
- [ ] Adicionar modo escuro/claro
- [ ] Otimizar performance e responsividade

## Fase 3: Checklist Mensal (CONCLUÍDA)
- [x] Analisar e preparar schema de checklist
- [x] Implementar procedimentos tRPC para CRUD de checklist
- [x] Criar página de Checklist Mensal com listagem
- [x] Adicionar filtros por cliente, mês, ano e status
- [x] Implementar edição inline de status e responsável
- [x] Adicionar busca e paginação
- [x] Adicionar skeleton loading e animações
- [x] Implementar testes unitários para CRUD de checklist


## Fase 4: Controle de Mensalidades (CONCLUÍDA)
- [x] Analisar e preparar schema de mensalidades
- [x] Implementar procedimentos tRPC para CRUD de mensalidades
- [x] Criar página de Controle de Mensalidades com listagem
- [x] Adicionar filtros por cliente e período (mês/ano)
- [x] Adicionar filtros por status (Pago, Pendente, Atrasado)
- [x] Implementar edição inline de status e data de pagamento
- [x] Adicionar busca e paginação
- [x] Adicionar skeleton loading e animações
- [x] Implementar testes unitários para CRUD de mensalidades


## Fase 5: Sistema de Alertas Visuais (CONCLUÍDA)
- [x] Implementar lógica de cálculo de alertas no backend
- [x] Criar componentes visuais de alertas (badges, banners, ícones)
- [x] Integrar alertas nas páginas de Obrigações e Mensalidades
- [x] Adicionar widget de notificações na Home
- [x] Implementar indicadores visuais (cores, ícones, animações)
- [x] Adicionar testes para sistema de alertas
- [x] Testar e validar funcionalidade completa


## Fase 6: Correção de KPIs na Home (CONCLUÍDA)
- [x] Analisar o problema de atualização dos KPIs
- [x] Implementar queries para total de clientes
- [x] Implementar queries para obrigações pendentes
- [x] Implementar queries para mensalidades atrasadas
- [x] Implementar queries para taxa de conclusão
- [x] Conectar KPIs ao frontend com dados reais
- [x] Testar e validar atualização dos KPIs


## Fase 2 (Revisão): Gestão de Obrigações Específicas
- [ ] Criar seed de dados com 5 obrigações (INSS, FGTS, eSocial, Folha Mensal, DCTFWeb)
- [ ] Implementar interface melhorada de gestão de obrigações
- [ ] Adicionar filtros por tipo de obrigação
- [ ] Adicionar busca avançada por nome e descrição
- [ ] Implementar testes unitários para obrigações específicas
- [ ] Validar interface com dados reais


## Fase 7: Página de Administração (EM PROGRESSO)
- [ ] Analisar e preparar backend para administração
- [ ] Implementar procedimentos tRPC para gerenciar usuários
- [ ] Implementar procedimentos tRPC para alterar permissões
- [ ] Criar página de administração com layout
- [ ] Adicionar aba de gerenciamento de usuários
- [ ] Adicionar aba de operações em lote
- [ ] Adicionar aba de log de atividades
- [ ] Implementar testes unitários para admin


## Fase 8: Filtros Avan\u00e7ados e Ordena\u00e7\u00e3o para Clientes
- [ ] Implementar componente de filtros avan\u00e7ados
- [ ] Adicionar filtro por regime tribut\u00e1rio
- [ ] Adicionar filtro por status (ativo/inativo)
- [ ] Adicionar ordena\u00e7\u00e3o por nome, data de cria\u00e7\u00e3o, regime
- [ ] Integrar filtros com backend (queries otimizadas)
- [ ] Implementar testes para filtros
- [ ] Testar e validar funcionalidade completa
