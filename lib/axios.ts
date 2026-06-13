import axios, { AxiosInstance } from "axios";
import { getApiUrl } from "./getApiURL";

export let localAxios: AxiosInstance;

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
//     console.log("Unable to get Origin URL");
//   }
// };

export const getAxios = async (): Promise<void> => {
  // const baseURL =
  //   typeof window === "undefined"
  //     ? (process.env.SERVER_BASEURL ?? "http://server:4000/api/v1")
  //     : `http://${window.location.hostname}:4000/api/v1`;
  console.log(getApiUrl());
  localAxios = axios.create({
    baseURL: getApiUrl(),
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
};

getAxios();

// Helper to attach headers dynamically
export const attachHeaders = (token?: string, contentType?: string) => {
  if (token && localAxios)
    localAxios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  if (contentType && localAxios)
    localAxios.defaults.headers.common["Content-Type"] = contentType;
};
