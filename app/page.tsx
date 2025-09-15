import Button from "@/components/button";
import Input from "@/components/input";
import Spacer from "@/components/spacer";
import Image from "next/image";

export default function Home() {
  return (
    <div className="grid h-full grid-cols-12 font-sans">
      {/* Side Box */}
      <div className="col-span-6 bg-blue-50 flex flex-col items-center justify-center">
        <Image
          src={"/images/students_collage.png"}
          width={384}
          height={384}
          alt="Sauki CBT"
          className="aspect-square flex"
        />

        <div className="w-5/10 text-accent-dim">
          <div className="text-3xl font-bold leading-tight">
            Built for Schools, <br />
            Trusted by Educators.
          </div>
          <Spacer size="sm" />
          <p className="text-xs leading-normal">
            Register confidently with a platform designed specifically for
            education institutions.
          </p>
        </div>
      </div>

      {/* Form Box */}
      <div className="col-span-6 flex flex-col justify-center items-center">
        <div className="w-5/10 bg-reds-50 rounded-lg">
          {/* School Name */}
          <div className="text-sm font-sans font-semibold bg-accent-light text-accent-dim w-fit  rounded-full px-3 mb-5 py-1 leading-none">
            Adamawa State University, Mubi.
          </div>

          {/* Form Heading */}
          <div className="text-2xl font-semibold mb-5 text-accent-dim">
            Login to your account.
          </div>

          <form>
            <Input placeholder="Enter your username" />
            <Spacer size="sm" />
            <Input placeholder="Enter your password" />

            <Spacer size="lg" />
            <Button title="Proceed" />
          </form>
        </div>
      </div>
    </div>
  );
}
