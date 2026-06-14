import { User } from "next-auth";
import { getAxios } from "./axios";

export const schooLogin: (
  credentials: Partial<Record<"email" | "password" | "loginClient", unknown>>,
  user: any,
) => Promise<User | null> = async (credentials, user) => {
  try {
    const api = await getAxios();
    // Get user from database
    const res = await api.post(`${process.env.SERVER_API_URL}/admin/login`, {
      email: credentials.email,
      password: credentials.password,
    });

    // Check if user exist
    if (res.status === 422 || res.status === 400) {
      return user;
    }

    // Parse user response body

    user = { ...res.data.data.user };
    console.log(res.data);

    if (!user) {
      return null;
    }

    return user;
  } catch (e) {
    console.log(e);
    throw new Error("Server error");
  }
};
