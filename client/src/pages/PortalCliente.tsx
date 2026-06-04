import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, FolderOpen, FileText, Download, Search, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("pt-BR");
}

export default function PortalCliente() {
  const [search, setSearch] = useState("");
  const [pastaAtiva, setPastaAtiva] = useState<string | null>(null);

  const { data: documentos = [], isLoading } = trpc.portalCliente.documentos.useQuery(undefined, {
    retry: false,
  });

  const handleDownload = (doc: any) => {
    try {
      const link = document.createElement("a");
      link.href = doc.conteudo;
      link.download = doc.nome;
      link.click();
    } catch {
      toast.error("Erro ao baixar arquivo");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const docs = documentos as any[];

  // Pastas únicas
  const pastas = Array.from(new Set(docs.filter(d => d.pasta).map(d => d.pasta as string))).sort();
  const semPasta = docs.filter(d => !d.pasta);

  const docsNaPasta = pastaAtiva
    ? docs.filter(d => d.pasta === pastaAtiva)
    : semPasta;

  const filtrados = docsNaPasta.filter(d =>
    d.nome.toLowerCase().includes(search.toLowerCase()) ||
    (d.descricao?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meus Documentos</h1>
        <p className="text-sm text-gray-500 mt-1">Documentos disponibilizados pelo seu contador</p>
      </div>

      {/* Pastas */}
      {pastas.length > 0 && !pastaAtiva && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {pastas.map(pasta => {
            const count = docs.filter(d => d.pasta === pasta).length;
            return (
              <button
                key={pasta}
                onClick={() => { setPastaAtiva(pasta); setSearch(""); }}
                className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:border-emerald-400 hover:shadow-sm transition-all text-left"
              >
                <FolderOpen className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{pasta}</p>
                  <p className="text-xs text-gray-500">{count} arquivo{count !== 1 ? "s" : ""}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* Voltar de pasta */}
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
          <span className="text-sm text-gray-500">/</span>
          <span className="text-sm font-medium text-gray-900">{pastaAtiva}</span>
        </div>
      )}

      {/* Busca */}
      {(pastaAtiva || semPasta.length > 0) && (
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

      {/* Lista de documentos */}
      {filtrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {search ? "Nenhum arquivo encontrado" : "Nenhum documento disponível"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtrados.map((doc: any) => (
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
                onClick={() => handleDownload(doc)}
                className="shrink-0 gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Arquivos sem pasta (na raiz) quando há pastas */}
      {!pastaAtiva && semPasta.length > 0 && pastas.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-600 mb-2">Outros arquivos</h2>
          <div className="space-y-2">
            {semPasta
              .filter(d => d.nome.toLowerCase().includes(search.toLowerCase()))
              .map((doc: any) => (
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
                    onClick={() => handleDownload(doc)}
                    className="shrink-0 gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
