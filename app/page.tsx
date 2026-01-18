"use client";
import Button from "@/components/button";
import Input from "@/components/input";
import SideBox from "@/components/sections/side-box";
import Spacer from "@/components/spacer";
import { localAxios } from "@/lib/axios";
import { AxiosError } from "axios";
import { Key, Mail, MapPin, MoveRight, Phone, UserRound } from "lucide-react";
import { SessionProvider, signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function Page() {
  const router = useRouter();
  const { data: session } = useSession();

  // States
  const [loading, setLoading] = useState<string | null>(null);

  // Login Logic
  const login = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      email: { value: string };
      password: { value: string };
    };

    setLoading("login");
    const res = await signIn("credentials", {
      email: target.email.value,
      password: target.password.value,
      loginClient: "school",
      redirect: false,
    });

    if (!res!.error) {
      toast.success("Login successfull.", {
        position: "bottom-left",
      });
      router.push("/dashboard");
      setLoading(null);
    }

    if (res!.error === "CredentialsSignin") {
      toast.error("Incorrect details provided.", {
        position: "bottom-left",
      });
      setLoading(null);
    }

    if (res!.error === "Configuration") {
      toast.error("An error occured, try again.", {
        position: "bottom-left",
      });
      setLoading(null);
    }
  };

  return (
    <div className="grid h-full w-full grid-cols-12 font-sans">
      {/* Side Box */}
      <SideBox />

      {/* Form Box */}
      <div className="col-span-6 flex flex-col justify-center items-center">
        <div className="w-7/10 rounded-lg">
          {/* Form Heading */}
          <div className="text-2xl font-bold mb-5 text-accent-dim">
            Login to your dashboard
          </div>

          <form onSubmit={login} className="flex flex-wrap justify-between">
            {/* School Email */}
            <div className="w-[100%]">
              <Input
                name="email"
                type="text"
                placeholder="E-mail address"
                icon={<Mail size={16} />}
              />
              <Spacer size="sm" />
            </div>

            {/* Password */}
            <div className="w-[100%]">
              <Input
                name="password"
                type="password"
                placeholder="Enter password"
                icon={<Key size={16} />}
              />
              <Spacer size="sm" />
            </div>

            {/* Submit Button */}
            <div className="w-[100%]">
              <Button
                title="Sign In"
                loading={loading === "login"}
                icon={<MoveRight size={20} strokeWidth={2} />}
                variant="fill"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const PageWrapper = () => {
  return (
    <SessionProvider>
      <Page />
    </SessionProvider>
  );
};

export default PageWrapper;
