import { useState, useEffect } from "react";
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
import { Loader2, RotateCcw, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function BackupMonitor() {
  const [selectedBackup, setSelectedBackup] = useState<any>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  const { data: backups = [], isLoading: isLoadingBackups, refetch: refetchBackups } = trpc.backup.getAllBackups.useQuery();
  const { data: syncStats = { total: 0, synced: 0, pending: 0, failed: 0 }, isLoading: isLoadingStats, refetch: refetchStats } = trpc.backup.getSyncStats.useQuery();
  const { data: pendingLogs = [], isLoading: isLoadingPending } = trpc.backup.getPendingSyncLogs.useQuery();
  const { data: failedLogs = [], isLoading: isLoadingFailed } = trpc.backup.getFailedSyncLogs.useQuery();

  const restoreMutation = trpc.backup.restore.useMutation({
    onSuccess: () => {
      toast.success("Empresa restaurada com sucesso!");
      setShowRestoreDialog(false);
      refetchBackups();
    },
    onError: (error) => {
      toast.error(`Erro ao restaurar: ${error.message}`);
    },
  });

  const handleRestore = (backup: any) => {
    setSelectedBackup(backup);
    setShowRestoreDialog(true);
  };

  const confirmRestore = async () => {
    if (selectedBackup) {
      await restoreMutation.mutateAsync({ clienteId: selectedBackup.id });
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString("pt-BR");
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas de Sincronização */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{syncStats.total}</div>
              <p className="text-sm text-gray-600">Total de Sincronizações</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{syncStats.synced}</div>
              <p className="text-sm text-gray-600">Sincronizadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{syncStats.pending}</div>
              <p className="text-sm text-gray-600">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{syncStats.failed}</div>
              <p className="text-sm text-gray-600">Falhadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backups de Empresas */}
      <Card>
        <CardHeader>
          <CardTitle>Backups de Empresas</CardTitle>
          <CardDescription>
            Visualize e restaure backups de empresas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingBackups ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum backup disponível
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Empresa</TableHead>
                    <TableHead>Regime</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data do Backup</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup: any) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.nome}</TableCell>
                      <TableCell>{backup.regime}</TableCell>
                      <TableCell>R$ {Number(backup.valor).toFixed(2)}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(backup.backupedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(backup)}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restaurar
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

      {/* Sincronizações Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle>Sincronizações Pendentes</CardTitle>
          <CardDescription>
            Operações aguardando sincronização
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPending ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : pendingLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma sincronização pendente
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>ID da Entidade</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="capitalize">{log.entityType}</TableCell>
                      <TableCell>{log.entityId}</TableCell>
                      <TableCell className="capitalize">{log.action}</TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendente
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(log.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sincronizações Falhadas */}
      <Card>
        <CardHeader>
          <CardTitle>Sincronizações Falhadas</CardTitle>
          <CardDescription>
            Operações que falharam na sincronização
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingFailed ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : failedLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma sincronização falhada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>ID da Entidade</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Erro</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="capitalize">{log.entityType}</TableCell>
                      <TableCell>{log.entityId}</TableCell>
                      <TableCell className="capitalize">{log.action}</TableCell>
                      <TableCell className="text-sm text-red-600">
                        {log.errorMessage || "Erro desconhecido"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(log.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Restauração */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar Empresa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja restaurar a empresa "{selectedBackup?.nome}"?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Esta ação vai sobrescrever os dados atuais com os dados do backup.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmRestore}
              disabled={restoreMutation.isPending}
            >
              {restoreMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restaurando...
                </>
              ) : (
                "Restaurar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
