const options = (entries) => entries.map(([value, label]) => ({ value, label }));
const OTHER = ["OTHER", "Other"];
export const PROJECT_TYPE_OPTIONS = options([
  ["RESIDENTIAL", "Residential"], ["COMMERCIAL", "Commercial"], ["INSTITUTIONAL", "Institutional"],
]);
export const SITE_TYPES_BY_PROJECT = {
  RESIDENTIAL: options([["BUILDER_FLOOR", "Builder Floor"], ["BUNGALOW", "Bungalow"], ["FLAT", "Flat"], ["VILLA", "Villa"], ["FARMHOUSE", "Farmhouse"], ["PENTHOUSE", "Penthouse"], OTHER]),
  COMMERCIAL: options([["OFFICE", "Office"], ["RETAIL_SHOWROOM", "Retail Showroom"], ["HOSPITALITY", "Hospitality"], ["HOTEL", "Hospitality — Hotel"], ["RESTAURANT", "Hospitality — Restaurant"], ["BANQUETS", "Hospitality — Banquets"], ["BAR_AND_LOUNGE", "Hospitality — Bar And Lounge"], ["CAFE", "Hospitality — Café"], ["RESORT", "Hospitality — Resort"], ["QSR_AND_CLOUD_KITCHEN", "Hospitality — QSR And Cloud Kitchen"], OTHER]),
  INSTITUTIONAL: options([["CAMPUS_ADDITION", "Campus Addition"], ["EDUCATION", "Education"], ["RELIGIOUS", "Religious"], ["RESIDENTIAL_INSTITUTIONAL", "Residential Institutional"], ["SPORTS", "Sports"], OTHER]),
};
const shellConditions = [["BARE_PLOT", "Bare Plot"], ["COLD_SHELL", "Cold Shell"], ["WARM_SHELL", "Warm Shell"]];
export const SITE_CONDITIONS_BY_PROJECT = {
  RESIDENTIAL: options([...shellConditions, ["EXISTING_OCCUPIED", "Existing Occupied"], ["EXISTING_VACANT", "Existing Vacant"], OTHER]),
  COMMERCIAL: options([...shellConditions, ["EXISTING_OPERATIONAL", "Existing Operational"], ["EXISTING_VACANT", "Existing Vacant"], ["REBRANDING", "Rebranding"], OTHER]),
  INSTITUTIONAL: options([["BARE_PLOT", "Bare Plot"], ["EXISTING_BUILDING_VACANT", "Existing Building — Vacant"], ["EXISTING_BUILDING_OPERATIONAL", "Existing Building — Operational"], ["FIT_OUT_REQUIRED", "Fit Out Required"], OTHER]),
};
export function projectCategoryFromName(name = "") {
  return PROJECT_TYPE_OPTIONS.find((item) => item.label.toLowerCase() === name.toLowerCase())?.value || "";
}
export function siteOptionLabel(value, groups) {
  return Object.values(groups).flat().find((item) => item.value === value)?.label;
}
export function changeBriefSiteField(current, key, value) {
  const next = { ...current, [key]: value };
  if (key === "projectCategory" && value !== current.projectCategory) {
    next.projectType = "";
    next.siteType = "";
    next.siteCondition = "";
    next.siteTypeOther = "";
    next.siteConditionOther = "";
  }
  if (key === "siteType" && value !== "OTHER") next.siteTypeOther = "";
  if (key === "siteCondition" && value !== "OTHER") next.siteConditionOther = "";
  return next;
}
