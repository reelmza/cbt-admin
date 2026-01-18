"use client";
import Button from "@/components/button";
import Input from "@/components/input";
import SideBox from "@/components/sections/side-box";
import Spacer from "@/components/spacer";
import { localAxios } from "@/lib/axios";
import { AxiosError } from "axios";
import { Key, Mail, MapPin, MoveRight, Phone, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();

  //   States
  const [loading, setLoading] = useState<string | null>(null);

  // Signup Logic
  const createSchool = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      name: { value: string };
      email: { value: string };
      phoneNumber: { value: string };
      address: { value: string };
      password: { value: string };
      confirmPassword: { value: string };
    };

    // Manage unmatching password
    if (target.password.value !== target.confirmPassword.value) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading("createSchool");
    try {
      const res = await localAxios.post("/school/signup", {
        name: target.name.value,
        email: target.email.value,
        phoneNumber: target.phoneNumber.value,
        password: target.password.value,
        address: target.address.value,
      });

      if (res.status == 201) {
        toast.success("School created successfully, please login.");
      }

      setLoading(null);
    } catch (error: any) {
      console.log(error);

      // Email already exist
      if (error.status === 409) {
        toast.error("School or Email already exists.");
      }

      // Validation error from server
      if (error.status === 422) {
        toast.error(error.response.data.message);
      }

      // Some other unspecified error
      if (!error.status) {
        toast.error("An error occured, please try again.");
      }

      setLoading(null);
    }
  };

  return (
    <div className="grid h-full w-full grid-cols-12 font-sans">
      {/* Side Box */}
      <SideBox />

      {/* Form Box */}
      <div className="col-span-6 flex flex-col justify-center items-center">
        <div className="w-7/10 rounded-lg">
          {/* Form Heading */}
          <div className="text-2xl font-bold mb-5 text-accent-dim">
            Create a school account.
          </div>

          <form
            onSubmit={createSchool}
            className="flex flex-wrap justify-between"
          >
            {/* School Name */}
            <div className="w-[100%]">
              <Input
                name="name"
                type="text"
                placeholder="Enter school name"
                icon={<UserRound size={16} />}
              />
              <Spacer size="sm" />
            </div>

            {/* School Email */}
            <div className="w-[100%]">
              <Input
                name="email"
                type="text"
                placeholder="E-mail address"
                icon={<Mail size={16} />}
              />
              <Spacer size="sm" />
            </div>

            {/* School Address */}
            <div className="w-[100%]">
              <Input
                name="address"
                type="text"
                placeholder="Brief school address"
                icon={<MapPin size={16} />}
              />
              <Spacer size="sm" />
            </div>

            {/* School Phone Number */}
            <div className="w-[100%]">
              <Input
                name="phoneNumber"
                type="text"
                placeholder="Phone number"
                icon={<Phone size={16} />}
              />
              <Spacer size="sm" />
            </div>

            {/* Password */}
            <div className="w-[49%]">
              <Input
                name="password"
                type="password"
                placeholder="Enter password"
                icon={<Key size={16} />}
              />
              <Spacer size="sm" />
            </div>

            {/* Confirm Password */}
            <div className="w-[49%]">
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Enter password again"
                icon={<Key size={16} />}
              />
              <Spacer size="md" />
            </div>

            {/* Submit Button */}
            <div className="w-[100%]">
              <Button
                title="Create school account"
                loading={loading === "createSchool"}
                icon={<MoveRight size={20} strokeWidth={2} />}
                variant="fill"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
