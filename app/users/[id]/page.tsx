"use client";

import Spacer from "@/components/spacer";

import { attachHeaders, localAxios } from "@/lib/axios";
import { SessionProvider, useSession } from "next-auth/react";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User2 } from "lucide-react";
import { StudentProfile } from "./id.types";
import { Spinner } from "@/components/ui/spinner";

const Page = ({ id }: { id: string }) => {
  const controller = new AbortController();
  const { data: session } = useSession();

  const [loading, setLoading] = useState<string | null>("page");
  const [pageData, setPageData] = useState<AssesmentApiResponse[] | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    if (!session) return;

    const getAssessments = async () => {
      try {
        attachHeaders(session!.user.token);

        // Get Profile
        const studentRes = await localAxios.get(`/student/profile/${id}`, {
          signal: controller.signal,
        });

        // Get Assessments
        const assRes = await localAxios.get(`/assessment/student/${id}`, {
          signal: controller.signal,
        });

        if (assRes.status === 200 && studentRes.status === 200) {
          setProfile(studentRes.data.data);
          setPageData(assRes.data.data);
        }

        setLoading(null);
      } catch (error: any) {
        if (error.name !== "CanceledError") {
          setLoading("pageError");
          console.log(error);
        }
      }
    };

    !pageData && getAssessments();

    return () => {
      controller.abort();
    };
  }, [session]);

  return (
    <div className="w-full h-full p-10 font-sans">
      {!loading && pageData && (
        <>
          <div className="w-full flex gap-10 min-h-full">
            {/* Pofile Picture */}
            <div className="border rounded-full h-[220px] w-[220px] flex items-center justify-center">
              <User2
                size={140}
                strokeWidth={0.2}
                className="text-theme-gray-mid"
              />
            </div>

            {/* User Profile & Courses*/}
            <div className="">
              <div>
                <div>Full Name</div>
                <div className="text-2xl font-bold">{profile?.fullName}</div>
                <div className="text-2xl font-bold">{profile?.regNumber}</div>
              </div>
              <Spacer size="xl" />

              {/* Courses Offered */}
              <div>
                <div>Assigned Exams</div>
                {pageData.map((ex, key: number) => {
                  return <div key={key}>{ex.title}</div>;
                })}
              </div>
            </div>
          </div>

          <Spacer size="xl" />
        </>
      )}

      {/* Page Loading */}
      {loading === "page" ? (
        <div className="flex items-center gap-2 mt-2 text-theme-gray">
          <Spinner />
          <div className="text-sm">Fetching data</div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export const PageWrapper = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = use(params);

  return (
    <SessionProvider>
      <Page id={id} />
    </SessionProvider>
  );
};

export default PageWrapper;
