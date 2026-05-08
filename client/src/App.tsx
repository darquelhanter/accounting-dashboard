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
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/clientes"} component={() => <DashboardLayout><Clientes /></DashboardLayout>} />
      <Route path={"/obrigacoes"} component={() => <DashboardLayout><Obrigacoes /></DashboardLayout>} />
      <Route path={"/checklist"} component={() => <DashboardLayout><ChecklistMensal /></DashboardLayout>} />
      <Route path={"/mensalidades"} component={() => <DashboardLayout><Mensalidades /></DashboardLayout>} />
      <Route path={"/admin"} component={() => <DashboardLayout><Admin /></DashboardLayout>} />
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
