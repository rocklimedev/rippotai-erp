import test from 'node:test';
import assert from 'node:assert/strict';
import { consentFormData, consentFormDate } from './consent-form-data.js';
test('fills consent details from the selected project and linked client',()=>{
 const data=consentFormData({name:'Project A',site_location:'Site A',client:{name:'Client A'}});
 assert.equal(data.projectName,'Project A');assert.equal(data.clientName,'Client A');assert.equal(data.siteAddress,'Site A');assert.match(data.date,/^\d{4}-\d{2}-\d{2}$/);
 const next=consentFormData({name:'Project B',client:{contact_person:'Client B'}});assert.equal(next.clientName,'Client B');assert.equal(next.siteAddress,'');
});
test('leaves unavailable client and site values empty and formats form dates',()=>{assert.equal(consentFormData({}).clientName,'');assert.equal(consentFormDate('2026-10-08'),'08 Oct 2026');assert.equal(consentFormDate(''),'');});
