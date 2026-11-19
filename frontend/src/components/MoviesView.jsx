
import { useState } from "react";
import { api } from "../api";

export default function MoviesView({ movies, onRefresh }) {
  const [title, setTitle] = useState("");
  const [releaseYear, setReleaseYear] = useState("2026");
  const [runtimeMinutes, setRuntimeMinutes] = useState("150");
  const [selectedPrereqs, setSelectedPrereqs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [editingMovieId, setEditingMovieId] = useState(null);
  const [editPrereqIds, setEditPrereqIds] = useState([]);
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  function toggleArrayId(list, setter, id) {
    setter((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleCreateMovie(e) {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      await api.createMovie({
        title: title.trim(),
        releaseYear: Number(releaseYear),
        runtimeMinutes: Number(runtimeMinutes),
        prerequisiteIds: selectedPrereqs,
      });
      setTitle("");
      setSelectedPrereqs([]);
      await onRefresh();
    } catch (err) {
      setErrorMsg(err.code ? `${err.code}: ${err.message}` : err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleWatched(movie) {
    setErrorMsg("");
    try {
      await api.updateMovie(movie.id, { watched: !movie.watched });
      await onRefresh();
    } catch (err) {
      setErrorMsg(err.code ? `${err.code}: ${err.message}` : err.message);
    }
  }

  function startEditingPrereqs(movie) {
    setEditingMovieId(movie.id);
    setEditPrereqIds(movie.prerequisiteIds || []);
    setEditError("");
  }

  async function handleSavePrereqs(movieId) {
    setEditError("");
    setSavingEdit(true);
    try {
      await api.updateMovie(movieId, { prerequisiteIds: editPrereqIds });
      setEditingMovieId(null);
      await onRefresh();
    } catch (err) {
      setEditError(
        err.status === 409
          ? `409 CIRCULAR_DEPENDENCY: ${err.message}`
          : err.message
      );
    } finally {
      setSavingEdit(false);
    }
  }

  const inputClass =
    "w-full rounded-xl bg-[#090e19] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10";

  const labelClass =
    "block text-xs font-semibold tracking-wide text-slate-300 mb-2";

  return (
    <div className="space-y-7">

      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[10px] font-bold tracking-[2px] uppercase text-amber-400">
              Marvel Cinematic Universe
            </span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            MCU Movie Collection
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Manage movies, track your watching progress and build your ultimate rewatch timeline.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Total Movies
            </p>
            <p className="text-xl font-black text-amber-400">
              {movies.length}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] px-4 py-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Watched
            </p>
            <p className="text-xl font-black text-emerald-400">
              {movies.filter((m) => m.watched).length}
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          <span className="font-bold">Error:</span> {errorMsg}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Add Movie Form */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#182235] to-[#101624] p-5 sm:p-6 shadow-xl">

            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-xl">
                🎬
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  Add New Movie
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Expand your MCU collection
                </p>
              </div>
            </div>

            <div className="h-px bg-white/[0.07] mb-6" />

            <form onSubmit={handleCreateMovie} className="space-y-5">

              <div>
                <label className={labelClass}>Movie Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Avengers: Doomsday"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Release Year</label>
                  <input
                    type="number"
                    required
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Runtime (Min)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={300}
                    value={runtimeMinutes}
                    onChange={(e) => setRuntimeMinutes(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass}>
                    Watch These First
                  </label>
                  <span className="text-[10px] text-amber-400">
                    {selectedPrereqs.length} Selected
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl bg-[#090e19] border border-white/10 p-3 custom-scrollbar">
                  {movies.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">
                      No movies added yet.
                    </p>
                  ) : (
                    movies.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer py-2 px-2 rounded-lg hover:bg-white/[0.05] transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPrereqs.includes(m.id)}
                          onChange={() =>
                            toggleArrayId(selectedPrereqs, setSelectedPrereqs, m.id)
                          }
                          className="w-4 h-4 accent-amber-400 cursor-pointer"
                        />
                        <span>{m.title}</span>
                      </label>
                    ))
                  )}
                </div>

                <p className="text-[11px] text-slate-500 mt-2">
                  Select movies that should be watched before this movie.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 cursor-pointer"
              >
                {submitting ? "Saving Movie..." : "+ Add Movie to Collection"}
              </button>

            </form>
          </div>
        </div>

        {/* Movie Catalog */}
        <div className="lg:col-span-2 space-y-4">

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Movie Catalog
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your complete MCU movie library
              </p>
            </div>

            <span className="text-xs font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-3 py-2 rounded-lg">
              {movies.length} Movies
            </span>
          </div>

          {movies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#101624]/60 p-12 text-center">
              <div className="text-4xl mb-4">🎥</div>
              <h3 className="text-white font-bold text-base">
                No Movies Yet
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Start building your MCU collection by adding your first movie.
              </p>
            </div>
          ) : (
            movies.map((movie) => {
              const isEditing = editingMovieId === movie.id;

              return (
                <div
                  key={movie.id}
                  className="group rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#182235] to-[#111827] p-4 sm:p-5 hover:border-amber-400/30 transition-all duration-300 shadow-lg"
                >
                  {/* Movie Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                    <div className="flex gap-3 min-w-0">
                      <div className="w-11 h-11 shrink-0 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-xl">
                        🎬
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-base break-words">
                          {movie.title}
                        </h3>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.07] text-slate-300">
                            📅 {movie.releaseYear}
                          </span>

                          <span className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.07] text-slate-300">
                            ⏱ {movie.runtimeMinutes} min
                          </span>

                          <span className={`text-[10px] px-2.5 py-1 rounded-lg border ${
                            movie.watched
                              ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                              : "bg-amber-400/10 border-amber-400/20 text-amber-300"
                          }`}>
                            {movie.watched ? "✓ Watched" : "○ Not Watched"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer bg-black/20 border border-white/10 px-3 py-2 rounded-xl hover:border-emerald-400/30 transition">
                        <input
                          type="checkbox"
                          checked={movie.watched}
                          onChange={() => handleToggleWatched(movie)}
                          className="w-4 h-4 accent-emerald-400 cursor-pointer"
                        />
                        Watched
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          isEditing
                            ? setEditingMovieId(null)
                            : startEditingPrereqs(movie)
                        }
                        className="text-xs font-semibold px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-amber-400/10 hover:border-amber-400/30 text-slate-300 hover:text-amber-300 transition cursor-pointer"
                      >
                        {isEditing ? "✕ Cancel" : "✎ Edit"}
                      </button>
                    </div>
                  </div>

                  {/* Prerequisites */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06]">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">
                      Watch Prerequisites
                    </p>

                    {movie.prerequisites && movie.prerequisites.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {movie.prerequisites.map((p) => (
                          <span
                            key={p.id}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-400/[0.07] border border-blue-400/15 text-blue-300"
                          >
                            {p.title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        No prerequisites required.
                      </p>
                    )}
                  </div>

                  {/* Edit Prerequisites */}
                  {isEditing && (
                    <div className="mt-5 pt-4 border-t border-white/10 space-y-4">

                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Edit Prerequisites
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Select the movies required before this movie.
                        </p>
                      </div>

                      {editError && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                          ⚠ {editError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto bg-[#090e19] p-3 rounded-xl border border-white/10">
                        {movies.map((candidate) => (
                          <label
                            key={candidate.id}
                            className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer py-2 px-2 rounded-lg hover:bg-white/[0.05] transition"
                          >
                            <input
                              type="checkbox"
                              checked={editPrereqIds.includes(candidate.id)}
                              onChange={() =>
                                toggleArrayId(editPrereqIds, setEditPrereqIds, candidate.id)
                              }
                              className="w-4 h-4 accent-amber-400 cursor-pointer"
                            />
                            <span>{candidate.title}</span>
                          </label>
                        ))}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={savingEdit}
                          onClick={() => handleSavePrereqs(movie.id)}
                          className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs transition cursor-pointer"
                        >
                          {savingEdit ? "Validating..." : "✓ Save Prerequisites"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
