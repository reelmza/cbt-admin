import { StaticImageData } from "next/image";
import adsuLogo from "@/public/images/adsu-logo-auth.webp";
import ebsuLogo from "@/public/images/ebsu-logo-auth.webp";
import defaultLogo from "@/public/images/school-logo-auth.webp";
import uhrLogo from "@/public/images/uhr-logo.webp";

export type School = {
  image: StaticImageData;
  shortName: string;
  fullName: string;
  name: string;
};

export const schools: Record<string, School> = {
  adsu: {
    image: adsuLogo,
    shortName: "ADSU Portal",
    fullName: "Adamawa State University, Mubi, Adamawa State.",
    name: "Adamawa State University, Mubi",
  },
  ebsu: {
    image: ebsuLogo,
    shortName: "EBSU Portal",
    fullName: "Ebonyi State University, Abakaliki.",
    name: "Ebonyi State University, Abakaliki",
  },
  uhr: {
    image: uhrLogo,
    shortName: "UHR Portal",
    fullName: "UHR Consult Kado, Abuja.",
    name: "UHR Consult Kado, Abuja",
  },
};

export const defaultSchool: School = {
  image: defaultLogo,
  shortName: "CBT APP",
  fullName: "Oayastech CBT Exams Portal",
  name: "Oayastech CBT Exams Portal",
};

export const getSchool = (schoolName?: string | null): School =>
  (schoolName && schools[schoolName.toLowerCase()]) || defaultSchool;
