import SideBox from "@/components/sections/side-box";
import SignupForm from "@/components/sections/signup-form";
import { fetchSchoolName } from "@/lib/getSchoolName";

export default async function Page() {
  const schoolName = await fetchSchoolName();

  return (
    <div className="grid h-full w-full grid-cols-12 font-sans">
      <SideBox schoolName={schoolName} />
      <SignupForm />
    </div>
  );
}
