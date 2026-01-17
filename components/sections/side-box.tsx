import Spacer from "../spacer";
import Image from "next/image";

import boxImage from "@/public/images/students_collage.png";
const SideBox = () => {
  return (
    <div className="col-span-6 bg-blue-50 flex flex-col items-center justify-center">
      <Image
        src={boxImage}
        width={384}
        height={384}
        alt="Sauki CBT"
        className="aspect-square flex"
      />

      <div className="w-5/10 text-accent-dim text-center">
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
  );
};

export default SideBox;
