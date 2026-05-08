import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface SeedObrigacoesButtonProps {
  onSuccess?: () => void;
  showWhenEmpty?: boolean;
}

export function SeedObrigacoesButton({ onSuccess, showWhenEmpty = true }: SeedObrigacoesButtonProps) {
  const utils = trpc.useUtils();
  const { data: obrigacoes = [] } = trpc.obrigacoes.list.useQuery();
  const seedMutation = trpc.obrigacoes.seedPadrao.useMutation();

  const handleSeed = async () => {
    try {
      await seedMutation.mutateAsync();
      toast.success("Obrigações padrão carregadas com sucesso!");
      utils.obrigacoes.list.invalidate();
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao carregar obrigações padrão");
      console.error(error);
    }
  };

  if (showWhenEmpty && obrigacoes.length > 0) {
    return null;
  }

  return (
    <Button
      onClick={handleSeed}
      disabled={seedMutation.isPending}
      className="gap-2 bg-green-600 hover:bg-green-700"
    >
      {seedMutation.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Plus className="w-4 h-4" />
      )}
      Carregar Obrigações Padrão
    </Button>
  );
}
