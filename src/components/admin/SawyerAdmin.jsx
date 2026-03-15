import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const ANIMAL_GROUPS = [
  "Mammals",
  "Birds",
  "Reptiles",
  "Amphibians",
  "Fish",
  "Insects",
  "Arachnids",
  "Marine Life",
];

const CATEGORIES = [
  "Basics",
  "Queen & Colony",
  "Food",
  "Types of Ants",
  "Fun Facts",
  "My Experiments",
];

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function SawyerAdmin() {
  // auth
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // data
  const [facts, setFacts] = useState([]);
  const [factsLoading, setFactsLoading] = useState(false);

  // login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // add form
  const [title, setTitle] = useState("");
  const [fact, setFact] = useState("");
  const [animalGroup, setAnimalGroup] = useState("Insects");
  const [category, setCategory] = useState("Fun Facts");

  // UI
  const [activeTab, setActiveTab] = useState("add"); // "add" | "manage"
  const [expanded, setExpanded] = useState({}); // { [id]: true }

  const publishedCount = useMemo(
    () => facts.filter((f) => f.published).length,
    [facts]
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadFacts() {
    setFactsLoading(true);
    setError("");
    setSuccess("");

    const { data, error } = await supabase
      .from("facts")
      .select("id,title,fact,animal_group,category,published,created_at")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setFacts(data ?? []);

    setFactsLoading(false);
  }

  useEffect(() => {
    if (user) loadFacts();
    if (!user) setFacts([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setError(error.message);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function addFact(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !fact.trim()) {
      setError("Please add a title and a fact.");
      return;
    }

    const { error } = await supabase.from("facts").insert([
      {
        title: title.trim(),
        fact: fact.trim(),
        animal_group: animalGroup,
        category,
        published: false,
      },
    ]);

    if (error) {
      setError(error.message);
      return;
    }

    setTitle("");
    setFact("");
    setAnimalGroup("Insects");
    setCategory("Fun Facts");
    setSuccess("Saved as a draft!");

    await loadFacts();

    // After save, switch to Manage so she can publish if she wants
    setActiveTab("manage");
  }

  async function togglePublish(row) {
    setError("");
    setSuccess("");

    const next = !row.published;

    const { error } = await supabase
      .from("facts")
      .update({ published: next })
      .eq("id", row.id);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(next ? "Published!" : "Moved back to Draft.");
    await loadFacts();
  }

  async function deleteFact(row) {
    const ok = confirm(`Delete "${row.title}"?`);
    if (!ok) return;

    setError("");
    setSuccess("");

    const { error } = await supabase.from("facts").delete().eq("id", row.id);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Deleted.");
    await loadFacts();
  }

  function toggleExpanded(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (authLoading) return <p className="p-6 text-sm text-slate-600">Loading…</p>;

  // LOGGED OUT
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-md px-4 py-10">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-2xl">
                    🦁
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900">
                      Sawyer’s Wild Kingdom
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">Admin login</p>
                  </div>
                </div>

                <a
                  href="/"
                  className="shrink-0 text-sm font-extrabold text-emerald-800 hover:underline"
                >
                  ← Home
                </a>
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleLogin} className="mt-5 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Email
                  </span>
                  <input
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[16px] outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Password
                  </span>
                  <input
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[16px] outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-700 px-5 font-extrabold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                >
                  Log in
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-slate-500">
                Private page for Sawyer (and Dad) 🙂
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-xl">
              🦁
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-black tracking-tight text-slate-900">
                Sawyer Admin
              </div>
              <div className="text-xs text-slate-600">
                Published <span className="font-bold">{publishedCount}</span> •
                Total <span className="font-bold">{facts.length}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-extrabold text-emerald-800 shadow-sm hover:bg-slate-50"
            >
              Home
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("add")}
              className={cn(
                "h-11 rounded-2xl text-sm font-extrabold shadow-sm transition",
                activeTab === "add"
                  ? "bg-emerald-700 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              Add Fact
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manage")}
              className={cn(
                "h-11 rounded-2xl text-sm font-extrabold shadow-sm transition",
                activeTab === "manage"
                  ? "bg-emerald-700 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              Manage Facts
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-5">
        {/* Alerts */}
        <div className="grid gap-3">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              {success}
            </div>
          ) : null}
        </div>

        {/* ADD TAB */}
        {activeTab === "add" ? (
          <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              Add a new fact
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              This saves as a draft first. You can publish it after.
            </p>

            <form onSubmit={addFact} className="mt-4 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Title
                </span>
                <input
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[16px] outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Wolves communicate by…"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Fact
                </span>
                <textarea
                  className="min-h-[170px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[16px] leading-6 outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  value={fact}
                  onChange={(e) => setFact(e.target.value)}
                  placeholder="Write the fact in Sawyer’s words…"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Animal Group
                  </span>
                  <select
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[16px] outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    value={animalGroup}
                    onChange={(e) => setAnimalGroup(e.target.value)}
                  >
                    {ANIMAL_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Category
                  </span>
                  <select
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[16px] outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-700 px-6 font-extrabold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200"
              >
                Save Draft
              </button>

              <button
                type="button"
                onClick={loadFacts}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                {factsLoading ? "Refreshing…" : "Refresh facts list"}
              </button>
            </form>
          </section>
        ) : null}

        {/* MANAGE TAB */}
        {activeTab === "manage" ? (
          <section className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  Manage facts
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Publish, unpublish, or delete.
                </p>
              </div>

              <button
                type="button"
                onClick={loadFacts}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                {factsLoading ? "…" : "Refresh"}
              </button>
            </div>

            {facts.length === 0 ? (
              <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
                No facts yet. Go to “Add Fact” to create one.
              </div>
            ) : (
              <div className="mt-4 grid gap-4">
                {facts.map((f) => {
                  const isOpen = !!expanded[f.id];

                  return (
                    <article
                      key={f.id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(0,0,0,0.06)]"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold tracking-tight text-slate-900">
                          {f.title}
                        </h3>

                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold",
                            f.published
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                          )}
                        >
                          {f.published ? "Published" : "Draft"}
                        </span>
                      </div>

                      <div className="mt-1 text-xs font-semibold text-slate-500">
                        {(f.animal_group || "—")} • {f.category}
                      </div>

                      <p className={cn("mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700", !isOpen && "line-clamp-3")}>
                        {f.fact}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(f.id)}
                          className="text-sm font-extrabold text-emerald-800 hover:underline"
                        >
                          {isOpen ? "Show less" : "Read more"}
                        </button>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button
                          onClick={() => togglePublish(f)}
                          className={cn(
                            "inline-flex h-12 items-center justify-center rounded-2xl px-4 text-sm font-extrabold shadow-sm transition focus:outline-none focus:ring-4",
                            f.published
                              ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus:ring-slate-200"
                              : "bg-emerald-700 text-white hover:bg-emerald-800 focus:ring-emerald-200"
                          )}
                        >
                          {f.published ? "Unpublish" : "Publish"}
                        </button>

                        <button
                          onClick={() => deleteFact(f)}
                          className="inline-flex h-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-extrabold text-rose-700 shadow-sm transition hover:bg-rose-100 focus:outline-none focus:ring-4 focus:ring-rose-200"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}