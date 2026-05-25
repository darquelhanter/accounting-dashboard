import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  Search,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

const SUGESTOES_DESCRICAO = [
  "E-mail principal",
  "Portal e-CAC",
  "Portal SEFAZ",
  "Simples Nacional",
  "Portal eSocial",
  "Portal FGTS Digital",
  "Internet Banking",
  "Certificado Digital",
  "Portal Prefeitura",
  "Gov.br",
  "Outro",
];

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} copiado!`);
  });
}

function SenhaField({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-sm">{visible ? value : "••••••••"}</span>
      <button
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground hover:text-foreground transition-colors ml-1"
        title={visible ? "Ocultar" : "Mostrar"}
      >
        {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      <button
        onClick={() => copyToClipboard(value, "Senha")}
        className="text-muted-foreground hover:text-foreground transition-colors"
        title="Copiar senha"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

const emptyForm = {
  clienteId: "",
  descricao: "",
  descricaoCustom: "",
  email: "",
  senha: "",
  telefone: "",
  observacao: "",
};

export default function Acessos() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filtroCliente, setFiltroCliente] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data: clientes } = trpc.clientes.list.useQuery();
  const { data: acessos, isLoading, refetch } = trpc.acessos.list.useQuery();

  const createMutation = trpc.acessos.create.useMutation({
    onSuccess: () => { refetch(); setIsOpen(false); setForm(emptyForm); toast.success("Acesso salvo!"); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.acessos.update.useMutation({
    onSuccess: () => { refetch(); setIsOpen(false); setEditingId(null); setForm(emptyForm); toast.success("Acesso atualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.acessos.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Acesso excluído!"); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!acessos) return [];
    return acessos.filter((a) => {
      const clienteNome = clientes?.find((c) => c.id === a.clienteId)?.nome ?? "";
      if (filtroCliente !== "Todos" && String(a.clienteId) !== filtroCliente) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          a.descricao.toLowerCase().includes(q) ||
          clienteNome.toLowerCase().includes(q) ||
          (a.email ?? "").toLowerCase().includes(q) ||
          (a.telefone ?? "").toLowerCase().includes(q) ||
          (a.observacao ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [acessos, filtroCliente, searchTerm, clientes]);

  const groupedByCliente = useMemo(() => {
    const map = new Map<number, typeof filtered>();
    for (const a of filtered) {
      const list = map.get(a.clienteId!) ?? [];
      list.push(a);
      map.set(a.clienteId!, list);
    }
    return map;
  }, [filtered]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setIsOpen(true);
  }

  function openEdit(a: any) {
    setEditingId(a.id);
    setForm({
      clienteId: String(a.clienteId),
      descricao: SUGESTOES_DESCRICAO.includes(a.descricao) ? a.descricao : "Outro",
      descricaoCustom: SUGESTOES_DESCRICAO.includes(a.descricao) ? "" : a.descricao,
      email: a.email ?? "",
      senha: a.senha ?? "",
      telefone: a.telefone ?? "",
      observacao: a.observacao ?? "",
    });
    setIsOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const descricaoFinal = form.descricao === "Outro" ? form.descricaoCustom : form.descricao;
    if (!descricaoFinal) { toast.error("Informe a descrição do acesso."); return; }
    if (!form.clienteId) { toast.error("Selecione uma empresa."); return; }

    const payload = {
      clienteId: Number(form.clienteId),
      descricao: descricaoFinal,
      email: form.email || undefined,
      senha: form.senha || undefined,
      telefone: form.telefone || undefined,
      observacao: form.observacao || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Acessos das Empresas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Senhas, e-mails e telefones por empresa
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Acesso
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={filtroCliente} onValueChange={setFiltroCliente}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Todas as empresas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todas as empresas</SelectItem>
            {clientes?.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 w-56"
            placeholder="Buscar acesso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista agrupada por empresa */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : groupedByCliente.size === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <KeyRound className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">Nenhum acesso cadastrado.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Cadastrar primeiro acesso
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(groupedByCliente.entries()).map(([clienteId, itens]) => {
            const clienteNome = clientes?.find((c) => c.id === clienteId)?.nome ?? "Empresa";
            return (
              <Card key={clienteId}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {clienteNome}
                    <Badge variant="secondary" className="ml-1 text-xs">{itens.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {itens.map((acesso) => (
                      <div key={acesso.id} className="flex items-start justify-between gap-4 px-6 py-3 hover:bg-muted/30 transition-colors">
                        <div className="space-y-1 min-w-0 flex-1">
                          <p className="font-medium text-sm">{acesso.descricao}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            {acesso.email && (
                              <span className="flex items-center gap-1">
                                <span className="text-xs font-medium text-foreground/60">E-mail:</span>
                                <button
                                  onClick={() => copyToClipboard(acesso.email!, "E-mail")}
                                  className="hover:text-foreground transition-colors flex items-center gap-1"
                                >
                                  {acesso.email}
                                  <Copy className="h-3 w-3" />
                                </button>
                              </span>
                            )}
                            {acesso.senha && (
                              <span className="flex items-center gap-1">
                                <span className="text-xs font-medium text-foreground/60">Senha:</span>
                                <SenhaField value={acesso.senha} />
                              </span>
                            )}
                            {acesso.telefone && (
                              <span className="flex items-center gap-1">
                                <span className="text-xs font-medium text-foreground/60">Tel:</span>
                                <button
                                  onClick={() => copyToClipboard(acesso.telefone!, "Telefone")}
                                  className="hover:text-foreground transition-colors flex items-center gap-1"
                                >
                                  {acesso.telefone}
                                  <Copy className="h-3 w-3" />
                                </button>
                              </span>
                            )}
                          </div>
                          {acesso.observacao && (
                            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans mt-1 bg-muted/40 rounded px-2 py-1.5 border max-w-md">{acesso.observacao}</pre>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(acesso)} title="Editar">
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Excluir">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir acesso?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{acesso.descricao}" de {clienteNome} será removido permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="flex justify-end gap-2 mt-4">
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => deleteMutation.mutate({ id: acesso.id })}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal criar/editar */}
      <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Acesso" : "Novo Acesso"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Empresa *</Label>
              <Select value={form.clienteId} onValueChange={(v) => setForm((f) => ({ ...f, clienteId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Descrição *</Label>
              <Select value={form.descricao} onValueChange={(v) => setForm((f) => ({ ...f, descricao: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Ex: Portal e-CAC" />
                </SelectTrigger>
                <SelectContent>
                  {SUGESTOES_DESCRICAO.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.descricao === "Outro" && (
                <Input
                  className="mt-1"
                  placeholder="Descreva o acesso"
                  value={form.descricaoCustom}
                  onChange={(e) => setForm((f) => ({ ...f, descricaoCustom: e.target.value }))}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>E-mail</Label>
                <Input
                  type="text"
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={form.telefone}
                  onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Senha</Label>
              <Input
                type="text"
                placeholder="Senha de acesso"
                value={form.senha}
                onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Notas Livres</Label>
              <Textarea
                placeholder={"CNPJ: 00.000.000/0001-00\nCPF: 000.000.000-00\ngov.br: senha123\nPrefeitura: senha456\n..."}
                rows={6}
                value={form.observacao}
                onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Cole qualquer informação de acesso em texto livre</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsOpen(false); setEditingId(null); setForm(emptyForm); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : editingId ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
