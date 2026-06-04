import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function formatCNPJ(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export default function ClienteLogin() {
  const [cnpj, setCnpj] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.portalCliente.login.useMutation({
    onSuccess: () => {
      toast.success("Acesso realizado com sucesso!");
      window.location.href = "/portal";
    },
    onError: (error) => {
      toast.error(error.message || "CNPJ ou senha inválidos");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnpj || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    setIsLoading(true);
    try {
      await loginMutation.mutateAsync({ cnpj, password, rememberMe });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-full">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Área do Cliente</CardTitle>
            <CardDescription>Acesse com seu CNPJ e senha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">CNPJ</label>
                <Input
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  className="mt-1"
                  maxLength={18}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Senha</label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(Boolean(v))}
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
                  Lembrar meu acesso
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isLoading}
              >
                {isLoading ? "Acessando..." : "Acessar"}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500">
              Não tem acesso?{" "}
              <span className="text-gray-700 font-medium">
                Entre em contato com seu contador.
              </span>
            </p>

            <div className="border-t pt-3 text-center">
              <a href="/login" className="text-sm text-emerald-600 hover:text-emerald-700">
                Acesso administrativo →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
