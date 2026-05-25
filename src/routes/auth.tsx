import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckSquare, Loader2, Eye, EyeOff, MailCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({ component: AuthPage });

type Mode = "signin" | "signup" | "forgot" | "reset";

function AuthPage() {
  const nav = useNavigate();
  const { session, loading } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session && mode !== "reset") nav({ to: "/dashboard" });
  }, [loading, mode, session, nav]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const recoveryInUrl =
      url.searchParams.get("type") === "recovery" ||
      url.hash.includes("type=recovery") ||
      url.searchParams.has("code");
    if (recoveryInUrl) setMode("reset");

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setResetEmailSent(false);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) { handleAuthError(error.message); return; }
        if (data.session) {
          nav({ to: "/dashboard" });
        } else {
          toast.error("Não foi possível criar a sessão. Tente fazer login.");
        }
      } else if (mode === "forgot") {
        const redirectTo = `${window.location.origin}/auth`;
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo,
        });
        if (error) { handleAuthError(error.message); return; }
        setResetEmailSent(true);
        toast.success("Enviamos o link de recuperação para seu e-mail.");
      } else if (mode === "reset") {
        if (password.length < 6) {
          toast.error("A senha deve ter pelo menos 6 caracteres.");
          return;
        }
        if (password !== confirmPassword) {
          toast.error("As senhas não conferem.");
          return;
        }

        const { error } = await supabase.auth.updateUser({ password });
        if (error) { handleAuthError(error.message); return; }
        toast.success("Senha atualizada com sucesso!");
        setPassword("");
        setConfirmPassword("");
        nav({ to: "/dashboard" });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) { handleAuthError(error.message); return; }
        if (data.session) nav({ to: "/dashboard" });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleAuthError = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes("email not confirmed")) {
      toast.error("E-mail não confirmado. Verifique sua caixa de entrada.");
    } else if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
      toast.error("E-mail ou senha incorretos.");
    } else if (m.includes("user already registered") || m.includes("already registered")) {
      toast.error("E-mail já cadastrado. Faça login.");
      setMode("signin");
    } else if (m.includes("weak") || m.includes("pwned") || m.includes("easy to guess")) {
      toast.error("Senha muito comum. Use letras, números e símbolos (ex: Orbit@2026!).", { duration: 6000 });
    } else if (m.includes("password should be") || m.includes("at least")) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
    } else if (m.includes("rate limit") || m.includes("too many")) {
      toast.error("Muitas tentativas. Aguarde alguns minutos.");
    } else {
      toast.error(msg || "Erro inesperado.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PageWrapper>
      <Card className="p-6">
        {mode !== "forgot" && mode !== "reset" && (
          <div className="flex rounded-lg bg-muted p-1 mb-5">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                  mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "signin" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>
        )}

        {mode === "forgot" && resetEmailSent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
              <MailCheck className="size-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Verifique seu e-mail</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Se existir uma conta para <span className="font-medium text-foreground">{email}</span>, enviamos um link para redefinir a senha.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setResetEmailSent(false);
              }}
              className="text-sm font-medium text-primary hover:underline"
            >
              Voltar para login
            </button>
          </div>
        ) : (

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
                disabled={busy}
              />
            </div>
          )}

          {mode !== "reset" && (
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                autoComplete="email"
                disabled={busy}
              />
            </div>
          )}

          {mode === "forgot" ? (
            <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              Digite seu e-mail e enviaremos um link seguro para você criar uma nova senha.
            </p>
          ) : (
            <div className="space-y-2">
            <Label htmlFor="password">{mode === "reset" ? "Nova senha" : "Senha"}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" || mode === "reset" ? "Use letras, números e símbolos" : "Sua senha"}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                disabled={busy}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {(mode === "signup" || mode === "reset") && (
              <p className="text-xs text-muted-foreground">
                Evite senhas comuns. Exemplo válido: <span className="font-mono">Orbit@2026!</span>
              </p>
            )}
          </div>
          )}

          {mode === "reset" && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                disabled={busy}
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="size-4 mr-2 animate-spin" />}
            {mode === "signin"
              ? "Entrar"
              : mode === "signup"
                ? "Criar conta"
                : mode === "forgot"
                  ? "Enviar link de recuperação"
                  : "Atualizar senha"}
          </Button>

          <div className="flex justify-center gap-3 text-xs">
            {mode === "signin" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="font-medium text-primary hover:underline"
              >
                Esqueci minha senha
              </button>
            )}
            {(mode === "forgot" || mode === "reset") && (
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setPassword("");
                  setConfirmPassword("");
                }}
                className="font-medium text-primary hover:underline"
              >
                Voltar para login
              </button>
            )}
          </div>
        </form>
        )}
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-5">
        Ao continuar você concorda com os Termos de uso e Política de privacidade.
      </p>
    </PageWrapper>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/20 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="size-10 rounded-xl bg-primary text-primary-foreground grid place-items-center">
            <CheckSquare className="size-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">TaskFlow</span>
        </div>
        {children}
      </div>
    </div>
  );
}
