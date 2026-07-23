import React from "react";
import {
  CreditCard,
  Crown,
  Calendar,
  Receipt,
  Download,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export default function BillingSettings() {
  const invoices = [
    {
      id: "#INV-1001",
      date: "01 Jul 2026",
      amount: "₹2,999",
      status: "Paid",
    },
    {
      id: "#INV-0998",
      date: "01 Jun 2026",
      amount: "₹2,999",
      status: "Paid",
    },
    {
      id: "#INV-0994",
      date: "01 May 2026",
      amount: "₹2,999",
      status: "Paid",
    },
  ];

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h2
          className="text-2xl font-semibold"
          style={{ color: "var(--ink-green)" }}
        >
          Billing & Subscription
        </h2>

        <p className="text-[#6B7B7C] mt-2">
          Manage your subscription, payment methods, invoices, and billing
          preferences.
        </p>
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border bg-white">
        <div className="border-b px-6 py-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <Crown size={18} />
            Current Plan
          </h3>
        </div>

        <div className="px-6 py-6 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Professional Plan
            </span>

            <h3 className="text-3xl font-bold mt-3">₹2,999/month</h3>

            <p className="text-[#6B7B7C] mt-2">
              Renews automatically on <strong>1 August 2026</strong>.
            </p>
          </div>

          <div className="flex gap-3 self-start">
            <Button variant="outline">Change Plan</Button>

            <Button>Upgrade</Button>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="rounded-xl border bg-white">
        <div className="border-b px-6 py-4">
          <h3 className="font-semibold">Plan Usage</h3>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Users</span>
              <span>18 / 25</span>
            </div>

            <Progress value={72} />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Storage</span>
              <span>36 GB / 100 GB</span>
            </div>

            <Progress value={36} />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Projects</span>
              <span>54 / Unlimited</span>
            </div>

            <Progress value={20} />
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="rounded-xl border bg-white">
        <div className="border-b px-6 py-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <CreditCard size={18} />
            Payment Method
          </h3>
        </div>

        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-lg bg-[#EDF4F2] flex items-center justify-center">
              <Wallet size={22} />
            </div>

            <div>
              <p className="font-medium">Visa ending in 4242</p>

              <p className="text-sm text-[#6B7B7C]">Expires 12/2028</p>
            </div>
          </div>

          <Button variant="outline">Update Card</Button>
        </div>
      </div>

      {/* Billing Information */}
      <div className="rounded-xl border bg-white">
        <div className="border-b px-6 py-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <Calendar size={18} />
            Billing Information
          </h3>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex justify-between">
            <span className="text-[#6B7B7C]">Billing Cycle</span>
            <span className="font-medium">Monthly</span>
          </div>

          <Separator />

          <div className="flex justify-between">
            <span className="text-[#6B7B7C]">Next Invoice</span>
            <span className="font-medium">1 August 2026</span>
          </div>

          <Separator />

          <div className="flex justify-between">
            <span className="text-[#6B7B7C]">Auto Renewal</span>
            <span className="font-medium text-green-600">Enabled</span>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="rounded-xl border bg-white">
        <div className="border-b px-6 py-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <Receipt size={18} />
            Invoice History
          </h3>
        </div>

        <div className="divide-y">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between px-6 py-4"
            >
              <div>
                <p className="font-medium">{invoice.id}</p>
                <p className="text-sm text-[#6B7B7C]">{invoice.date}</p>
              </div>

              <div className="flex items-center gap-6">
                <span className="font-semibold">{invoice.amount}</span>

                <span className="text-green-600 text-sm font-medium">
                  {invoice.status}
                </span>

                <Button variant="ghost" size="icon">
                  <Download size={18} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 bg-red-50">
        <div className="flex items-start justify-between p-6">
          <div className="flex gap-3">
            <AlertTriangle size={22} className="text-red-600 mt-1" />

            <div>
              <h3 className="font-semibold text-red-700">
                Cancel Subscription
              </h3>

              <p className="text-sm text-red-600 mt-1 max-w-xl">
                Cancelling your subscription will keep your account active until
                the end of the current billing period. After that, premium
                features will no longer be available.
              </p>
            </div>
          </div>

          <Button variant="destructive">Cancel Plan</Button>
        </div>
      </div>
    </div>
  );
}
