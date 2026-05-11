import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckSquare, DollarSign, ArrowRight, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AlertRow, AlertIndicator } from "@/components/AlertBadge";
import { AlertDetailsModal } from "@/components/AlertDetailsModal";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  // Carregar alertas
  const { data: alertasSumario } = trpc.alertas.sumario.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  // Carregar KPIs
  const { data: kpis } = trpc.alertas.kpis.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Controle Contábil</h1>
            <p className="text-gray-600">Gerencie seus clientes, obrigações e mensalidades em um único lugar</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bem-vindo!</h2>
            <p className="text-gray-600 mb-6">
              Faça login para acessar seu dashboard de gestão contábil e começar a controlar seu escritório.
            </p>
            <Button 
              onClick={() => window.location.href = getLoginUrl()}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Fazer Login
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Gestão de Clientes</p>
            </div>
            <div className="text-center">
              <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Obrigações</p>
            </div>
            <div className="text-center">
              <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Mensalidades</p>
            </div>
          </div>
        </div>
      </div>
    );
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.totalClientes || 0}</div>
              <p className="text-xs text-gray-600">Clientes cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Obrigações Pendentes</CardTitle>
              <FileText className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.obrigacoesPendentes || 0}</div>
              <p className="text-xs text-gray-600">Tarefas a fazer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensalidades Atrasadas</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.mensalidadesAtrasadas || 0}</div>
              <p className="text-xs text-gray-600">Cobranças pendentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
              <CheckSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis?.taxaConclusao || 0}%</div>
              <p className="text-xs text-gray-600">Obrigações concluídas</p>
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

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Dashboard
                  </CardTitle>
                  <CardDescription>Visualizações e relatórios</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Veja gráficos e indicadores do seu escritório. Analise tendências e tome decisões baseadas em dados.
              </p>
              <div className="flex items-center text-indigo-600 font-medium text-sm">
                Em breve <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-cyan-600" />
                    Importar Excel
                  </CardTitle>
                  <CardDescription>Carregar dados da planilha</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Importe dados da sua planilha Excel para sincronizar com o sistema.
              </p>
              <div className="flex items-center text-cyan-600 font-medium text-sm">
                Em breve <ArrowRight className="h-4 w-4 ml-2" />
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
