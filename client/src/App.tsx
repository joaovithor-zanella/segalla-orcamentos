import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Products from "./pages/Products";
import QuoteEditor from "./pages/QuoteEditor";
import QuotesList from "./pages/QuotesList";
import QuoteView from "./pages/QuoteView";
import AdminUsers from "./pages/AdminUsers";
import AdminPayments from "./pages/AdminPayments";

function Router() {
  return (
    <Switch>
      {/* Dashboard */}
      <Route path="/" component={Home} />

      {/* Catálogo de Produtos */}
      <Route path="/produtos" component={Products} />

      {/* Orçamentos */}
      <Route path="/orcamentos" component={QuotesList} />
      <Route path="/orcamentos/novo" component={QuoteEditor} />
      <Route path="/orcamentos/:id" component={QuoteView} />
      <Route path="/orcamentos/:id/editar" component={QuoteEditor} />

      {/* Admin */}
      <Route path="/admin/usuarios" component={AdminUsers} />
      <Route path="/admin/pagamentos" component={AdminPayments} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
