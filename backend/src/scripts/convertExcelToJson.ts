const XLSX = require('xlsx');
const fs = require('fs');

const filePath = './src/scripts/data/vendors.xlsx';

// Read workbook
const workbook = XLSX.readFile(filePath);

// Final result object (all sheets)
const allSheetsData = {};

// Loop through all sheet names
workbook.SheetNames.forEach((sheetName) => {
  const worksheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    defval: null,
  });

  allSheetsData[sheetName] = jsonData;
});

// Output to console
console.log(JSON.stringify(allSheetsData, null, 2));

// Write to file
fs.writeFileSync(
  './output.json',
  JSON.stringify(allSheetsData, null, 2),
  'utf-8',
);

console.log('All Excel sheets converted to JSON!');
