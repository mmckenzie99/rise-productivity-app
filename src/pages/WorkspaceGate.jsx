import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setSession } from '@/lib/workspaceSession';
import { Loader2, KeyRound } from 'lucide-react';
import Logo from '@/components/speaking/Logo';

// First-run screen. A visitor either creates a new private workspace (picking
// a name + a simple shared password) or joins an existing one with its id +
// password. No accounts, no email. On success the session is stored and the
// app reloads into the workspace.
export default function WorkspaceGate() {
  const [mode, setMode] = useState('create');
  const [name, setName] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = mode === 'create'
        ? { action: 'create', name: name.trim(), password }
        : { action: 'join', workspace_id: workspaceId.trim(), password };
      const res = await base44.functions.invoke('workspaceAuth', payload);
      const result = res.data;
      setSession({ workspace_id: result.workspace_id, password, name: result.name });
      window.location.href = '/';
    } catch (err) {
      setError(err?.response?.data?.error || err?.data?.error || err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo />
          <h1 className="font-display text-2xl font-semibold">RISE</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'create' ? 'Create a private workspace to begin.' : 'Join an existing workspace.'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1 text-sm">
            <button type="button" onClick={() => setMode('create')} className={`rounded px-3 py-1.5 font-medium transition ${mode === 'create' ? 'bg-card text-foreground shadow' : 'text-muted-foreground'}`}>Create</button>
            <button type="button" onClick={() => setMode('join')} className={`rounded px-3 py-1.5 font-medium transition ${mode === 'join' ? 'bg-card text-foreground shadow' : 'text-muted-foreground'}`}>Join</button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="ws-name">Workspace name</Label>
                <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My Life" required className="h-12" />
              </div>
            )}
            {mode === 'join' && (
              <div className="space-y-2">
                <Label htmlFor="ws-id">Workspace ID</Label>
                <Input id="ws-id" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} placeholder="Paste the workspace ID" required className="h-12" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="ws-pass">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="ws-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 4 characters" required className="pl-10 h-12" minLength={4} />
              </div>
            </div>
            {error && <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">{error}</div>}
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === 'create' ? 'Create workspace' : 'Join workspace')}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center">
            {mode === 'create' ? 'Share the workspace ID and password with your partner so they can join.' : 'Ask the workspace creator for the ID and password.'}
          </p>
        </div>
      </div>
    </main>
  );
}