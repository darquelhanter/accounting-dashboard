import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Plus, Edit2, Trash2, Loader2, UserCheck } from "lucide-react";
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

interface ResponsavelForm {
  nome: string;
  email: string;
  telefone: string;
}

const initialForm: ResponsavelForm = {
  nome: "",
  email: "",
  telefone: "",
};

export default function Responsaveis() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ResponsavelForm>(initialForm);

  const utils = trpc.useUtils();
  const { data: responsaveis = [], isLoading } = trpc.responsaveis.list.useQuery();
  const { data: clientes = [] } = trpc.clientes.list.useQuery();

  const createMutation = trpc.responsaveis.create.useMutation();
  const updateMutation = trpc.responsaveis.update.useMutation();
  const deleteMutation = trpc.responsaveis.delete.useMutation();

  const empresasPorResponsavel = (responsavelId: number) => {
    return clientes.filter((c: any) => c.responsavelId === responsavelId).length;
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsOpen(true);
  };

  const handleOpenEdit = (responsavel: any) => {
    setEditingId(responsavel.id);
    setForm({
      nome: responsavel.nome,
      email: responsavel.email ?? "",
      telefone: responsavel.telefone ?? "",
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          nome: form.nome,
          email: form.email || undefined,
          telefone: form.telefone || undefined,
        });
        toast.success("Responsável atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync({
          nome: form.nome,
          email: form.email || undefined,
          telefone: form.telefone || undefined,
        });
        toast.success("Responsável criado com sucesso!");
      }
      utils.responsaveis.list.invalidate();
      setIsOpen(false);
      setForm(initialForm);
    } catch (error) {
      toast.error("Erro ao salvar responsável");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Responsável deletado com sucesso!");
      utils.responsaveis.list.invalidate();
    } catch (error) {
      toast.error("Erro ao deletar responsável");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Responsáveis Contábeis</h1>
          <p className="text-slate-600 mt-1">Gerencie os responsáveis vinculados às empresas</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Novo Responsável
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              {editingId ? "Editar Responsável" : "Novo Responsável"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Nome *</label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome completo"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">E-mail</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemplo.com"
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

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Atualizar" : "Criar"}
              </Button>
              <Button onClick={() => setIsOpen(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : responsaveis.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Nenhum responsável cadastrado</p>
              <p className="text-slate-400 text-sm mt-1">Clique em "Novo Responsável" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Empresas Vinculadas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responsaveis.map((responsavel: any) => (
                    <TableRow key={responsavel.id}>
                      <TableCell className="font-medium">{responsavel.nome}</TableCell>
                      <TableCell className="text-slate-600">
                        {responsavel.email || <span className="text-slate-400">—</span>}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {responsavel.telefone || <span className="text-slate-400">—</span>}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {empresasPorResponsavel(responsavel.id)} empresa(s)
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(responsavel)}
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
                                  Tem certeza que deseja deletar o responsável "{responsavel.nome}"?
                                  As empresas vinculadas perderão essa referência.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="flex gap-2 justify-end">
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(responsavel.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
