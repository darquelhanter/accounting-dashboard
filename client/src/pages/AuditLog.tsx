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
import { Loader2, Eye, Edit, Trash2, Share2, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const actionIcons: Record<string, React.ReactNode> = {
  view: <Eye className="w-4 h-4" />,
  create: <Edit className="w-4 h-4" />,
  update: <Edit className="w-4 h-4" />,
  delete: <Trash2 className="w-4 h-4" />,
  share: <Share2 className="w-4 h-4" />,
  unshare: <Users className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
  view: "bg-blue-100 text-blue-800",
  create: "bg-green-100 text-green-800",
  update: "bg-yellow-100 text-yellow-800",
  delete: "bg-red-100 text-red-800",
  share: "bg-purple-100 text-purple-800",
  unshare: "bg-orange-100 text-orange-800",
};

const actionLabels: Record<string, string> = {
  view: "Visualizou",
  create: "Criou",
  update: "Atualizou",
  delete: "Deletou",
  share: "Compartilhou",
  unshare: "Revogou Acesso",
};

export default function AuditLog() {
  const [filterType, setFilterType] = useState<"all" | "cliente" | "user">("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: allLogs = [], isLoading: isLoadingAll } = trpc.audit.getAll.useQuery(
    { limit: 500 },
    { enabled: filterType === "all" }
  );

  const logs = filterType === "all" ? allLogs : [];

  const formatDate = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString("pt-BR");
  };

  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Auditoria de Acesso</CardTitle>
          <CardDescription>
            Visualize todas as ações realizadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Filtro</label>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Ações</SelectItem>
                  <SelectItem value="cliente">Por Empresa</SelectItem>
                  <SelectItem value="user">Por Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela de Auditoria */}
          {isLoadingAll ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma ação registrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tipo de Entidade</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell className="text-sm">
                        ID: {log.userId}
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColors[log.action] || "bg-gray-100 text-gray-800"}>
                          <span className="mr-1">{actionIcons[log.action]}</span>
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {log.entityType}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(log)}
                        >
                          Detalhes
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

      {/* Dialog de Detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Ação</DialogTitle>
            <DialogDescription>
              Informações completas sobre a ação realizada
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">ID da Ação</label>
                  <p className="text-sm">{selectedLog.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">ID do Usuário</label>
                  <p className="text-sm">{selectedLog.userId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">ID da Empresa</label>
                  <p className="text-sm">{selectedLog.clienteId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">ID da Entidade</label>
                  <p className="text-sm">{selectedLog.entityId || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Ação</label>
                  <p className="text-sm">{actionLabels[selectedLog.action] || selectedLog.action}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo de Entidade</label>
                  <p className="text-sm capitalize">{selectedLog.entityType}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Data/Hora</label>
                  <p className="text-sm">{formatDate(selectedLog.timestamp)}</p>
                </div>
              </div>

              {selectedLog.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Descrição</label>
                  <p className="text-sm">{selectedLog.description}</p>
                </div>
              )}

              {selectedLog.ipAddress && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Endereço IP</label>
                  <p className="text-sm">{selectedLog.ipAddress}</p>
                </div>
              )}

              {selectedLog.changes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Mudanças</label>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-48">
                    {JSON.stringify(JSON.parse(selectedLog.changes), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
