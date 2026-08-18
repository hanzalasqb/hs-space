import { useMemo } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, FolderKanban, MessageSquare, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const projects = trpc.projects.list.useQuery();
  const conversations = trpc.conversations.list.useQuery();
  const projectId = Number(id);
  const project = projects.data?.find((item: any) => item.id === projectId);
  const projectChats = useMemo(() => (conversations.data || []).filter((item: any) => item.projectId === projectId), [conversations.data, projectId]);

  return <div className="app-surface min-h-screen px-4 py-5 sm:px-6"><div className="mx-auto w-full max-w-6xl"><header className="mb-8 flex items-center justify-between app-header border-b pb-5"><div className="flex items-center gap-3"><div className="brand-mark"><Sparkles className="size-4" /></div><div><p className="text-sm font-semibold tracking-[0.2em] text-white">HS SPACE</p><p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">Project workspace</p></div></div><Button variant="outline" className="border-white/10 text-slate-300" onClick={() => navigate("/")}><ArrowLeft className="mr-2 size-4" />Workspace</Button></header><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Project</p><h1 className="mt-2 text-3xl font-semibold text-foreground">{project?.name || "Project"}</h1><p className="mt-2 text-sm text-slate-500">Reopen a conversation or start a new one inside this project.</p></div><Button className="glow-button" onClick={() => navigate(`/?project=${projectId}`)}><Plus className="mr-2 size-4" />New project chat</Button></div>{projectChats.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{projectChats.map((conversation: any) => <button key={conversation.id} className="text-left transition-transform duration-200 hover:-translate-y-0.5" onClick={() => navigate(`/?conversation=${conversation.id}`)}><Card className="app-card h-full border hover:border-cyan-300/20"><CardContent className="p-5"><MessageSquare className="size-4 text-cyan-300" /><p className="mt-5 truncate text-sm font-medium text-foreground">{conversation.title}</p><p className="mt-1 text-xs text-slate-500">{new Date(conversation.updatedAt).toLocaleDateString()} · {conversation.model}</p></CardContent></Card></button>)}</div> : <Card className="border-dashed border-white/10 bg-transparent"><CardContent className="flex flex-col items-center py-20 text-center"><FolderKanban className="mb-4 size-8 text-slate-600" /><p className="text-sm text-slate-300">No chats in this project yet.</p><p className="mt-1 text-xs text-slate-600">Start a project chat to keep the work together.</p><Link href={`/?project=${projectId}`}><Button variant="outline" className="mt-5 border-white/10 text-slate-300">Start a chat</Button></Link></CardContent></Card>}</div></div>;
}
