/**
 * allMovies: Array of { id, title, releaseYear, runtimeMinutes, watched, prerequisiteIds: number[] }
 */
function buildAdjacency(allMovies) {
  const movieMap = new Map();
  const dependentsMap = new Map(); // prereqId -> array of movieIds that depend on it

  for (const m of allMovies) {
    movieMap.set(m.id, m);
    if (!dependentsMap.has(m.id)) dependentsMap.set(m.id, []);
  }

  for (const m of allMovies) {
    for (const prereqId of m.prerequisiteIds) {
      if (!dependentsMap.has(prereqId)) dependentsMap.set(prereqId, []);
      dependentsMap.get(prereqId).push(m.id);
    }
  }

  return { movieMap, dependentsMap };
}

/**
 * Checks if setting `movieId`'s prerequisites to `candidatePrereqIds` creates a cycle.
 * Returns `true` if a direct self-dependency or indirect circular dependency is detected.
 */
function wouldCreateCycle(allMovies, movieId, candidatePrereqIds) {
  const prereqSet = new Set(candidatePrereqIds);

  // Direct self-dependency check (e.g., movie A depends on movie A)
  if (movieId !== null && prereqSet.has(movieId)) {
    return true;
  }

  // If creating a new movie that is not yet in `allMovies`, no existing movie can depend on it yet
  if (movieId === null) {
    return false;
  }

  // Simulate updated prerequisites for `movieId`
  const updatedMovies = allMovies.map((m) =>
    m.id === movieId ? { ...m, prerequisiteIds: [...prereqSet] } : m
  );

  const { dependentsMap } = buildAdjacency(updatedMovies);

  // Traverse forward through dependents to check if we can reach `movieId` again
  const visited = new Set();
  const stack = [...(dependentsMap.get(movieId) || [])];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (currentId === movieId) {
      return true;
    }
    if (!visited.has(currentId)) {
      visited.add(currentId);
      const nextDeps = dependentsMap.get(currentId) || [];
      for (const depId of nextDeps) {
        stack.push(depId);
      }
    }
  }

  return false;
}

/**
 * Returns all transitive prerequisites of `targetMovieId` in valid watch order
 * (prerequisites before movies that depend on them), excluding `targetMovieId`.
 */
function getRewatchOrder(allMovies, targetMovieId) {
  const { movieMap } = buildAdjacency(allMovies);
  const target = movieMap.get(targetMovieId);
  if (!target) return null;

  // Step 1: Collect all direct & indirect prerequisite IDs (excluding targetMovieId)
  const neededIds = new Set();
  const collectStack = [...target.prerequisiteIds];

  while (collectStack.length > 0) {
    const id = collectStack.pop();
    if (id === targetMovieId || neededIds.has(id)) continue;
    const movie = movieMap.get(id);
    if (!movie) continue;
    neededIds.add(id);
    for (const pId of movie.prerequisiteIds) {
      if (!neededIds.has(pId)) {
        collectStack.push(pId);
      }
    }
  }

  // Step 2: Topological sort over `neededIds` using DFS post-order
  const permVisited = new Set();
  const tempVisited = new Set();
  const orderedMovies = [];

  function dfs(id) {
    if (permVisited.has(id)) return;
    if (tempVisited.has(id)) {
      throw new Error("CIRCULAR_DEPENDENCY");
    }
    tempVisited.add(id);

    const movie = movieMap.get(id);
    if (movie) {
      for (const pId of movie.prerequisiteIds) {
        if (neededIds.has(pId)) {
          dfs(pId);
        }
      }
    }

    tempVisited.delete(id);
    permVisited.add(id);
    if (movie) {
      orderedMovies.push(movie);
    }
  }

  for (const id of neededIds) {
    dfs(id);
  }

  let watchedCount = 0;
  let unwatchedRuntimeMinutes = 0;

  for (const m of orderedMovies) {
    if (m.watched) {
      watchedCount += 1;
    } else {
      unwatchedRuntimeMinutes += m.runtimeMinutes;
    }
  }

  return {
    targetMovieId,
    movies: orderedMovies.map(({ id, title, releaseYear, runtimeMinutes, watched }) => ({
      id,
      title,
      releaseYear,
      runtimeMinutes,
      watched,
    })),
    watchedCount,
    totalPrerequisites: orderedMovies.length,
    unwatchedRuntimeMinutes,
  };
}

module.exports = {
  wouldCreateCycle,
  getRewatchOrder,
};