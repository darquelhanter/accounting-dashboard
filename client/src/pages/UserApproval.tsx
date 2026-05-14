import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
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

  const handleApprove = async () => {
    if (!selectedUserId) return;
    await approveMutation.mutateAsync({ userId: selectedUserId });
  };

  const handleReject = async () => {
    if (!selectedUserId) return;
    await rejectMutation.mutateAsync({ userId: selectedUserId });
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
          <CardTitle>Usuários Pendentes de Aprovação</CardTitle>
          <CardDescription>
            {pendingUsers.length} usuário(s) aguardando aprovação
          </CardDescription>
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Data de Registro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user: any) => (
                    <TableRow key={user.id}>
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
          <CardTitle>Todos os Usuários</CardTitle>
          <CardDescription>
            Total de {allUsers.length} usuário(s) no sistema
          </CardDescription>
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

      {/* Dialog de Confirmação */}
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
    </div>
  );
}
