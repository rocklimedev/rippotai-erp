// Preview-only build (cloud workspace copy, never shipped to the Mac folder).
// Same app code, with four build-time rewrites so it can run as a static, read-only snapshot:
//   1. API base -> same-origin "/api/v1" (served by the snapshot shim, never the network)
//   2. axios instances use the fetch adapter, so one fetch shim covers RTK Query + axios
//   3. BrowserRouter -> HashRouter (static hosting has no server-side route fallback)
//   4. absolute /public asset paths -> relative
import base from "./vite.config.js";

const previewRewrites = {
  name: "inos-preview-rewrites",
  enforce: "pre",
  transform(code, id) {
    let out = code;
    if (/src\/(lib\/config\.js|pages\/ZohoCrmTester\.jsx|pages\/UploadPanel\.jsx)$/.test(id)) {
      out = out
        .replaceAll("https://erp-api.rippotaiarchitecture.com/api/v1", "/api/v1")
        .replaceAll("http://localhost:5000/api/v1", "/api/v1");
    }
    if (/src\/(lib\/api\.js|pages\/client\/ClientPortal\.jsx)$/.test(id)) {
      out = out.replace(/axios\.create\(\{/g, 'axios.create({ adapter: "fetch", ');
    }
    if (/src\/App\.jsx$/.test(id)) {
      out = out.replace(/\bBrowserRouter\b/g, "HashRouter");
    }
    if (/src\/.*\.(jsx?|tsx?)$/.test(id)) {
      out = out.replaceAll('"/rippotai_logo.png"', '"./rippotai_logo.png"').replaceAll('"/templates/', '"./templates/');
    }
    return out === code ? undefined : out;
  },
};

export default {
  ...base,
  base: "./",
  publicDir: false,
  plugins: [previewRewrites, ...base.plugins],
  build: { assetsInlineLimit: 0 },
};
