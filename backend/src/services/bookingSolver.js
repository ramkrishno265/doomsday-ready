/**
 * Solves the minimum-bundle watch-party booking problem using Dynamic Programming.
 *
 * @param {number[]} bundleSizes - Array of positive integers (e.g., [2, 5])
 * @param {number} groupSize - Target seat count (1 to 10,000)
 * @returns {{
 *   possible: boolean,
 *   groupSize: number,
 *   totalBundles: number | null,
 *   bundles: Array<{ size: number, count: number }>
 * }}
 */
function solveBookingBundles(bundleSizes, groupSize) {
  if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 10000) {
    throw new Error("INVALID_GROUP_SIZE");
  }

  if (!Array.isArray(bundleSizes) || bundleSizes.length === 0) {
    return {
      possible: false,
      groupSize,
      totalBundles: null,
      bundles: [],
    };
  }

  // Deduplicate and filter valid positive sizes
  const validSizes = [...new Set(bundleSizes)].filter(
    (s) => Number.isInteger(s) && s > 0
  );

  const INF = Infinity;
  // dp[x] = minimum number of bundles needed to get exact `x` seats
  const dp = new Array(groupSize + 1).fill(INF);
  // lastUsed[x] = which bundle size was added last to reach `x`
  const lastUsed = new Array(groupSize + 1).fill(-1);

  dp[0] = 0;

  for (let amount = 1; amount <= groupSize; amount++) {
    for (const size of validSizes) {
      if (size <= amount && dp[amount - size] + 1 < dp[amount]) {
        dp[amount] = dp[amount - size] + 1;
        lastUsed[amount] = size;
      }
    }
  }

  if (dp[groupSize] === INF) {
    return {
      possible: false,
      groupSize,
      totalBundles: null,
      bundles: [],
    };
  }

  // Backtrack from `groupSize` down to `0` to count how many of each bundle size were used
  const countsMap = new Map();
  for (const size of validSizes) {
    countsMap.set(size, 0);
  }

  let current = groupSize;
  while (current > 0) {
    const usedSize = lastUsed[current];
    if (usedSize === -1) break;
    countsMap.set(usedSize, (countsMap.get(usedSize) || 0) + 1);
    current -= usedSize;
  }

  // Return used bundles sorted descending by size for clean display (e.g., 20, 9, 6)
  const bundles = [...countsMap.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[0] - a[0])
    .map(([size, count]) => ({ size, count }));

  return {
    possible: true,
    groupSize,
    totalBundles: dp[groupSize],
    bundles,
  };
}

module.exports = {
  solveBookingBundles,
};