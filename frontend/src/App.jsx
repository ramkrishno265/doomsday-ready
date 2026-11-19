
import { useEffect, useState } from "react";
import { api } from "./api";
import MoviesView from "./components/MoviesView";
import RewatchPlanView from "./components/RewatchPlanView";
import BookingView from "./components/BookingView";

export default function App() {
  const [activeTab, setActiveTab] = useState("movies");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refreshMovies() {
    try {
      const data = await api.getMovies();
      setMovies(data);
    } catch (err) {
      console.error("Failed to fetch movies:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMovies();
  }, []);

  const tabs = [
    { id: "movies", label: "Movies", number: "01", icon: "🎬" },
    { id: "rewatch", label: "Rewatch Plan", number: "02", icon: "📅" },
    { id: "booking", label: "Booking", number: "03", icon: "🎟️" },
  ];

  return (
    <div className="min-h-screen bg-[#080b14] text-slate-100 selection:bg-amber-400 selection:text-black">

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.07] bg-[#0c101b]/90 backdrop-blur-2xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="min-h-[88px] flex flex-col sm:flex-row sm:items-center justify-between gap-5 py-4">

            {/* Brand */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-2xl">⚡</span>
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  DOOMSDAY
                  <span className="text-amber-400"> READY</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-400 tracking-[2px] uppercase mt-1">
                  MCU Rewatch & Watch Party Experience
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 border ${
                    activeTab === tab.id
                      ? "bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/20"
                      : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <span className="text-xs opacity-70">{tab.number}</span>
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Page Intro */}
        <div className="mb-9">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-[3px] uppercase text-amber-400">
              Your Mission Starts Here
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {activeTab === "movies"
              ? "Explore the MCU Universe"
              : activeTab === "rewatch"
              ? "Your Rewatch Mission"
              : "Secure Your Watch Party"}
          </h2>

          <p className="text-sm text-slate-400 mt-3 max-w-2xl leading-relaxed">
            {activeTab === "movies"
              ? "Discover movies, explore the Marvel timeline and prepare for Avengers: Doomsday."
              : activeTab === "rewatch"
              ? "Build your ultimate Marvel rewatch journey before Doomsday arrives."
              : "Get ready for opening night. Reserve your place and experience the ultimate MCU event."}
          </p>
        </div>

        {/* Content Container */}
        <section className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#101624]/80 backdrop-blur-xl shadow-2xl shadow-black/20 p-4 sm:p-7 lg:p-8 min-h-[400px]">

          {loading ? (
            <div className="min-h-[350px] flex flex-col items-center justify-center gap-5">
              <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-amber-400 animate-spin" />
              <p className="text-sm font-medium text-slate-400 tracking-wide">
                Loading Doomsday Ready...
              </p>
            </div>
          ) : activeTab === "movies" ? (
            <MoviesView movies={movies} onRefresh={refreshMovies} />
          ) : activeTab === "rewatch" ? (
            <RewatchPlanView movies={movies} onRefresh={refreshMovies} />
          ) : (
            <BookingView />
          )}

        </section>

        {/* Footer */}
        <footer className="mt-10 pt-6 border-t border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            © 2026 Doomsday Ready. All rights reserved.
          </p>
          <p className="text-xs text-slate-500 tracking-wider uppercase">
            <span className="text-amber-400">⚡</span> Prepare for the Endgame
          </p>
        </footer>

      </main>
    </div>
  );
}
