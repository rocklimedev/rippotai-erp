export function productionCsp(env = {}) {
  const api = new URL(
    env.VITE_BACKEND_URL || "https://erp-api.rippotaiarchitecture.com",
  );
  if (!["http:", "https:"].includes(api.protocol))
    throw new Error("Invalid backend URL");
  const socket = new URL(api.origin);
  socket.protocol = api.protocol === "https:" ? "wss:" : "ws:";
  const extra = (env.VITE_CSP_CONNECT_ORIGINS || "")
    .split(",")
    .filter(Boolean)
    .map((value) => {
      const url = new URL(value.trim());
      if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol))
        throw new Error("Invalid CSP origin");
      return url.origin;
    });
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    `connect-src 'self' ${[...new Set([api.origin, socket.origin, "https://media-buildcon.rippotaiarchitecture.com", ...extra])].join(" ")}`,
    "frame-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function contentSecurityPolicy() {
  let env;
  return {
    name: "production-content-security-policy",
    apply: "build",
    configResolved(config) {
      env = config.env;
    },
    transformIndexHtml() {
      return [
        {
          tag: "meta",
          attrs: {
            "http-equiv": "Content-Security-Policy",
            content: productionCsp(env),
          },
          injectTo: "head-prepend",
        },
      ];
    },
  };
}
