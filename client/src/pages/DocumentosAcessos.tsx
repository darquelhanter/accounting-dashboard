import { useState, useRef, useEffect, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  Trash2,
  FileText,
  File,
  FileImage,
  FileSpreadsheet,
  FolderOpen,
  Folder,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Edit2,
  KeyRound,
  Building2,
  FolderPlus,
  ArrowLeft,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────── Documentos ───────────────────────────

const ITEMS_PER_PAGE = 15;
const MAX_FILE_SIZE_MB = 30;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(tipo: string) {
  if (tipo.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
  if (tipo.includes("image")) return <FileImage className="h-4 w-4 text-blue-500" />;
  if (tipo.includes("sheet") || tipo.includes("excel") || tipo.includes("csv"))
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  return <File className="h-4 w-4 text-gray-500" />;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function TabDocumentos() {
  const [selectedClienteId, setSelectedClienteId] = useState<string>("Todos");
  const [pastaAtiva, setPastaAtiva] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNovaPastaOpen, setIsNovaPastaOpen] = useState(false);
  const [novaPastaNome, setNovaPastaNome] = useState("");
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameAlvo, setRenameAlvo] = useState("");
  const [renameNome, setRenameNome] = useState("");
  const [isDeletePastaOpen, setIsDeletePastaOpen] = useState(false);
  const [deletePastaAlvo, setDeletePastaAlvo] = useState("");
  const [pastasVazias, setPastasVazias] = useState<{ clienteId: number | undefined; nome: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescricao, setUploadDescricao] = useState("");
  const [uploadPasta, setUploadPasta] = useState("");
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: clientes } = trpc.clientes.list.useQuery();
  const clienteId = selectedClienteId !== "Todos" ? Number(selectedClienteId) : undefined;

  const { data: todosDocs, isLoading, refetch } = trpc.documentos.list.useQuery();
  const { data: docsByCliente } = trpc.documentos.listByCliente.useQuery(
    { clienteId: clienteId! },
    { enabled: !!clienteId }
  );

  const rawDocs = clienteId ? (docsByCliente ?? []) : (todosDocs ?? []);

  const uploadMutation = trpc.documentos.upload.useMutation({
    onSuccess: () => {
      refetch();
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadDescricao("");
      setUploadPasta("");
      toast.success("Documento enviado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.documentos.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Documento excluído!"); },
    onError: (err) => toast.error(err.message),
  });

  const deleteManyMutation = trpc.documentos.deleteMany.useMutation({
    onSuccess: () => { refetch(); setSelectedIds([]); toast.success("Documentos excluídos!"); },
    onError: (err) => toast.error(err.message),
  });

  const renamePastaMutation = trpc.documentos.renamePasta.useMutation({
    onSuccess: () => {
      refetch();
      setIsRenameOpen(false);
      setPastaAtiva((prev) => prev === renameAlvo ? renameNome.trim() : prev);
      setPastasVazias(prev => prev.map(p =>
        p.nome === renameAlvo && p.clienteId === clienteId ? { ...p, nome: renameNome.trim() } : p
      ));
      toast.success("Pasta renomeada!");
    },
    onError: (err) => toast.error(err.message),
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

  useEffect(() => {
    if (downloadQuery.isError && downloadingId) {
      setDownloadingId(null);
      toast.error("Erro ao baixar documento.");
    }
  }, [downloadQuery.isError, downloadingId]);

  // Pastas únicas dos documentos + pastas criadas ainda vazias (filtradas pela empresa selecionada)
  const pastasExistentes = useMemo(() => {
    const set = new Set<string>();
    for (const d of rawDocs) {
      if (d.pasta) set.add(d.pasta);
    }
    for (const p of pastasVazias) {
      if (p.clienteId === clienteId) set.add(p.nome);
    }
    return Array.from(set).sort();
  }, [rawDocs, pastasVazias, clienteId]);

  // Docs filtrados por pasta ativa e busca
  const docsNaPasta = useMemo(() => {
    return rawDocs.filter((d) => {
      if (pastaAtiva !== null) {
        if (pastaAtiva === "__sem_pasta__") {
          if (d.pasta) return false;
        } else {
          if (d.pasta !== pastaAtiva) return false;
        }
      }
      if (!searchTerm) return true;
      const clienteNome = clientes?.find((c) => c.id === d.clienteId)?.nome ?? "";
      const q = searchTerm.toLowerCase();
      return (
        d.nome.toLowerCase().includes(q) ||
        clienteNome.toLowerCase().includes(q) ||
        (d.descricao ?? "").toLowerCase().includes(q)
      );
    });
  }, [rawDocs, pastaAtiva, searchTerm, clientes]);

  const totalPages = Math.max(1, Math.ceil(docsNaPasta.length / ITEMS_PER_PAGE));
  const paginated = docsNaPasta.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const semPastaCount = rawDocs.filter((d) => !d.pasta).length;

  function abrirPasta(nome: string | "__sem_pasta__") {
    setPastaAtiva(nome);
    setCurrentPage(1);
    setSelectedIds([]);
    setSearchTerm("");
  }

  function voltarPastas() {
    setPastaAtiva(null);
    setCurrentPage(1);
    setSelectedIds([]);
    setSearchTerm("");
  }

  function confirmarNovaPasta() {
    const nome = novaPastaNome.trim();
    if (!nome) { toast.error("Digite um nome para a pasta."); return; }
    if (pastasExistentes.includes(nome)) {
      toast.error("Já existe uma pasta com esse nome.");
      return;
    }
    setIsNovaPastaOpen(false);
    setNovaPastaNome("");
    setPastasVazias(prev => [...prev, { clienteId, nome }]);
    setUploadPasta(nome);
    setPastaAtiva(nome);
    toast.success(`Pasta "${nome}" criada! Envie arquivos quando quiser.`);
  }

  function openDeletePasta(pasta: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletePastaAlvo(pasta);
    setIsDeletePastaOpen(true);
  }

  function addToFolder(pasta: string, e: React.MouseEvent) {
    e.stopPropagation();
    setUploadPasta(pasta);
    fileInputRef.current?.click();
  }

  function confirmarDeletePasta() {
    const docIds = rawDocs.filter(d => d.pasta === deletePastaAlvo).map(d => d.id);
    const cleanup = () => {
      setPastasVazias(prev => prev.filter(p => !(p.nome === deletePastaAlvo && p.clienteId === clienteId)));
      setIsDeletePastaOpen(false);
      setDeletePastaAlvo("");
      if (pastaAtiva === deletePastaAlvo) voltarPastas();
    };
    if (docIds.length > 0) {
      deleteManyMutation.mutate({ ids: docIds }, { onSuccess: () => { cleanup(); toast.success("Pasta e arquivos excluídos!"); } });
    } else {
      cleanup();
      toast.success("Pasta excluída!");
    }
  }

  function openRename(pasta: string, e: React.MouseEvent) {
    e.stopPropagation();
    setRenameAlvo(pasta);
    setRenameNome(pasta);
    setIsRenameOpen(true);
  }

  function confirmarRename() {
    const nome = renameNome.trim();
    if (!nome) { toast.error("Digite um nome para a pasta."); return; }
    if (nome === renameAlvo) { setIsRenameOpen(false); return; }
    if (!clienteId) { toast.error("Selecione uma empresa para renomear."); return; }
    renamePastaMutation.mutate({ clienteId, oldNome: renameAlvo, newNome: nome });
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) pickFile(file);
  }

  function pickFile(file: File) {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    setUploadFile(file);
    if (pastaAtiva && pastaAtiva !== "__sem_pasta__") setUploadPasta(pastaAtiva);
    setIsUploadOpen(true);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;
    if (!selectedClienteId || selectedClienteId === "Todos") {
      toast.error("Selecione uma empresa antes de enviar.");
      return;
    }
    setUploading(true);
    try {
      const conteudo = await fileToBase64(uploadFile);
      await uploadMutation.mutateAsync({
        clienteId: Number(selectedClienteId),
        pasta: uploadPasta.trim() || undefined,
        nome: uploadFile.name,
        descricao: uploadDescricao || undefined,
        tipo: uploadFile.type || "application/octet-stream",
        tamanho: uploadFile.size,
        conteudo,
      });
    } catch {
      toast.error("Erro ao enviar arquivo.");
    } finally {
      setUploading(false);
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function toggleAll() {
    setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map((d) => d.id));
  }

  const totalSize = rawDocs.reduce((acc, d) => acc + (d.tamanho ?? 0), 0);
  const empresaNome = selectedClienteId === "Todos"
    ? "Todas as empresas"
    : clientes?.find((c) => String(c.id) === selectedClienteId)?.nome ?? "—";

  const temEmpresa = !!clienteId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          {pastaAtiva !== null ? (
            <div className="flex items-center gap-2">
              <button onClick={voltarPastas} className="text-gray-400 hover:text-gray-700 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Folder className="h-5 w-5 text-yellow-500" />
                  {pastaAtiva === "__sem_pasta__" ? "Sem pasta" : pastaAtiva}
                </h2>
                <p className="text-gray-500 text-xs mt-0.5">{empresaNome}</p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-gray-900">Documentos</h2>
              <p className="text-gray-500 text-sm mt-1">Armazene e acesse documentos por empresa</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {pastaAtiva === null && temEmpresa && (
            <Button variant="outline" onClick={() => setIsNovaPastaOpen(true)} className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4" />
              Nova Pasta
            </Button>
          )}
          {pastaAtiva !== null && pastaAtiva !== "__sem_pasta__" && temEmpresa && (
            <>
              <Button variant="outline" size="sm" onClick={(e) => openRename(pastaAtiva, e)} className="flex items-center gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Renomear
              </Button>
              <Button variant="outline" size="sm" onClick={(e) => openDeletePasta(pastaAtiva, e)} className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" />
                Excluir Pasta
              </Button>
            </>
          )}
          {temEmpresa && (
            <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Enviar Documento
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{rawDocs.length}</p>
            <p className="text-xs text-gray-500">{formatBytes(totalSize)} armazenados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pastas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pastasExistentes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Empresa selecionada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold truncate">{empresaNome}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de empresa */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={selectedClienteId}
          onValueChange={(v) => { setSelectedClienteId(v); setPastaAtiva(null); setCurrentPage(1); setSelectedIds([]); }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Todas as empresas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todas as empresas</SelectItem>
            {clientes?.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {pastaAtiva !== null && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 w-56"
              placeholder="Buscar documento..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        )}

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
                <AlertDialogTitle>Excluir documentos selecionados?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
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

      {/* Conteúdo principal */}
      {pastaAtiva === null ? (
        /* Vista de pastas */
        <>
          {temEmpresa && (
            <div
              className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors cursor-pointer ${
                isDragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className={`h-7 w-7 mx-auto mb-1 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
              <p className="text-sm text-gray-500">
                Arraste um arquivo aqui ou <span className="text-blue-600 underline">clique para selecionar</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Máximo {MAX_FILE_SIZE_MB}MB</p>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : pastasExistentes.length === 0 && semPastaCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FolderOpen className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">Nenhum documento encontrado.</p>
              {!temEmpresa && <p className="text-xs mt-1">Selecione uma empresa ou envie o primeiro documento.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {pastasExistentes.map((pasta) => {
                const count = rawDocs.filter((d) => d.pasta === pasta).length;
                return (
                  <div key={pasta} className="relative group">
                    <button
                      onClick={() => abrirPasta(pasta)}
                      className="w-full flex flex-col items-center gap-2 p-5 rounded-xl border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition-colors text-left"
                    >
                      <Folder className="h-10 w-10 text-yellow-400 group-hover:text-yellow-500 transition-colors" />
                      <span className="text-sm font-medium text-gray-800 text-center leading-tight break-all">{pasta}</span>
                      <Badge variant="secondary" className="text-xs">{count} arquivo{count !== 1 ? "s" : ""}</Badge>
                    </button>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => addToFolder(pasta, e)}
                        title="Adicionar arquivo"
                        className="p-1 rounded-md bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-200 shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5 text-blue-500" />
                      </button>
                      {temEmpresa && (
                        <>
                          <button
                            onClick={(e) => openRename(pasta, e)}
                            title="Renomear pasta"
                            className="p-1 rounded-md bg-white border border-gray-200 hover:bg-gray-100 shadow-sm"
                          >
                            <Pencil className="h-3.5 w-3.5 text-gray-500" />
                          </button>
                          <button
                            onClick={(e) => openDeletePasta(pasta, e)}
                            title="Excluir pasta"
                            className="p-1 rounded-md bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 shadow-sm"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {semPastaCount > 0 && (
                <button
                  onClick={() => abrirPasta("__sem_pasta__")}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl border border-dashed border-gray-300 hover:border-gray-500 hover:bg-gray-50 transition-colors group text-left"
                >
                  <Folder className="h-10 w-10 text-gray-400 group-hover:text-gray-500 transition-colors" />
                  <span className="text-sm font-medium text-gray-600 text-center">Sem pasta</span>
                  <Badge variant="outline" className="text-xs">{semPastaCount} arquivo{semPastaCount !== 1 ? "s" : ""}</Badge>
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        /* Vista de documentos dentro de uma pasta */
        <>
          <div
            className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors cursor-pointer ${
              isDragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`h-7 w-7 mx-auto mb-1 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
            <p className="text-sm text-gray-500">
              Arraste um arquivo aqui ou <span className="text-blue-600 underline">clique para selecionar</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Máximo {MAX_FILE_SIZE_MB}MB</p>
          </div>

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
                  <TableHead>Arquivo</TableHead>
                  {selectedClienteId === "Todos" && <TableHead>Empresa</TableHead>}
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                      <Upload className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p>Esta pasta está vazia.</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 text-sm text-blue-600 hover:underline"
                      >
                        Clique para enviar o primeiro arquivo
                      </button>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((doc) => {
                    const clienteNome = clientes?.find((c) => c.id === doc.clienteId)?.nome ?? "—";
                    const ext = doc.nome.split(".").pop()?.toUpperCase() ?? "";
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(doc.id)}
                            onCheckedChange={() => toggleSelect(doc.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFileIcon(doc.tipo)}
                            <div>
                              <p className="font-medium text-sm truncate max-w-[200px]">{doc.nome}</p>
                              {ext && <Badge variant="outline" className="text-xs px-1 py-0">{ext}</Badge>}
                            </div>
                          </div>
                        </TableCell>
                        {selectedClienteId === "Todos" && (
                          <TableCell className="text-sm">{clienteNome}</TableCell>
                        )}
                        <TableCell className="text-sm text-gray-500 max-w-[180px] truncate">
                          {doc.descricao || "—"}
                        </TableCell>
                        <TableCell className="text-sm">{formatBytes(doc.tamanho)}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Baixar"
                              disabled={downloadingId === doc.id}
                              onClick={() => setDownloadingId(doc.id)}
                            >
                              <Download className={`h-4 w-4 text-blue-600 ${downloadingId === doc.id ? "animate-pulse" : ""}`} />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Excluir">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    "{doc.nome}" será removido permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="flex justify-end gap-2 mt-4">
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => deleteMutation.mutate({ id: doc.id })}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{docsNaPasta.length} documento(s) — página {currentPage} de {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Renomear Pasta */}
      <Dialog open={isRenameOpen} onOpenChange={(v) => { setIsRenameOpen(v); if (!v) { setRenameAlvo(""); setRenameNome(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Renomear Pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Novo nome</Label>
              <Input
                placeholder="Nome da pasta"
                value={renameNome}
                onChange={(e) => setRenameNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmarRename()}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsRenameOpen(false)}>Cancelar</Button>
              <Button onClick={confirmarRename} disabled={renamePastaMutation.isPending}>
                {renamePastaMutation.isPending ? "Salvando..." : "Renomear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Excluir Pasta */}
      <AlertDialog open={isDeletePastaOpen} onOpenChange={(v) => { setIsDeletePastaOpen(v); if (!v) setDeletePastaAlvo(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pasta "{deletePastaAlvo}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const count = rawDocs.filter(d => d.pasta === deletePastaAlvo).length;
                return count > 0
                  ? `Esta pasta contém ${count} arquivo${count !== 1 ? "s" : ""}. Todos serão excluídos permanentemente.`
                  : "A pasta está vazia e será removida.";
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmarDeletePasta}
            >
              Excluir
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Nova Pasta */}
      <Dialog open={isNovaPastaOpen} onOpenChange={(v) => { setIsNovaPastaOpen(v); if (!v) setNovaPastaNome(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Nome da pasta</Label>
              <Input
                placeholder="Ex: Contratos, Notas Fiscais, 2024..."
                value={novaPastaNome}
                onChange={(e) => setNovaPastaNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmarNovaPasta()}
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500">
              A pasta será criada vazia. Você pode enviar arquivos para ela quando quiser.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsNovaPastaOpen(false)}>Cancelar</Button>
              <Button onClick={confirmarNovaPasta}>Criar Pasta</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Upload */}
      <Dialog open={isUploadOpen} onOpenChange={(v) => { setIsUploadOpen(v); if (!v) { setUploadFile(null); setUploadDescricao(""); setUploadPasta(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Documento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4 mt-2">
            {uploadFile && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                {getFileIcon(uploadFile.type)}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{uploadFile.name}</p>
                  <p className="text-xs text-gray-500">{formatBytes(uploadFile.size)}</p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label>Empresa</Label>
              <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Pasta (opcional)</Label>
              <Input
                list="pastas-list"
                placeholder="Ex: Contratos, Notas Fiscais..."
                value={uploadPasta}
                onChange={(e) => setUploadPasta(e.target.value)}
              />
              <datalist id="pastas-list">
                {pastasExistentes.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <p className="text-xs text-gray-400">Digite um nome existente ou crie uma nova pasta</p>
            </div>

            <div className="space-y-1">
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Ex: Contrato social, Balanço 2024..."
                value={uploadDescricao}
                onChange={(e) => setUploadDescricao(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsUploadOpen(false); setUploadFile(null); setUploadDescricao(""); setUploadPasta(""); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading || !uploadFile}>
                {uploading ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────── Acessos ───────────────────────────

const emptyAcessoForm = {
  clienteId: "",
  titulo: "",
  conteudo: "",
};

function TabAcessos() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filtroCliente, setFiltroCliente] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState(emptyAcessoForm);

  const { data: clientes } = trpc.clientes.list.useQuery();
  const { data: acessos, isLoading, refetch } = trpc.acessos.list.useQuery();

  const createMutation = trpc.acessos.create.useMutation({
    onSuccess: () => { refetch(); setIsOpen(false); setForm(emptyAcessoForm); toast.success("Acesso salvo!"); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.acessos.update.useMutation({
    onSuccess: () => { refetch(); setIsOpen(false); setEditingId(null); setForm(emptyAcessoForm); toast.success("Acesso atualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.acessos.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Acesso excluído!"); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!acessos) return [];
    return acessos.filter((a) => {
      const clienteNome = clientes?.find((c) => c.id === a.clienteId)?.nome ?? "";
      if (filtroCliente !== "Todos" && String(a.clienteId) !== filtroCliente) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          a.descricao.toLowerCase().includes(q) ||
          clienteNome.toLowerCase().includes(q) ||
          (a.observacao ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [acessos, filtroCliente, searchTerm, clientes]);

  const groupedByCliente = useMemo(() => {
    const map = new Map<number, typeof filtered>();
    for (const a of filtered) {
      const list = map.get(a.clienteId!) ?? [];
      list.push(a);
      map.set(a.clienteId!, list);
    }
    return map;
  }, [filtered]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyAcessoForm);
    setIsOpen(true);
  }

  function openEdit(a: any) {
    setEditingId(a.id);
    setForm({
      clienteId: String(a.clienteId),
      titulo: a.descricao ?? "",
      conteudo: a.observacao ?? "",
    });
    setIsOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) { toast.error("Informe o título do acesso."); return; }
    if (!form.clienteId) { toast.error("Selecione uma empresa."); return; }

    const payload = {
      clienteId: Number(form.clienteId),
      descricao: form.titulo.trim(),
      observacao: form.conteudo || undefined,
      email: undefined,
      senha: undefined,
      telefone: undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Acessos das Empresas</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Senhas e credenciais em texto livre por empresa
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Acesso
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={filtroCliente} onValueChange={setFiltroCliente}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Todas as empresas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todas as empresas</SelectItem>
            {clientes?.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 w-56"
            placeholder="Buscar acesso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista agrupada por empresa */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : groupedByCliente.size === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <KeyRound className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">Nenhum acesso cadastrado.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Cadastrar primeiro acesso
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(groupedByCliente.entries()).map(([clienteId, itens]) => {
            const clienteNome = clientes?.find((c) => c.id === clienteId)?.nome ?? "Empresa";
            return (
              <Card key={clienteId}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {clienteNome}
                    <Badge variant="secondary" className="ml-1 text-xs">{itens.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {itens.map((acesso) => (
                      <div key={acesso.id} className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                        <div className="space-y-2 min-w-0 flex-1">
                          <p className="font-semibold text-sm">{acesso.descricao}</p>
                          {acesso.observacao ? (
                            <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-mono bg-muted/50 rounded-md px-3 py-2.5 border leading-relaxed max-w-2xl">
                              {acesso.observacao}
                            </pre>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Sem conteúdo</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(acesso)} title="Editar">
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Excluir">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir acesso?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{acesso.descricao}" de {clienteNome} será removido permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="flex justify-end gap-2 mt-4">
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => deleteMutation.mutate({ id: acesso.id })}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal criar/editar */}
      <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if (!v) { setEditingId(null); setForm(emptyAcessoForm); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Acesso" : "Novo Acesso"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Empresa *</Label>
              <Select value={form.clienteId} onValueChange={(v) => setForm((f) => ({ ...f, clienteId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Portal e-CAC, Simples Nacional, Gov.br..."
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Conteúdo</Label>
              <Textarea
                placeholder={"e-mail: empresa@email.com\nsenha: minhasenha123\nCNPJ: 00.000.000/0001-00\n\nQualquer informação de acesso..."}
                rows={8}
                value={form.conteudo}
                onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Escreva livremente: senhas, logins, CNPJ, observações, etc.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsOpen(false); setEditingId(null); setForm(emptyAcessoForm); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : editingId ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────── Página unificada ───────────────────────────

export default function DocumentosAcessos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documentos & Acessos</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie arquivos e credenciais das empresas</p>
      </div>

      <Tabs defaultValue="documentos">
        <TabsList>
          <TabsTrigger value="documentos" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="acessos" className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Acessos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documentos" className="mt-6">
          <TabDocumentos />
        </TabsContent>

        <TabsContent value="acessos" className="mt-6">
          <TabAcessos />
        </TabsContent>
      </Tabs>
    </div>
  );
}
