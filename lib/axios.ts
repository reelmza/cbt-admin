import axios, { AxiosInstance } from "axios";

export let localAxios: AxiosInstance;

export const getAxios = async (): Promise<void> => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (origin) {
    console.log(origin);
    const res = await fetch(`${origin}/api/config`);
    const data = await res.json();

    localAxios = axios.create({
      baseURL: data.baseUrl,
      timeout: 120_000,
    });

    localAxios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.status === 401) {
          window.dispatchEvent(new CustomEvent("session-expired"));
        }
        return Promise.reject(error);
      },
    );
  } else {
    console.log(
      origin,
      "No origin found, skipping axios configuration for this instance",
    );
  }
};

getAxios();

// Helper to attach headers dynamically
export const attachHeaders = (token?: string, contentType?: string) => {
  if (token && localAxios)
    localAxios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  if (contentType && localAxios)
    localAxios.defaults.headers.common["Content-Type"] = contentType;
};
