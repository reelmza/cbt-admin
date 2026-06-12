"use client";

import Spacer from "../spacer";
import Image from "next/image";
import { useEffect, useState } from "react";
import getEnv from "@/lib/getEnv";
import { getSchool } from "@/utils/schools";

const SideBox = () => {
  const [envVars, setEnvVars] = useState<{ schoolName: string } | null>(null);

  useEffect(() => {
    const getVars = async () => {
      const vars = await getEnv();
      if (vars) setEnvVars(vars);
    };

    getVars();
  }, []);

  const school = getSchool(envVars?.schoolName);

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
