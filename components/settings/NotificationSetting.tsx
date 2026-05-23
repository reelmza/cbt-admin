import { Switch } from "@/components/ui/switch";

const sections = [
  {
    title: "Assessment Alerts",
    items: [
      { label: "Assessment published", description: "Notify when a new assessment goes live" },
      { label: "Assessment ended", description: "Notify when an assessment's deadline passes" },
      { label: "New submission received", description: "Notify when a student submits an assessment" },
    ],
  },
  {
    title: "Student Activity",
    items: [
      { label: "New student registered", description: "Notify when a student account is created" },
      { label: "Student assigned to exam", description: "Notify the student on assignment" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Login from new device", description: "Alert on unrecognised device sign-in" },
      { label: "Bulk upload completed", description: "Notify when a CSV import finishes" },
    ],
  },
];

const NotificationSetting = () => {
  return (
    <div className="max-w-xl">
      <div className="font-semibold text-lg">Notifications</div>
      <div className="text-sm text-theme-gray mb-6">
        Choose which events trigger in-app notifications.
      </div>

      {sections.map((section) => (
        <div key={section.title} className="border rounded-lg p-6 mb-4">
          <div className="text-sm font-medium mb-2">{section.title}</div>

          {section.items.map((item, key) => (
            <div
              key={key}
              className={`flex items-center justify-between py-3 ${
                key < section.items.length - 1 ? "border-b" : ""
              }`}
            >
              <div>
                <div className="text-sm">{item.label}</div>
                <div className="text-xs text-theme-gray">{item.description}</div>
              </div>
              <Switch />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default NotificationSetting;
