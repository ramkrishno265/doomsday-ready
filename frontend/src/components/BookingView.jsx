
import { useEffect, useState } from "react";
import { api } from "../api";

export default function BookingView() {
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState("");
  const [groupSize, setGroupSize] = useState("11");
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const [cinemaName, setCinemaName] = useState("");
  const [bundleInput, setBundleInput] = useState("2, 5");
  const [creatingCinema, setCreatingCinema] = useState(false);
  const [cinemaError, setCinemaError] = useState("");

  async function loadCinemas() {
    try {
      const list = await api.getCinemas();
      setCinemas(list);
      if (list.length > 0 && !selectedCinemaId) {
        setSelectedCinemaId(String(list[0].id));
      }
    } catch (err) {
      setCinemaError(err.message);
    }
  }

  useEffect(() => {
    loadCinemas();
  }, []);

  async function handleCreateCinema(e) {
    e.preventDefault();
    setCinemaError("");
    setCreatingCinema(true);

    try {
      const parsedSizes = bundleInput
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n));

      const created = await api.createCinema({
        name: cinemaName.trim(),
        bundleSizes: parsedSizes,
      });

      setCinemaName("");
      await loadCinemas();
      setSelectedCinemaId(String(created.id));
    } catch (err) {
      setCinemaError(err.message || "Failed to create cinema");
    } finally {
      setCreatingCinema(false);
    }
  }

  async function handleGetQuote(e) {
    e.preventDefault();
    if (!selectedCinemaId) return;

    setQuoteError("");
    setLoadingQuote(true);
    setQuote(null);

    try {
      const res = await api.getBookingQuote(selectedCinemaId, Number(groupSize));
      setQuote(res);
    } catch (err) {
      setQuoteError(err.message || "Failed to fetch booking quote");
    } finally {
      setLoadingQuote(false);
    }
  }

  const inputClass =
    "w-full rounded-xl bg-[#090e19] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all duration-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10";

  const labelClass =
    "block text-xs font-semibold tracking-wide text-slate-300 mb-2";

  return (
    <div className="space-y-7">

      {/* Section Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[10px] font-bold tracking-[2px] uppercase text-amber-400">
              Opening Night Experience
            </span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            Watch Party Booking
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Manage cinemas and calculate the perfect seat bundle for your group.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-400/20 bg-amber-400/5 w-fit">
          <span className="text-lg">🎟️</span>
          <span className="text-xs font-semibold text-amber-300">
            Reservation Center
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Add Cinema */}
        <div className="lg:col-span-1">
          <div className="h-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#182235] to-[#101624] p-5 sm:p-6 shadow-xl">

            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-xl">
                🏛️
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  Add Cinema
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Register a new cinema hall
                </p>
              </div>
            </div>

            <div className="h-px bg-white/[0.07] mb-6" />

            {cinemaError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {cinemaError}
              </div>
            )}

            <form onSubmit={handleCreateCinema} className="space-y-5">

              <div>
                <label className={labelClass}>
                  Cinema Name
                </label>

                <input
                  type="text"
                  required
                  placeholder="e.g. IMAX Opening Hall"
                  value={cinemaName}
                  onChange={(e) => setCinemaName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Bundle Sizes
                </label>

                <input
                  type="text"
                  required
                  placeholder="e.g. 2, 5"
                  value={bundleInput}
                  onChange={(e) => setBundleInput(e.target.value)}
                  className={inputClass}
                />

                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Enter comma-separated seat bundle sizes. Each size supports 1–500 seats.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                  Bundle Preview
                </p>

                <div className="flex flex-wrap gap-2">
                  {bundleInput.split(",").map((size, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-semibold"
                    >
                      {size.trim() || "—"} Seats
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingCinema}
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/20 cursor-pointer"
              >
                {creatingCinema ? "Creating Cinema..." : "+ Create Cinema"}
              </button>
            </form>
          </div>
        </div>

        {/* Booking Calculator */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#182235] to-[#101624] p-5 sm:p-6 shadow-xl">

            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center text-xl">
                🎫
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  Bundle Booking Calculator
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Find the minimum number of bundles for your group.
                </p>
              </div>
            </div>

            <div className="h-px bg-white/[0.07] mb-6" />

            <form
              onSubmit={handleGetQuote}
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            >

              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Select Cinema
                </label>

                <select
                  value={selectedCinemaId}
                  onChange={(e) => setSelectedCinemaId(e.target.value)}
                  className={inputClass}
                >
                  {cinemas.length === 0 ? (
                    <option value="">No cinemas available</option>
                  ) : (
                    cinemas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} [{c.bundleSizes.join(", ")}]
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Group Size
                </label>

                <input
                  type="number"
                  required
                  min={1}
                  max={10000}
                  value={groupSize}
                  onChange={(e) => setGroupSize(e.target.value)}
                  className={inputClass}
                />

                <p className="text-[11px] text-slate-500 mt-2">
                  Maximum 10,000 seats
                </p>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loadingQuote || !selectedCinemaId}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 cursor-pointer"
                >
                  {loadingQuote ? "Calculating..." : "⚡ Calculate Booking"}
                </button>
              </div>
            </form>

            {/* Error */}
            {quoteError && (
              <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                <span className="font-bold">Booking Error:</span> {quoteError}
              </div>
            )}

            {/* Quote Result */}
            {quote && (
              <div className="mt-7 pt-6 border-t border-white/[0.08]">

                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Booking Calculation Result
                  </h4>
                </div>

                {!quote.possible ? (
                  <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">⚠️</span>
                      <span className="text-rose-300 font-bold">
                        Exact Match Not Possible
                      </span>
                    </div>

                    <p className="text-sm text-rose-200/80 leading-relaxed">
                      Not possible to form an exact seat match of{" "}
                      <strong>{quote.groupSize}</strong> using bundle sizes [
                      {quote.bundleSizes.join(", ")}].
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/25 overflow-hidden">

                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center text-xl">
                            ✓
                          </div>

                          <div>
                            <p className="text-emerald-300 font-bold text-sm">
                              Exact Match Found
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Your group can be accommodated perfectly.
                            </p>
                          </div>
                        </div>

                        <div className="px-4 py-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20">
                          <p className="text-[10px] text-emerald-300/70 uppercase tracking-wider">
                            Total Bundles
                          </p>
                          <p className="text-xl font-black text-emerald-300">
                            {quote.totalBundles}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                        <div className="rounded-xl bg-black/20 border border-white/[0.06] p-4">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                            Group Size
                          </p>
                          <p className="text-2xl font-black text-white">
                            {quote.groupSize}
                            <span className="text-sm font-medium text-slate-400 ml-2">
                              Seats
                            </span>
                          </p>
                        </div>

                        <div className="rounded-xl bg-black/20 border border-white/[0.06] p-4">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                            Total Bundles
                          </p>
                          <p className="text-2xl font-black text-amber-300">
                            {quote.totalBundles}
                            <span className="text-sm font-medium text-slate-400 ml-2">
                              Bundles
                            </span>
                          </p>
                        </div>

                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-semibold text-slate-300 mb-3">
                          Bundle Breakdown
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {quote.bundles.map((b) => (
                            <div
                              key={b.size}
                              className="px-4 py-3 rounded-xl bg-[#101624] border border-emerald-500/20"
                            >
                              <p className="text-lg font-black text-white">
                                {b.count} × {b.size}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {b.count * b.size} seats
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-emerald-400/[0.06] border-t border-emerald-500/20">
                      <p className="text-xs text-emerald-300">
                        ✓ Exact seat allocation successfully calculated.
                      </p>
                    </div>

                  </div>
                )}
              </div>
            )}

            {!quote && !quoteError && (
              <div className="mt-7 py-8 rounded-2xl border border-dashed border-white/10 bg-black/10 text-center">
                <div className="text-3xl mb-3">🎬</div>
                <p className="text-sm font-semibold text-slate-300">
                  Ready to Calculate?
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Select a cinema and enter your group size to get a booking quote.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
