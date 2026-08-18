import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/private-admin-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) });
      if (!response.ok) throw new Error("Invalid admin credentials.");
      navigate("/admin12-34");
      window.location.reload();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="app-surface flex min-h-screen items-center justify-center px-6"><div className="absolute inset-0 space-grid opacity-30" /><Card className="app-card relative w-full max-w-md border shadow-2xl shadow-cyan-950/30 backdrop-blur-xl"><CardHeader className="space-y-5 p-8"><div className="brand-mark"><Sparkles className="size-4" /></div><div><p className="eyebrow">Restricted workspace</p><CardTitle className="mt-2 text-2xl text-foreground">Admin control center</CardTitle><p className="mt-2 text-sm leading-6 text-slate-500">Authorized administrators only. Access is protected by a server-side session.</p></div></CardHeader><CardContent className="p-8 pt-0"><form className="space-y-5" onSubmit={submit}><div className="space-y-2"><Label htmlFor="admin-username" className="text-xs text-slate-400">Username</Label><Input id="admin-username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="border-white/10 bg-black/20" required /></div><div className="space-y-2"><Label htmlFor="admin-password" className="text-xs text-slate-400">Password</Label><Input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="border-white/10 bg-black/20" required /></div>{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}<Button className="glow-button w-full" disabled={loading}>{loading ? "Verifying…" : <><LockKeyhole className="mr-2 size-4" />Enter secure admin space</>}</Button></form><div className="mt-6 flex items-center gap-2 text-[11px] text-slate-600"><ShieldCheck className="size-3.5 text-cyan-300/70" />Credentials are never displayed or sent to the client after verification.</div></CardContent></Card></div>;
}
