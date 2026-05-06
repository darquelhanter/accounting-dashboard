import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Users, DollarSign, CheckCircle, AlertCircle, Clock, TrendingUp, Upload, X } from "lucide-react";
import ExcelUpload from "@/components/ExcelUpload";
import AdvancedFilters, { FilterState } from "@/components/AdvancedFilters";
import { DashboardData } from "@/hooks/useExcelParser";
import { useFilteredData, useFilteredStats } from "@/hooks/useFilteredData";

export default function Dashboard() {
  const [showUpload, setShowUpload] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    clientes: [],
    statusObrigacoes: [],
    periodo: { inicio: '', fim: '' }
  });

  const filteredData = useFilteredData(dashboardData, filters);
  const filteredStats = useFilteredStats(filteredData);

  // Dados padrão (exemplo)
  const defaultKpis = [
    {
      title: "Total de Clientes",
      value: "8",
      subtitle: "6 ativos",
      icon: Users,
      color: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Receita Total",
      value: "R$ 4.500",
      subtitle: "Janeiro",
      icon: DollarSign,
      color: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      title: "Vencimento Dia 10",
      value: "3",
      subtitle: "cliente(s)",
      icon: CheckCircle,
      color: "bg-amber-50",
      iconColor: "text-amber-600"
    },
    {
      title: "Vencimento Dia 20",
      value: "3",
      subtitle: "cliente(s)",
      icon: AlertCircle,
      color: "bg-red-50",
      iconColor: "text-red-600"
    }
  ];

  // Gerar KPIs com base nos dados filtrados
  const generateFilteredKpis = () => {
    if (!filteredData) return defaultKpis;
    return [
      {
        title: "Total de Clientes",
        value: filteredStats.totalClientes.toString(),
        subtitle: `${filteredStats.totalClientes} selecionados`,
        icon: Users,
        color: "bg-blue-50",
        iconColor: "text-blue-600"
      },
      {
        title: "Receita Total",
        value: `R$ ${filteredStats.receitaTotal.toLocaleString('pt-BR')}`,
        subtitle: "Período selecionado",
        icon: DollarSign,
        color: "bg-green-50",
        iconColor: "text-green-600"
      },
      {
        title: "Vencimento Dia 10",
        value: filteredStats.vencimento10.toString(),
        subtitle: "cliente(s)",
        icon: CheckCircle,
        color: "bg-amber-50",
        iconColor: "text-amber-600"
      },
      {
        title: "Vencimento Dia 20",
        value: filteredStats.vencimento20.toString(),
        subtitle: "cliente(s)",
        icon: AlertCircle,
        color: "bg-red-50",
        iconColor: "text-red-600"
      }
    ];
  };

  const defaultStatusRecebimento = [
    { name: "Pago", value: 4, fill: "#10b981" },
    { name: "Pendente", value: 2, fill: "#f59e0b" },
    { name: "Atrasado", value: 0, fill: "#ef4444" }
  ];

  const defaultEvolucaoReceita = [
    { mes: "Jan", recebido: 4500, previsto: 4500 },
    { mes: "Fev", recebido: 3200, previsto: 4500 },
    { mes: "Mar", recebido: 3800, previsto: 4500 },
    { mes: "Abr", recebido: 4100, previsto: 4500 },
    { mes: "Mai", recebido: 4300, previsto: 4500 },
    { mes: "Jun", recebido: 4500, previsto: 4500 }
  ];

  const defaultStatusObrigacoes = [
    { status: "Feito", quantidade: 12, fill: "#10b981" },
    { status: "Pendente", quantidade: 5, fill: "#f59e0b" },
    { status: "Em Progresso", quantidade: 2, fill: "#3b82f6" },
    { status: "Bloqueado", quantidade: 1, fill: "#ef4444" }
  ];

  const defaultDadosSetor = [
    { setor: "Fiscal", clientes: 4, obrigacoes: 8 },
    { setor: "Trabalhista", clientes: 2, obrigacoes: 4 },
    { setor: "Contábil", clientes: 3, obrigacoes: 6 },
    { setor: "Geral", clientes: 1, obrigacoes: 2 }
  ];

  // Calcular KPIs a partir dos dados carregados
  const calculateKpis = (data: DashboardData) => {
    const clientesAtivos = data.clientes.filter(c => c.status === 'Ativo');
    const receitaTotal = clientesAtivos.reduce((sum, c) => sum + c.valor, 0);
    const vencimento10 = clientesAtivos.filter(c => c.vencimento === 10).length;
    const vencimento20 = clientesAtivos.filter(c => c.vencimento === 20).length;

    return [
      {
        title: "Total de Clientes",
        value: data.clientes.length.toString(),
        subtitle: `${clientesAtivos.length} ativos`,
        icon: Users,
        color: "bg-blue-50",
        iconColor: "text-blue-600"
      },
      {
        title: "Receita Total",
        value: `R$ ${receitaTotal.toLocaleString('pt-BR')}`,
        subtitle: "Mensal",
        icon: DollarSign,
        color: "bg-green-50",
        iconColor: "text-green-600"
      },
      {
        title: "Vencimento Dia 10",
        value: vencimento10.toString(),
        subtitle: "cliente(s)",
        icon: CheckCircle,
        color: "bg-amber-50",
        iconColor: "text-amber-600"
      },
      {
        title: "Vencimento Dia 20",
        value: vencimento20.toString(),
        subtitle: "cliente(s)",
        icon: AlertCircle,
        color: "bg-red-50",
        iconColor: "text-red-600"
      }
    ];
  };

  // Calcular status de obrigações
  const calculateStatusObrigacoes = (data: DashboardData) => {
    let feito = 0, pendente = 0, emProgresso = 0, bloqueado = 0;

    data.checklist.forEach(item => {
      Object.values(item.meses).forEach(status => {
        if (status === 'Feito') feito++;
        else if (status === 'Pendente') pendente++;
        else if (status === 'Em Progresso') emProgresso++;
        else if (status === 'Bloqueado') bloqueado++;
      });
    });

    return [
      { status: "Feito", quantidade: feito, fill: "#10b981" },
      { status: "Pendente", quantidade: pendente, fill: "#f59e0b" },
      { status: "Em Progresso", quantidade: emProgresso, fill: "#3b82f6" },
      { status: "Bloqueado", quantidade: bloqueado, fill: "#ef4444" }
    ];
  };

  const kpis = filteredData ? generateFilteredKpis() : defaultKpis;
  const statusObrigacoes = filteredData ? filteredStats.statusObrigacoes : defaultStatusObrigacoes;

  const handleDataLoaded = (data: DashboardData) => {
    setDashboardData(data);
    setShowUpload(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header com botão de upload e filtros */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard Contábil</h1>
            <p className="text-slate-600">Gestão financeira e operacional do seu escritório</p>
          </div>
          <div className="flex gap-3">
            {dashboardData && (
              <AdvancedFilters data={dashboardData} onFilterChange={setFilters} />
            )}
            <Button
              onClick={() => setShowUpload(!showUpload)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {showUpload ? (
                <>
                  <X className="w-4 h-4" />
                  Fechar
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Carregar Planilha
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Modal de Upload */}
        {showUpload && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Carregar Dados da Planilha</CardTitle>
            </CardHeader>
            <CardContent>
              <ExcelUpload onDataLoaded={handleDataLoaded} />
              <p className="text-xs text-slate-600 mt-4 text-center">
                Selecione o arquivo Excel com as abas: Cadastro Clientes, Obrigações, Checklist Obrigações e Controle Mensalidades
              </p>
            </CardContent>
          </Card>
        )}

        {/* Status de dados carregados */}
        {dashboardData && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Dados carregados com sucesso!</p>
                  <p className="text-sm text-green-700">{dashboardData.clientes.length} clientes, {dashboardData.obrigacoes.length} obrigações</p>
                  {Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : Object.values(f).some(v => v)) && (
                    <p className="text-xs text-green-600 mt-1">Filtros aplicados</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : Object.values(f).some(v => v)) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ clientes: [], statusObrigacoes: [], periodo: { inicio: '', fim: '' } })}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    Limpar Filtros
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDashboardData(null)}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  Limpar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Card key={index} className={`${kpi.color} border-0 shadow-sm hover:shadow-md transition-shadow`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">{kpi.title}</p>
                      <p className="text-3xl font-bold text-slate-900">{kpi.value}</p>
                      <p className="text-xs text-slate-500 mt-2">{kpi.subtitle}</p>
                    </div>
                    <Icon className={`${kpi.iconColor} w-8 h-8`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Gráficos Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status de Recebimento */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Status de Recebimento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={filteredData ? filteredStats.statusRecebimento : defaultStatusRecebimento}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(filteredData ? filteredStats.statusRecebimento : defaultStatusRecebimento).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Evolução de Receita */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Evolução de Receita (6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={defaultEvolucaoReceita}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="recebido" stroke="#10b981" strokeWidth={2} name="Recebido" />
                  <Line type="monotone" dataKey="previsto" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="Previsto" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Secundários */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status de Obrigações */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Status de Obrigações</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusObrigacoes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="status" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }}
                  />
                  <Bar dataKey="quantidade" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                    {statusObrigacoes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição por Setor */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Distribuição por Setor</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={defaultDadosSetor}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="setor" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }}
                  />
                  <Legend />
                  <Bar dataKey="clientes" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Clientes" />
                  <Bar dataKey="obrigacoes" fill="#06b6d4" radius={[8, 8, 0, 0]} name="Obrigações" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Resumo Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="border-0 shadow-sm bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="w-12 h-12 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600 mb-1">Crescimento Mensal</p>
                  <p className="text-2xl font-bold text-slate-900">+8.5%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
                <div>
                  <p className="text-sm text-slate-600 mb-1">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold text-slate-900">85%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Clock className="w-12 h-12 text-amber-600" />
                <div>
                  <p className="text-sm text-slate-600 mb-1">Pendências</p>
                  <p className="text-2xl font-bold text-slate-900">7</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
