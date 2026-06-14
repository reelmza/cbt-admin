import SideBox from "@/components/sections/side-box";
import SignupForm from "@/components/sections/signup-form";

export default async function Page() {
  const schoolName = process.env.SCHOOL_NAME || null;

  return (
    <div className="grid h-full w-full grid-cols-12 font-sans">
      <SideBox schoolName={schoolName} />
      <SignupForm />
    </div>
  );
}
