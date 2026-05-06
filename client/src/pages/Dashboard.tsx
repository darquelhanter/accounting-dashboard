import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Users, DollarSign, CheckCircle, AlertCircle, Clock, TrendingUp } from "lucide-react";

export default function Dashboard() {
  // Dados simulados baseados na planilha
  const kpis = [
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

  // Dados de status de recebimento
  const statusRecebimento = [
    { name: "Pago", value: 4, fill: "#10b981" },
    { name: "Pendente", value: 2, fill: "#f59e0b" },
    { name: "Atrasado", value: 0, fill: "#ef4444" }
  ];

  // Dados de evolução de receita
  const evolucaoReceita = [
    { mes: "Jan", recebido: 4500, previsto: 4500 },
    { mes: "Fev", recebido: 3200, previsto: 4500 },
    { mes: "Mar", recebido: 3800, previsto: 4500 },
    { mes: "Abr", recebido: 4100, previsto: 4500 },
    { mes: "Mai", recebido: 4300, previsto: 4500 },
    { mes: "Jun", recebido: 4500, previsto: 4500 }
  ];

  // Dados de status de obrigações
  const statusObrigacoes = [
    { status: "Feito", quantidade: 12, fill: "#10b981" },
    { status: "Pendente", quantidade: 5, fill: "#f59e0b" },
    { status: "Em Progresso", quantidade: 2, fill: "#3b82f6" },
    { status: "Bloqueado", quantidade: 1, fill: "#ef4444" }
  ];

  // Dados por setor
  const dadosSetor = [
    { setor: "Fiscal", clientes: 4, obrigacoes: 8 },
    { setor: "Trabalhista", clientes: 2, obrigacoes: 4 },
    { setor: "Contábil", clientes: 3, obrigacoes: 6 },
    { setor: "Geral", clientes: 1, obrigacoes: 2 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard Contábil</h1>
          <p className="text-slate-600">Gestão financeira e operacional do seu escritório</p>
        </div>

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
                    data={statusRecebimento}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusRecebimento.map((entry, index) => (
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
                <LineChart data={evolucaoReceita}>
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
                <BarChart data={dadosSetor}>
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
