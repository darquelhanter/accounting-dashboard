import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, DollarSign, CheckCircle, AlertCircle } from "lucide-react";

// Dados de exemplo baseados na planilha
const clientesData = [
  { name: "novo1", status: "Pago", valor: 300, vencimento: 20 }
];

const statusFinanceiro = [
  { name: "Pago", value: 1, fill: "#10b981" },
  { name: "Pendente", value: 0, fill: "#f59e0b" },
  { name: "Atrasado", value: 0, fill: "#ef4444" }
];

const receitaMensal = [
  { mes: "Jan", recebido: 300, previsto: 300 },
  { mes: "Fev", recebido: 0, previsto: 300 },
  { mes: "Mar", recebido: 0, previsto: 300 },
  { mes: "Abr", recebido: 0, previsto: 300 },
  { mes: "Mai", recebido: 0, previsto: 300 },
  { mes: "Jun", recebido: 0, previsto: 300 }
];

const obrigacoesPorMes = [
  { mes: "Jan", feito: 1, pendente: 0 },
  { mes: "Fev", feito: 0, pendente: 1 },
  { mes: "Mar", feito: 0, pendente: 1 },
  { mes: "Abr", feito: 0, pendente: 1 },
  { mes: "Mai", feito: 0, pendente: 1 },
  { mes: "Jun", feito: 0, pendente: 1 }
];

export default function Dashboard() {
  const totalClientes = clientesData.length;
  const clientesAtivos = clientesData.filter(c => c.status === "Pago").length;
  const receitaTotal = clientesData.reduce((sum, c) => sum + c.valor, 0);
  const vencimento10 = clientesData.filter(c => c.vencimento === 10).length;
  const vencimento20 = clientesData.filter(c => c.vencimento === 20).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard Contábil</h1>
          <p className="text-slate-600">Gestão financeira e operacional do seu escritório</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalClientes}</div>
              <p className="text-xs text-slate-500 mt-1">{clientesAtivos} ativos</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">R$ {receitaTotal.toLocaleString('pt-BR')}</div>
              <p className="text-xs text-slate-500 mt-1">Janeiro</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Vencimento Dia 10</CardTitle>
              <CheckCircle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{vencimento10}</div>
              <p className="text-xs text-slate-500 mt-1">cliente(s)</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Vencimento Dia 20</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{vencimento20}</div>
              <p className="text-xs text-slate-500 mt-1">cliente(s)</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Status Financeiro */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Status de Recebimento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusFinanceiro} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {statusFinanceiro.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Evolução de Receita */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Evolução de Receita (6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={receitaMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }} />
                  <Legend />
                  <Line type="monotone" dataKey="recebido" stroke="#10b981" strokeWidth={2} name="Recebido" />
                  <Line type="monotone" dataKey="previsto" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Previsto" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Obrigações */}
        <div className="grid grid-cols-1 gap-8">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Status de Obrigações (6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={obrigacoesPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }} />
                  <Legend />
                  <Bar dataKey="feito" stackId="a" fill="#10b981" name="Feito" />
                  <Bar dataKey="pendente" stackId="a" fill="#f59e0b" name="Pendente" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
