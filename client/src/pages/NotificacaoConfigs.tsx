import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Clock, Bell } from "lucide-react";

export default function NotificacaoConfigs() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    ativarMensalidades: true,
    diasAntecedencia: 3,
    ativarObrigacoes: true,
    ativarChecklist: true,
    horarioEnvio: "09:00",
    frequencia: "Diaria" as "Diaria" | "Semanal" | "Mensal",
    ativo: true,
  });

  // Queries
  const { data: config, isLoading, refetch } = trpc.notificacaoConfigs.getConfig.useQuery();

  // Mutations
  const updateMutation = trpc.notificacaoConfigs.updateConfig.useMutation({
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      refetch();
    },
  });

  const toggleMutation = trpc.notificacaoConfigs.toggleNotifications.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const resetMutation = trpc.notificacaoConfigs.resetToDefault.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Atualizar form quando config é carregada
  useEffect(() => {
    if (config) {
      setFormData({
        ativarMensalidades: config.ativarMensalidades ?? true,
        diasAntecedencia: config.diasAntecedencia ?? 3,
        ativarObrigacoes: config.ativarObrigacoes ?? true,
        ativarChecklist: config.ativarChecklist ?? true,
        horarioEnvio: config.horarioEnvio ?? "09:00",
        frequencia: (config.frequencia ?? "Diaria") as "Diaria" | "Semanal" | "Mensal",
        ativo: config.ativo ?? true,
      });
    }
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotifications = async () => {
    await toggleMutation.mutateAsync({ ativo: !formData.ativo });
    setFormData({ ...formData, ativo: !formData.ativo });
  };

  const handleReset = async () => {
    if (confirm("Tem certeza que deseja redefinir as configurações para padrão?")) {
      await resetMutation.mutateAsync();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações de Notificações</h1>
          <p className="text-muted-foreground">Personalize suas preferências de notificação</p>
        </div>

        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Configurações de Notificações</h1>
          <p className="text-muted-foreground">Personalize suas preferências de notificação</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={resetMutation.isPending}
          >
            Redefinir Padrão
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || updateMutation.isPending}
          >
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-green-800">Configurações salvas com sucesso!</p>
        </div>
      )}

      {/* Status Geral */}
      <Card className={formData.ativo ? "border-green-200" : "border-red-200"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Status das Notificações
            </CardTitle>
            <Switch
              checked={formData.ativo}
              onCheckedChange={handleToggleNotifications}
              disabled={toggleMutation.isPending}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {formData.ativo
              ? "✅ Notificações ativas. Você receberá alertas conforme configurado."
              : "❌ Notificações desativadas. Você não receberá nenhum alerta."}
          </p>
        </CardContent>
      </Card>

      {/* Notificações de Mensalidades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            Notificações de Mensalidades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Ativar alertas de mensalidades</label>
              <p className="text-xs text-muted-foreground">
                Receba notificações sobre mensalidades próximas do vencimento
              </p>
            </div>
            <Switch
              checked={formData.ativarMensalidades}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, ativarMensalidades: checked })
              }
            />
          </div>

          {formData.ativarMensalidades && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium">Dias de antecedência</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Quantos dias antes do vencimento deseja ser notificado?
                </p>
                <Select
                  value={formData.diasAntecedencia.toString()}
                  onValueChange={(v) =>
                    setFormData({ ...formData, diasAntecedencia: parseInt(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 5, 7, 10, 14, 30].map((dias) => (
                      <SelectItem key={dias} value={dias.toString()}>
                        {dias} dia{dias > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notificações de Obrigações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Notificações de Obrigações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Ativar alertas de obrigações</label>
              <p className="text-xs text-muted-foreground">
                Receba notificações sobre obrigações fiscais próximas do vencimento
              </p>
            </div>
            <Switch
              checked={formData.ativarObrigacoes}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, ativarObrigacoes: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Notificações de Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            Notificações de Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Ativar alertas de checklist</label>
              <p className="text-xs text-muted-foreground">
                Receba notificações sobre tarefas pendentes no checklist mensal
              </p>
            </div>
            <Switch
              checked={formData.ativarChecklist}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, ativarChecklist: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Agendamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Agendamento de Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Horário preferido de envio</label>
            <p className="text-xs text-muted-foreground mb-2">
              Hora do dia em que deseja receber as notificações
            </p>
            <Input
              type="time"
              value={formData.horarioEnvio}
              onChange={(e) =>
                setFormData({ ...formData, horarioEnvio: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">Frequência de notificações</label>
            <p className="text-xs text-muted-foreground mb-2">
              Com que frequência deseja receber notificações?
            </p>
            <Select
              value={formData.frequencia}
              onValueChange={(v: any) =>
                setFormData({ ...formData, frequencia: v as "Diaria" | "Semanal" | "Mensal" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Diaria">Diária</SelectItem>
                <SelectItem value="Semanal">Semanal</SelectItem>
                <SelectItem value="Mensal">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>ℹ️ Informação:</strong> As notificações serão enviadas para o email associado à sua conta.
            Certifique-se de que seu email está correto nas configurações de perfil.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
