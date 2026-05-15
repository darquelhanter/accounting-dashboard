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
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import UserApproval from "./pages/UserApproval";
import ClientePermissions from "./pages/ClientePermissions";
import AuditLog from "./pages/AuditLog";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
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
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
