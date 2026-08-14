import { toastConfig } from "@/utils/toastConfig";
import { toast } from "sonner";
import { getAxios } from "./axios";

// Per-image cap, shared by question and section images
export const MAX_IMAGE_SIZE = 500 * 1024;

// Images are stored as URLs, so the file is uploaded first and only the
// returned URL is attached to the question or section
export const uploadImage = async (file: File) => {
  if (file.size > MAX_IMAGE_SIZE) {
    toast.error("Each image must be 500KB or less", toastConfig);
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const api = await getAxios();
    const res = await api.post("/utility/file-upload", formData);
    return (res?.data?.data?.url ?? null) as string | null;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        "Unable to upload the image, please retry.",
      toastConfig,
    );
    return null;
  }
};
