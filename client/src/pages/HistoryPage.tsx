import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MessageSquare, Search, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { historyBucket } from "@shared/history";

export default function HistoryPage() {
  const [, navigate] = useLocation();
  const conversations = trpc.conversations.list.useQuery();
  const projects = trpc.projects.list.useQuery();
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const grouped = useMemo(() => {
    const filtered = (conversations.data || []).filter((conversation: any) => {
      const matchesSearch = !search || conversation.title.toLowerCase().includes(search.toLowerCase());
      const matchesProject = projectFilter === "all" || String(conversation.projectId || "none") === projectFilter;
      return matchesSearch && matchesProject;
    });
    return ["Today", "Previous 7 Days", "Older"].map((label) => ({ label, items: filtered.filter((item: any) => historyBucket(item.updatedAt) === label) })).filter((group) => group.items.length);
  }, [conversations.data, projectFilter, search]);

  return <div className="app-surface min-h-screen px-5 py-6 sm:px-8"><div className="mx-auto w-full max-w-6xl"><header className="mb-8 flex items-center justify-between app-header border-b pb-5"><div className="flex items-center gap-3"><div className="brand-mark"><Sparkles className="size-4" /></div><div><p className="text-sm font-semibold tracking-[0.2em] text-white">HS SPACE</p><p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">Conversation history</p></div></div><Button variant="outline" className="border-white/10 text-slate-300" onClick={() => navigate("/")}><ArrowLeft className="mr-2 size-4" />Workspace</Button></header><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Your archive</p><h1 className="mt-2 text-3xl font-semibold text-foreground">History</h1><p className="mt-2 text-sm text-slate-500">Search, filter, and reopen your AI conversations.</p></div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><div className="relative min-w-[240px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" className="border-white/10 bg-white/[0.04] pl-9" /></div><Select value={projectFilter} onValueChange={setProjectFilter}><SelectTrigger className="w-[180px] border-white/10 bg-white/[0.04] text-xs"><SelectValue placeholder="All projects" /></SelectTrigger><SelectContent><SelectItem value="all">All projects</SelectItem><SelectItem value="none">No project</SelectItem>{(projects.data || []).map((project: any) => <SelectItem key={project.id} value={String(project.id)}>{project.name}</SelectItem>)}</SelectContent></Select></div></div>{grouped.length ? <div className="space-y-8">{grouped.map((group) => <section key={group.label}><div className="mb-3 flex items-center gap-3"><h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{group.label}</h2><div className="h-px flex-1 bg-white/8" /></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{group.items.map((conversation: any) => <button key={conversation.id} className="app-card group rounded-2xl border p-4 text-left transition-colors hover:border-cyan-300/20 hover:bg-cyan-300/[0.04]" onClick={() => navigate(`/?conversation=${conversation.id}`)}><div className="flex items-start justify-between gap-3"><MessageSquare className="size-4 text-cyan-300" /><span className="text-[10px] text-slate-600">{new Date(conversation.updatedAt).toLocaleDateString()}</span></div><p className="mt-5 truncate text-sm font-medium text-foreground">{conversation.title}</p><p className="mt-1 truncate text-xs text-slate-500">{conversation.model}</p></button>)}</div></section>)}</div> : <Card className="border-dashed border-white/10 bg-transparent"><CardHeader><CardTitle className="text-sm text-white">No matching conversations</CardTitle></CardHeader><CardContent className="text-sm text-slate-500">Try a broader search or a different project.</CardContent></Card>}</div></div>;
}
