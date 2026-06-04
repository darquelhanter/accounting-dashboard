import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, FileText, DollarSign, CheckSquare, Users, Briefcase, FolderOpen } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AlertRow, AlertIndicator } from "@/components/AlertBadge";
import { AlertDetailsModal } from "@/components/AlertDetailsModal";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const isApproved = isAuthenticated && (user?.role === 'admin' || user?.status === 'approved');

  // Carregar alertas
  const { data: alertasSumario } = trpc.alertas.sumario.useQuery(undefined, {
    enabled: isApproved,
  });

  // Carregar KPIs
  const { data: kpis } = trpc.alertas.kpis.useQuery(undefined, {
    enabled: isApproved,
  });

  if (loading) return null;

  if (!isAuthenticated) {
    navigate("/admin/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo, {user?.name || "Usuário"}!
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie seu escritório contábil com eficiência
          </p>
        </div>

        {/* Alertas */}
        {alertasSumario && (alertasSumario.obrigacoesProximas > 0 || alertasSumario.mensalidadesAtrasadas > 0 || alertasSumario.mensalidadesPendentes > 0) && (
          <div className="flex gap-3 flex-wrap">
            {alertasSumario.obrigacoesProximas > 0 && (
              <AlertDetailsModal type="proximo" count={alertasSumario.obrigacoesProximas} label="Obrigacoes proximas" />
            )}
            {alertasSumario.mensalidadesAtrasadas > 0 && (
              <AlertDetailsModal type="atrasado" count={alertasSumario.mensalidadesAtrasadas} label="Mensalidades atrasadas" />
            )}
            {alertasSumario.mensalidadesPendentes > 0 && (
              <AlertDetailsModal type="pendente" count={alertasSumario.mensalidadesPendentes} label="Mensalidades pendentes" />
            )}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
            onClick={() => navigate("/clientes")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.totalClientes || 0}</div>
              <p className="text-xs text-gray-500">Ver empresas →</p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer hover:border-orange-300"
            onClick={() => navigate("/checklist")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Obrigações Pendentes</CardTitle>
              <FileText className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.obrigacoesPendentes || 0}</div>
              <p className="text-xs text-gray-500">Ver checklist →</p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer hover:border-red-300"
            onClick={() => navigate("/mensalidades")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensalidades Atrasadas</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.mensalidadesAtrasadas || 0}</div>
              <p className="text-xs text-gray-500">Ver mensalidades →</p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer hover:border-green-300"
            onClick={() => navigate("/checklist")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
              <CheckSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.taxaConclusao || 0}%</div>
              <p className="text-xs text-gray-500">Ver checklist →</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/clientes")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Gestão de Clientes
                  </CardTitle>
                  <CardDescription>Cadastre e gerencie seus clientes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Mantenha um registro completo de todos os seus clientes, incluindo dados de contato, regime tributário e valores de mensalidade.
              </p>
              <div className="flex items-center text-blue-600 font-medium text-sm">
                Acessar <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/obrigacoes")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Obrigações
                  </CardTitle>
                  <CardDescription>Controle de tarefas contábeis</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Gerencie obrigações fiscais, acessórias e trabalhistas. Mantenha o controle de prazos e entregas.
              </p>
              <div className="flex items-center text-orange-600 font-medium text-sm">
                Acessar <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/mensalidades")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Mensalidades
                  </CardTitle>
                  <CardDescription>Gestão de pagamentos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Acompanhe o status de pagamento de suas mensalidades e identifique cobranças pendentes.
              </p>
              <div className="flex items-center text-green-600 font-medium text-sm">
                Acessar <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/checklist")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-purple-600" />
                    Checklist Mensal
                  </CardTitle>
                  <CardDescription>Acompanhamento de tarefas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Marque o status das obrigações mensais para cada cliente e acompanhe o progresso.
              </p>
              <div className="flex items-center text-purple-600 font-medium text-sm">
                Acessar <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/documentos")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-indigo-600" />
                    Documentos
                  </CardTitle>
                  <CardDescription>Armazenamento de arquivos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Envie e armazene documentos por empresa. Acesse e baixe contratos, declarações e outros arquivos quando precisar.
              </p>
              <div className="flex items-center text-indigo-600 font-medium text-sm">
                Acessar <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/servicos-prestados")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-cyan-600" />
                    Serviços Prestados
                  </CardTitle>
                  <CardDescription>Cobranças esporádicas por cliente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Registre serviços avulsos como alteração contratual, baixa de empresa, regularização e outros com valor e mês definidos.
              </p>
              <div className="flex items-center text-cyan-600 font-medium text-sm">
                Acessar <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Dica:</h3>
          <p className="text-gray-700">
            Comece cadastrando seus clientes para ter uma base sólida. Depois, configure as obrigações e comece a acompanhar o progresso mensal.
          </p>
        </div>
      </div>
    </div>
  );
}
