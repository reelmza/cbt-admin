import { User } from "next-auth";

export const schooLogin: (
  credentials: Partial<Record<"email" | "password" | "loginClient", unknown>>,
  user: any
) => Promise<User | null> = async (credentials, user) => {
  try {
    // Get user from database
    const targetUser = await fetch(
      "https://cbt-server-q5fr.onrender.com/api/v1/school/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      }
    );

    // Check if user exist
    if (targetUser.status === 401 || targetUser.status === 400) {
      return user;
    }

    // Parse user response body
    const targetUserBody = await targetUser.json();
    console.log(targetUserBody);

    // Get user details from DB
    // const userProfile = await fetch(
    //   `https://sbareads.surprises.ng/api/user/profile`,
    //   {
    //     method: "GET",
    //     headers: {
    //       Authorization: `Bearer ${targetUserBody.data.token}`,
    //       "Content-Type": "application/json",
    //       "x-app-version": "0.0.1",
    //       "x-device-id": "9fb1a2b7-5ddf-429d-99a9-88ff47b419dd",
    //       "x-platform": "ios",
    //       "x-app-id": "com.sbareads",
    //     },
    //   }
    // );

    // Parse user details
    // const userProfileBody = await userProfile.json();
    // console.log(userProfileBody);

    // Save merged user and session to user object
    // user = { ...targetUserBody.data, ...userProfileBody.data };
    user = targetUserBody.data;
    if (!user) {
      return null;
    }

    return user;
  } catch (e) {
    console.log(e);
    throw new Error("Server error");
  }
};
