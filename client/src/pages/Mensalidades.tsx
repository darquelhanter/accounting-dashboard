import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
// Toast hook - usando console como fallback
const useToast = () => ({
  toast: ({ title, description, variant }: any) => {
    console.log(`[${variant || 'info'}] ${title}: ${description}`);
  },
});
import { Plus, Trash2, Edit2, CheckCircle2, AlertCircle } from "lucide-react";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const ANOS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

export default function Mensalidades() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMes, setSelectedMes] = useState(MESES[new Date().getMonth()]);
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [selectedCliente, setSelectedCliente] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    clienteId: "",
    valor: "",
    status: "Pendente" as "Pago" | "Pendente" | "Atrasado",
    dataPagamento: "",
  });

  // Queries
  const { data: mensalidades, isLoading, refetch } = trpc.mensalidades.listByMonth.useQuery({
    mes: selectedMes,
    ano: selectedAno,
  });

  const { data: clientes } = trpc.clientes.list.useQuery();
  const { data: totals } = trpc.mensalidades.getTotals.useQuery();

  // Mutations
  const createMutation = trpc.mensalidades.create.useMutation({
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Mensalidade criada com sucesso" });
      refetch();
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = trpc.mensalidades.update.useMutation({
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Mensalidade atualizada com sucesso" });
      refetch();
      setEditingId(null);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = trpc.mensalidades.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Mensalidade deletada com sucesso" });
      refetch();
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const markAsPaidMutation = trpc.mensalidades.markAsPaid.useMutation({
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Marcado como pago" });
      refetch();
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  // Filtered data
  const filteredMensalidades = useMemo(() => {
    if (!mensalidades) return [];
    return mensalidades.filter((m) => {
      const clienteName = clientes?.find((c) => c.id === m.clienteId)?.nome || "N/A";
      const matchesStatus = selectedStatus === "Todos" || m.status === selectedStatus;
      const matchesCliente = selectedCliente === "Todos" || m.clienteId.toString() === selectedCliente;
      const matchesSearch =
        clienteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.valor.toString().includes(searchTerm);
      return matchesStatus && matchesCliente && matchesSearch;
    });
  }, [mensalidades, selectedStatus, selectedCliente, searchTerm, clientes]);

  const resetForm = () => {
    setFormData({
      clienteId: "",
      valor: "",
      status: "Pendente",
      dataPagamento: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clienteId || !formData.valor) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        status: formData.status,
        valor: formData.valor,
        dataPagamento: formData.dataPagamento ? new Date(formData.dataPagamento) : undefined,
      });
    } else {
      await createMutation.mutateAsync({
        clienteId: parseInt(formData.clienteId),
        mes: selectedMes,
        ano: selectedAno,
        valor: formData.valor,
        status: formData.status,
        dataPagamento: formData.dataPagamento ? new Date(formData.dataPagamento) : undefined,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pago":
        return "bg-green-100 text-green-800";
      case "Pendente":
        return "bg-yellow-100 text-yellow-800";
      case "Atrasado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pago":
        return <CheckCircle2 className="w-4 h-4" />;
      case "Atrasado":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Controle de Mensalidades</h1>
          <p className="text-muted-foreground">Acompanhe o status de pagamento de suas mensalidades</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Mensalidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Nova"} Mensalidade</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Cliente *</label>
                <Select value={formData.clienteId} onValueChange={(v) => setFormData({ ...formData, clienteId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Valor *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Data de Pagamento</label>
                <Input
                  type="date"
                  value={formData.dataPagamento}
                  onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(totals?.total || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Todas as mensalidades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {(totals?.pago || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Mensalidades pagas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">R$ {(totals?.pendente || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Atrasado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {(totals?.atrasado || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Mensalidades atrasadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium">Mês</label>
            <Select value={selectedMes} onValueChange={setSelectedMes}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((mes) => (
                  <SelectItem key={mes} value={mes}>
                    {mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Ano</label>
            <Select value={selectedAno.toString()} onValueChange={(v) => setSelectedAno(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANOS.map((ano) => (
                  <SelectItem key={ano} value={ano.toString()}>
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Cliente</label>
            <Select value={selectedCliente} onValueChange={setSelectedCliente}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {clientes?.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
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

          <div>
            <label className="text-sm font-medium">Buscar</label>
            <Input
              placeholder="Cliente ou valor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Período</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Pagamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredMensalidades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma mensalidade encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredMensalidades.map((m) => {
                const cliente = clientes?.find((c) => c.id === m.clienteId);
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{cliente?.nome || "N/A"}</TableCell>
                    <TableCell>
                      {m.mes}/{m.ano}
                    </TableCell>
                    <TableCell className="text-right font-medium">R$ {parseFloat(m.valor.toString()).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={`gap-1 ${getStatusColor(m.status || "")}`}>
                        {getStatusIcon(m.status || "")}
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {m.dataPagamento && m.dataPagamento !== null
                        ? new Date(m.dataPagamento as any).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {m.status !== "Pago" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsPaidMutation.mutate({ id: m.id })}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setFormData({
                              clienteId: m.clienteId.toString(),
                              valor: m.valor.toString(),
                              status: m.status as any,
                              dataPagamento: m.dataPagamento && m.dataPagamento !== null
                                ? new Date(m.dataPagamento as any).toISOString().split("T")[0]
                                : "",
                            });
                            setEditingId(m.id);
                            setIsOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate({ id: m.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
