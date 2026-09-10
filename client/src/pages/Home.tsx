import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowRight,
  FileText,
  DollarSign,
  CheckSquare,
  Users,
  Briefcase,
  FolderOpen,
  TrendingUp,
  Monitor,
  AlertTriangle,
  Clock,
  UserCheck,
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AlertDetailsModal } from "@/components/AlertDetailsModal";

const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const DIAS_SEMANA = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];

function getGreeting(name?: string) {
  const h = new Date().getHours();
  const periodo = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return `${periodo}${name ? `, ${name.split(" ")[0]}` : ""}!`;
}

function getDateLabel() {
  const d = new Date();
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

// ── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color, onClick,
}: {
  label: string; value: number | string; sub: string;
  icon: React.ElementType; color: string; onClick: () => void;
}) {
  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    blue:   { bg: "bg-blue-50",   text: "text-blue-600",   ring: "hover:ring-blue-200" },
    orange: { bg: "bg-orange-50", text: "text-orange-500", ring: "hover:ring-orange-200" },
    red:    { bg: "bg-red-50",    text: "text-red-500",    ring: "hover:ring-red-200" },
    green:  { bg: "bg-green-50",  text: "text-green-600",  ring: "hover:ring-green-200" },
  };
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-xl border p-5 hover:shadow-md hover:ring-2 ${c.ring} transition-all group`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <Icon className={`h-5 w-5 ${c.text}`} />
        </div>
        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </button>
  );
}

// ── Shortcut Card ────────────────────────────────────────────────────────────
function ShortcutCard({
  label, description, icon: Icon, color, onClick,
}: {
  label: string; description: string;
  icon: React.ElementType; color: string; onClick: () => void;
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    blue:   { bg: "bg-blue-50",   text: "text-blue-600" },
    orange: { bg: "bg-orange-50", text: "text-orange-500" },
    green:  { bg: "bg-green-50",  text: "text-green-600" },
    purple: { bg: "bg-purple-50", text: "text-purple-600" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
    cyan:   { bg: "bg-cyan-50",   text: "text-cyan-600" },
    teal:   { bg: "bg-teal-50",   text: "text-teal-600" },
    violet: { bg: "bg-violet-50", text: "text-violet-600" },
  };
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border p-4 hover:shadow-md hover:border-gray-300 transition-all group flex items-start gap-3"
    >
      <div className={`p-2 rounded-lg ${c.bg} shrink-0 mt-0.5`}>
        <Icon className={`h-4 w-4 ${c.text}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
    </button>
  );
}

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const isApproved = isAuthenticated && (user?.role === "admin" || user?.status === "approved");

  const { data: alertasSumario } = trpc.alertas.sumario.useQuery(undefined, { enabled: isApproved });
  const { data: kpis } = trpc.alertas.kpis.useQuery(undefined, { enabled: isApproved });

  if (loading) return null;
  if (!isAuthenticated) { navigate("/admin/login"); return null; }

  const temAlertas =
    alertasSumario &&
    (alertasSumario.obrigacoesProximas > 0 ||
      alertasSumario.mensalidadesAtrasadas > 0 ||
      alertasSumario.mensalidadesPendentes > 0);

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Saudação ── */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getGreeting(user?.name ?? undefined)}</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{getDateLabel()}</p>
        </div>
      </div>

      {/* ── Alertas ── */}
      {temAlertas && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Atenção necessária</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alertasSumario!.obrigacoesProximas > 0 && (
              <AlertDetailsModal type="proximo" count={alertasSumario!.obrigacoesProximas} label="Obrigações próximas" />
            )}
            {alertasSumario!.mensalidadesAtrasadas > 0 && (
              <AlertDetailsModal type="atrasado" count={alertasSumario!.mensalidadesAtrasadas} label="Mensalidades atrasadas" />
            )}
            {alertasSumario!.mensalidadesPendentes > 0 && (
              <AlertDetailsModal type="pendente" count={alertasSumario!.mensalidadesPendentes} label="Mensalidades pendentes" />
            )}
          </div>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total de Empresas"
          value={kpis?.totalClientes ?? 0}
          sub="Clientes cadastrados"
          icon={Users}
          color="blue"
          onClick={() => navigate("/clientes")}
        />
        <KpiCard
          label="Obrigações Pendentes"
          value={kpis?.obrigacoesPendentes ?? 0}
          sub="Aguardando conclusão"
          icon={Clock}
          color="orange"
          onClick={() => navigate("/checklist")}
        />
        <KpiCard
          label="Mensalidades Atrasadas"
          value={kpis?.mensalidadesAtrasadas ?? 0}
          sub="Requerem atenção"
          icon={DollarSign}
          color="red"
          onClick={() => navigate("/mensalidades")}
        />
        <KpiCard
          label="Taxa de Conclusão"
          value={`${kpis?.taxaConclusao ?? 0}%`}
          sub="Obrigações concluídas"
          icon={CheckSquare}
          color="green"
          onClick={() => navigate("/checklist")}
        />
      </div>

      {/* ── Acesso rápido ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Acesso rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ShortcutCard
            label="Empresas"
            description="Cadastre e gerencie clientes, sócios e dados cadastrais"
            icon={Users}
            color="blue"
            onClick={() => navigate("/clientes")}
          />
          <ShortcutCard
            label="Checklist Mensal"
            description="Acompanhe o status das obrigações mensais por empresa"
            icon={CheckSquare}
            color="purple"
            onClick={() => navigate("/checklist")}
          />
          <ShortcutCard
            label="Mensalidades"
            description="Controle de pagamentos, status e cobranças pendentes"
            icon={DollarSign}
            color="green"
            onClick={() => navigate("/mensalidades")}
          />
          <ShortcutCard
            label="Obrigações"
            description="Gerencie obrigações fiscais, acessórias e trabalhistas"
            icon={FileText}
            color="orange"
            onClick={() => navigate("/obrigacoes")}
          />
          <ShortcutCard
            label="Fluxo de Caixa"
            description="Visão consolidada de entradas e saídas financeiras"
            icon={TrendingUp}
            color="teal"
            onClick={() => navigate("/fluxo-caixa")}
          />
          <ShortcutCard
            label="Documentos & Acessos"
            description="Armazene arquivos e credenciais por empresa"
            icon={FolderOpen}
            color="indigo"
            onClick={() => navigate("/documentos")}
          />
          <ShortcutCard
            label="Serviços Prestados"
            description="Registre cobranças avulsas com valor e mês definidos"
            icon={Briefcase}
            color="cyan"
            onClick={() => navigate("/servicos-prestados")}
          />
          <ShortcutCard
            label="Responsáveis"
            description="Gerencie os responsáveis contábeis das empresas"
            icon={UserCheck}
            color="violet"
            onClick={() => navigate("/responsaveis")}
          />
          <ShortcutCard
            label="Área do Cliente"
            description="Visualize e edite os dados do portal por empresa"
            icon={Monitor}
            color="blue"
            onClick={() => navigate("/area-cliente")}
          />
        </div>
      </div>
    </div>
  );
}
