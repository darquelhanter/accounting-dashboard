import { useState, useEffect, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, FolderOpen, FileText, Download, Search, ChevronRight, ChevronLeft,
  Upload, Trash2, DollarSign, TrendingUp, FolderPlus,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "documentos" | "fluxo";

const MESES_ORDER: Record<string, number> = {
  Jan: 1, Fev: 2, Mar: 3, Abr: 4, Mai: 5, Jun: 6,
  Jul: 7, Ago: 8, Set: 9, Out: 10, Nov: 11, Dez: 12,
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("pt-BR");
}

function formatCurrency(value: number | string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pago: "bg-green-100 text-green-800",
    Pendente: "bg-yellow-100 text-yellow-800",
    Atrasado: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

function FluxoItemRow({
  item,
  onDelete,
}: {
  item: { id: string; descricao: string; categoria?: string; valor: number; tipo: "entrada" | "saida"; status?: string; dataPagamento?: string | null };
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 truncate">{item.descricao}</p>
        {item.categoria && (
          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{item.categoria}</span>
        )}
        {item.dataPagamento && (
          <p className="text-xs text-gray-400">Pago em {new Date(item.dataPagamento).toLocaleDateString("pt-BR")}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {item.status && <StatusBadge status={item.status} />}
        <span className={`text-sm font-semibold w-24 text-right ${item.tipo === "entrada" ? "text-emerald-700" : "text-red-600"}`}>
          {item.tipo === "entrada" ? "+" : "-"}{formatCurrency(item.valor)}
        </span>
        {onDelete && (
          <button onClick={onDelete} className="text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function DocList({
  docs,
  downloadingId,
  deletingId,
  onDownload,
  onDelete,
}: {
  docs: any[];
  downloadingId: number | null;
  deletingId: number | null;
  onDownload: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="space-y-2">
      {docs.map((doc: any) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow"
        >
          <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{doc.nome}</p>
            <p className="text-xs text-gray-500">
              {formatBytes(doc.tamanho)} · {formatDate(doc.createdAt)}
              {doc.descricao && ` · ${doc.descricao}`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(doc.id)}
            disabled={downloadingId === doc.id}
            className="shrink-0 gap-1.5"
          >
            {downloadingId === doc.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Baixar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(doc.id)}
            disabled={deletingId === doc.id}
            className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            {deletingId === doc.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function PortalCliente() {
  const [tab, setTab] = useState<Tab>("documentos");

  // Documentos state
  const [search, setSearch] = useState("");
  const [pastaAtiva, setPastaAtiva] = useState<string | null>(null);
  const [pastasVazias, setPastasVazias] = useState<string[]>([]);
  const [novaPastaNome, setNovaPastaNome] = useState("");
  const [showNovaPasta, setShowNovaPasta] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fluxo de caixa — modal de novo lançamento
  const [showLancamento, setShowLancamento] = useState(false);
  const [lancTipo, setLancTipo] = useState<"entrada" | "saida">("entrada");
  const [lancDescricao, setLancDescricao] = useState("");
  const [lancCategoria, setLancCategoria] = useState("");
  const [lancValor, setLancValor] = useState("");
  const [lancMes, setLancMes] = useState(() => {
    const nomes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    return nomes[new Date().getMonth()];
  });
  const [lancAno, setLancAno] = useState(() => new Date().getFullYear());

  // Filtro de mês no fluxo de caixa (null = Todos)
  const [filtroSortKey, setFiltroSortKey] = useState<string | null>(null);


  // Queries e mutations
  const utils = trpc.useUtils();

  const { data: documentos = [], isLoading: isLoadingDocs } = trpc.portalCliente.documentos.useQuery(undefined, {
    retry: false,
  });

  const { data: fluxoData, isLoading: isLoadingFluxo } = trpc.portalCliente.fluxoCaixa.useQuery(undefined, {
    enabled: tab === "fluxo",
    retry: false,
  });

  const downloadQuery = trpc.portalCliente.downloadDocumento.useQuery(
    { id: downloadingId! },
    { enabled: !!downloadingId, retry: false }
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

  useEffect(() => {
    if (downloadQuery.isError && downloadingId) {
      setDownloadingId(null);
      toast.error("Erro ao baixar documento.");
    }
  }, [downloadQuery.isError, downloadingId]);

  const uploadMutation = trpc.portalCliente.uploadDocumento.useMutation({
    onSuccess: () => {
      toast.success("Arquivo enviado com sucesso!");
      utils.portalCliente.documentos.invalidate();
      setUploadingFile(false);
    },
    onError: (e) => {
      toast.error(e.message || "Erro ao enviar arquivo");
      setUploadingFile(false);
    },
  });

  const deleteMutation = trpc.portalCliente.deleteDocumento.useMutation({
    onSuccess: () => {
      toast.success("Arquivo removido.");
      setDeletingId(null);
      utils.portalCliente.documentos.invalidate();
    },
    onError: (e) => {
      toast.error(e.message || "Erro ao remover arquivo");
      setDeletingId(null);
    },
  });

  const criarLancamentoMutation = trpc.portalCliente.criarLancamento.useMutation({
    onSuccess: () => {
      toast.success("Lançamento adicionado!");
      utils.portalCliente.fluxoCaixa.invalidate();
      setShowLancamento(false);
      setLancDescricao("");
      setLancCategoria("");
      setLancValor("");
    },
    onError: (e) => toast.error(e.message || "Erro ao salvar lançamento"),
  });

  const deletarLancamentoMutation = trpc.portalCliente.deletarLancamento.useMutation({
    onSuccess: () => {
      toast.success("Lançamento removido.");
      utils.portalCliente.fluxoCaixa.invalidate();
    },
    onError: (e) => toast.error(e.message || "Erro ao remover lançamento"),
  });

  function salvarLancamento() {
    const valor = parseFloat(lancValor.replace(",", "."));
    if (!lancDescricao.trim()) { toast.error("Informe a descrição."); return; }
    if (isNaN(valor) || valor <= 0) { toast.error("Informe um valor válido."); return; }
    criarLancamentoMutation.mutate({ tipo: lancTipo, descricao: lancDescricao.trim(), categoria: lancCategoria.trim() || undefined, valor, mes: lancMes, ano: lancAno });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const conteudo = await fileToBase64(file);
      await uploadMutation.mutateAsync({
        pasta: pastaAtiva ?? undefined,
        nome: file.name,
        tipo: file.type || "application/octet-stream",
        tamanho: file.size,
        conteudo,
      });
    } catch {
      // onError já trata
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const docs = documentos as any[];

  const pastas = useMemo(
    () => Array.from(new Set(docs.filter(d => d.pasta).map(d => d.pasta as string))).sort(),
    [docs]
  );

  const todasPastas = useMemo(
    () => Array.from(new Set([...pastas, ...pastasVazias])).sort(),
    [pastas, pastasVazias]
  );

  function confirmarNovaPasta() {
    const nome = novaPastaNome.trim();
    if (!nome) { toast.error("Digite um nome para a pasta."); return; }
    if (todasPastas.includes(nome)) {
      toast.error("Já existe uma pasta com esse nome."); return;
    }
    setPastasVazias(prev => [...prev, nome]);
    setNovaPastaNome("");
    setShowNovaPasta(false);
    setPastaAtiva(nome);
  }

  const docsNaPasta = pastaAtiva
    ? docs.filter(d => d.pasta === pastaAtiva)
    : docs.filter(d => !d.pasta);

  const filtrados = docsNaPasta.filter(d =>
    d.nome.toLowerCase().includes(search.toLowerCase()) ||
    (d.descricao?.toLowerCase().includes(search.toLowerCase()))
  );

  // Fluxo de caixa
  const mensalidades = (fluxoData?.mensalidades ?? []) as any[];
  const servicos = (fluxoData?.servicos ?? []) as any[];
  const lancamentos = (fluxoData?.lancamentos ?? []) as any[];

  type FluxoItem = {
    id: string;
    dbId?: number;
    descricao: string;
    categoria?: string;
    valor: number;
    tipo: "entrada" | "saida";
    deletavel: boolean;
    status?: string;
    dataPagamento?: string | null;
  };
  type MesGrupo = {
    sortKey: string;
    label: string;
    mes: string;
    ano: number;
    entradas: FluxoItem[];
    saidas: FluxoItem[];
  };

  const gruposPorMes = useMemo<MesGrupo[]>(() => {
    const map = new Map<string, MesGrupo>();
    const get = (mes: string, ano: number) => {
      const sortKey = `${ano}-${String(MESES_ORDER[mes] ?? 0).padStart(2, "0")}`;
      if (!map.has(sortKey)) {
        map.set(sortKey, { sortKey, label: `${mes}/${ano}`, mes, ano, entradas: [], saidas: [] });
      }
      return map.get(sortKey)!;
    };
    for (const m of mensalidades) {
      get(m.mes, m.ano).saidas.push({
        id: `men-${m.id}`, descricao: "Mensalidade (escritório)",
        valor: Number(m.valor), tipo: "saida", deletavel: false,
        status: m.status, dataPagamento: m.dataPagamento,
      });
    }
    for (const s of servicos) {
      get(s.mes, s.ano).saidas.push({
        id: `srv-${s.id}`, descricao: s.nomeServico,
        valor: Number(s.valor), tipo: "saida", deletavel: false,
        status: s.status,
      });
    }
    for (const l of lancamentos) {
      const item: FluxoItem = {
        id: `lan-${l.id}`, dbId: l.id, descricao: l.descricao,
        categoria: l.categoria ?? undefined,
        valor: Number(l.valor), tipo: l.tipo, deletavel: true,
      };
      const grupo = get(l.mes, l.ano);
      if (l.tipo === "entrada") grupo.entradas.push(item);
      else grupo.saidas.push(item);
    }
    return Array.from(map.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [mensalidades, servicos, lancamentos]);

  const resumoGeral = useMemo(() => {
    let entradas = 0, saidas = 0;
    for (const g of gruposPorMes) {
      for (const i of g.entradas) entradas += i.valor;
      for (const i of g.saidas) saidas += i.valor;
    }
    return { entradas, saidas, saldo: entradas - saidas };
  }, [gruposPorMes]);

  const gruposVisiveis = filtroSortKey
    ? gruposPorMes.filter(g => g.sortKey === filtroSortKey)
    : gruposPorMes;

  const resumoVisivel = useMemo(() => {
    let entradas = 0, saidas = 0;
    for (const g of gruposVisiveis) {
      for (const i of g.entradas) entradas += i.valor;
      for (const i of g.saidas) saidas += i.valor;
    }
    return { entradas, saidas, saldo: entradas - saidas };
  }, [gruposVisiveis]);

  const filtroLabel = filtroSortKey
    ? gruposPorMes.find(g => g.sortKey === filtroSortKey)?.label ?? ""
    : null;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab("documentos")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "documentos"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Documentos
        </button>
        <button
          onClick={() => setTab("fluxo")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "fluxo"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Fluxo de Caixa
        </button>
      </div>

      {/* ===== ABA DOCUMENTOS ===== */}
      {tab === "documentos" && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {pastaAtiva ? pastaAtiva : "Meus Documentos"}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {pastaAtiva
                  ? "Arquivos desta pasta"
                  : "Documentos do seu escritório contábil"}
              </p>
            </div>
            <div className="flex gap-2">
              {!pastaAtiva && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setShowNovaPasta(true)}
                >
                  <FolderPlus className="w-4 h-4" />
                  Nova Pasta
                </Button>
              )}
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
              >
                {uploadingFile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploadingFile ? "Enviando..." : "Enviar Arquivo"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {/* Modal Nova Pasta */}
          {showNovaPasta && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
              <Card className="w-full max-w-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Nova Pasta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Nome da pasta"
                    value={novaPastaNome}
                    onChange={e => setNovaPastaNome(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && confirmarNovaPasta()}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowNovaPasta(false); setNovaPastaNome(""); }}
                    >
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={confirmarNovaPasta} className="bg-emerald-600 hover:bg-emerald-700">
                      Criar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navegação de pasta */}
          {pastaAtiva && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setPastaAtiva(null); setSearch(""); }}
                className="gap-1 text-gray-600"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
              <span className="text-sm text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900">{pastaAtiva}</span>
            </div>
          )}

          {isLoadingDocs ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              {/* Grade de pastas (só na raiz) */}
              {!pastaAtiva && todasPastas.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {todasPastas.map(pasta => {
                    const count = docs.filter(d => d.pasta === pasta).length;
                    return (
                      <button
                        key={pasta}
                        onClick={() => { setPastaAtiva(pasta); setSearch(""); }}
                        className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:border-emerald-400 hover:shadow-sm transition-all text-left"
                      >
                        <FolderOpen className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{pasta}</p>
                          <p className="text-xs text-gray-500">{count} arquivo{count !== 1 ? "s" : ""}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Busca */}
              {(pastaAtiva || docs.filter(d => !d.pasta).length > 0) && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar arquivos..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}

              {/* Lista de documentos — só exibe quando estamos dentro de uma pasta
                  OU quando não há pastas e precisamos mostrar os arquivos na raiz */}
              {(pastaAtiva !== null || todasPastas.length === 0) && (
                filtrados.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        {search
                          ? "Nenhum arquivo encontrado"
                          : pastaAtiva
                          ? 'Pasta vazia. Clique em "Enviar Arquivo" para adicionar.'
                          : "Nenhum documento disponível"}
                      </p>
                      {!search && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 gap-1.5"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFile}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Enviar Arquivo
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <DocList
                    docs={filtrados}
                    downloadingId={downloadingId}
                    deletingId={deletingId}
                    onDownload={id => setDownloadingId(id)}
                    onDelete={id => {
                      if (confirm("Remover este arquivo?")) {
                        setDeletingId(id);
                        deleteMutation.mutate({ id });
                      }
                    }}
                  />
                )
              )}

              {/* Arquivos na raiz quando também há pastas */}
              {pastaAtiva === null && todasPastas.length > 0 && filtrados.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-gray-600 mb-2">Arquivos sem pasta</h2>
                  <DocList
                    docs={filtrados}
                    downloadingId={downloadingId}
                    deletingId={deletingId}
                    onDownload={id => setDownloadingId(id)}
                    onDelete={id => {
                      if (confirm("Remover este arquivo?")) {
                        setDeletingId(id);
                        deleteMutation.mutate({ id });
                      }
                    }}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ===== ABA FLUXO DE CAIXA ===== */}
      {tab === "fluxo" && (
        <>
          {/* Cabeçalho + botões */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fluxo de Caixa</h1>
              <p className="text-sm text-gray-500 mt-0.5">Entradas, saídas e cobranças por mês</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => { setLancTipo("entrada"); setShowLancamento(true); }}
              >
                <TrendingUp className="w-4 h-4" />
                + Entrada
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => { setLancTipo("saida"); setShowLancamento(true); }}
              >
                <DollarSign className="w-4 h-4" />
                + Saída
              </Button>
            </div>
          </div>

          {/* Modal novo lançamento */}
          {showLancamento && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
              <Card className="w-full max-w-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {lancTipo === "entrada" ? "Nova Entrada" : "Nova Saída"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Tipo */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLancTipo("entrada")}
                      className={`flex-1 py-1.5 rounded text-sm font-medium border transition-colors ${
                        lancTipo === "entrada"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "border-gray-300 text-gray-600 hover:border-emerald-400"
                      }`}
                    >
                      Entrada
                    </button>
                    <button
                      onClick={() => setLancTipo("saida")}
                      className={`flex-1 py-1.5 rounded text-sm font-medium border transition-colors ${
                        lancTipo === "saida"
                          ? "bg-red-500 text-white border-red-500"
                          : "border-gray-300 text-gray-600 hover:border-red-400"
                      }`}
                    >
                      Saída
                    </button>
                  </div>
                  {/* Descrição */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Descrição</label>
                    <Input
                      placeholder="Ex: Venda de produto, Aluguel..."
                      value={lancDescricao}
                      onChange={e => setLancDescricao(e.target.value)}
                    />
                  </div>
                  {/* Categoria */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Categoria <span className="text-gray-400">(opcional)</span></label>
                    <Input
                      placeholder="Ex: Salários, Impostos, Receitas..."
                      value={lancCategoria}
                      onChange={e => setLancCategoria(e.target.value)}
                    />
                  </div>
                  {/* Valor */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Valor (R$)</label>
                    <Input
                      placeholder="0,00"
                      value={lancValor}
                      onChange={e => setLancValor(e.target.value)}
                      inputMode="decimal"
                    />
                  </div>
                  {/* Mês e Ano */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Mês</label>
                      <select
                        value={lancMes}
                        onChange={e => setLancMes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Ano</label>
                      <Input
                        type="number"
                        value={lancAno}
                        onChange={e => setLancAno(Number(e.target.value))}
                        min={2020}
                        max={2099}
                      />
                    </div>
                  </div>
                  {/* Botões */}
                  <div className="flex gap-2 justify-end pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowLancamento(false); setLancDescricao(""); setLancCategoria(""); setLancValor(""); }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={salvarLancamento}
                      disabled={criarLancamentoMutation.isPending}
                      className={lancTipo === "entrada" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"}
                    >
                      {criarLancamentoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {isLoadingFluxo ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              {/* Seletor de mês */}
              {gruposPorMes.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  <button
                    onClick={() => setFiltroSortKey(null)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      filtroSortKey === null
                        ? "bg-gray-800 text-white border-gray-800"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    Todos
                  </button>
                  {gruposPorMes.map(g => (
                    <button
                      key={g.sortKey}
                      onClick={() => setFiltroSortKey(g.sortKey)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        filtroSortKey === g.sortKey
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-emerald-400"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Resumo (mês selecionado ou total) */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-gray-500 mb-1">
                      {filtroLabel ? `Entradas — ${filtroLabel}` : "Total de Entradas"}
                    </p>
                    <p className="text-lg font-bold text-emerald-700">{formatCurrency(resumoVisivel.entradas)}</p>
                    {filtroLabel && resumoGeral.entradas !== resumoVisivel.entradas && (
                      <p className="text-xs text-gray-400 mt-0.5">Total: {formatCurrency(resumoGeral.entradas)}</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-gray-500 mb-1">
                      {filtroLabel ? `Saídas — ${filtroLabel}` : "Total de Saídas"}
                    </p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(resumoVisivel.saidas)}</p>
                    {filtroLabel && resumoGeral.saidas !== resumoVisivel.saidas && (
                      <p className="text-xs text-gray-400 mt-0.5">Total: {formatCurrency(resumoGeral.saidas)}</p>
                    )}
                  </CardContent>
                </Card>
                <Card className={resumoVisivel.saldo >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-gray-500 mb-1">
                      {filtroLabel ? `Saldo — ${filtroLabel}` : "Saldo Geral"}
                    </p>
                    <p className={`text-lg font-bold ${resumoVisivel.saldo >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                      {resumoVisivel.saldo >= 0 ? "+" : ""}{formatCurrency(resumoVisivel.saldo)}
                    </p>
                    {filtroLabel && resumoGeral.saldo !== resumoVisivel.saldo && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Total: {resumoGeral.saldo >= 0 ? "+" : ""}{formatCurrency(resumoGeral.saldo)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Grupos por mês */}
              {gruposVisiveis.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Nenhum lançamento registrado</p>
                    <p className="text-gray-400 text-xs mt-1">Use os botões acima para adicionar entradas e saídas</p>
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
                        {/* Cabeçalho do mês */}
                        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                          <span className="font-semibold text-gray-800">{grupo.label}</span>
                          <div className="flex items-center gap-4 text-xs">
                            {totalEnt > 0 && (
                              <span className="text-emerald-700">↑ {formatCurrency(totalEnt)}</span>
                            )}
                            {totalSai > 0 && (
                              <span className="text-red-600">↓ {formatCurrency(totalSai)}</span>
                            )}
                            <span className={`font-bold ${saldoMes >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                              Saldo: {saldoMes >= 0 ? "+" : ""}{formatCurrency(saldoMes)}
                            </span>
                          </div>
                        </div>
                        <CardContent className="p-0">
                          {/* Entradas */}
                          {grupo.entradas.length > 0 && (
                            <div className="px-4 py-2">
                              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Entradas</p>
                              {grupo.entradas.map(item => (
                                <FluxoItemRow
                                  key={item.id}
                                  item={item}
                                  onDelete={item.deletavel
                                    ? () => { if (confirm("Remover este lançamento?")) deletarLancamentoMutation.mutate({ id: item.dbId! }); }
                                    : undefined
                                  }
                                />
                              ))}
                            </div>
                          )}
                          {/* Saídas */}
                          {grupo.saidas.length > 0 && (
                            <div className={`px-4 py-2 ${grupo.entradas.length > 0 ? "border-t" : ""}`}>
                              <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">Saídas</p>
                              {grupo.saidas.map(item => (
                                <FluxoItemRow
                                  key={item.id}
                                  item={item}
                                  onDelete={item.deletavel
                                    ? () => { if (confirm("Remover este lançamento?")) deletarLancamentoMutation.mutate({ id: item.dbId! }); }
                                    : undefined
                                  }
                                />
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
