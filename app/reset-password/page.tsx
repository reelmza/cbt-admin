import Button from "@/components/button";
import Input from "@/components/input";
import SideBox from "@/components/sections/side-box";
import Spacer from "@/components/spacer";
import { Key, Lock, Mail, MoveRight, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid h-full w-full grid-cols-12 font-sans">
      {/* Side Box */}
      <SideBox />

      {/* Form Box */}
      <div className="col-span-6 flex flex-col justify-center items-center">
        <div className="w-5/10 bg-reds-50 rounded-lg">
          {/* School Name */}
          <div className="text-sm font-sans font-semibold bg-accent-light text-accent-dim w-fit  rounded-full px-3 mb-5 py-1 leading-none">
            Adamawa State University, Mubi.
          </div>

          {/* Form Heading */}
          <div className="text-2xl font-bold mb-5 text-accent-dim">
            Reset your Password.
          </div>

          <form>
            <Input
              name="email"
              type="text"
              placeholder="Enter your email"
              icon={<Mail size={16} />}
            />
            <Spacer size="sm" />

            <div className="flex items-center text-sm text-accent-dim">
              Have account? Back to
              <Link href="/" className="ml-1 inline-block text-accent">
                Log in.
              </Link>
            </div>
            <Spacer size="md" />
            <Button
              type="submit"
              loading={false}
              title="Request Password Reset"
              icon={<MoveRight size={20} strokeWidth={2} />}
              variant="fill"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
