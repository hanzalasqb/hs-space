import { useEffect, useState } from "react";

function passwordStrength(value: string) {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return { score, label: score <= 1 ? "Weak" : score <= 3 ? "Good" : "Strong" };
}
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, Image, LockKeyhole, Save, Upload, UserRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, loading, refresh } = useAuth();
  useEffect(() => { if (!loading && !user) navigate("/auth?mode=login"); }, [loading, user, navigate]);
  useEffect(() => { if (user?.avatarUrl) setAvatarPreview(user.avatarUrl); }, [user?.avatarUrl]);
  const [username, setUsername] = useState(user?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || "");
  const strength = passwordStrength(newPassword);
  const mutation = trpc.profile.update.useMutation({ onSuccess: async () => { setMessage("Profile updated successfully."); setError(""); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); await refresh(); } });
  const avatarMutation = trpc.profile.avatar.useMutation({ onSuccess: async (result) => { setAvatarPreview(result.url); setMessage("Avatar updated successfully."); setError(""); await refresh(); } });
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; if (!/^image\/(png|jpeg|jpg|webp|gif)$/.test(file.type)) return setError("Choose a PNG, JPEG, WebP, or GIF image."); if (file.size > 5 * 1024 * 1024) return setError("Avatar images must be 5 MB or smaller."); const reader = new FileReader(); reader.onload = () => { const dataUrl = String(reader.result || ""); const base64 = dataUrl.split(",")[1] || ""; setAvatarPreview(dataUrl); avatarMutation.mutate({ fileName: file.name, mimeType: file.type, sizeBytes: file.size, base64 }); }; reader.readAsDataURL(file); };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(""); setError("");
    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_.-]{3,80}$/.test(cleanUsername)) return setError("Username must be 3–80 characters and use only letters, numbers, dots, underscores, or hyphens.");
    if (newPassword && newPassword !== confirmPassword) return setError("New password and confirmation do not match.");
    if (newPassword && !currentPassword) return setError("Enter your current password before setting a new password.");
    if (cleanUsername === (user?.username || "").toLowerCase() && !newPassword) return setError("Make a change before saving.");
    mutation.mutate({ username: cleanUsername === (user?.username || "").toLowerCase() ? undefined : cleanUsername, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined });
  };
  if (loading) return <div className="app-surface flex min-h-screen items-center justify-center"><Spinner className="size-6 text-cyan-300" /></div>;
  if (!user) return <div className="app-surface flex min-h-screen items-center justify-center p-6"><Card className="app-card w-full max-w-md"><CardContent className="p-6 text-center"><p className="text-sm text-muted-foreground">Redirecting to login…</p></CardContent></Card></div>;
  if (user.role === "admin" || user.approvalStatus !== "approved" || !user.accessEnabled) return <div className="app-surface flex min-h-screen items-center justify-center p-6"><Card className="app-card w-full max-w-md"><CardHeader><CardTitle className="text-foreground">Profile settings unavailable</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Profile settings are available to approved workspace users only.</p><Button className="mt-5" onClick={() => navigate("/")}>Back to workspace</Button></CardContent></Card></div>;
  return <div className="app-surface min-h-screen px-4 py-8 sm:px-6"><div className="mx-auto w-full max-w-2xl"><Button variant="ghost" className="mb-6 text-slate-500 hover:text-foreground" onClick={() => navigate("/")}><ArrowLeft className="mr-2 size-4" />Back to workspace</Button><div className="mb-6"><p className="eyebrow">Account settings</p><h1 className="mt-2 text-3xl font-semibold text-foreground">Your profile</h1><p className="mt-2 text-sm text-muted-foreground">Update the username shown across HS Space and change your local account password.</p></div><Card className="app-card"><CardHeader><CardTitle className="flex items-center gap-2 text-foreground"><UserRound className="size-4 text-cyan-300" />Identity</CardTitle></CardHeader><CardContent><div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-muted/30 p-4"><div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/30 bg-cyan-300/10">{avatarPreview ? <img src={avatarPreview} alt="Profile avatar" className="size-full object-cover" /> : <Image className="size-6 text-cyan-700 dark:text-cyan-200" />}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground">Profile avatar</p><p className="mt-1 text-xs text-muted-foreground">PNG, JPEG, WebP, or GIF up to 5 MB.</p><label className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"><Upload className="mr-2 size-3.5" />{avatarMutation.isPending ? "Uploading…" : "Upload avatar"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={handleAvatarChange} disabled={avatarMutation.isPending} /></label></div></div><form className="space-y-6" onSubmit={submit}><div className="space-y-2"><Label htmlFor="profile-username">Username</Label><Input id="profile-username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" aria-describedby="username-help" /><p id="username-help" className="text-xs text-muted-foreground">This username is shown to you and administrators. It must be unique.</p></div><div className="border-t border-border pt-6"><div className="mb-4 flex items-center gap-2"><LockKeyhole className="size-4 text-cyan-300" /><p className="text-sm font-medium text-foreground">Change password</p></div><div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" /></div><div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" /><div className="space-y-2"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Password strength</span><span className={cn("font-medium", strength.score <= 1 ? "text-rose-600 dark:text-rose-300" : strength.score <= 3 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300")}>{newPassword ? strength.label : "Not set"}</span></div><div className="flex gap-1">{[0, 1, 2, 3, 4].map((index) => <span key={index} className={cn("h-1.5 flex-1 rounded-full bg-muted", newPassword && index < strength.score && (strength.score <= 1 ? "bg-rose-500" : strength.score <= 3 ? "bg-amber-500" : "bg-emerald-500"))} />)}</div><p className="text-xs text-muted-foreground">Use 8+ characters with upper/lowercase letters, numbers, and symbols.</p></div></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" /></div></div></div>{message && <Alert><CheckCircle2 className="size-4" /><AlertDescription>{message}</AlertDescription></Alert>}{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>} {mutation.error && <Alert variant="destructive"><AlertDescription>{mutation.error.message}</AlertDescription></Alert>}<Button className="glow-button" disabled={mutation.isPending}>{mutation.isPending ? <><Spinner className="mr-2" />Saving…</> : <><Save className="mr-2 size-4" />Save profile</>}</Button></form></CardContent></Card></div></div>;
}
