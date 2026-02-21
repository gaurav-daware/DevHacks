import { useState, useEffect } from "react";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Pencil, Trash2, Trophy, Code2, Users,
  BarChart3, Loader2, CheckCircle2, Copy, Hash
} from "lucide-react";
import { toast } from "sonner";

// Problem form component
function ProblemForm({ problem, onSave, onClose }) {
  const [form, setForm] = useState({
    title: problem?.title || "",
    description: problem?.description || "",
    difficulty: problem?.difficulty || "easy",
    tags: problem?.tags?.join(", ") || "",
    sample_input: problem?.sample_input || "",
    sample_output: problem?.sample_output || "",
    test_cases: problem?.test_cases?.map(tc => `${tc.input}|||${tc.output}`).join("\n---\n") || "",
    hints: problem?.hints?.join("\n") || "",
    constraints: problem?.constraints || "",
    time_limit: problem?.time_limit || 5,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title || !form.description) {
      toast.error("Title and description are required");
      return;
    }
    setSaving(true);
    try {
      const testCases = form.test_cases
        ? form.test_cases.split("---").map(tc => {
            const [input, output] = tc.split("|||");
            return { input: input?.trim() || "", output: output?.trim() || "" };
          }).filter(tc => tc.input || tc.output)
        : [];

      const data = {
        title: form.title,
        description: form.description,
        difficulty: form.difficulty,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        sample_input: form.sample_input,
        sample_output: form.sample_output,
        test_cases: testCases,
        hints: form.hints.split("\n").filter(Boolean),
        constraints: form.constraints,
        time_limit: parseInt(form.time_limit) || 5,
      };

      if (problem) {
        await api.put(`/problems/${problem.id}`, data);
        toast.success("Problem updated!");
      } else {
        await api.post("/problems", data);
        toast.success("Problem created!");
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save problem");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Title</Label>
          <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
            className="bg-[#09090b] border-[#27272a] h-9" placeholder="Problem title" data-testid="problem-title-input" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Difficulty</Label>
          <Select value={form.difficulty} onValueChange={v => setForm({...form, difficulty: v})}>
            <SelectTrigger className="bg-[#09090b] border-[#27272a] h-9" data-testid="problem-difficulty-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#121215] border-[#27272a]">
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Time Limit (sec)</Label>
          <Input type="number" value={form.time_limit} onChange={e => setForm({...form, time_limit: e.target.value})}
            className="bg-[#09090b] border-[#27272a] h-9" min={1} max={30} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Description (Markdown supported)</Label>
        <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
          className="bg-[#09090b] border-[#27272a] min-h-[120px] font-mono text-xs" placeholder="Problem description..." data-testid="problem-description-input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sample Input</Label>
          <Textarea value={form.sample_input} onChange={e => setForm({...form, sample_input: e.target.value})}
            className="bg-[#09090b] border-[#27272a] font-mono text-xs h-20" placeholder="1 2 3" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sample Output</Label>
          <Textarea value={form.sample_output} onChange={e => setForm({...form, sample_output: e.target.value})}
            className="bg-[#09090b] border-[#27272a] font-mono text-xs h-20" placeholder="6" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Test Cases (input|||output, separate by ---)</Label>
        <Textarea value={form.test_cases} onChange={e => setForm({...form, test_cases: e.target.value})}
          className="bg-[#09090b] border-[#27272a] font-mono text-xs h-24"
          placeholder={"1 2 3|||6\n---\n4 5 6|||15"} data-testid="problem-testcases-input" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Hints (one per line)</Label>
        <Textarea value={form.hints} onChange={e => setForm({...form, hints: e.target.value})}
          className="bg-[#09090b] border-[#27272a] text-xs h-16" placeholder={"Hint 1\nHint 2\nHint 3"} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tags (comma-separated)</Label>
          <Input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}
            className="bg-[#09090b] border-[#27272a] h-9" placeholder="array, hash-table" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Constraints</Label>
          <Input value={form.constraints} onChange={e => setForm({...form, constraints: e.target.value})}
            className="bg-[#09090b] border-[#27272a] h-9" placeholder="1 <= n <= 10^5" />
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        data-testid="save-problem-btn">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : `${problem ? "Update" : "Create"} Problem`}
      </Button>
    </div>
  );
}

// Contest form component
function ContestForm({ problems, onSave, onClose }) {
  const [form, setForm] = useState({ title: "", description: "", problem_ids: [], duration: 60 });
  const [creating, setCreating] = useState(false);
  const [createdContest, setCreatedContest] = useState(null);

  const toggleProblem = (id) => {
    setForm(f => ({
      ...f,
      problem_ids: f.problem_ids.includes(id)
        ? f.problem_ids.filter(p => p !== id)
        : [...f.problem_ids, id]
    }));
  };

  const handleCreate = async () => {
    if (!form.title || form.problem_ids.length === 0) {
      toast.error("Title and at least 1 problem required");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post("/contests", form);
      setCreatedContest(res.data);
      toast.success("Contest created!");
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create contest");
    } finally {
      setCreating(false);
    }
  };

  if (createdContest) {
    return (
      <div className="space-y-4">
        <div className="bg-green-400/10 border border-green-400/30 rounded-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="font-medium text-green-400">Contest Created!</span>
          </div>
          <p className="text-sm text-muted-foreground">Share this code with participants:</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="bg-[#09090b] border border-[#27272a] rounded-sm px-4 py-3 font-mono font-bold text-2xl tracking-widest text-primary">
              {createdContest.join_code}
            </div>
            <Button variant="ghost" size="sm"
              onClick={() => { navigator.clipboard.writeText(createdContest.join_code); toast.success("Copied!"); }}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Button onClick={onClose} variant="outline" className="w-full border-[#27272a]">
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Title</Label>
        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
          className="bg-[#09090b] border-[#27272a] h-9" placeholder="Weekly Contest #1" data-testid="contest-title-input" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
          className="bg-[#09090b] border-[#27272a] text-sm h-16" placeholder="Contest description..." />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Duration (minutes)</Label>
        <Input type="number" value={form.duration} onChange={e => setForm({...form, duration: parseInt(e.target.value) || 60})}
          className="bg-[#09090b] border-[#27272a] h-9" min={10} max={360} data-testid="contest-duration-input" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Select Problems ({form.problem_ids.length} selected)</Label>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {problems.map(p => (
            <div key={p.id}
              onClick={() => toggleProblem(p.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-sm border cursor-pointer transition-colors ${
                form.problem_ids.includes(p.id)
                  ? "border-primary/40 bg-primary/5"
                  : "border-[#27272a] hover:border-[#3f3f46]"
              }`}
              data-testid={`select-problem-${p.id}`}
            >
              <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                form.problem_ids.includes(p.id) ? "border-primary bg-primary" : "border-[#3f3f46]"
              }`}>
                {form.problem_ids.includes(p.id) && (
                  <CheckCircle2 className="w-2.5 h-2.5 text-primary-foreground" />
                )}
              </div>
              <span className="text-sm">{p.title}</span>
              <span className={`text-xs ml-auto capitalize ${
                p.difficulty === "easy" ? "text-green-400" : p.difficulty === "medium" ? "text-yellow-400" : "text-red-400"
              }`}>{p.difficulty}</span>
            </div>
          ))}
        </div>
      </div>
      <Button onClick={handleCreate} disabled={creating}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        data-testid="create-contest-btn">
        {creating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</> : "Create Contest"}
      </Button>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [contests, setContests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editProblem, setEditProblem] = useState(null);
  const [problemDialogOpen, setProblemDialogOpen] = useState(false);
  const [contestDialogOpen, setContestDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [probs, conts, s] = await Promise.all([
        api.get("/problems"),
        api.get("/contests"),
        api.get("/admin/stats"),
      ]);
      setProblems(probs.data);
      setContests(conts.data);
      setStats(s.data);
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProblem = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/problems/${id}`);
      toast.success("Problem deleted");
      setProblems(prev => prev.filter(p => p.id !== id));
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteContest = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/contests/${id}`);
      toast.success("Contest deleted");
      setContests(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code ${code} copied!`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-1">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage problems, contests, and platform settings</p>
        </div>
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-sm px-3 py-1">
          <span className="text-yellow-400 text-xs font-mono">ADMIN</span>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Users", value: stats.total_users, icon: Users },
            { label: "Problems", value: stats.total_problems, icon: Code2 },
            { label: "Contests", value: stats.total_contests, icon: Trophy },
            { label: "Submissions", value: stats.total_submissions, icon: BarChart3 },
            { label: "Accepted", value: stats.accepted_submissions, icon: CheckCircle2 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[#121215] border border-[#27272a] rounded-sm p-4 text-center">
              <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <div className="text-2xl font-bold font-heading text-primary">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="problems">
        <TabsList className="bg-[#121215] border border-[#27272a] mb-6">
          <TabsTrigger value="problems" className="gap-2 data-[state=active]:bg-[#27272a]" data-testid="tab-problems">
            <Code2 className="w-3.5 h-3.5" /> Problems ({problems.length})
          </TabsTrigger>
          <TabsTrigger value="contests" className="gap-2 data-[state=active]:bg-[#27272a]" data-testid="tab-contests">
            <Trophy className="w-3.5 h-3.5" /> Contests ({contests.length})
          </TabsTrigger>
        </TabsList>

        {/* Problems Tab */}
        <TabsContent value="problems">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-heading font-semibold">Problems</h2>
            <Dialog open={problemDialogOpen} onOpenChange={(v) => { setProblemDialogOpen(v); if (!v) setEditProblem(null); }}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  onClick={() => { setEditProblem(null); setProblemDialogOpen(true); }}
                  data-testid="add-problem-btn"
                >
                  <Plus className="w-4 h-4" /> Add Problem
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#121215] border-[#27272a] max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-heading">
                    {editProblem ? "Edit Problem" : "Create Problem"}
                  </DialogTitle>
                </DialogHeader>
                <ProblemForm
                  problem={editProblem}
                  onSave={fetchAll}
                  onClose={() => { setProblemDialogOpen(false); setEditProblem(null); }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" /></div>
          ) : (
            <div className="bg-[#121215] border border-[#27272a] rounded-sm overflow-hidden">
              {problems.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">No problems yet</div>
              ) : (
                problems.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e22] last:border-0 hover:bg-white/[0.02]" data-testid={`admin-problem-${i}`}>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{p.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs capitalize ${p.difficulty === "easy" ? "text-green-400" : p.difficulty === "medium" ? "text-yellow-400" : "text-red-400"}`}>
                          {p.difficulty}
                        </span>
                        <span className="text-xs text-muted-foreground">{p.solved_count} solved</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                        onClick={() => { setEditProblem(p); setProblemDialogOpen(true); }}
                        data-testid={`edit-problem-${p.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        disabled={deleting === p.id}
                        onClick={() => handleDeleteProblem(p.id)}
                        data-testid={`delete-problem-${p.id}`}>
                        {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* Contests Tab */}
        <TabsContent value="contests">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-heading font-semibold">Contests</h2>
            <Dialog open={contestDialogOpen} onOpenChange={setContestDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" data-testid="create-contest-open-btn">
                  <Plus className="w-4 h-4" /> Create Contest
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#121215] border-[#27272a] max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-heading">Create Contest</DialogTitle>
                </DialogHeader>
                <ContestForm
                  problems={problems}
                  onSave={fetchAll}
                  onClose={() => setContestDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" /></div>
          ) : (
            <div className="bg-[#121215] border border-[#27272a] rounded-sm overflow-hidden">
              {contests.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">No contests yet</div>
              ) : (
                contests.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e22] last:border-0 hover:bg-white/[0.02]" data-testid={`admin-contest-${i}`}>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{c.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{c.duration}min</span>
                        <span className="text-xs text-muted-foreground">{c.problem_count} problems</span>
                        <button
                          onClick={() => copyCode(c.join_code)}
                          className="flex items-center gap-1 text-xs font-mono text-primary hover:text-primary/80"
                          data-testid={`copy-code-${c.id}`}
                        >
                          <Hash className="w-3 h-3" />{c.join_code}
                          <Copy className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      disabled={deleting === c.id}
                      onClick={() => handleDeleteContest(c.id)}
                      data-testid={`delete-contest-${c.id}`}>
                      {deleting === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
