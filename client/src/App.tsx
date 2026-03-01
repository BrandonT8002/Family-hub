import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// App Components
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Schedule from "@/pages/schedule";
import Money from "@/pages/money";
import Groceries from "@/pages/groceries";
import GroceryListDetail from "@/pages/grocery-list-detail";
import Chat from "@/pages/chat";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard}/>
        <Route path="/schedule" component={Schedule}/>
        <Route path="/money" component={Money}/>
        <Route path="/groceries" component={Groceries}/>
        <Route path="/groceries/:listId" component={GroceryListDetail}/>
        <Route path="/chat" component={Chat}/>
        <Route path="/settings" component={Settings}/>
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
