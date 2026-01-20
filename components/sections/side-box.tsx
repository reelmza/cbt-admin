import Spacer from "../spacer";
import Image from "next/image";

import boxImage from "@/public/images/school-logo-auth.png";
const SideBox = () => {
  return (
    <div className="col-span-6 bg-blue-50 flex flex-col items-center justify-center">
      <Image src={boxImage} width={271} height={271} alt="School logo" />
      <Spacer size="md" />

      <div className="w-8/10 text-accent-dim text-center">
        <div className="text-3xl font-bold leading-tight">
          Ebonyi State <br />
          University, Ababkaliki
        </div>
        <Spacer size="sm" />
        <p className="text-xs hidden leading-normal">
          Register confidently with a platform designed specifically for
          education institutions.
        </p>
      </div>
    </div>
  );
};

export default SideBox;
