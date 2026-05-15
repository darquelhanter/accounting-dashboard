import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ClientePermissions() {
  const [selectedCliente, setSelectedCliente] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [permissions, setPermissions] = useState({ canView: true, canEdit: false, canDelete: false });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: clientes = [], isLoading: isLoadingClientes } = trpc.clientes.list.useQuery();
  const { data: allUsers = [], isLoading: isLoadingUsers } = trpc.users.getAll.useQuery();
  const { data: clienteUsers = [], isLoading: isLoadingPermissions, refetch: refetchPermissions } = 
    trpc.permissions.getClientePermissions.useQuery(
      { clienteId: selectedCliente || 0 },
      { enabled: selectedCliente !== null }
    );

  const grantAccessMutation = trpc.permissions.grantAccess.useMutation({
    onSuccess: () => {
      toast.success("Permissão concedida com sucesso!");
      refetchPermissions();
      setSelectedUser(null);
      setPermissions({ canView: true, canEdit: false, canDelete: false });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao conceder permissão");
    },
  });

  const revokeAccessMutation = trpc.permissions.revokeAccess.useMutation({
    onSuccess: () => {
      toast.success("Permissão removida com sucesso!");
      refetchPermissions();
      setDeleteConfirmOpen(false);
      setDeleteUserId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover permissão");
    },
  });

  const handleGrantAccess = async () => {
    if (!selectedCliente || !selectedUser) {
      toast.error("Selecione uma empresa e um usuário");
      return;
    }
    await grantAccessMutation.mutateAsync({
      clienteId: selectedCliente,
      userId: selectedUser,
      canView: permissions.canView,
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete,
    });
  };

  const handleRevokeAccess = async () => {
    if (!selectedCliente || !deleteUserId) return;
    await revokeAccessMutation.mutateAsync({
      clienteId: selectedCliente,
      userId: deleteUserId,
    });
  };

  const getClienteName = (clienteId: number) => {
    return clientes.find((c: any) => c.id === clienteId)?.nome || "Empresa desconhecida";
  };

  const getAvailableUsers = () => {
    const assignedUserIds = new Set(clienteUsers.map((u: any) => u.id));
    return allUsers.filter((u: any) => !assignedUserIds.has(u.id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Permissões de Empresas</CardTitle>
          <CardDescription>
            Controle quais usuários têm acesso a cada empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de Empresa */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione uma Empresa</label>
            <Select
              value={selectedCliente?.toString() || ""}
              onValueChange={(value) => setSelectedCliente(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma empresa..." />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((cliente: any) => (
                  <SelectItem key={cliente.id} value={cliente.id.toString()}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCliente && (
            <>
              {/* Adicionar Novo Acesso */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Conceder Novo Acesso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Usuário</label>
                    <Select
                      value={selectedUser?.toString() || ""}
                      onValueChange={(value) => setSelectedUser(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um usuário..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableUsers().map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Permissões</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canView"
                          checked={permissions.canView}
                          onCheckedChange={(checked) =>
                            setPermissions({ ...permissions, canView: checked as boolean })
                          }
                        />
                        <label htmlFor="canView" className="text-sm cursor-pointer">
                          Visualizar
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canEdit"
                          checked={permissions.canEdit}
                          onCheckedChange={(checked) =>
                            setPermissions({ ...permissions, canEdit: checked as boolean })
                          }
                        />
                        <label htmlFor="canEdit" className="text-sm cursor-pointer">
                          Editar
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canDelete"
                          checked={permissions.canDelete}
                          onCheckedChange={(checked) =>
                            setPermissions({ ...permissions, canDelete: checked as boolean })
                          }
                        />
                        <label htmlFor="canDelete" className="text-sm cursor-pointer">
                          Deletar
                        </label>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleGrantAccess}
                    disabled={!selectedUser || grantAccessMutation.isPending}
                    className="w-full"
                  >
                    {grantAccessMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Concedendo...
                      </>
                    ) : (
                      "Conceder Acesso"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de Usuários com Acesso */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Usuários com Acesso a {getClienteName(selectedCliente)}
                  </CardTitle>
                  <CardDescription>
                    {clienteUsers.length} usuário(s) com acesso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPermissions ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : clienteUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum usuário tem acesso a esta empresa
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-center">Visualizar</TableHead>
                            <TableHead className="text-center">Editar</TableHead>
                            <TableHead className="text-center">Deletar</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clienteUsers.map((user: any) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell className="text-center">
                                {user.canView ? (
                                  <Badge className="bg-green-100 text-green-800">Sim</Badge>
                                ) : (
                                  <Badge variant="secondary">Não</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {user.canEdit ? (
                                  <Badge className="bg-green-100 text-green-800">Sim</Badge>
                                ) : (
                                  <Badge variant="secondary">Não</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {user.canDelete ? (
                                  <Badge className="bg-green-100 text-green-800">Sim</Badge>
                                ) : (
                                  <Badge variant="secondary">Não</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setDeleteUserId(user.id);
                                    setDeleteConfirmOpen(true);
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remover
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação para Remoção */}
      <AlertDialog open={deleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário não terá mais acesso a esta empresa. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteUserId(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAccess}
              disabled={revokeAccessMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {revokeAccessMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover Acesso"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
