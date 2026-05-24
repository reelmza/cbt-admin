import Spacer from "../spacer";
import Image, { StaticImageData } from "next/image";
import adsuLogo from "@/public/images/adsu-logo-auth.webp";
import ebsuLogo from "@/public/images/ebsu-logo-auth.webp";
import defaultLogo from "@/public/images/school-logo-auth.webp";
interface SideBoxProps {
  schoolName?: string | null;
}

const SideBox = ({ schoolName }: SideBoxProps) => {
  const schoolList: {
    [key: string]: { image: StaticImageData; name: string };
  } = {
    adsu: {
      name: "Adamawa State University, Mubi",
      image: adsuLogo,
    },
    ebsu: {
      name: "Ebonyi State University, Abakaliki",
      image: ebsuLogo,
    },
    defaultLogo: {
      name: "Oayastech CBT Exams Portal",
      image: defaultLogo,
    },
  };

  return (
    <div className="col-span-6 bg-accent-light flex flex-col items-center justify-center">
      <Image
        src={schoolList[schoolName ?? "defaultLogo"].image} // Default to defaultLogo if schoolName is
        width={271}
        height={271}
        alt="School logo"
        priority
      />
      <Spacer size="lg" />

      <div className="w-8/10 flex flex-col items-center text-accent-dim text-center">
        <div className="text-3xl font-extrabold leading-tight text-accent-dim w-2/3">
          {schoolList[schoolName ?? "defaultLogo"].name}
        </div>
        <Spacer size="sm" />
        <p className="text-lg">Examination Portal</p>
      </div>
    </div>
  );
};

export default SideBox;
