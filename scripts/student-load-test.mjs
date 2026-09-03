const userCount = Number(process.env.USER_COUNT ?? 200);
const loginUrl =
  process.env.LOGIN_URL ??
  "http://127.0.0.1:4000/api/v1/student/complete-login";
const startUrl =
  process.env.START_URL ??
  "http://127.0.0.1:4000/api/v1/assessment/start-test/6a888c2ea152a099484ae1bf";
const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS ?? 40_000);

const percentile = (values, value) => {
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * value) - 1);
  return Math.round(sorted[index] * 100) / 100;
};

const request = async (url, options) => {
  const started = performance.now();

  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {}

    return { ok: response.ok, status: response.status, data, ms: performance.now() - started };
  } catch (error) {
    return {
      ok: false,
      status: "transport_error",
      error: error.cause?.message ?? error.message,
      ms: performance.now() - started,
    };
  }
};

const summarize = (results) => ({
  count: results.length,
  statusCodes: Object.entries(
    results.reduce((counts, result) => {
      counts[result.status] = (counts[result.status] ?? 0) + 1;
      return counts;
    }, {}),
  )
    .sort(([left], [right]) => String(left).localeCompare(String(right)))
    .map(([status, count]) => `${status}:${count}`)
    .join(", "),
  p50Ms: percentile(results.map((result) => result.ms), 0.5),
  p95Ms: percentile(results.map((result) => result.ms), 0.95),
  p99Ms: percentile(results.map((result) => result.ms), 0.99),
  maxMs: results.length ? Math.round(Math.max(...results.map((result) => result.ms)) * 100) / 100 : null,
});

const users = Array.from({ length: userCount }, (_, index) => `USER${index + 1}`);
const testStarted = performance.now();
const logins = await Promise.all(
  users.map((username) =>
    request(loginUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: username,
        regNumber: username,
        passCode: username,
        authMethod: "password",
      }),
    }),
  ),
);

const authenticated = logins
  .map((result, index) => ({
    result,
    username: users[index],
    token: result.data?.token ?? result.data?.data?.token ?? result.data?.data?.user?.token,
  }))
  .filter(({ result, token }) => result.ok && token);

const starts = await Promise.all(
  authenticated.map(({ token }) =>
    request(startUrl, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    }),
  ),
);

console.log(
  JSON.stringify({
    requestedUsers: userCount,
    authenticated: authenticated.length,
    totalWallTimeMs: Math.round((performance.now() - testStarted) * 100) / 100,
    login: summarize(logins),
    startTest: summarize(starts),
    loginErrors: logins
      .filter((result) => !result.ok)
      .slice(0, 5)
      .map((result) => ({ status: result.status, error: result.data?.message ?? result.error ?? null })),
    startErrors: starts
      .filter((result) => !result.ok)
      .slice(0, 5)
      .map((result) => ({ status: result.status, error: result.data?.message ?? result.error ?? null })),
  }),
);
