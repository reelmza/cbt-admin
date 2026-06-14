import Spacer from "../spacer";
import Image from "next/image";
import { getSchool } from "@/utils/schools";

const SideBox = ({ schoolName }: { schoolName?: string | null }) => {
  const school = getSchool(schoolName);

  return (
    <div className="col-span-6 bg-neutral-50 flex flex-col items-center justify-center">
      <Image
        src={school.image}
        width={271}
        height={271}
        alt="School logo"
        priority
        unoptimized
      />
      <Spacer size="lg" />

      <div className="w-8/10 flex flex-col items-center text-center">
        <div className="text-3xl font-extrabold leading-tight text-accent-dim w-2/3 font-serif">
          {school.name}
        </div>
        <Spacer size="sm" />
      </div>
    </div>
  );
};

export default SideBox;
