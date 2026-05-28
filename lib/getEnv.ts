const getEnv: () => Promise<{
  schoolName: string;
  baseUrl: string;
} | null> = async () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  if (!origin) return null;
  try {
    const res = await fetch(`${origin}/api/config`);
    const data = await res.json();
    return data;
  } catch (error) {
    return null;
  }
};
export default getEnv;
