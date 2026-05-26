import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Clock, DollarSign, Briefcase } from "lucide-react";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const ANOS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusBadge(status: string) {
  if (status === "Pago") return <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>;
  if (status === "Atrasado") return <Badge className="bg-red-100 text-red-800 border-red-200">Atrasado</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

export default function FluxoCaixa() {
  const [selectedMes, setSelectedMes] = useState(MESES[new Date().getMonth()]);
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear());
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroResponsavel, setFiltroResponsavel] = useState("Todos");

  const { data: responsaveis = [] } = trpc.responsaveis.list.useQuery();

  const responsavelIdParam = filtroResponsavel !== "Todos" ? Number(filtroResponsavel) : undefined;

  const { data: summary, isLoading: loadingSummary } = trpc.fluxoCaixa.getSummary.useQuery({
    mes: selectedMes,
    ano: selectedAno,
    responsavelId: responsavelIdParam,
  });

  const { data: anual, isLoading: loadingAnual } = trpc.fluxoCaixa.getAnual.useQuery({
    ano: selectedAno,
    responsavelId: responsavelIdParam,
  });

  const { data: transacoes, isLoading: loadingTransacoes } = trpc.fluxoCaixa.getTransacoes.useQuery({
    mes: selectedMes,
    ano: selectedAno,
    responsavelId: responsavelIdParam,
  });

  const transacoesFiltradas = useMemo(() => {
    if (!transacoes) return [];
    return transacoes.filter(t => {
      if (filtroTipo !== "Todos" && t.tipo !== filtroTipo) return false;
      if (filtroStatus !== "Todos" && t.status !== filtroStatus) return false;
      return true;
    });
  }, [transacoes, filtroTipo, filtroStatus]);

  const chartData = useMemo(() => {
    if (!anual) return [];
    return anual.map(d => ({
      mes: d.mes.substring(0, 3),
      Recebido: d.recebido,
      Pendente: d.pendente,
      Atrasado: d.atrasado,
    }));
  }, [anual]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fluxo de Caixa</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Consolidado de mensalidades e serviços prestados
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedMes} onValueChange={setSelectedMes}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(selectedAno)} onValueChange={v => setSelectedAno(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANOS.map(a => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os responsáveis</SelectItem>
              {(responsaveis as any[]).map((r: any) => (
                <SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <p className="text-xl font-bold text-green-700">{formatCurrency(summary?.recebido ?? 0)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-yellow-600" />
              Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <p className="text-xl font-bold text-yellow-700">{formatCurrency(summary?.pendente ?? 0)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              Atrasado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <p className="text-xl font-bold text-red-700">{formatCurrency(summary?.atrasado ?? 0)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-blue-600" />
              Mensalidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <p className="text-xl font-bold text-blue-700">{formatCurrency(summary?.mensalidadesRecebido ?? 0)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-purple-600" />
              Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <p className="text-xl font-bold text-purple-700">{formatCurrency(summary?.servicosRecebido ?? 0)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Anual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução Anual — {selectedAno}</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAnual ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Recebido" fill="#16a34a" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Pendente" fill="#ca8a04" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Atrasado" fill="#dc2626" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Transações do Mês */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">
              Transações — {selectedMes} {selectedAno}
            </CardTitle>
            <div className="flex gap-2">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-36 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os tipos</SelectItem>
                  <SelectItem value="Mensalidade">Mensalidade</SelectItem>
                  <SelectItem value="Serviço">Serviço</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingTransacoes ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : transacoesFiltradas.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Nenhuma transação encontrada para o período.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transacoesFiltradas.map((t, idx) => (
                  <TableRow key={`${t.tipo}-${t.id}-${idx}`}>
                    <TableCell className="font-medium">{t.cliente}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={t.tipo === "Mensalidade" ? "text-blue-700 border-blue-300" : "text-purple-700 border-purple-300"}>
                        {t.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.descricao}</TableCell>
                    <TableCell>{statusBadge(t.status ?? "Pendente")}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(t.valor)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.dataPagamento
                        ? new Date(t.dataPagamento).toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
