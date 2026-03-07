import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, LogOut } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md rounded-2xl border-0 shadow-xl">
        <CardContent className="pt-8 pb-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="text-not-found">Page Not Found</h1>
            <p className="mt-2 text-sm text-gray-500">
              This page doesn't exist or you may have followed an old link.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => window.location.href = "/"}
              className="w-full rounded-xl h-11 font-bold"
              data-testid="button-go-home"
            >
              <Home className="w-4 h-4 mr-2" /> Go Home
            </Button>
            <Button
              variant="outline"
              onClick={async () => { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); window.location.href = "/"; }}
              className="w-full rounded-xl h-11 font-bold border-slate-200 text-slate-600"
              data-testid="button-logout-notfound"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out & Start Fresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
