import axios from "axios";

// Axios Instance
export const localAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASEURL,
  timeout: 60_000,
  // withCredentials: true,
});

export const attachHeaders = (token: string | null, contentType?: string) => {
  // Set default headers
  //   localAxios.defaults.headers.common["x-app-version"] = "0.0.1";
  //   localAxios.defaults.headers.common["x-device-id"] =
  //     "6f0fce80-13ee-42d7-96bf-59a42ee6e39e";
  //   localAxios.defaults.headers.common["x-platform"] = "ios";
  //   localAxios.defaults.headers.common["x-app-id"] = "com.sbareads";

  // Set token if available
  if (token)
    localAxios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

  // Set content type if available
  if (contentType) {
    localAxios.defaults.headers.common["Content-Type"] = contentType;
  }
};
