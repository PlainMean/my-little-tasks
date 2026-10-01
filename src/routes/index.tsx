import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Todos — Inbox, Active, Done" },
      { name: "description", content: "A simple personal todo list. Sign in with your email." },
      { property: "og:title", content: "Todos — Inbox, Active, Done" },
      { property: "og:description", content: "A simple personal todo list. Sign in with your email." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Status = "inbox" | "active" | "done";
type Todo = { id: string; title: string; status: Status; created_at: string };
const STATUSES: { key: Status; label: string }[] = [
  { key: "inbox", label: "Inbox" },
  { key: "active", label: "Active" },
  { key: "done", label: "Done" },
];

function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return null;
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      {session ? <Todos email={session.user.email ?? ""} /> : <Login />}
    </main>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="mx-auto max-w-sm space-y-4 pt-20">
      <h1 className="text-3xl font-bold">Todos</h1>
      {sent ? (
        <p className="text-muted-foreground">Check {email} for a sign-in link.</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          />
          <button className="w-full rounded-md bg-primary px-3 py-2 text-primary-foreground">
            Send sign-in link
          </button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      )}
    </div>
  );
}

function Todos({ email }: { email: string }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");

  const load = async () => {
    const { data } = await supabase.from("todos").select("*").order("created_at");
    setTodos((data as Todo[]) ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await supabase.from("todos").insert({ title: title.trim() });
    setTitle("");
    load();
  };
  const move = async (id: string, status: Status) => {
    await supabase.from("todos").update({ status }).eq("id", id);
    load();
  };
  const remove = async (id: string) => {
    await supabase.from("todos").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Todos</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {email}
          <button onClick={() => supabase.auth.signOut()} className="underline">
            Sign out
          </button>
        </div>
      </header>
      <form onSubmit={add} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a todo to Inbox…"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2"
        />
        <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Add</button>
      </form>
      <div className="grid gap-4 md:grid-cols-3">
        {STATUSES.map((s) => (
          <section key={s.key} className="rounded-lg border bg-muted/40 p-3">
            <h2 className="mb-3 font-semibold">{s.label}</h2>
            <ul className="space-y-2">
              {todos
                .filter((t) => t.status === s.key)
                .map((t) => (
                  <li key={t.id} className="rounded-md border bg-card p-2 text-sm">
                    <p className={t.status === "done" ? "line-through text-muted-foreground" : ""}>
                      {t.title}
                    </p>
                    <div className="mt-2 flex gap-2 text-xs">
                      {STATUSES.filter((o) => o.key !== t.status).map((o) => (
                        <button key={o.key} onClick={() => move(t.id, o.key)} className="underline">
                          → {o.label}
                        </button>
                      ))}
                      <button onClick={() => remove(t.id)} className="ml-auto text-destructive">
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
