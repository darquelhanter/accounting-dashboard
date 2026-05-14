import { useState, useMemo } from "react";
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
import { CheckCircle, XCircle, Clock, Loader2, Trash2 } from "lucide-react";
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

export default function UserApproval() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<number>>(new Set());
  const [selectedAllIds, setSelectedAllIds] = useState<Set<number>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"pending" | "all" | null>(null);

  const utils = trpc.useUtils();
  const { data: pendingUsers = [], isLoading } = trpc.users.getPending.useQuery();
  const { data: allUsers = [], isLoading: isLoadingAll } = trpc.users.getAll.useQuery();

  const approveMutation = trpc.users.approve.useMutation({
    onSuccess: () => {
      toast.success("Usuário aprovado com sucesso!");
      utils.users.getPending.invalidate();
      utils.users.getAll.invalidate();
      setSelectedUserId(null);
      setAction(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao aprovar usuário");
    },
  });

  const rejectMutation = trpc.users.reject.useMutation({
    onSuccess: () => {
      toast.success("Usuário rejeitado!");
      utils.users.getPending.invalidate();
      utils.users.getAll.invalidate();
      setSelectedUserId(null);
      setAction(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao rejeitar usuário");
    },
  });

  const deleteUsersMutation = trpc.users.deleteMany.useMutation({
    onSuccess: () => {
      toast.success("Usuários deletados com sucesso!");
      utils.users.getPending.invalidate();
      utils.users.getAll.invalidate();
      setSelectedPendingIds(new Set());
      setSelectedAllIds(new Set());
      setDeleteConfirmOpen(false);
      setDeleteType(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar usuários");
    },
  });

  const handleApprove = async () => {
    if (!selectedUserId) return;
    await approveMutation.mutateAsync({ userId: selectedUserId });
  };

  const handleReject = async () => {
    if (!selectedUserId) return;
    await rejectMutation.mutateAsync({ userId: selectedUserId });
  };

  const handleDeletePending = async () => {
    if (selectedPendingIds.size === 0) return;
    await deleteUsersMutation.mutateAsync({ userIds: Array.from(selectedPendingIds) });
  };

  const handleDeleteAll = async () => {
    if (selectedAllIds.size === 0) return;
    await deleteUsersMutation.mutateAsync({ userIds: Array.from(selectedAllIds) });
  };

  const togglePendingSelection = (userId: number) => {
    const newSet = new Set(selectedPendingIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedPendingIds(newSet);
  };

  const toggleAllSelection = (userId: number) => {
    const newSet = new Set(selectedAllIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedAllIds(newSet);
  };

  const selectAllPending = () => {
    if (selectedPendingIds.size === pendingUsers.length) {
      setSelectedPendingIds(new Set());
    } else {
      setSelectedPendingIds(new Set(pendingUsers.map((u: any) => u.id)));
    }
  };

  const selectAllUsers = () => {
    if (selectedAllIds.size === allUsers.length) {
      setSelectedAllIds(new Set());
    } else {
      setSelectedAllIds(new Set(allUsers.map((u: any) => u.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rejeitado
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Usuários Pendentes */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Usuários Pendentes de Aprovação</CardTitle>
              <CardDescription>
                {pendingUsers.length} usuário(s) aguardando aprovação
              </CardDescription>
            </div>
            {selectedPendingIds.size > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setDeleteType("pending");
                  setDeleteConfirmOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Deletar {selectedPendingIds.size}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum usuário pendente de aprovação
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedPendingIds.size === pendingUsers.length && pendingUsers.length > 0}
                        onCheckedChange={selectAllPending}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Data de Registro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPendingIds.has(user.id)}
                          onCheckedChange={() => togglePendingSelection(user.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.name || "-"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:bg-green-50"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setAction("approve");
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setAction("reject");
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeitar
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

      {/* Todos os Usuários */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Todos os Usuários</CardTitle>
              <CardDescription>
                Total de {allUsers.length} usuário(s) no sistema
              </CardDescription>
            </div>
            {selectedAllIds.size > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setDeleteType("all");
                  setDeleteConfirmOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Deletar {selectedAllIds.size}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingAll ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAllIds.size === allUsers.length && allUsers.length > 0}
                        onCheckedChange={selectAllUsers}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Data de Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAllIds.has(user.id)}
                          onCheckedChange={() => toggleAllSelection(user.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.name || "-"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "Administrador" : "Usuário"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação para Aprovação/Rejeição */}
      <AlertDialog open={selectedUserId !== null && action !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === "approve" ? "Aprovar Usuário?" : "Rejeitar Usuário?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === "approve"
                ? "O usuário poderá acessar o sistema após a aprovação."
                : "O usuário não poderá mais acessar o sistema."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel
              onClick={() => {
                setSelectedUserId(null);
                setAction(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={action === "approve" ? handleApprove : handleReject}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className={action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {approveMutation.isPending || rejectMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : action === "approve" ? (
                "Aprovar"
              ) : (
                "Rejeitar"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmação para Exclusão em Massa */}
      <AlertDialog open={deleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Usuários?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a deletar {deleteType === "pending" ? selectedPendingIds.size : selectedAllIds.size} usuário(s). Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteType(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteType === "pending" ? handleDeletePending : handleDeleteAll}
              disabled={deleteUsersMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUsersMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
