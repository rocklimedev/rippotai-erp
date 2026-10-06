import assert from "node:assert/strict";
import test from "node:test";
import { textToTermsHtml, termsToText } from "./terms.js";

test("ordinary terms preserve line boundaries and escape HTML and ampersands", () => {
  assert.equal(textToTermsHtml('Payment < 30 days & costs > 0\r\n\n  Customer "approval" required.  '), '<ol><li>Payment &lt; 30 days &amp; costs &gt; 0</li><li>Customer &quot;approval&quot; required.</li></ol>');
  assert.equal(textToTermsHtml('<img src=x onerror=alert(1)>'), '<ol><li>&lt;img src=x onerror=alert(1)&gt;</li></ol>');
  assert.equal(textToTermsHtml(' \n '), '');
  assert.equal(termsToText('Payment < 30 days\nRates & taxes'), 'Payment < 30 days\nRates & taxes');
});
