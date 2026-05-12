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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Edit2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { AlertBadge, AlertRow, AlertIndicator } from "@/components/AlertBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

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
const ITEMS_PER_PAGE = 10;

export default function Mensalidades() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMes, setSelectedMes] = useState(MESES[new Date().getMonth()]);
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [selectedCliente, setSelectedCliente] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

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
  
  // Carregar alertas de mensalidades
  const { data: mensalidadesAtrasadas = [] } = trpc.alertas.mensalidadesAtrasadas.useQuery();
  const { data: mensalidadesPendentes = [] } = trpc.alertas.mensalidadesPendentes.useQuery({ diasAntecedencia: 3 });

  // Mutations
  const createMutation = trpc.mensalidades.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Erro ao criar mensalidade:", error);
    },
  });

  const updateMutation = trpc.mensalidades.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
      resetForm();
    },
    onError: (error) => {
      console.error("Erro ao atualizar mensalidade:", error);
    },
  });

  const deleteMutation = trpc.mensalidades.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      console.error("Erro ao deletar mensalidade:", error);
    },
  });

  const markAsPaidMutation = trpc.mensalidades.markAsPaid.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Erro ao marcar como pago:", error);
    },
  });

  const deleteManyMutation = trpc.mensalidades.deleteMany.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedIds([]);
      toast.success(`${selectedIds.length} mensalidade(s) deletada(s)!`);
    },
    onError: (error) => {
      toast.error('Erro ao deletar mensalidades');
      console.error(error);
    },
  });

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedMensalidades.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedMensalidades.map((item: any) => item.id));
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDeleteMany = async () => {
    try {
      await deleteManyMutation.mutateAsync({ ids: selectedIds });
    } catch (error) {
      console.error(error);
    }
  };

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

  // Pagination
  const totalPages = Math.ceil(filteredMensalidades.length / ITEMS_PER_PAGE);
  const paginatedMensalidades = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMensalidades.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMensalidades, currentPage]);

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
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    const valor = parseFloat(formData.valor);
    if (isNaN(valor) || valor <= 0) {
      alert("O valor deve ser um número positivo");
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
      {/* Alertas */}
      {mensalidadesAtrasadas && mensalidadesAtrasadas.length > 0 && (
        <AlertRow
          type="atrasado"
          title={`${mensalidadesAtrasadas.length} mensalidade(s) em atraso`}
          subtitle="Atenção: Existem cobranças pendentes que precisam de ação imediata"
        />
      )}
      
      {mensalidadesPendentes && mensalidadesPendentes.length > 0 && (
        <AlertRow
          type="pendente"
          title={`${mensalidadesPendentes.length} mensalidade(s) próxima(s) do vencimento`}
          subtitle="Verifique os prazos de pagamento"
        />
      )}

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
                <label className="text-sm font-medium">Valor (R$) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
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
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === paginatedMensalidades.length && paginatedMensalidades.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
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
              paginatedMensalidades.map((m) => {
                const cliente = clientes?.find((c) => c.id === m.clienteId);
                return (
                  <TableRow key={m.id}>
                    <TableCell className="w-12">
                      <Checkbox
                        checked={selectedIds.includes(m.id)}
                        onCheckedChange={() => handleSelectOne(m.id)}
                      />
                    </TableCell>
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
                            disabled={markAsPaidMutation.isPending}
                            title="Marcar como pago"
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
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog open={deleteId === m.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteId(m.id)}
                              title="Deletar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja deletar esta mensalidade? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex gap-2 justify-end">
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate({ id: m.id })}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Deletar
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Barra de ações para seleção múltipla */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-900">
            {selectedIds.length} mensalidade(s) selecionada(s)
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                disabled={deleteManyMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
                Deletar Selecionadas
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja deletar {selectedIds.length} mensalidade(s)? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex gap-2 justify-end">
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteMany}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Deletar
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Pagination */}
      {filteredMensalidades.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredMensalidades.length)} de {filteredMensalidades.length} mensalidades
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
