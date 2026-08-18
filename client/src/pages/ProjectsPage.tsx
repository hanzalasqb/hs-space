import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, FolderKanban, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

export default function ProjectsPage() {
  const [, navigate] = useLocation();
  const [projectName, setProjectName] = useState("");
  const projects = trpc.projects.list.useQuery();
  const utils = trpc.useUtils();
  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      setProjectName("");
      void utils.projects.list.invalidate();
    },
  });

  return <div className="app-surface min-h-screen px-4 py-5 sm:px-6"><div className="mx-auto w-full max-w-6xl"><header className="mb-8 flex items-center justify-between app-header border-b pb-5"><div className="flex items-center gap-3"><div className="brand-mark"><Sparkles className="size-4" /></div><div><p className="text-sm font-semibold tracking-[0.2em] text-white">HS SPACE</p><p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Projects</p></div></div><Button variant="outline" className="border-white/10 text-slate-300" onClick={() => navigate("/")}><ArrowLeft className="mr-2 size-4" />Workspace</Button></header><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Organize your work</p><h1 className="mt-2 text-3xl font-semibold text-foreground">Projects</h1><p className="mt-2 text-sm text-slate-400">Open a project to see its chats, or create a focused workspace.</p></div><div className="flex w-full gap-2 sm:w-auto"><Input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="New project name" className="min-w-0 border-white/10 bg-white/[0.04] sm:w-52" /><Button className="glow-button shrink-0" disabled={!projectName.trim() || createProject.isPending} onClick={() => createProject.mutate({ name: projectName.trim() })}><Plus className="mr-2 size-4" />Create</Button></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(projects.data || []).map((project: any) => <button key={project.id} type="button" className="text-left transition-transform duration-200 hover:-translate-y-0.5" onClick={() => navigate(`/projects/${project.id}`)}><Card className="app-card h-full border transition-colors hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]"><CardContent className="p-5"><div className="flex items-center justify-between"><div className="rounded-xl bg-cyan-300/10 p-3 text-cyan-300"><FolderKanban className="size-5" /></div><span className="text-xs text-slate-500">Open</span></div><h2 className="mt-6 truncate text-base font-medium text-foreground">{project.name}</h2><p className="mt-2 text-xs text-slate-400">Created {new Date(project.createdAt).toLocaleDateString()}</p></CardContent></Card></button>)}{(projects.data || []).length === 0 && <Card className="border-dashed border-white/10 bg-transparent sm:col-span-2 lg:col-span-3"><CardContent className="flex flex-col items-center py-20 text-center"><FolderKanban className="mb-4 size-8 text-slate-600" /><p className="text-sm text-slate-300">No projects yet.</p><p className="mt-1 text-xs text-slate-500">Create a project to keep related chats together.</p></CardContent></Card>}</div></div></div>;
}
