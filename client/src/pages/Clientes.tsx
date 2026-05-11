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
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
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

interface ClienteForm {
  nome: string;
  regime: "Simples" | "Lucro Presumido" | "Lucro Real" | "MEI";
  setor: "Fiscal" | "Trabalhista" | "Contábil" | "Geral";
  valor: string;
  vencimento: string;
  status: "Ativo" | "Inativo";
}

const initialForm: ClienteForm = {
  nome: "",
  regime: "Simples",
  setor: "Geral",
  valor: "",
  vencimento: "10",
  status: "Ativo",
};

const regimes = ["Simples", "Lucro Presumido", "Lucro Real", "MEI"];
const ITEMS_PER_PAGE = 10;

export default function Clientes() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ClienteForm>(initialForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"Todos" | "Ativo" | "Inativo">("Todos");
  const [filterRegime, setFilterRegime] = useState<string>("Todos");
  const [sortBy, setSortBy] = useState<string>("nome");
  const [currentPage, setCurrentPage] = useState(1);

  const utils = trpc.useUtils();
  const { data: clientes = [], isLoading } = trpc.clientes.list.useQuery();
  const createMutation = trpc.clientes.create.useMutation();
  const updateMutation = trpc.clientes.update.useMutation();
  const deleteMutation = trpc.clientes.delete.useMutation();

  // Filtrar, buscar e ordenar clientes
  const filteredClientes = useMemo(() => {
    let result = clientes.filter((cliente: any) => {
      const matchSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "Todos" || cliente.status === filterStatus;
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
    setFilterStatus("Todos");
    setFilterRegime("Todos");
    setSortBy("nome");
    setCurrentPage(1);
  };

  const handleOpenDialog = (cliente?: any) => {
    if (cliente) {
      setEditingId(cliente.id);
      setForm({
        nome: cliente.nome,
        regime: cliente.regime,
        setor: cliente.setor,
        valor: cliente.valor.toString(),
        vencimento: cliente.vencimento.toString(),
        status: cliente.status,
      });
    } else {
      setEditingId(null);
      setForm(initialForm);
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
          },
        });
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync({
          ...form,
          vencimento: parseInt(form.vencimento),
        });
        toast.success("Cliente criado com sucesso!");
      }
      utils.clientes.list.invalidate();
      setIsOpen(false);
      setForm(initialForm);
      setCurrentPage(1);
    } catch (error) {
      toast.error("Erro ao salvar cliente");
      console.error(error);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Cliente deletado com sucesso!");
      utils.clientes.list.invalidate();
    } catch (error) {
      toast.error("Erro ao deletar cliente");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Clientes</h1>
          <p className="text-slate-600 mt-1">Cadastre e gerencie seus clientes</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
                <label className="text-sm font-medium text-slate-700">Setor</label>
                <Select value={form.setor} onValueChange={(value) => setForm({ ...form, setor: value as any })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
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
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as any })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Tabela de Clientes */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : paginatedClientes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Regime</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Valor (R$)</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClientes.map((cliente: any) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">{cliente.nome}</TableCell>
                        <TableCell>{cliente.regime}</TableCell>
                        <TableCell>{cliente.setor}</TableCell>
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
                                    Tem certeza que deseja deletar o cliente "{cliente.nome}"?
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
