"use client";
import Button from "@/components/button";
import Input from "@/components/input";
import SideBox from "@/components/sections/side-box";
import Spacer from "@/components/spacer";
import { Key, Lock, MoveRight, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  // User authentication logic
  const doLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    router.push("/dashboard");
    return;
  };

  return (
    <div className="grid h-full w-full grid-cols-12 font-sans">
      {/* Side Box */}
      <SideBox />

      {/* Form Box */}
      <div className="col-span-6 flex flex-col justify-center items-center">
        <div className="w-5/10 rounded-lg">
          {/* School Name */}
          <div className="text-sm font-sans font-semibold bg-accent-light text-accent-dim w-fit  rounded-full px-3 mb-5 py-1 leading-none">
            Adamawa State University, Mubi.
          </div>

          {/* Form Heading */}
          <div className="text-2xl font-bold mb-5 text-accent-dim">
            Login to your Exam.
          </div>

          <form onSubmit={doLogin}>
            <Input
              placeholder="Enter your username"
              icon={<UserRound size={16} />}
            />
            <Spacer size="sm" />
            <Input
              name="password"
              type="password"
              placeholder="Enter your password"
              icon={<Key size={16} />}
            />
            <Spacer size="md" />

            <div className="flex items-center text-sm text-accent-dim">
              Forgot password?
              <Link
                href="/reset-password"
                className="ml-1 inline-block text-accent"
              >
                Reset Here.
              </Link>
            </div>
            <Spacer size="md" />
            <Button
              title="Proceed to Exam"
              icon={<MoveRight size={20} strokeWidth={2} />}
              variant="fill"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
