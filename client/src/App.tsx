import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import AdminLogin from "@/pages/AdminLogin";
import AuthPage from "@/pages/AuthPage";
import HistoryPage from "@/pages/HistoryPage";
import ProjectPage from "@/pages/ProjectPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProfilePage from "@/pages/ProfilePage";
import PasswordResetPage from "@/pages/PasswordResetPage";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { HISTORY_PATH } from "@shared/navigation";

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/auth" component={AuthPage} /><Route path={HISTORY_PATH} component={HistoryPage} /><Route path="/projects" component={ProjectsPage} /><Route path="/projects/:id" component={ProjectPage} /><Route path="/profile" component={ProfilePage} /><Route path="/reset-password" component={PasswordResetPage} /><Route path="/admin12-34" component={AdminLogin} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark" switchable><TooltipProvider><Toaster theme="dark" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
