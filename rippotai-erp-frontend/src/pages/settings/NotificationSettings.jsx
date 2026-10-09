import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { notificationGroups } from "@/lib/notifications";

export default function NotificationSettings() {
  const { user } = useAuth();
  const [preferences, update] = useNotificationPreferences(user?.id);
  return (
    <div className="max-w-4xl space-y-6">
      <h2 className="text-2xl font-semibold">In-app notifications</h2>
      <p className="text-sm text-muted-foreground">
        Choose which updates appear in your notification bell. Preferences are
        saved for your account in this browser. Hidden updates remain in your
        inbox and reappear when enabled.
      </p>
      <div className="rounded-xl border bg-white divide-y">
        {Object.entries(notificationGroups).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between p-5">
            <label htmlFor={`notification-${key}`} className="font-medium">
              {label}
            </label>
            <Switch
              id={`notification-${key}`}
              checked={preferences[key]}
              disabled={!user?.id}
              onCheckedChange={(enabled) => {
                try {
                  update(key, enabled);
                } catch {
                  toast.error("Could not save notification preferences");
                }
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
