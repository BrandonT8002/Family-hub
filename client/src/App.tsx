import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout, useCaregiverMode } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Schedule from "@/pages/schedule";
import Money from "@/pages/money";
import Groceries from "@/pages/groceries";
import GroceryListDetail from "@/pages/grocery-list-detail";
import Chat from "@/pages/chat";
import Diary from "@/pages/diary";
import Goals from "@/pages/goals";
import Wishlists from "@/pages/wishlists";
import LeaveTime from "@/pages/leave-time";
import Settings from "@/pages/settings";
import CaregiverDashboard from "@/pages/caregiver-dashboard";
import CareNotesPage from "@/pages/care-notes";

function HomeSwitcher() {
  const { isCaregiver } = useCaregiverMode();
  return isCaregiver ? <CaregiverDashboard /> : <Dashboard />;
}

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { isCaregiver } = useCaregiverMode();
  if (isCaregiver) return <CaregiverDashboard />;
  return <Component />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomeSwitcher}/>
        <Route path="/schedule" component={Schedule}/>
        <Route path="/money">{() => <ProtectedRoute component={Money} />}</Route>
        <Route path="/groceries">{() => <ProtectedRoute component={Groceries} />}</Route>
        <Route path="/groceries/:listId" component={GroceryListDetail}/>
        <Route path="/chat" component={Chat}/>
        <Route path="/diary">{() => <ProtectedRoute component={Diary} />}</Route>
        <Route path="/goals">{() => <ProtectedRoute component={Goals} />}</Route>
        <Route path="/wishlists">{() => <ProtectedRoute component={Wishlists} />}</Route>
        <Route path="/leave-time">{() => <ProtectedRoute component={LeaveTime} />}</Route>
        <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
        <Route path="/caregiver" component={CaregiverDashboard}/>
        <Route path="/care-notes" component={CareNotesPage}/>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
