
import { useEffect, useState } from "react";
import { api } from "../api";

export default function RewatchPlanView({ movies, onRefresh }) {
  const [targetId, setTargetId] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (movies.length > 0 && !targetId) {
      const doomsday = movies.find((m) =>
        m.title.toLowerCase().includes("doomsday")
      );
      setTargetId(String(doomsday ? doomsday.id : movies[movies.length - 1].id));
    }
  }, [movies, targetId]);

  useEffect(() => {
    if (!targetId) {
      setPlan(null);
      return;
    }

    let cancelled = false;

    async function loadPlan() {
      setLoading(true);
      setErrorMsg("");

      try {
        const data = await api.getRewatchOrder(targetId);
        if (!cancelled) setPlan(data);
      } catch (err) {
        if (!cancelled) setErrorMsg(err.message || "Failed to load rewatch plan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlan();

    return () => {
      cancelled = true;
    };
  }, [targetId, movies]);

  async function handleToggleItemWatched(item) {
    try {
      await api.updateMovie(item.id, { watched: !item.watched });
      await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  const total = plan?.totalPrerequisites ?? 0;
  const watchedCount = plan?.watchedCount ?? 0;
  const progressPct = total > 0 ? Math.round((watchedCount / total) * 100) : 100;
  const remainingMins = plan?.unwatchedRuntimeMinutes ?? 0;
  const hours = Math.floor(remainingMins / 60);
  const mins = remainingMins % 60;

  const remainingMovies = plan?.movies?.filter((m) => !m.watched).length ?? 0;

  const inputClass =
    "w-full rounded-xl bg-[#090e19] border border-white/10 px-4 py-3 text-sm text-white outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10";

  return (
    <div className="space-y-7">

      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[2px] uppercase text-amber-400">
              Mission Preparation
            </span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            Your MCU Rewatch Journey
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Follow the recommended movie timeline and prepare for your target movie.
          </p>
        </div>

        <div className="px-4 py-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] w-fit">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            Mission Status
          </p>
          <p className="text-sm font-bold text-amber-300 mt-1">
            {loading ? "Calculating..." : progressPct === 100 && plan ? "Completed ✓" : "In Progress"}
          </p>
        </div>
      </div>

      {/* Target Movie Selector */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#182235] to-[#101624] p-5 sm:p-6 shadow-xl">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-2xl">
              🎯
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                Select Your Target Movie
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Choose the movie you are preparing to watch.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-72">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Target Movie
            </label>

            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className={inputClass}
            >
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.releaseYear})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-px bg-white/[0.07] my-6" />

        {/* Error */}
        {errorMsg && (
          <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            <span className="font-bold">Error:</span> {errorMsg}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="py-7 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-full border-4 border-slate-700 border-t-amber-400 animate-spin" />
            <p className="text-xs text-slate-400">
              Calculating your MCU timeline...
            </p>
          </div>
        ) : plan ? (
          <div className="space-y-5">

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              <div className="rounded-xl bg-black/20 border border-white/[0.06] p-4">
                <div className="text-xs text-slate-500 mb-2">
                  Movies Watched
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  {watchedCount}
                  <span className="text-sm font-medium text-slate-500 ml-1">
                    / {total}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-black/20 border border-white/[0.06] p-4">
                <div className="text-xs text-slate-500 mb-2">
                  Remaining Movies
                </div>
                <div className="text-2xl font-black text-amber-400">
                  {remainingMovies}
                </div>
              </div>

              <div className="rounded-xl bg-black/20 border border-white/[0.06] p-4">
                <div className="text-xs text-slate-500 mb-2">
                  Remaining Watch Time
                </div>
                <div className="text-2xl font-black text-white">
                  {hours}h {mins}m
                </div>
              </div>

            </div>

            {/* Progress */}
            <div className="rounded-xl bg-black/20 border border-white/[0.06] p-5">

              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Rewatch Progress
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Track your journey to the final movie.
                  </p>
                </div>

                <span className="text-2xl font-black text-emerald-400">
                  {progressPct}%
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="flex justify-between mt-3 text-[10px] text-slate-500">
                <span>Mission Started</span>
                <span>{progressPct}% Completed</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Rewatch Timeline */}
      <div className="space-y-4">

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">
              Movie Watch Timeline
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Follow these movies in the recommended order.
            </p>
          </div>

          {plan && (
            <span className="text-xs font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-3 py-2 rounded-lg">
              {total} Movies
            </span>
          )}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#101624] p-10 text-center">
            <div className="w-9 h-9 mx-auto rounded-full border-4 border-slate-700 border-t-amber-400 animate-spin mb-4" />
            <p className="text-sm text-slate-400">
              Preparing your watch timeline...
            </p>
          </div>
        ) : !plan ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#101624]/60 p-12 text-center">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-white font-bold">
              No Rewatch Plan Available
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Add movies first to generate your MCU rewatch plan.
            </p>
          </div>
        ) : plan.movies.length === 0 ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-10 text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-bold text-emerald-300">
              You're Ready for the Mission!
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              No prerequisite movies needed before this movie!
            </p>
          </div>
        ) : (
          <div className="space-y-3">

            {plan.movies.map((item, index) => (
              <div
                key={item.id}
                className={`relative rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${
                  item.watched
                    ? "bg-emerald-500/[0.04] border-emerald-500/20"
                    : "bg-gradient-to-r from-[#182235] to-[#111827] border-white/[0.08] hover:border-amber-400/30"
                }`}
              >
                <div className="flex items-center justify-between gap-3">

                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">

                    {/* Number */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-black border ${
                      item.watched
                        ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                        : "bg-amber-400/10 border-amber-400/20 text-amber-300"
                    }`}>
                      {item.watched ? "✓" : String(index + 1).padStart(2, "0")}
                    </div>

                    {/* Movie Details */}
                    <div className="min-w-0">
                      <h4
                        className={`font-bold text-sm sm:text-base break-words ${
                          item.watched
                            ? "line-through text-slate-400"
                            : "text-white"
                        }`}
                      >
                        {item.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-slate-400">
                          📅 {item.releaseYear}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[11px] text-slate-400">
                          ⏱ {item.runtimeMinutes} min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Watched Toggle */}
                  <label className={`flex items-center gap-2 text-xs font-semibold cursor-pointer px-3 py-2 rounded-xl border shrink-0 transition ${
                    item.watched
                      ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                      : "bg-black/20 border-white/10 text-slate-300 hover:border-amber-400/30"
                  }`}>
                    <input
                      type="checkbox"
                      checked={item.watched}
                      onChange={() => handleToggleItemWatched(item)}
                      className="w-4 h-4 accent-emerald-400 cursor-pointer"
                    />
                    <span className="hidden sm:inline">
                      {item.watched ? "Watched" : "Mark Watched"}
                    </span>
                    <span className="sm:hidden">
                      {item.watched ? "Done" : "Watch"}
                    </span>
                  </label>

                </div>

                {item.watched && (
                  <div className="mt-3 pt-3 border-t border-emerald-400/10">
                    <p className="text-[10px] text-emerald-400 font-medium">
                      ✓ Completed
                    </p>
                  </div>
                )}
              </div>
            ))}

          </div>
        )}
      </div>

    </div>
  );
}
