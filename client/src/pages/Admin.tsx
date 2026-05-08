import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Settings, BarChart3, Trash2, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const [selectedTab, setSelectedTab] = useState("usuarios");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToChangeRole, setUserToChangeRole] = useState<{ id: string; newRole: string } | null>(null);

  // Queries
  const { data: usuariosData, isLoading: usuariosLoading, refetch: refetchUsuarios } = trpc.admin.listarUsuarios.useQuery();
  const { data: estatisticasData, isLoading: estatisticasLoading } = trpc.admin.obterEstatisticas.useQuery();

  // Mutations
  const alterarRoleMutation = trpc.admin.alterarRoleUsuario.useMutation({
    onSuccess: () => {
      toast.success("Role alterada com sucesso");
      refetchUsuarios();
      setUserToChangeRole(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao alterar role");
    },
  });

  const deletarUsuarioMutation = trpc.admin.deletarUsuario.useMutation({
    onSuccess: () => {
      toast.success("Usuário deletado com sucesso");
      refetchUsuarios();
      setUserToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar usuário");
    },
  });

  const seedObrigacoesMutation = trpc.admin.seedObrigacoesPadrao.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.criadas} obrigações padrão criadas`);
      if (data.erros > 0) {
        toast.warning(`${data.erros} erro(s) ao criar obrigações`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar obrigações padrão");
    },
  });

  const limparDadosMutation = trpc.admin.limparDadosUsuario.useMutation({
    onSuccess: () => {
      toast.success("Dados do usuário limpos com sucesso");
      refetchUsuarios();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao limpar dados");
    },
  });

  const handleAlterarRole = (userId: string, novaRole: string) => {
    alterarRoleMutation.mutate({ userId, novaRole: novaRole as "user" | "admin" });
  };

  const handleDeletarUsuario = (userId: string) => {
    deletarUsuarioMutation.mutate({ userId });
  };

  const handleSeedObrigacoes = (userId?: string) => {
    seedObrigacoesMutation.mutate({ userId });
  };

  const handleLimparDados = (userId: string) => {
    limparDadosMutation.mutate({ userId });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Administração</h1>
        <p className="text-slate-600 mt-1">Gerencie usuários, permissões e operações do sistema</p>
      </div>

      {/* Estatísticas */}
      {estatisticasLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-600 text-sm">Total de Usuários</p>
                <p className="text-3xl font-bold text-blue-600">{estatisticasData?.estatisticas.totalUsuarios || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-600 text-sm">Total de Clientes</p>
                <p className="text-3xl font-bold text-green-600">{estatisticasData?.estatisticas.totalClientes || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-600 text-sm">Total de Obrigações</p>
                <p className="text-3xl font-bold text-orange-600">{estatisticasData?.estatisticas.totalObrigacoes || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-600 text-sm">Checklist Items</p>
                <p className="text-3xl font-bold text-purple-600">{estatisticasData?.estatisticas.totalChecklistItems || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-slate-600 text-sm">Mensalidades</p>
                <p className="text-3xl font-bold text-red-600">{estatisticasData?.estatisticas.totalMensalidades || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="operacoes" className="gap-2">
            <Settings className="w-4 h-4" />
            Operações
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Aba: Usuários */}
        <TabsContent value="usuarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              {usuariosLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : usuariosData?.usuarios && usuariosData.usuarios.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Clientes</TableHead>
                        <TableHead>Obrigações</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuariosData.usuarios.map((usuario: any) => (
                        <TableRow key={usuario.id}>
                          <TableCell className="font-medium">{usuario.name || "N/A"}</TableCell>
                          <TableCell>{usuario.email || "N/A"}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              usuario.role === "admin"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}>
                              {usuario.role}
                            </span>
                          </TableCell>
                          <TableCell>{usuario.clientesCount}</TableCell>
                          <TableCell>{usuario.obrigacoesCount}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Select
                              value={usuario.role}
                              onValueChange={(newRole) => {
                                setUserToChangeRole({ id: String(usuario.id), newRole });
                              }}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setUserToDelete(String(usuario.id))}
                              disabled={deletarUsuarioMutation.isPending}
                            >
                              {deletarUsuarioMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">Nenhum usuário encontrado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Operações em Lote */}
        <TabsContent value="operacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operações em Lote</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-slate-900">Seed de Obrigações Padrão</h3>
                <p className="text-sm text-slate-600">
                  Criar as 5 obrigações padrão (INSS, FGTS, eSocial, Folha Mensal, DCTFWeb) para todos os usuários
                </p>
                <Button
                  onClick={() => handleSeedObrigacoes()}
                  disabled={seedObrigacoesMutation.isPending}
                  className="gap-2"
                >
                  {seedObrigacoesMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                  Executar Seed
                </Button>
              </div>

              <div className="border-t pt-4 space-y-2">
                <h3 className="font-medium text-slate-900">Limpeza de Dados</h3>
                <p className="text-sm text-slate-600">
                  Limpar todos os dados de um usuário sem deletar a conta
                </p>
                {usuariosData?.usuarios && usuariosData.usuarios.length > 0 && (
                  <div className="space-y-2">
                    {usuariosData.usuarios.map((usuario: any) => (
                      <div key={usuario.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                        <span className="text-sm">{usuario.name || usuario.email || "Usuário"}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLimparDados(String(usuario.id))}
                          disabled={limparDadosMutation.isPending}
                        >
                          {limparDadosMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Limpar Dados"
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Relatórios */}
        <TabsContent value="relatorios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Distribuição de Usuários</h4>
                  <p className="text-sm text-blue-700">
                    Total de usuários: {estatisticasData?.estatisticas.totalUsuarios || 0}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">Atividade de Clientes</h4>
                  <p className="text-sm text-green-700">
                    Total de clientes: {estatisticasData?.estatisticas.totalClientes || 0}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-2">Obrigações Cadastradas</h4>
                  <p className="text-sm text-orange-700">
                    Total de obrigações: {estatisticasData?.estatisticas.totalObrigacoes || 0}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2">Checklist Mensal</h4>
                  <p className="text-sm text-purple-700">
                    Total de items: {estatisticasData?.estatisticas.totalChecklistItems || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Confirmar mudança de role */}
      {userToChangeRole && (
        <AlertDialog open={!!userToChangeRole} onOpenChange={() => setUserToChangeRole(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar mudança de role</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja alterar a role deste usuário para {userToChangeRole.newRole}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleAlterarRole(userToChangeRole.id, userToChangeRole.newRole)}
                disabled={alterarRoleMutation.isPending}
              >
                {alterarRoleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirmar"
                )}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Dialog: Confirmar deleção */}
      {userToDelete && (
        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível. Todos os dados do usuário serão deletados permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeletarUsuario(userToDelete)}
                disabled={deletarUsuarioMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deletarUsuarioMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Deletar"
                )}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
