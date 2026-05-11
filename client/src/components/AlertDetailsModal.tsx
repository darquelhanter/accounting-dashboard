import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AlertDetailsModalProps {
  type: "proximo" | "atrasado" | "pendente";
  count: number;
  label: string;
  diasAntecedencia?: number;
}

export function AlertDetailsModal({
  type,
  count,
  label,
  diasAntecedencia = 7,
}: AlertDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Carregar dados baseado no tipo de alerta
  const { data: obrigacoes = [], isLoading } =
    trpc.alertas.obrigacoesProximasDetalhes.useQuery(
      { diasAntecedencia },
      { enabled: isOpen && type === "proximo" }
    );

  const { data: mensalidadesAtrasadas = [] } =
    trpc.alertas.mensalidadesAtrasadas.useQuery(undefined, {
      enabled: isOpen && type === "atrasado",
    });

  const { data: mensalidadesPendentes = [] } =
    trpc.alertas.mensalidadesPendentes.useQuery(
      { diasAntecedencia: 3 },
      { enabled: isOpen && type === "pendente" }
    );

  const bgClasses = {
    atrasado: "bg-red-500 hover:bg-red-600",
    proximo: "bg-amber-500 hover:bg-amber-600",
    pendente: "bg-blue-500 hover:bg-blue-600",
  };

  const badgeVariants = {
    atrasado: "destructive" as const,
    proximo: "secondary" as const,
    pendente: "default" as const,
  };

  const getDataToDisplay = () => {
    switch (type) {
      case "proximo":
        return obrigacoes;
      case "atrasado":
        return mensalidadesAtrasadas;
      case "pendente":
        return mensalidadesPendentes;
      default:
        return [];
    }
  };

  const data = getDataToDisplay();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`${bgClasses[type]} text-white border-0 cursor-pointer`}
        >
          <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></span>
          {count} {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "proximo" && <Clock className="w-5 h-5 text-amber-600" />}
            {type === "atrasado" && (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            {type === "pendente" && (
              <AlertCircle className="w-5 h-5 text-blue-600" />
            )}
            {label} ({data.length})
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-600">Nenhum item encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {type === "proximo" && (
                    <>
                      <TableHead>Obrigação</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Periodicidade</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Dias para Vencer</TableHead>
                    </>
                  )}
                  {type === "atrasado" && (
                    <>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor (R$)</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Dias Atrasado</TableHead>
                      <TableHead>Status</TableHead>
                    </>
                  )}
                  {type === "pendente" && (
                    <>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor (R$)</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item: any, index: number) => (
                  <TableRow key={index}>
                    {type === "proximo" && (
                      <>
                        <TableCell className="font-medium">
                          {item.nome}
                        </TableCell>
                        <TableCell>{item.clienteNome || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.categoria}</Badge>
                        </TableCell>
                        <TableCell>{item.periodicidade}</TableCell>
                        <TableCell>
                          {item.vencimento
                            ? `Dia ${item.vencimento}`
                            : "Contínuo"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.diasParaVencer <= 3
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {item.diasParaVencer} dias
                          </Badge>
                        </TableCell>
                      </>
                    )}
                    {type === "atrasado" && (
                      <>
                        <TableCell className="font-medium">
                          {item.clienteNome || item.cliente?.nome || "-"}
                        </TableCell>
                        <TableCell>
                          R$ {item.valor?.toFixed(2) || "0.00"}
                        </TableCell>
                        <TableCell>
                          {item.vencimento
                            ? new Date(item.vencimento).toLocaleDateString(
                                "pt-BR"
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {item.diasAtrasado || "-"} dias
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Atrasado
                          </span>
                        </TableCell>
                      </>
                    )}
                    {type === "pendente" && (
                      <>
                        <TableCell className="font-medium">
                          {item.clienteNome || item.cliente?.nome || "-"}
                        </TableCell>
                        <TableCell>
                          R$ {item.valor?.toFixed(2) || "0.00"}
                        </TableCell>
                        <TableCell>
                          {item.vencimento
                            ? new Date(item.vencimento).toLocaleDateString(
                                "pt-BR"
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Pendente
                          </span>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
