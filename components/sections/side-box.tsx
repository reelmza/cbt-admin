"use client";

import Spacer from "../spacer";
import Image, { StaticImageData } from "next/image";
import adsuLogo from "@/public/images/adsu-logo-auth.webp";
import ebsuLogo from "@/public/images/ebsu-logo-auth.webp";
import defaultLogo from "@/public/images/school-logo-auth.webp";
import { useEffect, useState } from "react";
import getEnv from "@/lib/getEnv";
interface SideBoxProps {
  schoolName?: string | null;
}

const SideBox = () => {
  const [envVars, setEnvVars] = useState<{ schoolName: string } | null>(null);

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

  useEffect(() => {
    const getVars = async () => {
      const vars = await getEnv();
      if (vars) setEnvVars(vars);
    };

    getVars();
  }, []);

  return (
    <div className="col-span-6 bg-neutral-50 flex flex-col items-center justify-center">
      {envVars && envVars?.schoolName ? (
        <Image
          src={schoolList[envVars?.schoolName.toLocaleLowerCase()]?.image}
          width={271}
          height={271}
          alt="School logo"
          priority
          unoptimized
        />
      ) : (
        <Image
          src={schoolList["defaultLogo"].image}
          width={271}
          height={271}
          alt="School logo"
          priority
          unoptimized
        />
      )}
      <Spacer size="lg" />

      <div className="w-8/10 flex flex-col items-center text-center">
        <div className="text-3xl font-extrabold leading-tight text-accent-dim w-2/3 font-serif">
          {envVars
            ? schoolList[envVars?.schoolName?.toLowerCase()]?.name
            : "Oayastech CBT Exams Portal"}
        </div>
        <Spacer size="sm" />
      </div>
    </div>
  );
};

export default SideBox;
