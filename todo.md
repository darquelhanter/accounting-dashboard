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
- [x] Revisar e melhorar a página de Mensalidades
- [x] Corrigir imports (useState, useMemo)
- [x] Adicionar validação de valores positivos
- [x] Implementar confirmação de exclusão com AlertDialog
- [x] Melhorar paginação com controles de navegação
- [x] Adicionar tooltips nos botões de ação

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

## Fase 7: Página de Administração (EM PROGRESSO)
- [ ] Analisar e preparar backend para administração
- [ ] Implementar procedimentos tRPC para gerenciar usuários
- [ ] Implementar procedimentos tRPC para alterar permissões
- [ ] Criar página de administração com layout
- [ ] Adicionar aba de gerenciamento de usuários
- [ ] Adicionar aba de operações em lote
- [ ] Adicionar aba de log de atividades
- [ ] Implementar testes unitários para admin

## Fase 8: Filtros Avançados e Ordenação para Clientes
- [ ] Implementar componente de filtros avançados
- [ ] Adicionar filtro por regime tributário
- [ ] Adicionar filtro por status (ativo/inativo)
- [ ] Adicionar ordenação por nome, data de criação, regime
- [ ] Integrar filtros com backend (queries otimizadas)
- [ ] Implementar testes para filtros
- [ ] Testar e validar funcionalidade completa

## Fase 9: Notificações por Email (EM PROGRESSO)
- [x] Implementar serviço de envio de emails (emailService.ts)
- [x] Criar procedimentos tRPC para notificações (notificacoes.ts)
- [x] Adicionar campo email à tabela clientes
- [x] Implementar lógica de alertas de obrigações próximas do vencimento
- [x] Implementar lógica de alertas de mensalidades atrasadas
- [x] Implementar lógica de alertas de checklist pendente
- [x] Registrar notificacoesRouter no appRouter
- [x] Adicionar testes unitários para notificações (10 testes passando)
- [ ] Criar interface de configuração de notificações
- [ ] Implementar agendamento automático de emails
- [ ] Testar e validar funcionalidade completa

## Fase 10: Notificações Automáticas para Mensalidades (CONCLUÍDA)
- [x] Analisar e planejar sistema de notificações automáticas
- [x] Instalar e configurar node-cron para agendamento de jobs
- [x] Criar schema para armazenar configurações de notificações
- [x] Implementar procedimentos tRPC para CRUD de configurações
- [x] Criar job de verificação de mensalidades próximas do vencimento
- [x] Integrar com emailService para envio automático
- [x] Criar interface de configuração de notificações
- [x] Adicionar link no menu lateral
- [x] Implementar testes unitários para configurações (7 testes passando)
- [x] Testar e validar funcionalidade completa (92 testes passando)

## Fase 11: Filtro de Obrigações Específicas para MEI (CONCLUÍDA)
- [x] Analisar e planejar obrigações específicas para MEI
- [x] Criar seed de obrigações MEI (DAS, declarações simplificadas, etc)
- [x] Implementar procedimento tRPC listByRegime para filtrar por regime
- [x] Implementar procedimento tRPC seedMEI com 5 obrigações
- [x] Criar interface de seleção automática de obrigações (botão + para MEI)
- [x] Adicionar filtro visual por regime na página de Obrigações
- [x] Implementar testes unitários (8 testes passando)
- [x] Testar e validar funcionalidade completa (101 testes passando)

## Fase 12: Detalhes de Notificações de Vencimento (CONCLUÍDA)
- [x] Analisar e planejar funcionalidade de detalhes
- [x] Criar componente Modal/Drawer para visualização (AlertDetailsModal.tsx)
- [x] Implementar procedimento tRPC obrigacoesProximasDetalhes
- [x] Integrar modal na página Home com clique
- [x] Adicionar tabelas com filtros e ordenação no modal
- [x] Todos os 101 testes passando
- [x] Testar e validar funcionalidade completa

## Fase 13: Ações Rápidas no Modal de Notificações (EM PROGRESSO)
- [ ] Analisar e planejar ações rápidas
- [ ] Implementar procedimento tRPC para marcar como concluído
- [ ] Criar diálogo de edição rápida
- [ ] Integrar botões de ação na tabela
- [ ] Adicionar confirmação de ações
- [ ] Implementar testes unitários
- [ ] Testar e validar funcionalidade completa

## Fase 14: Exclusão em Massa de Obrigações e Clientes (CONCLUÍDA)
- [x] Analisar e planejar exclusão em massa
- [x] Implementar procedimento tRPC deleteMany para obrigações
- [x] Implementar procedimento tRPC deleteMany para clientes
- [x] Adicionar checkboxes de seleção na tabela de obrigações
- [x] Adicionar checkboxes de seleção na tabela de clientes
- [x] Adicionar barra de ações para exclusão em massa
- [x] Todos os 101 testes passando
- [x] Testar e validar funcionalidade completa


## Fase 15: Exclusão em Massa para Checklist e Mensalidades + Correções (CONCLUÍDA)
- [x] Corrigir erro no modal de notificações (validação de valor)
- [x] Adicionar exclusão em massa para Checklist
- [x] Adicionar exclusão em massa para Mensalidades
- [x] Adicionar procedimento tRPC deleteMany para checklist
- [x] Adicionar procedimento tRPC deleteMany para mensalidades
- [x] Adicionar checkboxes de seleção na tabela de checklist
- [x] Adicionar checkboxes de seleção na tabela de mensalidades
- [x] Adicionar barra de ações para exclusão em massa em ambas
- [x] Todos os 101 testes passando
- [x] Testar e validar funcionalidade completa


## Correção: Status do Checklist Salvo Mês a Mês
- [x] Corrigir invalidate em ChecklistMensal para passar parâmetros específicos (mes, ano)
- [x] Garantir que alterações de status sejam salvas apenas para o mês/ano selecionado
- [x] Todos os 101 testes passando

## Fase 16: Múltipla Seleção de Meses para Mensalidades (CONCLUÍDA)
- [x] Adicionar seletor de meses no formulário de criação de mensalidades
- [x] Implementar lógica para criar múltiplas entradas (uma por mês selecionado)
- [x] Atualizar procedimento tRPC create para suportar batch
- [x] Adicionar testes unitários
- [x] Testar e validar funcionalidade completa

## Fase 17: Autenticação Customizada com Email/Senha (CONCLUÍDA)
- [x] Adicionar campos de senha ao schema de usuários
- [x] Implementar procedimentos tRPC para registro e login com email/senha
- [x] Criar página de login customizada com opção de Google
- [x] Criar página de registro de novo usuário
- [x] Implementar validação de email e força de senha
- [x] Adicionar testes unitários
- [x] Testar e validar funcionalidade completa

## Fase 18: Página de Perfil e Alterar Senha (CONCLUÍDA)
- [x] Criar página de perfil do usuário
- [x] Implementar funcionalidade de alterar senha
- [x] Adicionar link de perfil no menu de usuário
- [x] Migrar dados do usuário Google para autenticação local
- [x] Adicionar testes unitários
- [x] Testar e validar funcionalidade completa

## Fase 19: Sistema de Aprovação de Usuários (CONCLUÍDA)
- [x] Adicionar campo de status na tabela de usuários
- [x] Implementar procedimentos tRPC para aprovação/rejeição
- [x] Bloquear acesso para usuários não aprovados
- [x] Criar página de administração para aprovar usuários
- [x] Implementar notificação ao novo registro
- [x] Adicionar testes unitários
- [x] Testar e validar funcionalidade completa

## Fase 20: Exclusão em Massa de Usuários (CONCLUÍDA)
- [x] Implementar procedimento tRPC para deletar múltiplos usuários
- [x] Adicionar checkboxes na tabela de usuários
- [x] Adicionar barra de ações para exclusão em massa
- [x] Implementar confirmação de exclusão
- [x] Adicionar testes unitários
- [x] Testar e validar funcionalidade completa
