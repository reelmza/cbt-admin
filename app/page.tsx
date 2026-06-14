import SideBox from "@/components/sections/side-box";
import LoginFormWrapper from "@/components/sections/login-form";
import { fetchSchoolName } from "@/lib/getSchoolName";

export default async function Page() {
  const schoolName = await fetchSchoolName();

  return (
    <div className="grid h-full w-full grid-cols-12 font-sans">
      <SideBox schoolName={schoolName} />
      <LoginFormWrapper />
    </div>
  );
}
