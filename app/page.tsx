import SideBox from "@/components/sections/side-box";
import LoginFormWrapper from "@/components/sections/login-form";

export default async function Page() {
  const schoolName = process.env.SCHOOL_NAME || null;
  console.log("School Name from env:", schoolName);

  return (
    <div className="grid h-full w-full grid-cols-12 font-sans">
      <SideBox schoolName={schoolName?.toLowerCase()} />
      <LoginFormWrapper />
    </div>
  );
}
