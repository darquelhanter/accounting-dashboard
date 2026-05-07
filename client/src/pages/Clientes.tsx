import { useState } from "react";
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
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ClienteForm {
  nome: string;
  regime: "Simples" | "Lucro Presumido" | "Lucro Real";
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

export default function Clientes() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ClienteForm>(initialForm);

  const utils = trpc.useUtils();
  const { data: clientes = [], isLoading } = trpc.clientes.list.useQuery();
  const createMutation = trpc.clientes.create.useMutation();
  const updateMutation = trpc.clientes.update.useMutation();
  const deleteMutation = trpc.clientes.delete.useMutation();

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
    } catch (error) {
      toast.error("Erro ao salvar cliente");
      console.error(error);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (confirm("Tem certeza que deseja deletar este cliente?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Cliente deletado com sucesso!");
        utils.clientes.list.invalidate();
      } catch (error) {
        toast.error("Erro ao deletar cliente");
        console.error(error);
      }
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
                    <SelectItem value="Simples">Simples</SelectItem>
                    <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="Lucro Real">Lucro Real</SelectItem>
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
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Vencimento (dia) *</label>
                <Select value={form.vencimento} onValueChange={(value) => setForm({ ...form, vencimento: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Dia 10</SelectItem>
                    <SelectItem value="20">Dia 20</SelectItem>
                  </SelectContent>
                </Select>
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

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Nenhum cliente cadastrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Regime</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Mensalidade</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente: any) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.regime}</TableCell>
                      <TableCell>{cliente.setor}</TableCell>
                      <TableCell>R$ {parseFloat(cliente.valor).toFixed(2)}</TableCell>
                      <TableCell>Dia {cliente.vencimento}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cliente.status === "Ativo"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {cliente.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(cliente)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(cliente.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
