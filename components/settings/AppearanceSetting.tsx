const themes = [
  { label: "Light", value: "light", bg: "#ffffff", accent: "#2c187b" },
  { label: "Dark", value: "dark", bg: "#111827", accent: "#6d5fd4" },
  { label: "System", value: "system", bg: "linear-gradient(135deg,#ffffff 50%,#111827 50%)", accent: "#2c187b" },
];

const AppearanceSetting = () => {
  return (
    <div className="max-w-xl">
      <div className="font-semibold text-lg">Appearance</div>
      <div className="text-sm text-theme-gray mb-6">
        Customise how the platform looks.
      </div>

      <div className="border rounded-lg p-6 mb-4">
        <div className="text-sm font-medium mb-4">Theme</div>

        <div className="flex gap-4">
          {themes.map((theme) => (
            <button
              key={theme.value}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div
                className="h-20 w-32 rounded-lg border-2 border-transparent group-hover:border-accent transition-all"
                style={{ background: theme.bg }}
              >
                <div
                  className="h-3 w-full rounded-t-md"
                  style={{ background: theme.accent }}
                />
              </div>
              <span className="text-xs text-theme-gray">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <div className="text-sm font-medium mb-4">Density</div>

        <div className="flex gap-3">
          {["Compact", "Default", "Comfortable"].map((d) => (
            <button
              key={d}
              className="flex-1 h-10 rounded-md border text-sm text-theme-gray hover:border-accent hover:text-accent transition-all cursor-pointer"
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppearanceSetting;
