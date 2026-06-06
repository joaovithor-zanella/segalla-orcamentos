import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Preencha username e senha");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/local-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Login falhou");
        return;
      }

      // Login bem-sucedido, redireciona para home
      setLocation("/");
    } catch (error) {
      toast.error("Erro ao fazer login");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-segalla-blue via-background to-segalla-gray p-4">
      <Card className="w-full max-w-md shadow-lg border-segalla-red/20">
        <CardHeader className="bg-gradient-to-r from-segalla-red/10 to-segalla-blue/10 border-b border-segalla-red/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-segalla-red rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <CardTitle className="text-2xl text-segalla-red">Segalla</CardTitle>
              <CardDescription>Sistema de Orçamentos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Username</label>
              <Input
                type="text"
                placeholder="Seu username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="border-segalla-gray/30 focus:border-segalla-red"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Senha</label>
              <Input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="border-segalla-gray/30 focus:border-segalla-red"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-segalla-red hover:bg-segalla-red/90 text-white"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-segalla-gray/20 text-center text-sm text-muted-foreground">
            <p>Contate o administrador para criar sua conta</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
