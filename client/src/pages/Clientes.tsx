import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Edit2, Trash2, Loader2, Trash, ChevronRight, ChevronLeft, Search, CheckCircle2, XCircle, UserPlus, Key, ShieldCheck, ShieldOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ClienteFilters } from "@/components/ClienteFilters";
import { Checkbox } from "@/components/ui/checkbox";

interface SocioTemp {
  nome: string;
  cpf: string;
  participacao: string;
  cargo: string;
}

const initialSocioForm: SocioTemp = { nome: "", cpf: "", participacao: "", cargo: "" };

interface ClienteForm {
  cnpj: string;
  nome: string;
  email: string;
  telefone: string;
  responsavelId: string;
  regime: "Simples" | "Lucro Presumido" | "Lucro Real" | "MEI";
  setor: "Fiscal" | "Trabalhista" | "Contábil" | "Geral";
  valor: string;
  vencimento: string;
  status: "Ativo" | "Inativo";
  obrigacaoIds: number[];
  mesesMensalidade: number[];
}

function formatCPF(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

function formatCNPJ(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
               "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const initialForm: ClienteForm = {
  cnpj: "",
  nome: "",
  email: "",
  telefone: "",
  responsavelId: "",
  regime: "Simples",
  setor: "Geral",
  valor: "",
  vencimento: "10",
  status: "Ativo",
  obrigacaoIds: [],
  mesesMensalidade: Array.from({ length: 12 }, (_, i) => i),
};

const regimes = ["Simples", "Lucro Presumido", "Lucro Real", "MEI"];
const ITEMS_PER_PAGE = 10;

export default function Clientes() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ClienteForm>(initialForm);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [sociosTemp, setSociosTemp] = useState<SocioTemp[]>([]);
  const [socioForm, setSocioForm] = useState<SocioTemp>(initialSocioForm);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjStatus, setCnpjStatus] = useState<"ok" | "erro" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"Ativo" | "Inativo">("Ativo");
  const [filterRegime, setFilterRegime] = useState<string>("Todos");
  const [sortBy, setSortBy] = useState<string>("nome");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const utils = trpc.useUtils();
  const { data: clientes = [], isLoading } = trpc.clientes.list.useQuery();
  const { data: todasObrigacoes = [] } = trpc.obrigacoes.list.useQuery();
  const { data: responsaveis = [] } = trpc.responsaveis.list.useQuery();
  const createMutation = trpc.clientes.create.useMutation();
  const updateMutation = trpc.clientes.update.useMutation();
  const deleteMutation = trpc.clientes.delete.useMutation();
  const deleteManyMutation = trpc.clientes.deleteMany.useMutation();
  const createSocioMutation = trpc.socios.create.useMutation();
  const seedMEIMutation = trpc.obrigacoes.seedMEI.useMutation({
    onSuccess: () => {
      toast.success("Obrigacoes MEI adicionadas com sucesso!");
      utils.obrigacoes.list.invalidate();
    },
    onError: () => {
      toast.error("Erro ao adicionar obrigacoes MEI");
    },
  });

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedClientes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedClientes.map((c: any) => c.id));
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
      toast.success(`${selectedIds.length} empresa(s) deletada(s)!`);
      setSelectedIds([]);
      utils.clientes.list.invalidate();
    } catch (error) {
      toast.error('Erro ao deletar empresas');
      console.error(error);
    }
  };

  // Filtrar, buscar e ordenar clientes
  const filteredClientes = useMemo(() => {
    let result = clientes.filter((cliente: any) => {
      const matchSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = cliente.status === filterStatus;
      const matchRegime = filterRegime === "Todos" || cliente.regime === filterRegime;
      return matchSearch && matchStatus && matchRegime;
    });

    // Aplicar ordenação
    result.sort((a: any, b: any) => {
      switch (sortBy) {
        case "nome":
          return a.nome.localeCompare(b.nome);
        case "nome-desc":
          return b.nome.localeCompare(a.nome);
        case "data-asc":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "data-desc":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "regime":
          return a.regime.localeCompare(b.regime);
        default:
          return 0;
      }
    });

    return result;
  }, [clientes, searchTerm, filterStatus, filterRegime, sortBy]);

  // Paginar clientes
  const totalPages = Math.ceil(filteredClientes.length / ITEMS_PER_PAGE);
  const paginatedClientes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClientes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredClientes, currentPage]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus("Ativo");
    setFilterRegime("Todos");
    setSortBy("nome");
    setCurrentPage(1);
  };

  const obrigacoesFiltradas = useMemo(() => {
    return todasObrigacoes.filter((o: any) => o.regime === form.regime || o.regime === "Todos");
  }, [todasObrigacoes, form.regime]);

  const handleRegimeChange = (regime: ClienteForm["regime"]) => {
    const ids = todasObrigacoes
      .filter((o: any) => o.regime === regime || o.regime === "Todos")
      .map((o: any) => o.id);
    setForm(f => ({ ...f, regime, obrigacaoIds: ids }));
  };

  const toggleObrigacao = (id: number) => {
    setForm(f => ({
      ...f,
      obrigacaoIds: f.obrigacaoIds.includes(id)
        ? f.obrigacaoIds.filter(x => x !== id)
        : [...f.obrigacaoIds, id],
    }));
  };

  async function consultarCNPJ() {
    const digits = form.cnpj.replace(/\D/g, "");
    if (digits.length !== 14) { toast.error("CNPJ deve ter 14 dígitos."); return; }
    setCnpjLoading(true);
    setCnpjStatus(null);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) throw new Error("CNPJ não encontrado na Receita Federal.");
      const data = await res.json();
      const nome = data.nome_fantasia?.trim() || data.razao_social?.trim() || "";
      setForm((f) => ({ ...f, nome }));
      setCnpjStatus("ok");
      toast.success(`Dados preenchidos: ${nome}`);
    } catch (err: any) {
      setCnpjStatus("erro");
      toast.error(err.message ?? "Erro ao consultar CNPJ.");
    } finally {
      setCnpjLoading(false);
    }
  }

  const handleOpenDialog = (cliente?: any) => {
    setCnpjStatus(null);
    setSociosTemp([]);
    setSocioForm(initialSocioForm);
    if (cliente) {
      setEditingId(cliente.id);
      setForm({
        cnpj: cliente.cnpj ?? "",
        nome: cliente.nome,
        email: cliente.email ?? "",
        telefone: cliente.telefone ?? "",
        responsavelId: cliente.responsavelId ? String(cliente.responsavelId) : "",
        regime: cliente.regime,
        setor: cliente.setor,
        valor: cliente.valor.toString(),
        vencimento: cliente.vencimento.toString(),
        status: cliente.status,
        obrigacaoIds: [],
        mesesMensalidade: Array.from({ length: 12 }, (_, i) => i),
      });
      setStep(1);
    } else {
      setEditingId(null);
      const defaultIds = todasObrigacoes
        .filter((o: any) => o.regime === "Simples" || o.regime === "Todos")
        .map((o: any) => o.id);
      setForm({ ...initialForm, obrigacaoIds: defaultIds });
      setStep(1);
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome || !form.valor || !form.vencimento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            ...form,
            vencimento: parseInt(form.vencimento),
            email: form.email || undefined,
            telefone: form.telefone || undefined,
            responsavelId: form.responsavelId ? Number(form.responsavelId) : undefined,
          },
        });
        toast.success("Empresa atualizada com sucesso!");
      } else {
        const result = await createMutation.mutateAsync({
          ...form,
          vencimento: parseInt(form.vencimento),
          email: form.email || undefined,
          telefone: form.telefone || undefined,
          responsavelId: form.responsavelId ? Number(form.responsavelId) : undefined,
          obrigacaoIds: form.obrigacaoIds,
          mesesMensalidade: form.mesesMensalidade,
        });
        const newClienteId = (result as any)?.id;
        if (newClienteId && sociosTemp.length > 0) {
          for (const socio of sociosTemp) {
            await createSocioMutation.mutateAsync({
              clienteId: newClienteId,
              nome: socio.nome,
              cpf: socio.cpf || undefined,
              participacao: socio.participacao ? parseFloat(socio.participacao) : undefined,
              cargo: socio.cargo || undefined,
            });
          }
        }
        toast.success("Empresa criada com sucesso!");
      }
      utils.clientes.list.invalidate();
      setIsOpen(false);
      const defaultIds = todasObrigacoes
        .filter((o: any) => o.regime === "Simples" || o.regime === "Todos")
        .map((o: any) => o.id);
      setForm({ ...initialForm, obrigacaoIds: defaultIds });
      setStep(1);
      setSociosTemp([]);
      setSocioForm(initialSocioForm);
      setCurrentPage(1);
    } catch (error) {
      toast.error("Erro ao salvar empresa");
      console.error(error);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Empresa deletada com sucesso!");
      utils.clientes.list.invalidate();
    } catch (error) {
      toast.error("Erro ao deletar cliente");
      console.error(error);
    }
  };

  const handleAddMEIObrigacoes = () => {
    seedMEIMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Empresas</h1>
          <p className="text-slate-600 mt-1">Cadastre e gerencie suas empresas</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Empresa" : `Nova Empresa — Passo ${step}/4`}
              </DialogTitle>
            </DialogHeader>

            {/* PASSO 1: dados do cliente */}
            {(editingId || step === 1) && (
              <div className="space-y-4">
                {/* CNPJ com busca */}
                <div>
                  <label className="text-sm font-medium text-slate-700">CNPJ</label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input
                        value={form.cnpj}
                        onChange={(e) => {
                          setForm({ ...form, cnpj: formatCNPJ(e.target.value) });
                          setCnpjStatus(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && consultarCNPJ()}
                        placeholder="00.000.000/0001-00"
                        maxLength={18}
                      />
                      {cnpjStatus === "ok" && (
                        <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {cnpjStatus === "erro" && (
                        <XCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={consultarCNPJ}
                      disabled={cnpjLoading}
                      className="shrink-0 gap-1.5"
                    >
                      {cnpjLoading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Search className="h-4 w-4" />}
                      Consultar
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Digite o CNPJ e clique em Consultar para preencher o nome automaticamente
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Nome *</label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Nome da empresa"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">E-mail</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@empresa.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Telefone</label>
                  <Input
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Responsável</label>
                  <Select
                    value={form.responsavelId || "none"}
                    onValueChange={(v) => setForm({ ...form, responsavelId: v === "none" ? "" : v })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione um responsável" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {(responsaveis as any[]).map((r: any) => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Regime *</label>
                  <Select value={form.regime} onValueChange={(v) => handleRegimeChange(v as any)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {regimes.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Setor</label>
                  <Select value={form.setor} onValueChange={(v) => setForm({ ...form, setor: v as any })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fiscal">Fiscal</SelectItem>
                      <SelectItem value="Trabalhista">Trabalhista</SelectItem>
                      <SelectItem value="Contábil">Contábil</SelectItem>
                      <SelectItem value="Geral">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Valor Mensalidade (R$) *</label>
                  <Input
                    type="number"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Vencimento (dia do mês) *</label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={form.vencimento}
                    onChange={(e) => setForm({ ...form, vencimento: e.target.value })}
                    placeholder="10"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editingId && <SociosSection clienteId={editingId} />}
                {editingId && <PortalAccessSection clienteId={editingId} cnpj={form.cnpj} />}

                <div className="flex gap-2 pt-4">
                  {editingId ? (
                    <>
                      <Button onClick={handleSave} disabled={updateMutation.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700">
                        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar"}
                      </Button>
                      <Button onClick={() => setIsOpen(false)} variant="outline" className="flex-1">Cancelar</Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          if (!form.nome || !form.valor || !form.vencimento) {
                            toast.error("Preencha todos os campos obrigatórios");
                            return;
                          }
                          setStep(2);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Próximo <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                      <Button onClick={() => setIsOpen(false)} variant="outline" className="flex-1">Cancelar</Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* PASSO 2: selecionar obrigações (apenas criação) */}
            {!editingId && step === 2 && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-3">
                    Selecione as obrigações para <strong>{form.nome}</strong> ({form.regime}).
                    As marcadas são as recomendadas para o regime.
                  </p>
                  <div className="border rounded-md divide-y max-h-72 overflow-y-auto">
                    {obrigacoesFiltradas.length === 0 ? (
                      <p className="text-sm text-slate-500 p-4 text-center">Nenhuma obrigação cadastrada para este regime.</p>
                    ) : (
                      obrigacoesFiltradas.map((o: any) => (
                        <label key={o.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer">
                          <Checkbox
                            checked={form.obrigacaoIds.includes(o.id)}
                            onCheckedChange={() => toggleObrigacao(o.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">{o.nome}</p>
                            <p className="text-xs text-slate-500">{o.categoria} · {o.periodicidade}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {form.obrigacaoIds.length} obrigação(ões) selecionada(s)
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Próximo <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* PASSO 3: selecionar meses de mensalidade */}
            {!editingId && step === 3 && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-3">
                    Selecione os meses para criar mensalidades de <strong>{form.nome}</strong> (R$ {parseFloat(form.valor || "0").toFixed(2)}/mês).
                  </p>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, mesesMensalidade: Array.from({ length: 12 }, (_, i) => i) }))}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Selecionar todos
                    </button>
                    <span className="text-xs text-slate-400">·</span>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, mesesMensalidade: [] }))}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {MESES.map((mes, idx) => (
                      <label key={mes} className="flex items-center gap-2 p-2 border rounded-md hover:bg-slate-50 cursor-pointer">
                        <Checkbox
                          checked={form.mesesMensalidade.includes(idx)}
                          onCheckedChange={() => {
                            setForm(f => ({
                              ...f,
                              mesesMensalidade: f.mesesMensalidade.includes(idx)
                                ? f.mesesMensalidade.filter(m => m !== idx)
                                : [...f.mesesMensalidade, idx].sort((a, b) => a - b),
                            }));
                          }}
                        />
                        <span className="text-sm">{mes}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {form.mesesMensalidade.length} mês(es) selecionado(s)
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                  <Button onClick={() => setStep(4)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Próximo <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* PASSO 4: sócios (apenas criação) */}
            {!editingId && step === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Adicione os sócios de <strong>{form.nome}</strong>. Esta etapa é opcional — você pode pular ou adicionar depois.
                </p>

                {sociosTemp.length > 0 && (
                  <div className="space-y-2">
                    {sociosTemp.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded-md text-sm bg-slate-50">
                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-medium">{s.nome}</span>
                          {s.cpf && <span className="text-slate-500">{s.cpf}</span>}
                          {s.participacao && <span className="text-blue-600">{s.participacao}%</span>}
                          {s.cargo && <span className="text-slate-400">{s.cargo}</span>}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setSociosTemp(prev => prev.filter((_, i) => i !== idx))}>
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nome *"
                    value={socioForm.nome}
                    onChange={e => setSocioForm(f => ({ ...f, nome: e.target.value }))}
                    className="col-span-2"
                  />
                  <Input
                    placeholder="CPF (000.000.000-00)"
                    value={socioForm.cpf}
                    onChange={e => setSocioForm(f => ({ ...f, cpf: formatCPF(e.target.value) }))}
                    maxLength={14}
                  />
                  <Input
                    placeholder="Cargo"
                    value={socioForm.cargo}
                    onChange={e => setSocioForm(f => ({ ...f, cargo: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Participação %"
                    value={socioForm.participacao}
                    onChange={e => setSocioForm(f => ({ ...f, participacao: e.target.value }))}
                    className="col-span-2"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  disabled={!socioForm.nome.trim()}
                  onClick={() => {
                    setSociosTemp(prev => [...prev, { ...socioForm }]);
                    setSocioForm(initialSocioForm);
                  }}
                >
                  <UserPlus className="h-4 w-4" /> Adicionar Sócio
                </Button>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => setStep(3)} variant="outline" className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={createMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Empresa"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Abas de Status */}

      <Tabs value={filterStatus} onValueChange={(value: any) => {
        setFilterStatus(value);
        setCurrentPage(1);
      }} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="Ativo">Ativos</TabsTrigger>
          <TabsTrigger value="Inativo">Inativos</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filtros Avançados */}
      <ClienteFilters
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        filterStatus={filterStatus}
        onStatusChange={(value: any) => {
          setFilterStatus(value);
          setCurrentPage(1);
        }}
        filterRegime={filterRegime}
        onRegimeChange={(value) => {
          setFilterRegime(value);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        onSortChange={(value) => {
          setSortBy(value);
          setCurrentPage(1);
        }}
        onClearFilters={handleClearFilters}
      />

      {/* Tabela de Empresas */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : paginatedClientes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Nenhuma empresa encontrada</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.length === paginatedClientes.length && paginatedClientes.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Regime</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Valor (R$)</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClientes.map((cliente: any) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="w-12">
                          <Checkbox
                            checked={selectedIds.includes(cliente.id)}
                            onCheckedChange={() => handleSelectOne(cliente.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{cliente.nome}</TableCell>
                        <TableCell className="text-sm text-slate-500 font-mono">
                          {cliente.cnpj || "—"}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                            {cliente.regime}
                          </span>
                        </TableCell>
                        <TableCell>{cliente.setor}</TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {cliente.responsavelId
                            ? ((responsaveis as any[]).find((r: any) => r.id === cliente.responsavelId)?.nome ?? "—")
                            : <span className="text-slate-400">—</span>}
                        </TableCell>
                        <TableCell>R$ {cliente.valor.toFixed(2)}</TableCell>
                        <TableCell>Dia {cliente.vencimento}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            cliente.status === "Ativo"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {cliente.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {cliente.regime === "MEI" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddMEIObrigacoes()}
                                className="hover:bg-green-50"
                                title="Adicionar obrigações MEI"
                              >
                                <Plus className="w-4 h-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDialog(cliente)}
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
                                    Tem certeza que deseja deletar a empresa "{cliente.nome}"?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="flex gap-2 justify-end">
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(cliente.id)}
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
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Barra de ações para seleção múltipla */}
              {selectedIds.length > 0 && (
                <div className="flex items-center justify-between mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-900">
                    {selectedIds.length} empresa(s) selecionada(s)
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        disabled={deleteManyMutation.isPending}
                      >
                        <Trash className="w-4 h-4" />
                        Deletar Selecionados
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja deletar {selectedIds.length} cliente(s)? Esta ação não pode ser desfeita.
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
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                  >
                    Primeira
                  </Button>
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Anterior
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Próxima
                  </Button>
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    Última
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SociosSection({ clienteId }: { clienteId: number }) {
  const utils = trpc.useUtils();
  const { data: socios = [] } = trpc.socios.list.useQuery({ clienteId });
  const createMutation = trpc.socios.create.useMutation({
    onSuccess: () => {
      utils.socios.list.invalidate();
      setForm(initialSocioForm);
    },
  });
  const deleteMutation = trpc.socios.delete.useMutation({
    onSuccess: () => utils.socios.list.invalidate(),
  });
  const [form, setForm] = useState<SocioTemp>(initialSocioForm);

  return (
    <div className="mt-4 pt-4 border-t space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Sócios da Empresa</h3>

      {(socios as any[]).length > 0 && (
        <div className="space-y-2">
          {(socios as any[]).map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-2 border rounded-md text-sm bg-slate-50">
              <div className="flex flex-wrap gap-x-2 min-w-0">
                <span className="font-medium">{s.nome}</span>
                {s.cpf && <span className="text-slate-500">{s.cpf}</span>}
                {s.participacao && <span className="text-blue-600">{s.participacao}%</span>}
                {s.cargo && <span className="text-slate-400">{s.cargo}</span>}
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate({ id: s.id })}
                className="shrink-0 ml-2"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Nome *"
          value={form.nome}
          onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
          className="col-span-2"
        />
        <Input
          placeholder="CPF (000.000.000-00)"
          value={form.cpf}
          onChange={e => setForm(f => ({ ...f, cpf: formatCPF(e.target.value) }))}
          maxLength={14}
        />
        <Input
          placeholder="Cargo"
          value={form.cargo}
          onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
        />
        <Input
          type="number"
          placeholder="Participação %"
          value={form.participacao}
          onChange={e => setForm(f => ({ ...f, participacao: e.target.value }))}
          className="col-span-2"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-1.5"
        disabled={!form.nome.trim() || createMutation.isPending}
        onClick={() => createMutation.mutate({
          clienteId,
          nome: form.nome,
          cpf: form.cpf || undefined,
          participacao: form.participacao ? parseFloat(form.participacao) : undefined,
          cargo: form.cargo || undefined,
        })}
      >
        {createMutation.isPending
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <UserPlus className="h-4 w-4" />}
        Adicionar Sócio
      </Button>
    </div>
  );
}

function PortalAccessSection({ clienteId, cnpj }: { clienteId: number; cnpj: string }) {
  const utils = trpc.useUtils();
  const { data: acesso, isLoading } = trpc.portalAdmin.getByCliente.useQuery({ clienteId });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const createMutation = trpc.portalAdmin.create.useMutation({
    onSuccess: () => {
      toast.success("Acesso do portal criado!");
      setPassword("");
      utils.portalAdmin.getByCliente.invalidate({ clienteId });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.portalAdmin.updatePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha atualizada!");
      setPassword("");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.portalAdmin.toggle.useMutation({
    onSuccess: () => utils.portalAdmin.getByCliente.invalidate({ clienteId }),
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.portalAdmin.delete.useMutation({
    onSuccess: () => {
      toast.success("Acesso do portal removido!");
      utils.portalAdmin.getByCliente.invalidate({ clienteId });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="mt-4 pt-4 border-t space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <Key className="w-4 h-4" /> Acesso do Portal (Cliente)
      </h3>

      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      ) : acesso ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-md bg-slate-50 text-sm">
            <div>
              <p className="font-medium text-slate-700">CNPJ: {acesso.cnpj}</p>
              <p className={`text-xs mt-0.5 ${acesso.ativo ? "text-green-600" : "text-red-500"}`}>
                {acesso.ativo ? "Acesso ativo" : "Acesso desativado"}
              </p>
              <a
                href="/cliente/login"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                /cliente/login
              </a>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                title={acesso.ativo ? "Desativar" : "Ativar"}
                onClick={() => toggleMutation.mutate({ clienteId, ativo: !acesso.ativo })}
                disabled={toggleMutation.isPending}
              >
                {acesso.ativo
                  ? <ShieldOff className="h-4 w-4 text-orange-400" />
                  : <ShieldCheck className="h-4 w-4 text-green-500" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteMutation.mutate({ clienteId })}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Nova senha (mín. 6 caracteres)"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={password.length < 6 || updateMutation.isPending}
              onClick={() => updateMutation.mutate({ clienteId, password })}
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Alterar senha"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            CNPJ da empresa: <strong>{cnpj || "não cadastrado"}</strong>
          </p>
          <div className="flex gap-2">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Senha de acesso (mín. 6 caracteres)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="flex-1"
            />
            <Button
              size="sm"
              disabled={password.length < 6 || !cnpj || createMutation.isPending}
              onClick={() => createMutation.mutate({ clienteId, cnpj, password })}
              className="bg-blue-600 hover:bg-blue-700 shrink-0"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar acesso"}
            </Button>
          </div>
          {!cnpj && (
            <p className="text-xs text-orange-500">Cadastre o CNPJ da empresa antes de criar o acesso.</p>
          )}
        </div>
      )}
    </div>
  );
}
