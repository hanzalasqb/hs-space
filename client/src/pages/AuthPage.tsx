import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, LockKeyhole, Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const query = useSearch();
  const params = new URLSearchParams(query);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(params.get("mode") === "signup" ? "signup" : params.get("mode") === "forgot" ? "forgot" : "login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setMessage(""); setFieldErrors({}); setPreviewUrl("");
    const nextErrors: Record<string, string> = {};
    if (mode !== "forgot" && !username.trim()) nextErrors.username = "Username is required.";
    if (mode !== "forgot" && password.length < (mode === "signup" ? 8 : 1)) nextErrors.password = mode === "signup" ? "Password must be at least 8 characters." : "Password is required.";
    if ((mode === "signup" || mode === "forgot") && !/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (Object.keys(nextErrors).length) { setFieldErrors(nextErrors); return; }
    setLoading(true);
    const endpoint = mode === "signup" ? "/api/auth/signup" : mode === "forgot" ? "/api/auth/forgot-password" : "/api/auth/login";
    const payload = mode === "signup" ? { username, password, name, email } : mode === "forgot" ? { email } : { username, password };
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to continue.");
      if (mode === "signup") { setMessage("Account created. An administrator must approve it before you can sign in."); setMode("login"); }
      else if (mode === "forgot") { setMessage(result.message || "If an account exists for this email, recovery instructions will be provided."); setPreviewUrl(typeof result.previewUrl === "string" ? result.previewUrl : ""); }
      else { window.location.href = "/"; }
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to continue."); }
    finally { setLoading(false); }
  };

  return <div className="app-surface relative flex min-h-screen items-center justify-center overflow-hidden px-6"><div className="absolute inset-0 space-grid opacity-30" /><Card className="app-card relative w-full max-w-md border shadow-2xl shadow-cyan-950/30 backdrop-blur-xl"><CardHeader className="space-y-5 p-8"><button className="flex w-fit items-center gap-2 text-xs text-slate-500 transition-colors hover:text-white" onClick={() => navigate("/")}><ArrowLeft className="size-3.5" />Back to HS Space</button><div className="brand-mark"><Sparkles className="size-4" /></div><div><p className="eyebrow">HS Space access</p><CardTitle className="mt-2 text-2xl text-foreground">{mode === "login" ? "Welcome back." : mode === "forgot" ? "Recover your account." : "Create your workspace."}</CardTitle><p className="mt-2 text-sm leading-6 text-slate-500">{mode === "login" ? "Sign in with your approved account to continue." : mode === "forgot" ? "Enter the email associated with your account." : "Request an account. Admin approval is required before access."}</p></div></CardHeader><CardContent className="p-8 pt-0"><div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-white/8 bg-black/10 p-1"><button className={mode === "login" ? "rounded-lg bg-white/10 py-2 text-xs text-white" : "rounded-lg py-2 text-xs text-slate-500"} onClick={() => setMode("login")}>Login</button><button className={mode === "signup" ? "rounded-lg bg-white/10 py-2 text-xs text-white" : "rounded-lg py-2 text-xs text-slate-500"} onClick={() => setMode("signup")}>Sign up</button></div><form className="space-y-4" onSubmit={submit}>{(mode === "signup" || mode === "forgot") && <div className="space-y-2"><Label htmlFor="auth-email" className="text-xs text-slate-400">Email</Label><Input id="auth-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="border-white/10 bg-black/20" required aria-invalid={Boolean(fieldErrors.email)} />{fieldErrors.email && <p className="text-xs text-rose-300">{fieldErrors.email}</p>}</div>}{mode === "signup" && <div className="space-y-2"><Label htmlFor="auth-name" className="text-xs text-slate-400">Name</Label><Input id="auth-name" value={name} onChange={(event) => setName(event.target.value)} className="border-white/10 bg-black/20" /></div>}{mode !== "forgot" && <><div className="space-y-2"><Label htmlFor="auth-username" className="text-xs text-slate-400">Username</Label><Input id="auth-username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="border-white/10 bg-black/20" required aria-invalid={Boolean(fieldErrors.username)} />{fieldErrors.username && <p className="text-xs text-rose-300">{fieldErrors.username}</p>}</div><div className="space-y-2"><Label htmlFor="auth-password" className="text-xs text-slate-400">Password</Label><Input id="auth-password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="border-white/10 bg-black/20" required aria-invalid={Boolean(fieldErrors.password)} />{fieldErrors.password && <p className="text-xs text-rose-300">{fieldErrors.password}</p>}</div></>}{mode === "login" && <button type="button" className="text-xs text-cyan-300 hover:text-cyan-200" onClick={() => setMode("forgot")}>Forgot password?</button>}{message && <Alert><AlertDescription>{message}{previewUrl && <><br /><a className="mt-2 inline-block text-cyan-300 underline" href={previewUrl}>Open mock reset link</a></>}</AlertDescription></Alert>}{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}<Button className="glow-button w-full" disabled={loading}>{loading ? <><Spinner className="mr-2" />Working…</> : <><LockKeyhole className="mr-2 size-4" />{mode === "login" ? "Login to HS Space" : mode === "forgot" ? "Check recovery" : "Request access"}</>}</Button></form></CardContent></Card></div>;
}
