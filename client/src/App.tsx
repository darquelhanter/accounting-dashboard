import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Clientes from "./pages/Clientes";
import Obrigacoes from "./pages/Obrigacoes";
import ChecklistMensal from "./pages/ChecklistMensal";
import Mensalidades from "./pages/Mensalidades";
import Admin from "./pages/Admin";
import NotificacaoConfigs from "./pages/NotificacaoConfigs";
import DashboardLayout from "./components/DashboardLayout";
import PortalLayout from "./components/PortalLayout";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Register from "./pages/Register";
import PortalCliente from "./pages/PortalCliente";
import Profile from "./pages/Profile";
import UserApproval from "./pages/UserApproval";
import ClientePermissions from "./pages/ClientePermissions";
import AuditLog from "./pages/AuditLog";
import BackupMonitor from "./pages/BackupMonitor";
import ServicosPrestados from "./pages/ServicosPrestados";
import DocumentosAcessos from "./pages/DocumentosAcessos";
import FluxoCaixa from "./pages/FluxoCaixa";
import Responsaveis from "./pages/Responsaveis";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      {/* Login principal = acesso do cliente (CNPJ) */}
      <Route path={"/login"} component={Login} />
      {/* Alias: redireciona /cliente/login para /login */}
      <Route path={"/cliente/login"} component={() => { window.location.replace("/login"); return null; }} />
      {/* Login administrativo separado */}
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/register"} component={Register} />
      {/* Portal do cliente */}
      <Route path={"/portal"} component={() => <PortalLayout><PortalCliente /></PortalLayout>} />
      {/* Área administrativa */}
      <Route path={"/clientes"} component={() => <DashboardLayout><Clientes /></DashboardLayout>} />
      <Route path={"/obrigacoes"} component={() => <DashboardLayout><Obrigacoes /></DashboardLayout>} />
      <Route path={"/checklist"} component={() => <DashboardLayout><ChecklistMensal /></DashboardLayout>} />
      <Route path={"/mensalidades"} component={() => <DashboardLayout><Mensalidades /></DashboardLayout>} />
      <Route path={"/notificacao-configs"} component={() => <DashboardLayout><NotificacaoConfigs /></DashboardLayout>} />
      <Route path={"/admin"} component={() => <DashboardLayout><Admin /></DashboardLayout>} />
      <Route path={"/profile"} component={() => <DashboardLayout><Profile /></DashboardLayout>} />
      <Route path={"/user-approval"} component={() => <DashboardLayout><UserApproval /></DashboardLayout>} />
      <Route path={"/cliente-permissions"} component={() => <DashboardLayout><ClientePermissions /></DashboardLayout>} />
      <Route path={"/audit-log"} component={() => <DashboardLayout><AuditLog /></DashboardLayout>} />
      <Route path={"/backup-monitor"} component={() => <DashboardLayout><BackupMonitor /></DashboardLayout>} />
      <Route path={"/servicos-prestados"} component={() => <DashboardLayout><ServicosPrestados /></DashboardLayout>} />
      <Route path={"/documentos"} component={() => <DashboardLayout><DocumentosAcessos /></DashboardLayout>} />
      <Route path={"/acessos"} component={() => <DashboardLayout><DocumentosAcessos /></DashboardLayout>} />
      <Route path={"/fluxo-caixa"} component={() => <DashboardLayout><FluxoCaixa /></DashboardLayout>} />
      <Route path={"/responsaveis"} component={() => <DashboardLayout><Responsaveis /></DashboardLayout>} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
