import SideBox from "@/components/sections/side-box";
import LoginFormWrapper from "@/components/sections/login-form";

export default function Page() {
  const schoolName = process.env.SCHOOL_NAME ?? null;

  return (
    <div className="grid h-full w-full grid-cols-12 font-sans">
      <SideBox schoolName={schoolName?.toLowerCase()} />
      <LoginFormWrapper />
    </div>
  );
}
