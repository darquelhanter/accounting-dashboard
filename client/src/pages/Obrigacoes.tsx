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
import { Plus, Edit2, Trash2, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { AlertBadge, AlertRow } from "@/components/AlertBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface ObrigacaoForm {
  nome: string;
  categoria: "Fiscal" | "Acessória" | "Trabalhista" | "Outra";
  periodicidade: "Mensal" | "Anual" | "Contínuo";
  regime: "Simples" | "Todos" | "Com Funcionários";
  descricao: string;
  vencimento: string;
}

const initialForm: ObrigacaoForm = {
  nome: "",
  categoria: "Fiscal",
  periodicidade: "Mensal",
  regime: "Todos",
  descricao: "",
  vencimento: "",
};

const ITEMS_PER_PAGE = 10;

export default function Obrigacoes() {
  // Carregar alertas de obrigacoes proximas do vencimento
  const { data: alertasData } = trpc.alertas.obrigacoesProximas.useQuery({ diasAntecedencia: 7 });
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ObrigacaoForm>(initialForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("Todos");
  const [filterPeriodicidade, setFilterPeriodicidade] = useState<string>("Todos");
  const [filterRegime, setFilterRegime] = useState<string>("Todos");
  const [currentPage, setCurrentPage] = useState(1);

  const utils = trpc.useUtils();
  const { data: obrigacoes = [], isLoading } = trpc.obrigacoes.list.useQuery();
  const obrigacoesProximas = alertasData || [];
  const createMutation = trpc.obrigacoes.create.useMutation();
  const updateMutation = trpc.obrigacoes.update.useMutation();
  const deleteMutation = trpc.obrigacoes.delete.useMutation();

  // Filtrar e buscar obrigações
  const filteredObrigacoes = useMemo(() => {
    return obrigacoes.filter((obrigacao: any) => {
      const matchSearch = obrigacao.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategoria = filterCategoria === "Todos" || obrigacao.categoria === filterCategoria;
      const matchPeriodicidade = filterPeriodicidade === "Todos" || obrigacao.periodicidade === filterPeriodicidade;
      const matchRegime = filterRegime === "Todos" || obrigacao.regime === filterRegime;
      return matchSearch && matchCategoria && matchPeriodicidade && matchRegime;
    });
  }, [obrigacoes, searchTerm, filterCategoria, filterPeriodicidade, filterRegime]);

  // Paginar obrigações
  const totalPages = Math.ceil(filteredObrigacoes.length / ITEMS_PER_PAGE);
  const paginatedObrigacoes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredObrigacoes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredObrigacoes, currentPage]);

  const handleOpenDialog = (obrigacao?: any) => {
    if (obrigacao) {
      setEditingId(obrigacao.id);
      setForm({
        nome: obrigacao.nome,
        categoria: obrigacao.categoria,
        periodicidade: obrigacao.periodicidade,
        regime: obrigacao.regime,
        descricao: obrigacao.descricao || "",
        vencimento: obrigacao.vencimento?.toString() || "",
      });
    } else {
      setEditingId(null);
      setForm(initialForm);
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            ...form,
            vencimento: form.vencimento ? parseInt(form.vencimento) : undefined,
          },
        });
        toast.success("Obrigação atualizada com sucesso!");
      } else {
        await createMutation.mutateAsync({
          ...form,
          vencimento: form.vencimento ? parseInt(form.vencimento) : undefined,
        });
        toast.success("Obrigação criada com sucesso!");
      }
      utils.obrigacoes.list.invalidate();
      setIsOpen(false);
      setForm(initialForm);
      setCurrentPage(1);
    } catch (error) {
      toast.error("Erro ao salvar obrigação");
      console.error(error);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Obrigação deletada com sucesso!");
      utils.obrigacoes.list.invalidate();
    } catch (error) {
      toast.error("Erro ao deletar obrigação");
      console.error(error);
    }
  };

  const categorias = ["Fiscal", "Acessória", "Trabalhista", "Outra"];
  const periodicidades = ["Mensal", "Anual", "Contínuo"];
  const regimes = ["Simples", "Todos", "Com Funcionários"];

  // Verificar se uma obrigação está próxima do vencimento
  const isProximoVencimento = (obrigacao: any) => {
    return obrigacoesProximas.some((o: any) => o.id === obrigacao.id);
  };

  return (
    <div className="space-y-6">
      {obrigacoesProximas && obrigacoesProximas.length > 0 && (
        <AlertRow
          type="proximo"
          title={`${obrigacoesProximas.length} obrigação(ões) próxima(s) do vencimento`}
          subtitle="Verifique os prazos e mantenha tudo em dia"
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Obrigações</h1>
          <p className="text-slate-600 mt-1">Cadastre e gerencie as obrigações contábeis</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Nova Obrigação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Obrigação" : "Nova Obrigação"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Nome *</label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome da obrigação"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Categoria *</label>
                <Select value={form.categoria} onValueChange={(value) => setForm({ ...form, categoria: value as any })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Periodicidade *</label>
                <Select value={form.periodicidade} onValueChange={(value) => setForm({ ...form, periodicidade: value as any })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodicidades.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Regime *</label>
                <Select value={form.regime} onValueChange={(value) => setForm({ ...form, regime: value as any })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {regimes.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Vencimento (dia do mês)</label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={form.vencimento}
                  onChange={(e) => setForm({ ...form, vencimento: e.target.value })}
                  placeholder="Ex: 15"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Descrição</label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição da obrigação"
                  className="mt-1"
                  rows={3}
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

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar obrigação..."
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

            <Select value={filterCategoria} onValueChange={(value) => {
              setFilterCategoria(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPeriodicidade} onValueChange={(value) => {
              setFilterPeriodicidade(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Periodicidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {periodicidades.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterRegime} onValueChange={(value) => {
              setFilterRegime(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Regime" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {regimes.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-slate-600 flex items-center">
              {filteredObrigacoes.length} obrigação(ões)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Obrigações */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Obrigações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : paginatedObrigacoes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">
                {searchTerm || filterCategoria !== "Todos" || filterPeriodicidade !== "Todos" || filterRegime !== "Todos"
                  ? "Nenhuma obrigação encontrada com esses filtros"
                  : "Nenhuma obrigação cadastrada"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Periodicidade</TableHead>
                      <TableHead>Regime</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedObrigacoes.map((obrigacao: any) => (
                      <TableRow key={obrigacao.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium">{obrigacao.nome}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            obrigacao.categoria === "Fiscal" ? "bg-blue-100 text-blue-800" :
                            obrigacao.categoria === "Acessória" ? "bg-purple-100 text-purple-800" :
                            obrigacao.categoria === "Trabalhista" ? "bg-orange-100 text-orange-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {obrigacao.categoria}
                          </span>
                        </TableCell>
                        <TableCell>{obrigacao.periodicidade}</TableCell>
                        <TableCell>{obrigacao.regime}</TableCell>
                        <TableCell>{obrigacao.vencimento ? `Dia ${obrigacao.vencimento}` : "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDialog(obrigacao)}
                              className="hover:bg-blue-50"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja deletar a obrigação "{obrigacao.nome}"?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="flex gap-2 justify-end">
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(obrigacao.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Deletar
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={deleteMutation.isPending}
                                className="hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
