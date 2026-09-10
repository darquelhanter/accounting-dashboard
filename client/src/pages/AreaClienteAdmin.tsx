import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  DollarSign,
  Pencil,
  Trash2,
  Plus,
  FolderOpen,
  Building2,
  KeyRound,
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_ORDER: Record<string, number> = Object.fromEntries(MESES.map((m, i) => [m, i + 1]));

function formatCurrency(v: number | string) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─────────────────── Modal de Lançamento ───────────────────
const EMPTY_LANC = {
  tipo: "entrada" as "entrada" | "saida",
  descricao: "",
  categoria: "",
  valor: "",
  mes: MESES[new Date().getMonth()],
  ano: new Date().getFullYear(),
};

function ModalLancamento({
  open,
  onClose,
  initial,
  onSave,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  initial: typeof EMPTY_LANC;
  onSave: (data: typeof EMPTY_LANC) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState(initial);

  // Sync quando initial muda (editar vs criar)
  useEffect(() => { setForm(initial); }, [open]);

  function handleSave() {
    if (!form.descricao.trim()) { toast.error("Informe a descrição."); return; }
    const valor = parseFloat(form.valor.replace(",", "."));
    if (isNaN(valor) || valor <= 0) { toast.error("Informe um valor válido."); return; }
    onSave({ ...form, valor: String(valor) });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial.descricao ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          {/* Tipo */}
          <div className="flex gap-2">
            {(["entrada", "saida"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setForm(f => ({ ...f, tipo: t }))}
                className={`flex-1 py-1.5 rounded text-sm font-medium border transition-colors ${
                  form.tipo === t
                    ? t === "entrada" ? "bg-emerald-600 text-white border-emerald-600" : "bg-red-500 text-white border-red-500"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                {t === "entrada" ? "Entrada" : "Saída"}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input placeholder="Ex: Venda, Aluguel..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Categoria <span className="text-gray-400 font-normal">(opcional)</span></Label>
            <Input placeholder="Ex: Impostos, Receitas..." value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Valor (R$)</Label>
            <Input placeholder="0,00" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} inputMode="decimal" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label>Mês</Label>
              <select
                value={form.mes}
                onChange={e => setForm(f => ({ ...f, mes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {MESES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="w-24 space-y-1">
              <Label>Ano</Label>
              <Input type="number" value={form.ano} onChange={e => setForm(f => ({ ...f, ano: Number(e.target.value) }))} min={2020} max={2099} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────── Tab Fluxo de Caixa ───────────────────
function TabFluxo({ clienteId }: { clienteId: number }) {
  const [filtroSortKey, setFiltroSortKey] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formInicial, setFormInicial] = useState<typeof EMPTY_LANC>(EMPTY_LANC);

  const { data, isLoading, refetch } = trpc.portalAdmin.fluxoCaixaByCliente.useQuery({ clienteId });

  const criarMutation = trpc.portalAdmin.criarLancamento.useMutation({
    onSuccess: () => { refetch(); setModalOpen(false); toast.success("Lançamento criado!"); },
    onError: (e) => toast.error(e.message),
  });

  const editarMutation = trpc.portalAdmin.editarLancamento.useMutation({
    onSuccess: () => { refetch(); setModalOpen(false); setEditandoId(null); toast.success("Lançamento atualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  const deletarMutation = trpc.portalAdmin.deletarLancamento.useMutation({
    onSuccess: () => { refetch(); toast.success("Lançamento removido!"); },
    onError: (e) => toast.error(e.message),
  });

  const mensalidades = (data?.mensalidades ?? []) as any[];
  const servicos = (data?.servicos ?? []) as any[];
  const lancamentos = (data?.lancamentos ?? []) as any[];

  type FluxoItem = {
    id: string; dbId?: number; descricao: string; categoria?: string;
    valor: number; tipo: "entrada" | "saida"; editavel: boolean;
    status?: string; mes?: string; ano?: number;
  };

  const gruposPorMes = useMemo(() => {
    const map = new Map<string, { sortKey: string; label: string; mes: string; ano: number; entradas: FluxoItem[]; saidas: FluxoItem[] }>();
    const get = (mes: string, ano: number) => {
      const sortKey = `${ano}-${String(MESES_ORDER[mes] ?? 0).padStart(2, "0")}`;
      if (!map.has(sortKey)) map.set(sortKey, { sortKey, label: `${mes}/${ano}`, mes, ano, entradas: [], saidas: [] });
      return map.get(sortKey)!;
    };
    for (const m of mensalidades) {
      get(m.mes, m.ano).saidas.push({ id: `men-${m.id}`, descricao: "Mensalidade (escritório)", valor: Number(m.valor), tipo: "saida", editavel: false, status: m.status });
    }
    for (const s of servicos) {
      get(s.mes, s.ano).saidas.push({ id: `srv-${s.id}`, descricao: s.nomeServico, valor: Number(s.valor), tipo: "saida", editavel: false, status: s.status });
    }
    for (const l of lancamentos) {
      const item: FluxoItem = { id: `lan-${l.id}`, dbId: l.id, descricao: l.descricao, categoria: l.categoria ?? undefined, valor: Number(l.valor), tipo: l.tipo, editavel: true, mes: l.mes, ano: l.ano };
      const g = get(l.mes, l.ano);
      if (l.tipo === "entrada") g.entradas.push(item); else g.saidas.push(item);
    }
    return Array.from(map.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [mensalidades, servicos, lancamentos]);

  const gruposVisiveis = filtroSortKey ? gruposPorMes.filter(g => g.sortKey === filtroSortKey) : gruposPorMes;

  const resumo = useMemo(() => {
    let entradas = 0, saidas = 0;
    for (const g of gruposVisiveis) {
      for (const i of g.entradas) entradas += i.valor;
      for (const i of g.saidas) saidas += i.valor;
    }
    return { entradas, saidas, saldo: entradas - saidas };
  }, [gruposVisiveis]);

  function abrirCriar() {
    setEditandoId(null);
    setFormInicial({ ...EMPTY_LANC });
    setModalOpen(true);
  }

  function abrirEditar(item: FluxoItem) {
    if (!item.dbId) return;
    setEditandoId(item.dbId);
    setFormInicial({
      tipo: item.tipo,
      descricao: item.descricao,
      categoria: item.categoria ?? "",
      valor: String(item.valor),
      mes: item.mes ?? MESES[new Date().getMonth()],
      ano: item.ano ?? new Date().getFullYear(),
    });
    setModalOpen(true);
  }

  function handleSave(form: typeof EMPTY_LANC) {
    const valor = parseFloat(form.valor.replace(",", "."));
    if (editandoId) {
      editarMutation.mutate({ id: editandoId, tipo: form.tipo, descricao: form.descricao.trim(), categoria: form.categoria.trim() || undefined, valor, mes: form.mes, ano: form.ano });
    } else {
      criarMutation.mutate({ clienteId, tipo: form.tipo, descricao: form.descricao.trim(), categoria: form.categoria.trim() || undefined, valor, mes: form.mes, ano: form.ano });
    }
  }

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      {/* Ações */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <p className="text-sm text-gray-500">Lançamentos do portal do cliente. Mensalidades e serviços são somente leitura.</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={abrirCriar} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Filtro por mês */}
      {gruposPorMes.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFiltroSortKey(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filtroSortKey === null ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"}`}
          >
            Todos
          </button>
          {gruposPorMes.map(g => (
            <button
              key={g.sortKey}
              onClick={() => setFiltroSortKey(g.sortKey)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filtroSortKey === g.sortKey ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-300 hover:border-primary"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-gray-500 mb-1">Entradas</p><p className="text-lg font-bold text-emerald-700">{formatCurrency(resumo.entradas)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-gray-500 mb-1">Saídas</p><p className="text-lg font-bold text-red-600">{formatCurrency(resumo.saidas)}</p></CardContent></Card>
        <Card className={resumo.saldo >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500 mb-1">Saldo</p>
            <p className={`text-lg font-bold ${resumo.saldo >= 0 ? "text-emerald-700" : "text-red-700"}`}>{resumo.saldo >= 0 ? "+" : ""}{formatCurrency(resumo.saldo)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Grupos */}
      {gruposVisiveis.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum lançamento registrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {gruposVisiveis.map(grupo => {
            const totalEnt = grupo.entradas.reduce((s, i) => s + i.valor, 0);
            const totalSai = grupo.saidas.reduce((s, i) => s + i.valor, 0);
            const saldoMes = totalEnt - totalSai;
            return (
              <Card key={grupo.sortKey}>
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg flex-wrap gap-2">
                  <span className="font-semibold text-gray-800">{grupo.label}</span>
                  <div className="flex items-center gap-4 text-xs">
                    {totalEnt > 0 && <span className="text-emerald-700">↑ {formatCurrency(totalEnt)}</span>}
                    {totalSai > 0 && <span className="text-red-600">↓ {formatCurrency(totalSai)}</span>}
                    <span className={`font-bold ${saldoMes >= 0 ? "text-emerald-700" : "text-red-700"}`}>Saldo: {saldoMes >= 0 ? "+" : ""}{formatCurrency(saldoMes)}</span>
                  </div>
                </div>
                <CardContent className="p-0">
                  {grupo.entradas.length > 0 && (
                    <div className="px-4 py-2">
                      <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Entradas</p>
                      {grupo.entradas.map(item => <LancRow key={item.id} item={item} onEdit={() => abrirEditar(item)} onDelete={() => deletarMutation.mutate({ id: item.dbId! })} />)}
                    </div>
                  )}
                  {grupo.saidas.length > 0 && (
                    <div className={`px-4 py-2 ${grupo.entradas.length > 0 ? "border-t" : ""}`}>
                      <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">Saídas</p>
                      {grupo.saidas.map(item => <LancRow key={item.id} item={item} onEdit={() => abrirEditar(item)} onDelete={() => deletarMutation.mutate({ id: item.dbId! })} />)}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ModalLancamento
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditandoId(null); }}
        initial={formInicial}
        onSave={handleSave}
        isPending={criarMutation.isPending || editarMutation.isPending}
      />
    </div>
  );
}

function LancRow({ item, onEdit, onDelete }: {
  item: { id: string; dbId?: number; descricao: string; categoria?: string; valor: number; tipo: "entrada" | "saida"; editavel: boolean; status?: string };
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 truncate">{item.descricao}</p>
        {item.categoria && <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{item.categoria}</span>}
        {item.status && <Badge variant="outline" className="ml-1 text-xs">{item.status}</Badge>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-sm font-semibold w-24 text-right ${item.tipo === "entrada" ? "text-emerald-700" : "text-red-600"}`}>
          {item.tipo === "entrada" ? "+" : "-"}{formatCurrency(item.valor)}
        </span>
        {item.editavel && (
          <>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Editar">
              <Pencil className="h-3.5 w-3.5 text-gray-400" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Excluir">
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
                  <AlertDialogDescription>"{item.descricao}" será removido permanentemente.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={onDelete}>Excluir</AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────── Tab Documentos ───────────────────
function TabDocumentos({ clienteId }: { clienteId: number }) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data: docs = [], isLoading, refetch } = trpc.documentos.listByCliente.useQuery({ clienteId });

  const deleteMutation = trpc.documentos.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Documento excluído!"); },
    onError: (e) => toast.error(e.message),
  });

  const downloadQuery = trpc.documentos.download.useQuery(
    { id: downloadingId! },
    { enabled: !!downloadingId }
  );

  useEffect(() => {
    if (downloadQuery.data && downloadingId) {
      const doc = downloadQuery.data as any;
      const link = document.createElement("a");
      link.href = doc.conteudo;
      link.download = doc.nome;
      link.click();
      setDownloadingId(null);
      toast.success("Download iniciado!");
    }
  }, [downloadQuery.data, downloadingId]);

  if (isLoading) return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>;

  const totalDocs = (docs as any[]).length;

  if (totalDocs === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <FileText className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">Nenhum documento para esta empresa.</p>
        <p className="text-xs mt-1">Gerencie documentos na seção <strong>Documentos & Acessos</strong>.</p>
      </div>
    );
  }

  // Agrupa por pasta
  const porPasta = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const d of docs as any[]) {
      const pasta = d.pasta ?? "(Sem pasta)";
      const arr = map.get(pasta) ?? [];
      arr.push(d);
      map.set(pasta, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [docs]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{totalDocs} documento{totalDocs !== 1 ? "s" : ""} — somente leitura aqui. Para upload/renomear use <strong>Documentos & Acessos</strong>.</p>
      {porPasta.map(([pasta, items]) => (
        <div key={pasta}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            {pasta}
          </h3>
          <div className="space-y-1.5">
            {items.map((doc: any) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
                <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.nome}</p>
                  <p className="text-xs text-gray-500">{formatBytes(doc.tamanho)} · {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("pt-BR") : "—"}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setDownloadingId(doc.id)} disabled={downloadingId === doc.id} className="shrink-0 gap-1.5">
                  {downloadingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Baixar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                      <AlertDialogDescription>"{doc.nome}" será removido permanentemente.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteMutation.mutate({ id: doc.id })}>Excluir</AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────── Tab Acesso Portal ───────────────────
function TabAcessoPortal({ clienteId }: { clienteId: number }) {
  const [newPassword, setNewPassword] = useState("");
  const { data: portal, refetch } = trpc.portalAdmin.getByCliente.useQuery({ clienteId });

  const updatePasswordMutation = trpc.portalAdmin.updatePassword.useMutation({
    onSuccess: () => { refetch(); setNewPassword(""); toast.success("Senha atualizada!"); },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.portalAdmin.toggle.useMutation({
    onSuccess: () => { refetch(); toast.success("Status atualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  const fluxoConfigMutation = trpc.portalAdmin.updateFluxoConfig.useMutation({
    onSuccess: () => { refetch(); toast.success("Configuração salva!"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.portalAdmin.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Acesso removido!"); },
    onError: (e) => toast.error(e.message),
  });

  if (!portal) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <KeyRound className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">Esta empresa não tem acesso ao portal configurado.</p>
        <p className="text-xs mt-1">Configure em <strong>Empresas</strong> → selecionar a empresa → seção Acesso Portal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            Acesso ao Portal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">CNPJ de acesso</p>
              <p className="text-sm text-gray-500 font-mono">{portal.cnpj}</p>
            </div>
            <Badge variant={portal.ativo ? "default" : "secondary"}>
              {portal.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleMutation.mutate({ clienteId, ativo: !portal.ativo })}
              disabled={toggleMutation.isPending}
            >
              {portal.ativo ? "Desativar acesso" : "Ativar acesso"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Remover acesso
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover acesso ao portal?</AlertDialogTitle>
                  <AlertDialogDescription>O cliente não conseguirá mais fazer login no portal.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteMutation.mutate({ clienteId })}>Remover</AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="space-y-1 pt-2 border-t">
            <Label>Nova senha</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <Button
                size="sm"
                disabled={newPassword.length < 6 || updatePasswordMutation.isPending}
                onClick={() => updatePasswordMutation.mutate({ clienteId, password: newPassword })}
              >
                Alterar
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Visibilidade no Fluxo de Caixa</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={portal.mostrarMensalidades ?? false}
                onChange={e => fluxoConfigMutation.mutate({ clienteId, mostrarMensalidades: e.target.checked, mostrarServicos: portal.mostrarServicos ?? false })}
                className="rounded"
              />
              <span className="text-sm">Mostrar mensalidades do escritório</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={portal.mostrarServicos ?? false}
                onChange={e => fluxoConfigMutation.mutate({ clienteId, mostrarMensalidades: portal.mostrarMensalidades ?? false, mostrarServicos: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Mostrar serviços avulsos</span>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────── Página Principal ───────────────────
export default function AreaClienteAdmin() {
  const [selectedClienteId, setSelectedClienteId] = useState<string>("");

  const { data: clientes } = trpc.clientes.list.useQuery();
  const clienteId = selectedClienteId ? Number(selectedClienteId) : null;
  const clienteNome = clientes?.find(c => String(c.id) === selectedClienteId)?.nome;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Área do Cliente</h1>
        <p className="text-gray-500 text-sm mt-1">Visualize e gerencie os dados do portal por empresa</p>
      </div>

      {/* Seletor de empresa */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-48">
              <Select value={selectedClienteId} onValueChange={v => setSelectedClienteId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {clienteNome && (
              <Badge variant="secondary" className="text-sm">
                {clienteNome}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {!clienteId ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Building2 className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-sm">Selecione uma empresa para visualizar a área do cliente.</p>
        </div>
      ) : (
        <Tabs defaultValue="fluxo">
          <TabsList>
            <TabsTrigger value="fluxo" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Fluxo de Caixa
            </TabsTrigger>
            <TabsTrigger value="documentos" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="portal" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Acesso Portal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fluxo" className="mt-6">
            <TabFluxo key={clienteId} clienteId={clienteId} />
          </TabsContent>

          <TabsContent value="documentos" className="mt-6">
            <TabDocumentos key={clienteId} clienteId={clienteId} />
          </TabsContent>

          <TabsContent value="portal" className="mt-6">
            <TabAcessoPortal key={clienteId} clienteId={clienteId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
