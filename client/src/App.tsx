import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import BulkSend from "./pages/BulkSend";
import Analytics from "./pages/Analytics";
import ApiKeys from "./pages/ApiKeys";
import NotificationSettings from "./pages/NotificationSettings";
import ScheduleCampaigns from "./pages/ScheduleCampaigns";
import TestWhatsApp from "./pages/TestWhatsApp";
import Dashboard from "./pages/Dashboard";
import ChipsManagement from "./pages/ChipsManagement";
import SendMessages from "./pages/SendMessages";
import CRM from "./pages/CRM";
import WarmupDashboard from "./pages/WarmupDashboard";
import WarmupPage from "./pages/WarmupPage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/test"} component={TestWhatsApp} />
      <Route path={"/bulk"} component={BulkSend} />
      <Route path={"/analytics"} component={Analytics} />
        <Route path="/api-keys" component={ApiKeys} />
      <Route path="/notifications" component={NotificationSettings} />
      <Route path="/schedule" component={ScheduleCampaigns} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/dashboard/chips"} component={ChipsManagement} />
      <Route path={"/dashboard/messages"} component={SendMessages} />
      <Route path={"/dashboard/crm"} component={CRM} />
      <Route path={"/dashboard/warmup"} component={WarmupPage} />
      <Route path={"/warmup"} component={WarmupDashboard} />
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
