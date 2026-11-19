const BASE_URL = process.env.API_URL || "http://localhost:5000/api";

async function req(path, method = "GET", body = null) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function run() {
  console.log("--- 1. Creating Sample Movies ---");
  const sampleMovies = [
    { title: "Iron Man", releaseYear: 2008, runtimeMinutes: 126, prereqTitles: [] },
    { title: "Captain America: The First Avenger", releaseYear: 2011, runtimeMinutes: 124, prereqTitles: [] },
    { title: "The Avengers", releaseYear: 2012, runtimeMinutes: 143, prereqTitles: ["Iron Man", "Captain America: The First Avenger"] },
    { title: "Captain America: Civil War", releaseYear: 2016, runtimeMinutes: 147, prereqTitles: ["The Avengers"] },
    { title: "Thor: Ragnarok", releaseYear: 2017, runtimeMinutes: 130, prereqTitles: [] },
    { title: "Avengers: Infinity War", releaseYear: 2018, runtimeMinutes: 149, prereqTitles: ["Captain America: Civil War", "Thor: Ragnarok"] },
    { title: "Avengers: Endgame", releaseYear: 2019, runtimeMinutes: 181, prereqTitles: ["Avengers: Infinity War"] },
    { title: "Avengers: Doomsday", releaseYear: 2026, runtimeMinutes: 175, prereqTitles: ["Avengers: Endgame"] },
  ];

  const createdByTitle = new Map();

  for (const m of sampleMovies) {
    const existingList = await req("/movies");
    const found = Array.isArray(existingList.data)
      ? existingList.data.find((x) => x.title === m.title)
      : null;

    if (found) {
      createdByTitle.set(m.title, found);
      console.log(`Already exists: ${m.title} (id=${found.id})`);
    } else {
      const res = await req("/movies", "POST", {
        title: m.title,
        releaseYear: m.releaseYear,
        runtimeMinutes: m.runtimeMinutes,
      });
      if (res.status !== 201) {
        console.error(`Failed creating ${m.title}:`, res.status, res.data);
        return;
      }
      createdByTitle.set(m.title, res.data);
      console.log(`Created: ${m.title} (id=${res.data.id})`);
    }
  }

  console.log("\n--- 2. Setting Prerequisites ---");
  for (const m of sampleMovies) {
    const movieObj = createdByTitle.get(m.title);
    const prereqIds = m.prereqTitles.map((t) => createdByTitle.get(t).id);
    const patchRes = await req(`/movies/${movieObj.id}`, "PATCH", {
      prerequisiteIds: prereqIds,
    });
    console.log(
      `${m.title} -> prereqs: [${m.prereqTitles.join(", ")}] (status=${patchRes.status})`
    );
  }

  console.log("\n--- 3. Testing Rewatch Order ---");
  for (const targetTitle of ["Avengers: Doomsday", "Captain America: Civil War", "Thor: Ragnarok"]) {
    const target = createdByTitle.get(targetTitle);
    const res = await req(`/movies/${target.id}/rewatch-order`);
    console.log(`\nRewatch order for ${targetTitle} (status=${res.status}):`);
    console.log(
      "Order:",
      res.data.movies.map((x) => x.title).join(" -> ") || "(empty)"
    );
    console.log(
      `Watched: ${res.data.watchedCount}/${res.data.totalPrerequisites}, Unwatched runtime: ${res.data.unwatchedRuntimeMinutes} min`
    );
  }

  console.log("\n--- 4. Testing Circular Dependency (Endgame prereq of Iron Man) ---");
  const ironMan = createdByTitle.get("Iron Man");
  const endgame = createdByTitle.get("Avengers: Endgame");
  const cycleRes = await req(`/movies/${ironMan.id}`, "PATCH", {
    prerequisiteIds: [endgame.id],
  });
  console.log("Expected 409 CIRCULAR_DEPENDENCY -> Got:", cycleRes.status, cycleRes.data);

  console.log("\n--- 5. Testing Cinema & Booking Cases ---");
  const bookingCases = [
    { name: "Test Cinema A", bundleSizes: [1, 3, 4], groupSize: 6 },
    { name: "Test Cinema B", bundleSizes: [2, 5], groupSize: 11 },
    { name: "Test Cinema C", bundleSizes: [6, 9, 20], groupSize: 44 },
    { name: "Test Cinema D", bundleSizes: [4, 6], groupSize: 7 },
  ];

  const cinemasList = await req("/cinemas");

  for (const c of bookingCases) {
    let cinema = Array.isArray(cinemasList.data)
      ? cinemasList.data.find((x) => x.name === c.name)
      : null;

    if (!cinema) {
      const createC = await req("/cinemas", "POST", {
        name: c.name,
        bundleSizes: c.bundleSizes,
      });
      cinema = createC.data;
    }

    const bookingRes = await req(`/cinemas/${cinema.id}/booking?groupSize=${c.groupSize}`);
    console.log(
      `Bundles [${c.bundleSizes.join(", ")}] | Group ${c.groupSize} ->`,
      bookingRes.data.possible
        ? `${bookingRes.data.totalBundles} bundles: ${bookingRes.data.bundles
            .map((b) => `${b.size} × ${b.count}`)
            .join(", ")}`
        : "Not possible"
    );
  }
}

run().catch((err) => console.error(err));