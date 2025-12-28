import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { schooLogin } from "./lib/school-login";

declare module "next-auth" {
  interface Session {
    // User to be stored on session
    user: {
      id: string;
      token: string;
      firstName: string;
      lastName: string;
      picture: string;
      account_type: string;
    } & DefaultSession["user"];
  }

  // User returned from database
  interface User {
    userId: string;
    token: string;
    name: string;
    profilePhoto: string;
    userType: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // Define credentials
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
        loginClient: { type: "text" },
      },
      authorize: async (credentials) => {
        let user = null;

        // If user attempting login is a school
        if (credentials.loginClient === "school") {
          return schooLogin(credentials, user);
        }

        return user;
      },
    }),
  ],

  callbacks: {
    jwt({ token, trigger, user, session }) {
      if (user) {
        // User is available during sign-in
        // Extract data from database user returned from login endpoint
        token.id = user.userId;
        token.token = user.token;
        token.name = user.name;
        token.email = user.email;
        token.profilePhoto = user.profilePhoto;
        token.userType = user.userType;
      }

      if (trigger === "update") {
        // Note, that `session` can be any arbitrary object, remember to validate it!
        // Property that never needs to be updated are not listed such as userId

        if (session?.token) token.token = session.token;
        if (session?.name) token.name = session.name;
        if (session?.profilePhoto) token.profilePhoto = session.profilePhoto;
      }
      return token;
    },

    session({ session, token }) {
      // Extract data from token to final session
      session.user.id = token.id as string;
      session.user.token = token.token as string;
      session.user.name = token.name as string;
      session.user.profilePhoto = token.profilePhoto as string;
      session.user.userType = token.userType as string;

      return session;
    },

    // Required to enable conditional auth in middleware.ts
    authorized: async ({ auth }) => {
      return !!auth;
    },
  },

  pages: {
    error: "/",
    signIn: "/",
  },
});
