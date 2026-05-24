import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Edit2, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const ANOS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
const ITEMS_PER_PAGE = 10;

const SERVICOS_SUGERIDOS = [
  "Alteração Contratual",
  "Baixa de Empresa",
  "Regularização Fiscal",
  "Abertura de Empresa",
  "Declaração de Imposto de Renda",
  "Parcelamento de Débitos",
  "Certidão Negativa",
  "Consultoria Contábil",
  "Outro",
];

const STATUS_COLORS: Record<string, string> = {
  Pago: "bg-green-100 text-green-800",
  Pendente: "bg-yellow-100 text-yellow-800",
  Atrasado: "bg-red-100 text-red-800",
};

type FormData = {
  clienteId: string;
  nomeServico: string;
  nomeServicoCustom: string;
  descricao: string;
  valor: string;
  mes: string;
  ano: string;
  status: "Pago" | "Pendente" | "Atrasado";
  dataPagamento: string;
};

const EMPTY_FORM: FormData = {
  clienteId: "",
  nomeServico: "",
  nomeServicoCustom: "",
  descricao: "",
  valor: "",
  mes: MESES[new Date().getMonth()],
  ano: String(new Date().getFullYear()),
  status: "Pendente",
  dataPagamento: "",
};

export default function ServicosPrestados() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMes, setSelectedMes] = useState(MESES[new Date().getMonth()]);
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [selectedCliente, setSelectedCliente] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

  const { data: servicos, isLoading, refetch } = trpc.servicos.listByMonth.useQuery({
    mes: selectedMes,
    ano: selectedAno,
  });

  const { data: clientes } = trpc.clientes.list.useQuery();

  const createMutation = trpc.servicos.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsOpen(false);
      setFormData(EMPTY_FORM);
      toast.success("Serviço criado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.servicos.update.useMutation({
    onSuccess: () => {
      refetch();
      setIsOpen(false);
      setEditingId(null);
      setFormData(EMPTY_FORM);
      toast.success("Serviço atualizado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const markAsPaidMutation = trpc.servicos.markAsPaid.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Marcado como pago!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.servicos.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Serviço excluído!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteManyMutation = trpc.servicos.deleteMany.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedIds([]);
      toast.success("Serviços excluídos!");
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = (servicos ?? []).filter((s) => {
    const clienteNome = clientes?.find((c) => c.id === s.clienteId)?.nome ?? "";
    const matchCliente = selectedCliente === "Todos" || String(s.clienteId) === selectedCliente;
    const matchStatus = selectedStatus === "Todos" || s.status === selectedStatus;
    const matchSearch =
      !searchTerm ||
      s.nomeServico.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clienteNome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCliente && matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalValor = filtered.reduce((acc, s) => acc + parseFloat(s.valor ?? "0"), 0);
  const totalPago = filtered
    .filter((s) => s.status === "Pago")
    .reduce((acc, s) => acc + parseFloat(s.valor ?? "0"), 0);
  const totalPendente = filtered
    .filter((s) => s.status !== "Pago")
    .reduce((acc, s) => acc + parseFloat(s.valor ?? "0"), 0);

  function openCreate() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsOpen(true);
  }

  function openEdit(servico: any) {
    setEditingId(servico.id);
    const nome = SERVICOS_SUGERIDOS.includes(servico.nomeServico)
      ? servico.nomeServico
      : "Outro";
    setFormData({
      clienteId: String(servico.clienteId),
      nomeServico: nome,
      nomeServicoCustom: nome === "Outro" ? servico.nomeServico : "",
      descricao: servico.descricao ?? "",
      valor: servico.valor ?? "",
      mes: servico.mes,
      ano: String(servico.ano),
      status: servico.status ?? "Pendente",
      dataPagamento: servico.dataPagamento
        ? new Date(servico.dataPagamento).toISOString().split("T")[0]
        : "",
    });
    setIsOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nomeServico =
      formData.nomeServico === "Outro" ? formData.nomeServicoCustom : formData.nomeServico;

    if (!formData.clienteId || !nomeServico || !formData.valor || !formData.mes || !formData.ano) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const payload = {
      clienteId: Number(formData.clienteId),
      nomeServico,
      descricao: formData.descricao || undefined,
      valor: formData.valor,
      mes: formData.mes,
      ano: Number(formData.ano),
      status: formData.status,
      dataPagamento: formData.dataPagamento ? new Date(formData.dataPagamento) : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (selectedIds.length === paginated.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map((s) => s.id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Serviços Prestados</h1>
          <p className="text-gray-500 text-sm mt-1">Registre serviços esporádicos cobrados por cliente</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
            <p className="text-xs text-gray-500">{filtered.length} serviço(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              {totalPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">A Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-700">
              {totalPendente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedMes} onValueChange={(v) => { setSelectedMes(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MESES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={String(selectedAno)} onValueChange={(v) => { setSelectedAno(Number(v)); setCurrentPage(1); }}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ANOS.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={selectedCliente} onValueChange={(v) => { setSelectedCliente(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos os clientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os clientes</SelectItem>
            {clientes?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Pago">Pago</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Atrasado">Atrasado</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Buscar serviço ou cliente..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-56"
        />

        {selectedIds.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex items-center gap-1">
                <Trash2 className="h-4 w-4" />
                Excluir ({selectedIds.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir serviços selecionados?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => deleteManyMutation.mutate({ ids: selectedIds })}
                >
                  Excluir
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={paginated.length > 0 && selectedIds.length === paginated.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Mês/Ano</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  Nenhum serviço encontrado para este período.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((servico) => {
                const clienteNome = clientes?.find((c) => c.id === servico.clienteId)?.nome ?? "—";
                return (
                  <TableRow key={servico.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(servico.id)}
                        onCheckedChange={() => toggleSelect(servico.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{clienteNome}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{servico.nomeServico}</p>
                        {servico.descricao && (
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{servico.descricao}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{servico.mes}/{servico.ano}</TableCell>
                    <TableCell className="font-semibold">
                      {parseFloat(servico.valor ?? "0").toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[servico.status ?? "Pendente"]}>
                        {servico.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {servico.status !== "Pago" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Marcar como pago"
                            onClick={() => markAsPaidMutation.mutate({ id: servico.id })}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => openEdit(servico)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Excluir">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex justify-end gap-2 mt-4">
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => deleteMutation.mutate({ id: servico.id })}
                              >
                                Excluir
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {filtered.length} resultado(s) — página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal de criação/edição */}
      <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if (!v) { setEditingId(null); setFormData(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Serviço" : "Novo Serviço Prestado"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Cliente *</Label>
              <Select
                value={formData.clienteId}
                onValueChange={(v) => setFormData((f) => ({ ...f, clienteId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Tipo de Serviço *</Label>
              <Select
                value={formData.nomeServico}
                onValueChange={(v) => setFormData((f) => ({ ...f, nomeServico: v, nomeServicoCustom: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICOS_SUGERIDOS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.nomeServico === "Outro" && (
                <Input
                  className="mt-2"
                  placeholder="Descreva o serviço"
                  value={formData.nomeServicoCustom}
                  onChange={(e) => setFormData((f) => ({ ...f, nomeServicoCustom: e.target.value }))}
                />
              )}
            </div>

            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhes adicionais (opcional)"
                value={formData.descricao}
                onChange={(e) => setFormData((f) => ({ ...f, descricao: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-1">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.valor}
                onChange={(e) => setFormData((f) => ({ ...f, valor: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Mês do Serviço *</Label>
                <Select
                  value={formData.mes}
                  onValueChange={(v) => setFormData((f) => ({ ...f, mes: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Ano *</Label>
                <Select
                  value={formData.ano}
                  onValueChange={(v) => setFormData((f) => ({ ...f, ano: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANOS.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData((f) => ({ ...f, status: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === "Pago" && (
                <div className="space-y-1">
                  <Label>Data de Pagamento</Label>
                  <Input
                    type="date"
                    value={formData.dataPagamento}
                    onChange={(e) => setFormData((f) => ({ ...f, dataPagamento: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsOpen(false); setEditingId(null); setFormData(EMPTY_FORM); }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Salvar" : "Criar Serviço"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
