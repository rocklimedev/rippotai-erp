// Preview-only build config (cloud workspace copy, not shipped): same app, but every API base
// is rewritten to the same-origin path so one public URL serves both UI and API.
import base from "./vite.config.js";
const rewriteApiBase = {
  name: "inos-same-origin-api",
  enforce: "pre",
  transform(code, id) {
    if (!/src\/(lib\/config\.js|pages\/ZohoCrmTester\.jsx|pages\/UploadPanel\.jsx)$/.test(id)) return;
    return code
      .replaceAll("https://erp-api.rippotaiarchitecture.com/api/v1", "/api/v1")
      .replaceAll("http://localhost:5000/api/v1", "/api/v1");
  },
};
export default { ...base, plugins: [rewriteApiBase, ...base.plugins] };
