import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Lock, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Profile() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao alterar senha");
    },
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não conferem");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    await changePasswordMutation.mutateAsync({
      currentPassword,
      newPassword,
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Informações do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações da Conta
          </CardTitle>
          <CardDescription>Seus dados de perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Nome</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-md text-gray-900">
              {user.name || "Não informado"}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-md text-gray-900">
              {user.email || "Não informado"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>Atualize sua senha de acesso</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Senha Atual</label>
              <div className="mt-1 relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-2.5 text-gray-500"
                >
                  {showCurrentPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Nova Senha</label>
              <div className="mt-1 relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-gray-500"
                >
                  {showNewPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
              <div className="mt-1 relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirme sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-500"
                >
                  {showConfirmPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="w-full"
            >
              {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <LogOut className="w-5 h-5" />
            Sair
          </CardTitle>
          <CardDescription>Encerre sua sessão</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
          >
            Sair da Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
