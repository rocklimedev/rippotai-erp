export function buildMonthlyMilestones({
  firstDate,
  months,
  percentage,
  contractValue = 0,
  existingCodes = [],
}) {
  const count = Number(months);
  const share = Number(percentage);
  if (!Number.isInteger(count) || count < 1 || count > 120)
    throw new Error("Choose between 1 and 120 months.");
  if (!Number.isFinite(share) || share <= 0 || share > 100)
    throw new Error("Enter a share greater than 0 and up to 100%.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(firstDate || ""))
    throw new Error("Choose the first payment date.");
  const [year, month, day] = firstDate.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  if (start.toISOString().slice(0, 10) !== firstDate)
    throw new Error("Choose a valid first payment date.");
  const units = Math.round(share * 100);
  const cents = Math.round(Number(contractValue) * share);
  const codes = new Set(
    existingCodes.map((code) => String(code).toUpperCase()),
  );
  let codeIndex = 1;
  return Array.from({ length: count }, (_, index) => {
    // Anchor every month to the original day: Jan 31 -> Feb 28 -> Mar 31.
    const lastDay = new Date(Date.UTC(year, month + index, 0)).getUTCDate();
    const date = new Date(
      Date.UTC(year, month - 1 + index, Math.min(day, lastDay)),
    );
    const dueDate = date.toISOString().slice(0, 10);
    while (codes.has(`MONTH${codeIndex}`)) codeIndex++;
    const code = `MONTH${codeIndex++}`;
    codes.add(code);
    const part = (total) =>
      (Math.floor(total / count) + (index === count - 1 ? total % count : 0)) /
      100;
    return {
      code,
      title: `Monthly payment ${index + 1}`,
      description: `Monthly installment ${index + 1} of ${count}`,
      releaseTrigger: `Monthly payment due ${dueDate}`,
      dueDate,
      percentage: part(units),
      amount: part(cents),
    };
  });
}
