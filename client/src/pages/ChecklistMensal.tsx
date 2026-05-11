import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2, Loader2, Search, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const STATUS_COLORS: Record<string, string> = {
  "Feito": "bg-green-100 text-green-800",
  "Pendente": "bg-yellow-100 text-yellow-800",
  "Em Progresso": "bg-blue-100 text-blue-800",
  "Bloqueado": "bg-red-100 text-red-800",
  "N/A": "bg-gray-100 text-gray-800",
};

interface ChecklistForm {
  clienteId: number;
  obrigacaoId: number;
  mes: string;
  ano: number;
  status: "Feito" | "Pendente" | "Em Progresso" | "Bloqueado" | "N/A";
  responsavel: string;
  horaInicial: string;
  horaFinal: string;
  totalHoras: string;
}

const initialForm: ChecklistForm = {
  clienteId: 0,
  obrigacaoId: 0,
  mes: MESES[new Date().getMonth()],
  ano: new Date().getFullYear(),
  status: "Pendente",
  responsavel: "",
  horaInicial: "",
  horaFinal: "",
  totalHoras: "",
};

const ITEMS_PER_PAGE = 10;

export default function ChecklistMensal() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ChecklistForm>(initialForm);
  const [selectedMes, setSelectedMes] = useState(MESES[new Date().getMonth()]);
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear());
  const [selectedCliente, setSelectedCliente] = useState<string>("Todos");
  const [selectedStatus, setSelectedStatus] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const utils = trpc.useUtils();
  const { data: clientes = [] } = trpc.clientes.list.useQuery();
  const { data: obrigacoes = [] } = trpc.obrigacoes.list.useQuery();
  const { data: checklistItems = [], isLoading } = trpc.checklist.listByMonth.useQuery({
    mes: selectedMes,
    ano: selectedAno,
  });

  const createMutation = trpc.checklist.create.useMutation();
  const updateMutation = trpc.checklist.update.useMutation();
  const deleteMutation = trpc.checklist.delete.useMutation();

  // Filtrar checklist
  const filteredChecklist = useMemo(() => {
    return checklistItems.filter((item: any) => {
      const cliente = clientes.find((c: any) => c.id === item.clienteId);
      const obrigacao = obrigacoes.find((o: any) => o.id === item.obrigacaoId);
      
      const matchCliente = selectedCliente === "Todos" || item.clienteId === parseInt(selectedCliente);
      const matchStatus = selectedStatus === "Todos" || item.status === selectedStatus;
      const matchSearch = !searchTerm || 
        cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obrigacao?.nome.toLowerCase().includes(searchTerm.toLowerCase());

      return matchCliente && matchStatus && matchSearch;
    });
  }, [checklistItems, clientes, obrigacoes, selectedCliente, selectedStatus, searchTerm]);

  // Paginar
  const totalPages = Math.ceil(filteredChecklist.length / ITEMS_PER_PAGE);
  const paginatedChecklist = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredChecklist.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredChecklist, currentPage]);

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        clienteId: item.clienteId,
        obrigacaoId: item.obrigacaoId,
        mes: item.mes,
        ano: item.ano,
        status: item.status,
        responsavel: item.responsavel || "",
        horaInicial: item.horaInicial || "",
        horaFinal: item.horaFinal || "",
        totalHoras: item.totalHoras?.toString() || "",
      });
    } else {
      setEditingId(null);
      setForm({
        ...initialForm,
        mes: selectedMes,
        ano: selectedAno,
      });
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.clienteId || !form.obrigacaoId) {
      toast.error("Cliente e Obrigação são obrigatórios");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            ...form,
            totalHoras: form.totalHoras ? parseFloat(form.totalHoras) : undefined,
          },
        });
        toast.success("Item atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync({
          ...form,
          totalHoras: form.totalHoras ? parseFloat(form.totalHoras) : undefined,
        });
        toast.success("Item criado com sucesso!");
      }
      utils.checklist.listByMonth.invalidate();
      setIsOpen(false);
      setForm(initialForm);
      setCurrentPage(1);
    } catch (error) {
      toast.error("Erro ao salvar item");
      console.error(error);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Item deletado com sucesso!");
      utils.checklist.listByMonth.invalidate();
    } catch (error) {
      toast.error("Erro ao deletar item");
      console.error(error);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { status: newStatus as any },
      });
      utils.checklist.listByMonth.invalidate();
      toast.success("Status atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    }
  };

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: filteredChecklist.length,
      feito: filteredChecklist.filter((i: any) => i.status === "Feito").length,
      pendente: filteredChecklist.filter((i: any) => i.status === "Pendente").length,
      emProgresso: filteredChecklist.filter((i: any) => i.status === "Em Progresso").length,
      bloqueado: filteredChecklist.filter((i: any) => i.status === "Bloqueado").length,
    };
  }, [filteredChecklist]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Checklist Mensal</h1>
          <p className="text-slate-600 mt-1">Acompanhe o status das obrigações por cliente</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Item" : "Novo Item de Checklist"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Cliente *</label>
                <Select 
                  value={form.clienteId.toString()} 
                  onValueChange={(value) => setForm({ ...form, clienteId: parseInt(value) })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Obrigação *</label>
                <Select 
                  value={form.obrigacaoId.toString()} 
                  onValueChange={(value) => setForm({ ...form, obrigacaoId: parseInt(value) })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione uma obrigação" />
                  </SelectTrigger>
                  <SelectContent>
                    {obrigacoes.map((o: any) => (
                      <SelectItem key={o.id} value={o.id.toString()}>
                        {o.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Status *</label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as any })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feito">Feito</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                    <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                    <SelectItem value="N/A">N/A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Responsável</label>
                <Input
                  value={form.responsavel}
                  onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                  placeholder="Nome do responsável"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Hora Inicial</label>
                  <Input
                    type="time"
                    value={form.horaInicial}
                    onChange={(e) => setForm({ ...form, horaInicial: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Hora Final</label>
                  <Input
                    type="time"
                    value={form.horaFinal}
                    onChange={(e) => setForm({ ...form, horaFinal: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Total de Horas</label>
                <Input
                  type="number"
                  step="0.5"
                  value={form.totalHoras}
                  onChange={(e) => setForm({ ...form, totalHoras: e.target.value })}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    editingId ? "Atualizar" : "Criar"
                  )}
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-sm text-slate-600">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.feito}</div>
              <div className="text-sm text-slate-600">Feito</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendente}</div>
              <div className="text-sm text-slate-600">Pendente</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.emProgresso}</div>
              <div className="text-sm text-slate-600">Em Progresso</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.bloqueado}</div>
              <div className="text-sm text-slate-600">Bloqueado</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Mês</label>
              <Select value={selectedMes} onValueChange={(value) => {
                setSelectedMes(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Ano</label>
              <Select value={selectedAno.toString()} onValueChange={(value) => {
                setSelectedAno(parseInt(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={a.toString()}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Cliente</label>
              <Select value={selectedCliente} onValueChange={(value) => {
                setSelectedCliente(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {clientes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select value={selectedStatus} onValueChange={(value) => {
                setSelectedStatus(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Feito">Feito</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                  <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                  <SelectItem value="N/A">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Buscar</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Cliente ou obrigação..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist - {selectedMes} de {selectedAno}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : paginatedChecklist.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                {filteredChecklist.length === 0 && checklistItems.length === 0
                  ? "Nenhum item de checklist para este mês"
                  : "Nenhum item encontrado com esses filtros"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Obrigação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedChecklist.map((item: any) => {
                      const cliente = clientes.find((c: any) => c.id === item.clienteId);
                      const obrigacao = obrigacoes.find((o: any) => o.id === item.obrigacaoId);
                      return (
                        <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium">{cliente?.nome || "N/A"}</TableCell>
                          <TableCell>{obrigacao?.nome || "N/A"}</TableCell>
                          <TableCell>
                            <Select value={item.status} onValueChange={(value) => handleStatusChange(item.id, value)}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Feito">Feito</SelectItem>
                                <SelectItem value="Pendente">Pendente</SelectItem>
                                <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                                <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                                <SelectItem value="N/A">N/A</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{item.responsavel || "-"}</TableCell>
                          <TableCell>{item.totalHoras ? `${item.totalHoras}h` : "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDialog(item)}
                                className="hover:bg-blue-50"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={deleteMutation.isPending}
                                    className="hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja deletar este item?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="flex gap-2 justify-end">
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(item.id)}
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
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-slate-600">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
