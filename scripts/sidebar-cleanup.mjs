import fs from "node:fs";

const path = "client/src/pages/Home.tsx";
let source = fs.readFileSync(path, "utf8");
source = source.replace(
  "BarChart3, Bot, Check, ChevronRight, CircleDot, FileText, FolderKanban, Gauge, Loader2, LogIn, MessageSquare, MoreHorizontal, Paperclip, Plus, Radio, Settings2, ShieldCheck, Sparkles, Trash2, UserCheck, Users, X, LogOut",
  "BarChart3, Bot, Check, ChevronRight, CircleDot, FileText, FolderKanban, Gauge, History, Loader2, LogIn, MessageSquare, MoreHorizontal, Paperclip, Plus, Radio, Settings2, ShieldCheck, Sparkles, Trash2, UserCheck, Users, X, LogOut"
);
const start = '<div className="mt-8 border-t border-white/8 pt-5">';
const end = '<div className="absolute bottom-5 left-4 right-4';
const startAt = source.indexOf(start);
const endAt = source.indexOf(end, startAt);
if (startAt < 0 || endAt < 0) throw new Error("Sidebar anchors not found");
const replacement = '<div className="mt-8 border-t border-white/8 pt-5"><button className="nav-item" onClick={() => { window.location.href = "/projects"; }}><FolderKanban className="size-4" />Projects</button><button className="nav-item" onClick={() => { window.location.href = HISTORY_PATH; }}><History className="size-4" />History</button></div>';
source = source.slice(0, startAt) + replacement + source.slice(endAt);
fs.writeFileSync(path, source);
