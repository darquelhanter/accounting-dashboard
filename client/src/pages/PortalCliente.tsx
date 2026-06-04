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

  const fluxoSummary = useMemo(() => {
    const all = [
      ...mensalidades.map(m => ({ valor: Number(m.valor), status: m.status })),
      ...servicos.map(s => ({ valor: Number(s.valor), status: s.status })),
    ];
    return all.reduce(
      (acc, item) => {
        acc.total += item.valor;
        if (item.status === "Pago") acc.pago += item.valor;
        else if (item.status === "Pendente") acc.pendente += item.valor;
        else if (item.status === "Atrasado") acc.atrasado += item.valor;
        return acc;
      },
      { total: 0, pago: 0, pendente: 0, atrasado: 0 }
    );
  }, [mensalidades, servicos]);

  const mensalidadesOrdenadas = useMemo(
    () =>
      [...mensalidades].sort((a, b) => {
        if (b.ano !== a.ano) return b.ano - a.ano;
        return (MESES_ORDER[b.mes] ?? 0) - (MESES_ORDER[a.mes] ?? 0);
      }),
    [mensalidades]
  );

  const servicosOrdenados = useMemo(
    () =>
      [...servicos].sort((a, b) => {
        if (b.ano !== a.ano) return b.ano - a.ano;
        return (MESES_ORDER[b.mes] ?? 0) - (MESES_ORDER[a.mes] ?? 0);
      }),
    [servicos]
  );

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fluxo de Caixa</h1>
            <p className="text-sm text-gray-500 mt-0.5">Mensalidades e serviços do seu escritório</p>
          </div>

          {isLoadingFluxo ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-gray-500 mb-1">Total</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(fluxoSummary.total)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-gray-500 mb-1">Pago</p>
                    <p className="text-lg font-bold text-green-700">{formatCurrency(fluxoSummary.pago)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-gray-500 mb-1">Pendente</p>
                    <p className="text-lg font-bold text-yellow-700">{formatCurrency(fluxoSummary.pendente)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-gray-500 mb-1">Atrasado</p>
                    <p className="text-lg font-bold text-red-700">{formatCurrency(fluxoSummary.atrasado)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Mensalidades */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Mensalidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mensalidadesOrdenadas.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">Nenhuma mensalidade registrada</p>
                  ) : (
                    <div className="space-y-2">
                      {mensalidadesOrdenadas.map((m: any) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {m.mes}/{m.ano}
                            </p>
                            {m.dataPagamento && (
                              <p className="text-xs text-gray-500">
                                Pago em {formatDate(m.dataPagamento)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge status={m.status} />
                            <span className="text-sm font-semibold text-gray-900 w-24 text-right">
                              {formatCurrency(m.valor)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Serviços Prestados */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Serviços Avulsos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {servicosOrdenados.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">Nenhum serviço avulso registrado</p>
                  ) : (
                    <div className="space-y-2">
                      {servicosOrdenados.map((s: any) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                          <div className="min-w-0 flex-1 mr-3">
                            <p className="text-sm font-medium text-gray-900 truncate">{s.nomeServico}</p>
                            <p className="text-xs text-gray-500">
                              {s.mes}/{s.ano}
                              {s.descricao && ` · ${s.descricao}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <StatusBadge status={s.status} />
                            <span className="text-sm font-semibold text-gray-900 w-24 text-right">
                              {formatCurrency(s.valor)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
