import { useState, useRef, useCallback, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { toast } from "sonner";

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

export default function Documentos() {
  const [selectedClienteId, setSelectedClienteId] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescricao, setUploadDescricao] = useState("");
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

  const filtered = rawDocs.filter((d) => {
    const clienteNome = clientes?.find((c) => c.id === d.clienteId)?.nome ?? "";
    return (
      !searchTerm ||
      d.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.descricao ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-500 text-sm mt-1">Armazene e acesse documentos por empresa</p>
        </div>
        <Button
          onClick={() => {
            if (!selectedClienteId || selectedClienteId === "Todos") {
              toast.error("Selecione uma empresa para enviar documentos.");
              return;
            }
            fileInputRef.current?.click();
          }}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Enviar Documento
        </Button>
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
            <CardTitle className="text-sm font-medium text-gray-600">Empresas com Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Set(rawDocs.map((d) => d.clienteId)).size}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Empresa selecionada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold truncate">
              {selectedClienteId === "Todos"
                ? "Todas"
                : clientes?.find((c) => String(c.id) === selectedClienteId)?.nome ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={selectedClienteId}
          onValueChange={(v) => { setSelectedClienteId(v); setCurrentPage(1); }}
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 w-56"
            placeholder="Buscar documento..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>

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

      {/* Zona de drop */}
      {(!selectedClienteId || selectedClienteId === "Todos") ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400">
          <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Selecione uma empresa para enviar ou ver documentos</p>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
          <p className="text-sm text-gray-500">
            Arraste um arquivo aqui ou <span className="text-blue-600 underline">clique para selecionar</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Máximo {MAX_FILE_SIZE_MB}MB por arquivo</p>
        </div>
      )}

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
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Nenhum documento encontrado.
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{filtered.length} documento(s) — página {currentPage} de {totalPages}</span>
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

      {/* Modal de upload */}
      <Dialog open={isUploadOpen} onOpenChange={(v) => { setIsUploadOpen(v); if (!v) { setUploadFile(null); setUploadDescricao(""); } }}>
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
              <Select
                value={selectedClienteId}
                onValueChange={setSelectedClienteId}
              >
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
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Ex: Contrato social, Balanço 2024..."
                value={uploadDescricao}
                onChange={(e) => setUploadDescricao(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsUploadOpen(false); setUploadFile(null); setUploadDescricao(""); }}>
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
