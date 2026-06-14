import axios, { AxiosInstance } from "axios";

// export let localAxios: AxiosInstance;
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
// export const getAxios = async (): Promise<void> => {
//   const origin = typeof window !== "undefined" ? window.location.origin : "";
//   if (origin) {
//     console.log(origin);
//     const res = await fetch(`${origin}/api/config`);
//     const data = await res.json();

//     localAxios = axios.create({
//       baseURL: data.baseUrl,
//       timeout: 120_000,
//     });

//     localAxios.interceptors.response.use(
//       (response) => response,
//       (error) => {
//         if (error?.response?.status === 401) {
//           window.dispatchEvent(new CustomEvent("session-expired"));
//         }
//         return Promise.reject(error);
//       },
//     );
//   } else {
//     console.log(
//       origin,
//       "No origin found, skipping axios configuration for this instance",
//     );
//   }
// };

// getAxios();

// Helper to attach headers dynamically
// export const attachHeaders = (token?: string, contentType?: string) => {
//   if (token && localAxios)
//     localAxios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
//   if (contentType && localAxios)
//     localAxios.defaults.headers.common["Content-Type"] = contentType;
// };

export const attachHeaders = (token?: string, contentType?: string) => {
  if (token && clientPromise)
    clientPromise.then((instance) => {
      instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    });
  if (contentType && clientPromise)
    clientPromise.then((instance) => {
      instance.defaults.headers.common["Content-Type"] = contentType;
    });
};
