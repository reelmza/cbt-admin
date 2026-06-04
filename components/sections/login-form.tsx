"use client";
import Button from "@/components/button";
import Input from "@/components/input";
import Spacer from "@/components/spacer";
import { ArrowRight, Key, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

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
      toast.success("Login successfull.", { position: "bottom-left" });
      router.push("/dashboard");
      setLoading(null);
    }

    if (res!.error === "CredentialsSignin") {
      toast.error("Incorrect details provided.", { position: "bottom-left" });
      setLoading(null);
    }

    if (res!.error === "Configuration") {
      toast.error("An error occured, try again.", { position: "bottom-left" });
      setLoading(null);
    }
  };

  return (
    <div className="col-span-6 flex flex-col justify-center items-center">
      <div className="w-7/10 rounded-lg">
        {/* Form Heading */}
        <div className="text-2xl font-extrabold mb-5 text-accent-dim font-serif text-center">
          Login to your Account
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
              title="Continue"
              loading={loading === "login"}
              icon={<ArrowRight size={20} strokeWidth={2} />}
              variant="fill"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
