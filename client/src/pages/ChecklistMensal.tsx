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
import { Checkbox } from "@/components/ui/checkbox";

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
  obrigacaoIds?: number[];
  mes: string;
  ano: number;
  status: "Feito" | "Pendente" | "Em Progresso" | "Bloqueado" | "N/A";
  responsavel: string;
  mesesSelecionados?: number[];
}

const initialForm: ChecklistForm = {
  clienteId: 0,
  obrigacaoId: 0,
  obrigacaoIds: [],
  mes: MESES[new Date().getMonth()],
  ano: new Date().getFullYear(),
  status: "Pendente",
  responsavel: "",
  mesesSelecionados: [],
};

const ITEMS_PER_PAGE = 10;

export default function ChecklistMensal() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ChecklistForm>(initialForm);
  const [selectedMes, setSelectedMes] = useState(MESES[new Date().getMonth()]);
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear());
  const [selectedCliente, setSelectedCliente] = useState<string>("Todos");
  const [selectedObrigacao, setSelectedObrigacao] = useState<string>("Todos");
  const [selectedStatus, setSelectedStatus] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

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
  const deleteManyMutation = trpc.checklist.deleteMany.useMutation();

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedChecklist.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedChecklist.map((item: any) => item.id));
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
      toast.success(`${selectedIds.length} item(ns) deletado(s)!`);
      setSelectedIds([]);
      utils.checklist.listByMonth.invalidate();
    } catch (error) {
      toast.error('Erro ao deletar itens');
      console.error(error);
    }
  };

  // Filtrar checklist
  const filteredChecklist = useMemo(() => {
    return checklistItems.filter((item: any) => {
      const cliente = clientes.find((c: any) => c.id === item.clienteId);
      const obrigacao = obrigacoes.find((o: any) => o.id === item.obrigacaoId);
      
      const matchCliente = selectedCliente === "Todos" || item.clienteId === parseInt(selectedCliente);
      const matchObrigacao = selectedObrigacao === "Todos" || item.obrigacaoId === parseInt(selectedObrigacao);
      const matchStatus = selectedStatus === "Todos" || item.status === selectedStatus;
      const matchSearch = !searchTerm ||
        cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obrigacao?.nome.toLowerCase().includes(searchTerm.toLowerCase());

      return matchCliente && matchObrigacao && matchStatus && matchSearch;
    });
  }, [checklistItems, clientes, obrigacoes, selectedCliente, selectedObrigacao, selectedStatus, searchTerm]);

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
    if (!form.clienteId || (!form.obrigacaoId && (!form.obrigacaoIds || form.obrigacaoIds.length === 0))) {
      toast.error("Cliente e Obrigação(s) são obrigatórios");
      return;
    }

    if (!editingId && (!form.mesesSelecionados || form.mesesSelecionados.length === 0)) {
      toast.error("Selecione pelo menos um mês");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: { ...form },
        });
        toast.success("Item atualizado com sucesso!");
      } else {
        const mesesSelecionados = form.mesesSelecionados || [];
        const obrigacaoIds = form.obrigacaoIds && form.obrigacaoIds.length > 0 ? form.obrigacaoIds : [form.obrigacaoId];
        let totalCriados = 0;

        for (const obrigacaoId of obrigacaoIds) {
          for (const mesIndex of mesesSelecionados) {
            await createMutation.mutateAsync({
              ...form,
              obrigacaoId,
              mes: MESES[mesIndex],
            });
            totalCriados++;
          }
        }
        toast.success(`${totalCriados} item(ns) criado(s) com sucesso!`);
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
      utils.checklist.listByMonth.invalidate({ mes: selectedMes, ano: selectedAno });
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
                <label className="text-sm font-medium text-slate-700">Obrigações * (Selecione uma ou mais)</label>
                <div className="mt-1 border border-slate-300 rounded-md p-3 max-h-48 overflow-y-auto bg-white">
                  {obrigacoes.map((o: any) => (
                    <div key={o.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`obrigacao-${o.id}`}
                        checked={(form.obrigacaoIds || []).includes(o.id)}
                        onChange={(e) => {
                          const ids = form.obrigacaoIds || [];
                          if (e.target.checked) {
                            setForm({ ...form, obrigacaoIds: [...ids, o.id] });
                          } else {
                            setForm({ ...form, obrigacaoIds: ids.filter(id => id !== o.id) });
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 cursor-pointer"
                      />
                      <label htmlFor={`obrigacao-${o.id}`} className="ml-2 text-sm cursor-pointer">
                        {o.nome}
                      </label>
                    </div>
                  ))}
                </div>
                {(!form.obrigacaoIds || form.obrigacaoIds.length === 0) && (
                  <p className="text-xs text-red-600 mt-1">Selecione pelo menos uma obrigação</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Selecione os Meses *</label>
                <div className="grid grid-cols-3 gap-2 mt-2 p-3 border rounded-lg bg-slate-50">
                  {MESES.map((mes, index) => (
                    <div key={mes} className="flex items-center space-x-2">
                      <Checkbox
                        id={`mes-${index}`}
                        checked={(form.mesesSelecionados || []).includes(index)}
                        onCheckedChange={(checked) => {
                          const meses = form.mesesSelecionados || [];
                          if (checked) {
                            setForm({ ...form, mesesSelecionados: [...meses, index] });
                          } else {
                            setForm({ ...form, mesesSelecionados: meses.filter(m => m !== index) });
                          }
                        }}
                      />
                      <label htmlFor={`mes-${index}`} className="text-sm cursor-pointer">{mes.slice(0, 3)}</label>
                    </div>
                  ))}
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
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
              <label className="text-sm font-medium text-slate-700">Obrigação</label>
              <Select value={selectedObrigacao} onValueChange={(value) => {
                setSelectedObrigacao(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todas</SelectItem>
                  {obrigacoes.map((o: any) => (
                    <SelectItem key={o.id} value={o.id.toString()}>
                      {o.nome}
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

            <div>
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
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.length === paginatedChecklist.length && paginatedChecklist.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Obrigação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedChecklist.map((item: any) => {
                      const cliente = clientes.find((c: any) => c.id === item.clienteId);
                      const obrigacao = obrigacoes.find((o: any) => o.id === item.obrigacaoId);
                      return (
                        <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="w-12">
                            <Checkbox
                              checked={selectedIds.includes(item.id)}
                              onCheckedChange={() => handleSelectOne(item.id)}
                            />
                          </TableCell>
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

              {/* Barra de ações para seleção múltipla */}
              {selectedIds.length > 0 && (
                <div className="flex items-center justify-between mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-900">
                    {selectedIds.length} item(ns) selecionado(s)
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
                        Deletar Selecionados
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja deletar {selectedIds.length} item(ns)? Esta ação não pode ser desfeita.
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
