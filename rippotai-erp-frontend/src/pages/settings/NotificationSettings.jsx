import React, { useState } from "react";
import { Bell, Mail, Monitor, CalendarDays } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    // In-App
    inApp: true,
    mentions: true,
    taskAssigned: true,
    taskCompleted: true,
    comments: true,
    projectUpdates: true,

    // Email
    email: true,
    emailTasks: true,
    emailProjects: false,
    emailDocuments: true,
    emailSecurity: true,

    // Desktop
    desktop: false,

    // Reports
    weeklySummary: true,
    monthlyReport: false,
  });

  const update = (key) =>
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

  const Row = ({ icon: Icon, title, description, value, onChange }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#EDF4F2] flex items-center justify-center">
          <Icon size={18} style={{ color: "var(--ink-green)" }} />
        </div>

        <div>
          <p className="font-medium text-[15px] text-[#2D3A3A]">{title}</p>
          <p className="text-sm text-[#6B7B7C]">{description}</p>
        </div>
      </div>

      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2
          className="text-2xl font-semibold"
          style={{ color: "var(--ink-green)" }}
        >
          Notification Preferences
        </h2>

        <p className="text-[#6B7B7C] mt-2">
          Choose how you'd like to receive notifications across the platform.
        </p>
      </div>

      {/* In-App */}
      <div className="rounded-xl border bg-white">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Bell size={18} />
            In-App Notifications
          </h3>
        </div>

        <div className="px-6">
          <Row
            icon={Bell}
            title="Enable In-App Notifications"
            description="Receive notifications inside the application."
            value={settings.inApp}
            onChange={() => update("inApp")}
          />

          <Separator />

          <Row
            icon={Bell}
            title="Task Assignments"
            description="Notify when a task is assigned to you."
            value={settings.taskAssigned}
            onChange={() => update("taskAssigned")}
          />

          <Separator />

          <Row
            icon={Bell}
            title="Task Completed"
            description="Notify when assigned tasks are completed."
            value={settings.taskCompleted}
            onChange={() => update("taskCompleted")}
          />

          <Separator />

          <Row
            icon={Bell}
            title="Comments & Mentions"
            description="Receive notifications for comments and mentions."
            value={settings.comments}
            onChange={() => update("comments")}
          />

          <Separator />

          <Row
            icon={Bell}
            title="Project Updates"
            description="Notify about project changes and milestones."
            value={settings.projectUpdates}
            onChange={() => update("projectUpdates")}
          />
        </div>
      </div>

      {/* Email */}
      <div className="rounded-xl border bg-white">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Mail size={18} />
            Email Notifications
          </h3>
        </div>

        <div className="px-6">
          <Row
            icon={Mail}
            title="Enable Email Notifications"
            description="Receive important updates via email."
            value={settings.email}
            onChange={() => update("email")}
          />

          <Separator />

          <Row
            icon={Mail}
            title="Task Emails"
            description="Email notifications for task assignments and updates."
            value={settings.emailTasks}
            onChange={() => update("emailTasks")}
          />

          <Separator />

          <Row
            icon={Mail}
            title="Project Emails"
            description="Receive project progress emails."
            value={settings.emailProjects}
            onChange={() => update("emailProjects")}
          />

          <Separator />

          <Row
            icon={Mail}
            title="Document Notifications"
            description="Emails when documents are uploaded or approved."
            value={settings.emailDocuments}
            onChange={() => update("emailDocuments")}
          />

          <Separator />

          <Row
            icon={Mail}
            title="Security Alerts"
            description="Always receive security-related notifications."
            value={settings.emailSecurity}
            onChange={() => update("emailSecurity")}
          />
        </div>
      </div>

      {/* Desktop */}
      <div className="rounded-xl border bg-white">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Monitor size={18} />
            Desktop Notifications
          </h3>
        </div>

        <div className="px-6">
          <Row
            icon={Monitor}
            title="Browser Notifications"
            description="Receive desktop notifications when the browser is open."
            value={settings.desktop}
            onChange={() => update("desktop")}
          />
        </div>
      </div>

      {/* Reports */}
      <div className="rounded-xl border bg-white">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <CalendarDays size={18} />
            Reports & Summaries
          </h3>
        </div>

        <div className="px-6">
          <Row
            icon={CalendarDays}
            title="Weekly Summary"
            description="Receive a weekly summary of activity."
            value={settings.weeklySummary}
            onChange={() => update("weeklySummary")}
          />

          <Separator />

          <Row
            icon={CalendarDays}
            title="Monthly Report"
            description="Receive a monthly productivity report."
            value={settings.monthlyReport}
            onChange={() => update("monthlyReport")}
          />
        </div>
      </div>
    </div>
  );
}
