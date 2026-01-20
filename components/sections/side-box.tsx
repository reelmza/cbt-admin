import Spacer from "../spacer";
import Image from "next/image";

import boxImage from "@/public/images/school-logo-auth.png";
const SideBox = () => {
  return (
    <div className="col-span-6 bg-accent-light flex flex-col items-center justify-center">
      <Image src={boxImage} width={271} height={271} alt="School logo" />
      <Spacer size="lg" />

      <div className="w-8/10 text-accent-dim text-center">
        <div className="text-3xl font-extrabold leading-tight text-accent-dim">
          Ebonyi State <br />
          University, Abakaliki.
        </div>
        <Spacer size="sm" />
        <p className="text-lg">Examination Portal</p>
      </div>
    </div>
  );
};

export default SideBox;
