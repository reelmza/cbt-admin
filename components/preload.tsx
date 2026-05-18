const Preload = ({
  loading,
  pageData,
  errorMessage,
}: {
  loading: string | null;
  pageData: boolean;
  errorMessage?: string | null;
}) => {
  const stylesX = {
    wrap: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100%",
      gap: "20px",
    },
    textBlock: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      gap: "8px",
    },
    title: { fontSize: "16px", fontWeight: 500, color: "#111827", margin: 0 },
    subtitle: {
      fontSize: "13px",
      color: "#9ca3af",
      margin: 0,
      textAlign: "center" as const,
      maxWidth: "240px",
      lineHeight: 1.6,
    },
    btn: {
      fontSize: "13px",
      padding: "8px 20px",
      borderRadius: "8px",
      border: "1px solid #e5e7eb",
      background: "transparent",
      color: "#6b7280",
      cursor: "pointer",
    },
  };
  const styles = {
    wrap: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100%",
      gap: "18px",
    },
    spinner: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      border: "3px solid #e5e7eb",
      borderTop: "3px solid #111827",
      borderRight: "3px solid #9ca3af",
      animation: "spin 0.9s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite",
    },
    text: {
      fontSize: "13px",
      fontWeight: 500,
      color: "#9ca3af",
      letterSpacing: "0.06em",
      animation: "fade 1.8s ease-in-out infinite",
    },
  };

  return (
    <>
      {loading === "page" && (
        <div style={styles.wrap}>
          <div style={styles.spinner} />
          <span style={styles.text}>Loading…</span>
        </div>
      )}

      {loading === "pageError" && !pageData && (
        <div style={styles.wrap}>
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
            <circle cx="48" cy="48" r="38" stroke="#e5e7eb" strokeWidth="1" />
            <circle
              cx="48"
              cy="48"
              r="28"
              stroke="#e5e7eb"
              strokeWidth="0.5"
              strokeDasharray="3 3"
            />
            <line
              x1="34"
              y1="34"
              x2="62"
              y2="62"
              stroke="#9ca3af"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="62"
              y1="34"
              x2="34"
              y2="62"
              stroke="#9ca3af"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="48" cy="48" r="4" fill="#d1d5db" />
          </svg>

          <div style={stylesX.textBlock}>
            <p style={stylesX.title}>{errorMessage?.split("$")[0]}</p>
            <p style={stylesX.subtitle}>{errorMessage?.split("$")[1]}</p>
          </div>

          <button style={stylesX.btn} onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      )}
    </>
  );
};

export default Preload;
