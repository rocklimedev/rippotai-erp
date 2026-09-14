// src/pages/automation/AutomationNotifications.jsx

import React, { useState } from "react";
import {
  Bell,
  Check,
  Mail,
  MessageSquare,
  Save,
  Settings2,
  Smartphone,
  Zap,
} from "lucide-react";

import {
  notificationEvents,
  notificationPreferences,
} from "../../data/automationMockData";

export default function AutomationNotifications() {
  const [roles, setRoles] = useState(notificationPreferences);
  const [events, setEvents] = useState(notificationEvents);

  const toggleRole = (index, field) => {
    setRoles((prev) =>
      prev.map((role, i) =>
        i === index ? { ...role, [field]: !role[field] } : role,
      ),
    );
  };

  const toggleEvent = (index, field) => {
    setEvents((prev) =>
      prev.map((event, i) =>
        i === index ? { ...event, [field]: !event[field] } : event,
      ),
    );
  };

  const Toggle = ({ enabled, onClick }) => (
    <button
      onClick={onClick}
      className={`relative h-6 w-11 rounded-full transition ${
        enabled ? "bg-[#1F453B]" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
          enabled ? "left-6" : "left-1"
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Zap size={16} />
              Automation Center / Notifications
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Notification Preferences
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Control how automation events are delivered to each INOS role.
            </p>
          </div>

          <button className="inline-flex items-center gap-2 rounded-xl bg-[#1F453B] px-4 py-2.5 text-sm font-semibold text-white">
            <Save size={17} />
            Save Preferences
          </button>
        </div>

        {/* Channels */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3">
                <Bell size={20} className="text-blue-600" />
              </div>

              <div>
                <p className="font-semibold text-slate-800">In-App</p>
                <p className="text-xs text-slate-400">
                  INOS notification center
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-3">
                <Mail size={20} className="text-amber-600" />
              </div>

              <div>
                <p className="font-semibold text-slate-800">Email</p>
                <p className="text-xs text-slate-400">
                  Automated email notifications
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-3">
                <MessageSquare size={20} className="text-violet-600" />
              </div>

              <div>
                <p className="font-semibold text-slate-800">Zoho Cliq</p>
                <p className="text-xs text-slate-400">
                  Team and channel alerts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Role Preferences */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900">Role Preferences</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose which channels each role receives.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    In-App
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Zoho Cliq
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {roles.map((role, index) => (
                  <tr key={role.role}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                          {role.role
                            .split(" ")
                            .map((word) => word[0])
                            .join("")
                            .slice(0, 2)}
                        </div>

                        <span className="text-sm font-semibold text-slate-800">
                          {role.role}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          enabled={role.inApp}
                          onClick={() => toggleRole(index, "inApp")}
                        />
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          enabled={role.email}
                          onClick={() => toggleRole(index, "email")}
                        />
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          enabled={role.cliq}
                          onClick={() => toggleRole(index, "cliq")}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Event Preferences */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900">Event Preferences</h2>
            <p className="mt-1 text-sm text-slate-500">
              Configure which channels are used for individual automation
              events.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Event
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    In-App
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cliq
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {events.map((event, index) => (
                  <tr key={event.event}>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                      {event.event}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          enabled={event.inApp}
                          onClick={() => toggleEvent(index, "inApp")}
                        />
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          enabled={event.email}
                          onClick={() => toggleEvent(index, "email")}
                        />
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          enabled={event.cliq}
                          onClick={() => toggleEvent(index, "cliq")}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
