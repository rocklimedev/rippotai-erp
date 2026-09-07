import React from "react";
import {
  CheckCircle2,
  Link2,
  Mail,
  RefreshCw,
  Settings2,
  Unplug,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  useLazyGoogleAuthorizeUrlQuery,
  useGoogleStatusQuery,
  useGoogleDisconnectMutation,
  useLazyMicrosoftAuthorizeUrlQuery,
  useMicrosoftStatusQuery,
  useMicrosoftDisconnectMutation,
  useLazyZohoAuthorizeUrlQuery,
  useZohoStatusQuery,
  useZohoDisconnectMutation,
} from "../../api/authConnectors.api";

/* ---------------------------------------------------------------------- */
/* Brand marks, kept as small inline SVGs so no extra asset requests are  */
/* needed and they stay crisp at any size.                                */
/* ---------------------------------------------------------------------- */

function GoogleLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.6c-.5 3-2.2 5.5-4.7 7.2v6h7.6c4.4-4.1 7-10.1 7-17.7z"
      />
      <path
        fill="#34A853"
        d="M24 47c6.3 0 11.6-2.1 15.5-5.7l-7.6-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.1 0-11.2-4.1-13-9.6h-7.8v6.1C7.1 41.8 14.9 47 24 47z"
      />
      <path
        fill="#FBBC05"
        d="M11 27.9c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4v-6.1H3.2A23.9 23.9 0 0 0 0 23.5c0 3.9.9 7.5 3.2 10.6z"
      />
      <path
        fill="#EA4335"
        d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.7-6.7C35.6 2.4 30.3 0 24 0 14.9 0 7.1 5.2 3.2 12.9l7.8 6.1c1.8-5.5 6.9-9.5 13-9.5z"
      />
    </svg>
  );
}

function MicrosoftLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 23 23" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="#F35325" />
      <rect x="12" y="1" width="10" height="10" fill="#81BC06" />
      <rect x="1" y="12" width="10" height="10" fill="#05A6F0" />
      <rect x="12" y="12" width="10" height="10" fill="#FFBA08" />
    </svg>
  );
}

function ZohoLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="9" fill="#E64A19" />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fontSize="19"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        fill="#fff"
      >
        Z
      </text>
    </svg>
  );
}

/* ---------------------------------------------------------------------- */
/* IntegrationCard lives OUTSIDE the parent component.                    */
/* Previously it was defined inside IntegrationSettings's function body,  */
/* which meant React saw a brand-new component type on every render and   */
/* unmounted/remounted the whole card tree (killing transitions, focus,   */
/* and any local state) any time a status query refetched. Hoisting it    */
/* out fixes that and matches how React expects components to be built.   */
/* ---------------------------------------------------------------------- */

function IntegrationCard({
  name,
  description,
  icon,
  iconClass,
  features,
  status,
  onConnect,
  onDisconnect,
  disconnectState,
}) {
  const { data, isLoading, isFetching } = status;
  const connected = !!data?.connected;
  const isBusy = isLoading || disconnectState.isLoading;

  return (
    <div className="group rounded-2xl border border-[#E4EAE7] bg-white transition-colors hover:border-[#D3DEDA]">
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-[15px] font-medium text-[#22302D]">{name}</h3>

              {connected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF3EE] px-2 py-0.5 text-[11px] font-medium text-[#3F6D5F]">
                  <CheckCircle2 size={12} />
                  Connected
                </span>
              )}

              {isFetching && !isLoading && (
                <RefreshCw className="h-3 w-3 animate-spin text-[#9AA6A3]" />
              )}
            </div>

            <p className="mt-1 max-w-md text-[13.5px] leading-relaxed text-[#6B7B7C]">
              {description}
            </p>
          </div>
        </div>

        <div className="shrink-0 sm:pt-0.5">
          {isLoading ? (
            <Button size="sm" disabled className="w-full sm:w-auto">
              <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
              Checking status
            </Button>
          ) : connected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              disabled={isBusy}
              className="w-full sm:w-auto"
            >
              {disconnectState.isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Disconnecting
                </>
              ) : (
                <>
                  <Unplug className="mr-2 h-3.5 w-3.5" />
                  Disconnect
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onConnect}
              disabled={isBusy}
              className="w-full sm:w-auto"
            >
              <Link2 className="mr-2 h-3.5 w-3.5" />
              Connect
            </Button>
          )}
        </div>
      </div>

      <Separator className="bg-[#EEF2F0]" />

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-6 py-3.5 text-[13px] text-[#6B7B7C]">
        <span className="text-[#9AA6A3]">Syncs</span>
        {features.map((feature, i) => (
          <React.Fragment key={feature}>
            <span className="text-[#22302D]">{feature}</span>
            {i < features.length - 1 && (
              <span className="text-[#C7D1CD]">·</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {connected && (
        <>
          <Separator className="bg-[#EEF2F0]" />

          <div className="flex items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF3EE]">
                <Mail size={14} className="text-[#3F6D5F]" />
              </div>

              <div>
                <p className="text-[13px] font-medium text-[#22302D]">
                  Account linked
                </p>
                <p className="text-[12px] text-[#9AA6A3]">
                  Data is syncing automatically
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-[#6B7B7C] hover:text-[#22302D]"
            >
              <Settings2 className="mr-2 h-3.5 w-3.5" />
              Manage
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function IntegrationSettings() {
  const google = useGoogleStatusQuery();
  const microsoft = useMicrosoftStatusQuery();
  const zoho = useZohoStatusQuery();

  const [getGoogleAuthorizeUrl] = useLazyGoogleAuthorizeUrlQuery();
  const [getMicrosoftAuthorizeUrl] = useLazyMicrosoftAuthorizeUrlQuery();
  const [getZohoAuthorizeUrl] = useLazyZohoAuthorizeUrlQuery();

  const [disconnectGoogle, googleDisconnecting] = useGoogleDisconnectMutation();
  const [disconnectMicrosoft, microsoftDisconnecting] =
    useMicrosoftDisconnectMutation();
  const [disconnectZoho, zohoDisconnecting] = useZohoDisconnectMutation();

  const connectProvider = async (provider) => {
    try {
      let result;

      switch (provider) {
        case "google":
          result = await getGoogleAuthorizeUrl(undefined).unwrap();
          break;
        case "microsoft":
          result = await getMicrosoftAuthorizeUrl(undefined).unwrap();
          break;
        case "zoho":
          result = await getZohoAuthorizeUrl(undefined).unwrap();
          break;
      }

      if (!result?.authorizationUrl) {
        throw new Error("Authorization URL was not returned by the server");
      }

      window.location.assign(result.authorizationUrl);
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error);
    }
  };

  const providers = [
    {
      key: "zoho",
      name: "Zoho Bigin",
      description:
        "Manage leads, contacts, pipelines, and activities without leaving your workflow.",
      icon: <ZohoLogo size={22} />,
      iconClass: "bg-[#FFF1E8]",
      features: ["Leads", "Contacts", "Pipelines", "Activities", "Notes"],
      status: zoho,
      onConnect: () => connectProvider("zoho"),
      onDisconnect: () => disconnectZoho(),
      disconnectState: zohoDisconnecting,
    },
    {
      key: "google",
      name: "Google",
      description:
        "Bring your calendar and tasks in from Google Workspace and keep them current.",
      icon: <GoogleLogo size={22} />,
      iconClass: "bg-[#EEF4FF]",
      features: ["Calendar", "Tasks"],
      status: google,
      onConnect: () => connectProvider("google"),
      onDisconnect: () => disconnectGoogle(),
      disconnectState: googleDisconnecting,
    },
    {
      key: "microsoft",
      name: "Microsoft",
      description: "Link Microsoft 365 to work with files stored in OneDrive.",
      icon: <MicrosoftLogo size={20} />,
      iconClass: "bg-[#EEF4FF]",
      features: ["OneDrive"],
      status: microsoft,
      onConnect: () => connectProvider("microsoft"),
      onDisconnect: () => disconnectMicrosoft(),
      disconnectState: microsoftDisconnecting,
    },
  ];

  const connectedCount = providers.filter(
    (p) => !!p.status.data?.connected,
  ).length;

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-end justify-between border-b border-[#E4EAE7] pb-6">
        <div>
          <h2 className="text-[22px] font-semibold text-[#22302D]">
            Connectors
          </h2>
          <p className="mt-1.5 max-w-lg text-[14px] text-[#6B7B7C]">
            Connect your business tools to sync CRM data, emails, calendars, and
            files with your workspace.
          </p>
        </div>

        <p className="shrink-0 pl-4 text-[13px] text-[#9AA6A3]">
          {connectedCount} of {providers.length} connected
        </p>
      </div>

      <div className="space-y-4">
        {providers.map(
          ({
            key,
            status,
            onConnect,
            onDisconnect,
            disconnectState,
            ...rest
          }) => (
            <IntegrationCard
              key={key}
              status={status}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
              disconnectState={disconnectState}
              {...rest}
            />
          ),
        )}
      </div>
    </div>
  );
}
