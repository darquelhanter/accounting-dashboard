import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Plus, Search, Building2, CheckSquare, Square } from "lucide-react";
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
  // Formulário de concessão
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedClienteIds, setSelectedClienteIds] = useState<number[]>([]);
  const [permissions, setPermissions] = useState({ canView: true, canEdit: false, canDelete: false });
  const [searchEmpresas, setSearchEmpresas] = useState("");

  // Visualização de permissões existentes
  const [viewCliente, setViewCliente] = useState<number | null>(null);

  // Remoção
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ clienteId: number; userId: number } | null>(null);

  const { data: clientes = [] } = trpc.clientes.list.useQuery();
  const { data: allUsers = [] } = trpc.users.getAll.useQuery();
  const { data: clienteUsers = [], isLoading: isLoadingPermissions, refetch: refetchPermissions } =
    trpc.permissions.getClientePermissions.useQuery(
      { clienteId: viewCliente || 0 },
      { enabled: viewCliente !== null }
    );

  const grantBulkMutation = trpc.permissions.grantBulkAccess.useMutation({
    onSuccess: (res) => {
      toast.success(`Acesso concedido para ${res.count} empresa(s)!`);
      refetchPermissions();
      setSelectedClienteIds([]);
      setSelectedUser(null);
      setPermissions({ canView: true, canEdit: false, canDelete: false });
    },
    onError: (error) => toast.error(error.message || "Erro ao conceder permissão"),
  });

  const revokeAccessMutation = trpc.permissions.revokeAccess.useMutation({
    onSuccess: () => {
      toast.success("Acesso removido!");
      refetchPermissions();
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    },
    onError: (error) => toast.error(error.message || "Erro ao remover permissão"),
  });

  const filteredClientes = useMemo(() =>
    clientes.filter((c: any) =>
      c.nome.toLowerCase().includes(searchEmpresas.toLowerCase())
    ),
    [clientes, searchEmpresas]
  );

  function toggleCliente(id: number) {
    setSelectedClienteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    const ids = filteredClientes.map((c: any) => c.id);
    const allSelected = ids.every((id: number) => selectedClienteIds.includes(id));
    setSelectedClienteIds(allSelected ? selectedClienteIds.filter((id) => !ids.includes(id)) : [...new Set([...selectedClienteIds, ...ids])]);
  }

  const allFilteredSelected =
    filteredClientes.length > 0 &&
    filteredClientes.every((c: any) => selectedClienteIds.includes(c.id));

  function handleGrant() {
    if (!selectedUser) { toast.error("Selecione um usuário."); return; }
    if (selectedClienteIds.length === 0) { toast.error("Selecione pelo menos uma empresa."); return; }
    grantBulkMutation.mutate({
      clienteIds: selectedClienteIds,
      userId: selectedUser,
      ...permissions,
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Permissões de Empresas</CardTitle>
          <CardDescription>Conceda acesso a múltiplas empresas para um usuário de uma só vez</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Passo 1 — Usuário */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">1. Selecione o Usuário</p>
            <Select
              value={selectedUser?.toString() || ""}
              onValueChange={(v) => setSelectedUser(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha o usuário..." />
              </SelectTrigger>
              <SelectContent>
                {allUsers.map((u: any) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.name} — {u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Passo 2 — Empresas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                2. Selecione as Empresas
                {selectedClienteIds.length > 0 && (
                  <span className="ml-2 text-blue-600 font-normal">
                    ({selectedClienteIds.length} selecionada{selectedClienteIds.length > 1 ? "s" : ""})
                  </span>
                )}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={toggleAll}
                disabled={filteredClientes.length === 0}
              >
                {allFilteredSelected ? (
                  <><Square className="h-3 w-3" /> Desmarcar visíveis</>
                ) : (
                  <><CheckSquare className="h-3 w-3" /> Marcar visíveis</>
                )}
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Filtrar empresas..."
                value={searchEmpresas}
                onChange={(e) => setSearchEmpresas(e.target.value)}
              />
            </div>

            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {filteredClientes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">Nenhuma empresa encontrada.</p>
              ) : (
                filteredClientes.map((c: any) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedClienteIds.includes(c.id)}
                      onCheckedChange={() => toggleCliente(c.id)}
                    />
                    <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.nome}</p>
                      <p className="text-xs text-gray-500">{c.regime}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Passo 3 — Permissões */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">3. Defina as Permissões</p>
            <div className="flex gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={permissions.canView}
                  onCheckedChange={(v) => setPermissions({ ...permissions, canView: v as boolean })}
                />
                <span className="text-sm">Visualizar</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={permissions.canEdit}
                  onCheckedChange={(v) => setPermissions({ ...permissions, canEdit: v as boolean })}
                />
                <span className="text-sm">Editar</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={permissions.canDelete}
                  onCheckedChange={(v) => setPermissions({ ...permissions, canDelete: v as boolean })}
                />
                <span className="text-sm">Excluir</span>
              </label>
            </div>
          </div>

          {/* Botão */}
          <Button
            onClick={handleGrant}
            disabled={!selectedUser || selectedClienteIds.length === 0 || grantBulkMutation.isPending}
            className="w-full"
          >
            {grantBulkMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Concedendo...</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" />
                Conceder Acesso
                {selectedClienteIds.length > 0 && ` (${selectedClienteIds.length} empresa${selectedClienteIds.length > 1 ? "s" : ""})`}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Visualizar permissões por empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visualizar Permissões por Empresa</CardTitle>
          <CardDescription>Veja e remova acessos de uma empresa específica</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={viewCliente?.toString() || ""}
            onValueChange={(v) => setViewCliente(parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Escolha uma empresa para ver acessos..." />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {viewCliente && (
            isLoadingPermissions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : clienteUsers.length === 0 ? (
              <p className="text-center py-6 text-gray-500 text-sm">Nenhum usuário tem acesso a esta empresa.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Visualizar</TableHead>
                      <TableHead className="text-center">Editar</TableHead>
                      <TableHead className="text-center">Excluir</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clienteUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={user.canView ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                            {user.canView ? "Sim" : "Não"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={user.canEdit ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                            {user.canEdit ? "Sim" : "Não"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={user.canDelete ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                            {user.canDelete ? "Sim" : "Não"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setDeleteTarget({ clienteId: viewCliente, userId: user.id });
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
            )
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário perderá acesso a esta empresa. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel onClick={() => { setDeleteConfirmOpen(false); setDeleteTarget(null); }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && revokeAccessMutation.mutate(deleteTarget)}
              disabled={revokeAccessMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {revokeAccessMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Removendo...</>
              ) : "Remover Acesso"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
