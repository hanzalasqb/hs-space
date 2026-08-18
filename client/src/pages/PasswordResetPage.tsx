import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export default function PasswordResetPage() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(useSearch());
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    if (!/^[a-f0-9]{64}$/.test(token)) return setError("This reset link is invalid.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try { const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, newPassword: password }) }); const result = await response.json().catch(() => ({})); if (!response.ok) throw new Error(result.error || "Unable to reset password."); setSuccess(true); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to reset password."); } finally { setLoading(false); }
  };
  return <div className="app-surface flex min-h-screen items-center justify-center px-6"><Card className="app-card w-full max-w-md"><CardHeader><p className="eyebrow">Secure recovery</p><CardTitle className="mt-2 text-2xl text-foreground">Set a new password</CardTitle><p className="mt-2 text-sm text-muted-foreground">Reset links expire after 15 minutes and can only be used once.</p></CardHeader><CardContent>{success ? <><Alert><AlertDescription>Password updated. You can now sign in with your new password.</AlertDescription></Alert><Button className="mt-5 w-full" onClick={() => navigate("/auth?mode=login")}>Return to login</Button></> : <form className="space-y-4" onSubmit={submit}><div className="space-y-2"><Label htmlFor="reset-password">New password</Label><Input id="reset-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" /></div><div className="space-y-2"><Label htmlFor="reset-confirm">Confirm password</Label><Input id="reset-confirm" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" /></div>{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}<Button className="w-full" disabled={loading}>{loading ? <><Spinner className="mr-2" />Updating…</> : "Update password"}</Button></form>}</CardContent></Card></div>;
}
