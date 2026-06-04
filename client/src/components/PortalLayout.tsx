import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { BarChart3, LogOut, Loader2 } from "lucide-react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const utils = trpc.useUtils();
  const { data: me, isLoading } = trpc.portalCliente.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.portalCliente.logout.useMutation({
    onSuccess: () => {
      utils.portalCliente.me.setData(undefined, null);
      window.location.href = "/cliente/login";
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!me) {
    window.location.href = "/cliente/login";
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-600 rounded-lg">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 leading-none">Portal do Cliente</p>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{me.nomeEmpresa}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-gray-600 hover:text-red-600"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
