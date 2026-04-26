// ResetPassword — finalizes the password-reset flow. The user lands here
// from the email link with `type=recovery` in the URL hash; Supabase has
// already exchanged it for a temporary session, so we just call updateUser.

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Hand, Lock, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    document.title = "Reset password — BreezeControl";
    // Supabase parses the recovery token from the URL hash and emits a
    // PASSWORD_RECOVERY event. We just confirm the session exists.
    supabase.auth.getSession().then(({ data }) => {
      setHasRecoverySession(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setHasRecoverySession(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    setDone(true);
    setTimeout(() => navigate("/demo", { replace: true }), 1500);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-primary grid place-items-center shadow-md">
            <Hand className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl">BreezeControl</span>
        </div>

        <div className="panel p-6 sm:p-8">
          <h1 className="font-display text-2xl mb-1">Set a new password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Choose a fresh password to finish signing back in.
          </p>

          {!hasRecoverySession && !done && (
            <div className="mb-5 p-3 border border-warning/40 bg-warning/10 text-sm text-foreground rounded-lg">
              We couldn't detect a recovery session. Open this page from the
              link in your password-reset email.
            </div>
          )}

          {done ? (
            <div className="flex flex-col items-center text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-[hsl(var(--success))] mb-3" />
              <p className="font-display text-lg">Password updated</p>
              <p className="text-sm text-muted-foreground">Redirecting you to the demo…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <PasswordField value={password} onChange={setPassword} placeholder="New password (min 8 chars)" autoComplete="new-password" />
              <PasswordField value={confirm} onChange={setConfirm} placeholder="Confirm new password" autoComplete="new-password" />
              <button
                type="submit"
                disabled={busy || !hasRecoverySession}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-colors"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (<>Update password<ArrowRight className="w-4 h-4" /></>)}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/auth" className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground">
            ← BACK TO SIGN IN
          </Link>
        </div>
      </div>
    </main>
  );
};

function PasswordField({
  value, onChange, placeholder, autoComplete,
}: { value: string; onChange: (v: string) => void; placeholder: string; autoComplete?: string }) {
  return (
    <label className="flex items-center gap-2 border border-border bg-background h-11 px-3 rounded-xl focus-within:border-primary transition-colors">
      <Lock className="w-4 h-4 text-muted-foreground" />
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        minLength={8}
        autoComplete={autoComplete}
        className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/60"
      />
    </label>
  );
}

export default ResetPassword;
