import axios, { AxiosInstance } from "axios";

let clientPromise: Promise<AxiosInstance> | null = null;

// Server-side: process.env is read at runtime in Node, so it's already per-environment
function createServerInstance(): AxiosInstance {
  return axios.create({
    baseURL: process.env.SERVER_API_URL,
    // docker: http://server:4000/api/v1, dev: http://localhost:4000/api/v1, cloud: the cloud API URL
    timeout: 120_000,
  });
}

// Client-side: fetch runtime config once, cache the promise (fixes the race)
function createClientInstance(): Promise<AxiosInstance> {
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    const res = await fetch(`${window.location.origin}/api/config`);
    const { clientApiUrl } = await res.json();

    const instance = axios.create({ baseURL: clientApiUrl, timeout: 120_000 });

    // Inject the NextAuth token at dispatch time so every request carries the
    // current token, with no per-call header wiring. Dynamically imported to keep
    // next-auth/react out of the server bundle (getAxios is also used server-side).
    // broadcast: false is critical — the default getSession() broadcasts a session
    // event that makes SessionProvider refetch and update state, re-running every
    // [session] effect and looping requests endlessly.
    instance.interceptors.request.use(async (config) => {
      const { getSession } = await import("next-auth/react");
      const session = await getSession({ broadcast: false });
      const token = session?.user?.token;
      if (token) config.headers.set("Authorization", `Bearer ${token}`);
      return config;
    });

    instance.interceptors.response.use(
      (r) => r,
      (error) => {
        if (error?.response?.status === 401) {
          window.dispatchEvent(new CustomEvent("session-expired"));
        }
        return Promise.reject(error);
      },
    );
    return instance;
  })();

  return clientPromise;
}

export function getAxios(): Promise<AxiosInstance> {
  return typeof window === "undefined"
    ? Promise.resolve(createServerInstance())
    : createClientInstance();
}
