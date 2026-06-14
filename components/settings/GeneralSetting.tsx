"use client";

import Button from "@/components/button";
import Input from "@/components/input";
import Preload from "@/components/preload";
import Spacer from "@/components/spacer";
import { attachHeaders, getAxios } from "@/lib/axios";
import { toastConfig } from "@/utils/toastConfig";
import { ImagePlus, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type SchoolConfig = {
  name: string;
  abv: string;
  email: string;
  academicYear: string;
  academicSession: string;
  logo: string;
};

const GeneralSetting = () => {
  const { data: session } = useSession();

  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<SchoolConfig | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();

    const getData = async () => {
      try {
        const api = await getAxios();
        attachHeaders(session!.user.token);
        const res = await api.get("/config/school", {
          signal: controller.signal,
        });

        if (res.status === 200) {
          setPageData(res.data.data);
          if (res.data.data.logo) setLogoPreview(res.data.data.logo);
        }
        setLoading(null);
      } catch (error: any) {
        if (!controller.signal.aborted) {
          setLoading("pageError");
          console.log(error);
        }
      }
    };

    !pageData && getData();

    return () => {
      controller.abort();
    };
  }, [session]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const clearLogo = () => {
    if (logoFile && logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const saveInstitution = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      schoolName: { value: string };
      schoolShort: { value: string };
      contactEmail: { value: string };
    };

    const formData = new FormData();
    formData.append("name", target.schoolName.value);
    formData.append("abv", target.schoolShort.value);
    formData.append("email", target.contactEmail.value);
    if (logoFile) formData.append("logo", logoFile);

    setLoading("institution");
    attachHeaders(session!.user.token);
    try {
      const api = await getAxios();
      const res = await api.patch("/config/school", formData);
      if (res.status === 200) {
        toast.success("Institution details saved.", toastConfig);
      }
    } catch {
      toast.error("Failed to save institution details.", toastConfig);
    } finally {
      setLoading(null);
    }
  };

  const saveSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      session: { value: string };
      term: { value: string };
    };

    const formData = new FormData();
    formData.append("academicSession", target.session.value);
    formData.append("academicYear", target.term.value);

    setLoading("session");
    attachHeaders(session!.user.token);
    try {
      const api = await getAxios();
      const res = await api.patch("/config/school", formData);
      if (res.status === 200) {
        toast.success("Academic session saved.", toastConfig);
      }
    } catch {
      toast.error("Failed to save academic session.", toastConfig);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="h-full">
      {pageData && (
        <div className="max-w-xl">
          <div className="font-semibold text-lg">General</div>
          <div className="text-sm text-theme-gray mb-6">
            Basic information about your institution.
          </div>

          <form onSubmit={saveInstitution}>
            <div className="border rounded-lg p-6 mb-4">
              <div className="text-sm font-medium mb-4">
                Institution Details
              </div>

              {/* Logo upload */}
              <div className="text-xs text-theme-gray mb-1">School Logo</div>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-accent transition-colors"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-gray-300" />
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png, image/jpeg"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="text-xs text-accent underline underline-offset-2 text-left hover:opacity-70 transition-opacity"
                  >
                    {logoPreview ? "Change logo" : "Upload logo"}
                  </button>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={clearLogo}
                      className="flex items-center gap-1 text-xs text-red-500 hover:opacity-70 transition-opacity text-left"
                    >
                      <X className="h-3 w-3" />
                      Remove
                    </button>
                  )}
                  <span className="text-xs text-theme-gray">
                    PNG, JPG or SVG. Recommended 256×256px.
                  </span>
                </div>
              </div>

              <div className="text-xs text-theme-gray mb-1">
                Institution Name
              </div>
              <Input
                name="schoolName"
                type="text"
                placeholder="e.g. Ebonyi State University"
                defaultValue={pageData.name}
              />
              <Spacer size="sm" />

              <div className="text-xs text-theme-gray mb-1">
                Short Name / Abbreviation
              </div>
              <Input
                name="schoolShort"
                type="text"
                placeholder="e.g. EBSU"
                defaultValue={pageData.abv}
              />
              <Spacer size="sm" />

              <div className="text-xs text-theme-gray mb-1">Contact Email</div>
              <Input
                name="contactEmail"
                type="email"
                placeholder="admin@institution.edu"
                defaultValue={pageData.email}
              />
              <Spacer size="md" />

              <div className="w-40">
                <Button
                  title="Save Changes"
                  loading={loading === "institution"}
                  variant="fill"
                />
              </div>
            </div>
          </form>

          <form onSubmit={saveSession}>
            <div className="border rounded-lg p-6">
              <div className="text-sm font-medium mb-4">Academic Session</div>

              <div className="text-xs text-theme-gray mb-1">
                Current Session
              </div>
              <Input
                name="session"
                type="text"
                placeholder="e.g. 2024/2025"
                defaultValue={pageData.academicSession}
              />
              <Spacer size="sm" />

              <div className="text-xs text-theme-gray mb-1">
                Current Semester / Term
              </div>
              <Input
                name="term"
                type="text"
                placeholder="e.g. First Semester"
                defaultValue={pageData.academicYear}
              />
              <Spacer size="md" />

              <div className="w-40">
                <Button
                  title="Save Changes"
                  loading={loading === "session"}
                  variant="fill"
                />
              </div>
            </div>
          </form>
        </div>
      )}

      <Preload loading={loading} pageData={pageData ? true : false} />
    </div>
  );
};

export default GeneralSetting;
