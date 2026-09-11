import { createContext, useContext, useMemo, useState } from "react";
// Adjust path if needed to match your project layout
import { useGetCliqStatusQuery } from "../../api/connectors/cliq.api";
import { CliqMiniWidget } from "./CliqMiniWidget";

const CliqChatContext = createContext(null);

export function useCliqChat() {
  const ctx = useContext(CliqChatContext);

  if (!ctx) {
    throw new Error("useCliqChat must be used inside <CliqChatProvider>");
  }

  return ctx;
}

export function CliqChatProvider({ children, currentCliqUserId }) {
  const [open, setOpen] = useState(false);

  const { data: status } = useGetCliqStatusQuery(undefined, {
    pollingInterval: open ? 15000 : 60000,
  });

  const cliqConnected = status?.connected === true;

  const value = useMemo(
    () => ({
      open,
      cliqConnected,
      openChat: () => setOpen(true),
      closeChat: () => setOpen(false),
      toggleChat: () => setOpen((v) => !v),
    }),
    [open, cliqConnected],
  );

  return (
    <CliqChatContext.Provider value={value}>
      {children}
      {open && (
        <CliqMiniWidget
          currentCliqUserId={currentCliqUserId}
          onClose={() => setOpen(false)}
        />
      )}
    </CliqChatContext.Provider>
  );
}
