import { Injectable } from '@nestjs/common';
import { BoqService, BoqJSON, BoqItemJSON } from './boq.service';
import * as puppeteer from 'puppeteer';
import ExcelJS from 'exceljs';
export type PdfVariant =
  | 'internal'
  | 'client'
  | 'quantity_only'
  | 'vendor_enquiry';

@Injectable()
export class BoqExportService {
  constructor(private readonly boqService: BoqService) {}

  async toExcel(boqId: string): Promise<{ buffer: Buffer; filename: string }> {
    const boq = await this.boqService.findOne(boqId);

    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Rippotai ERP';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('BOQ');

    sheet.columns = [
      {
        header: 'S.No',
        key: 'sno',
        width: 10,
      },
      {
        header: 'Description',
        key: 'description',
        width: 35,
      },
      {
        header: 'Location',
        key: 'location',
        width: 25,
      },
      {
        header: 'Unit',
        key: 'unit',
        width: 15,
      },
      {
        header: 'Quantity',
        key: 'quantity',
        width: 15,
      },
      {
        header: 'Rate',
        key: 'rate',
        width: 15,
      },
      {
        header: 'Amount',
        key: 'amount',
        width: 20,
      },
    ];

    // Title

    sheet.addRow([this.formatValue(boq.title)]);

    sheet.addRow([`BOQ Number: ${this.formatValue(boq.boq_number)}`]);

    sheet.addRow([`Version: ${this.formatValue(boq.version)}`]);

    sheet.addRow([]);

    // Header styling

    const headerRow = sheet.getRow(5);

    headerRow.font = {
      bold: true,
    };

    const items = boq.items ?? [];

    items.forEach((item, index) => {
      sheet.addRow({
        sno: index + 1,

        description: this.formatValue(item.description),

        location: this.formatValue(item.location),

        unit: this.formatValue(item.unit),

        quantity: this.formatValue(item.quantity),

        rate: this.formatValue(item.rate),

        amount: this.formatValue(item.amount),
      });
    });

    sheet.addRow([]);

    sheet.addRow({
      description: 'Total Value',

      amount: this.formatValue(boq.total_value),
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: Buffer.from(buffer),

      filename: `${this.formatValue(boq.boq_number || boq.id)}.xlsx`,
    };
  }
  async toPdf(
    boqId: string,
    variant: PdfVariant,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const boq = await this.boqService.findOne(boqId);

    const items = this.itemsForVariant(boq, variant);

    const html = this.generatePdfHtml(boq, items, variant);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'load',
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm',
        },
      });

      return {
        buffer: Buffer.from(pdf),
        filename: `${this.formatValue(boq.boq_number || boq.id)}-${variant}.pdf`,
      };
    } finally {
      await browser.close();
    }
  }

  async pageOneThumbnail(boqId: string, variant: PdfVariant): Promise<Buffer> {
    const { buffer } = await this.toPdf(boqId, variant);

    // TODO:
    // Convert first PDF page into PNG.
    // Currently returning PDF buffer.

    return buffer;
  }

  private generatePdfHtml(
    boq: BoqJSON,
    items: BoqItemJSON[],
    variant: PdfVariant,
  ) {
    const hidePrice =
      variant === 'quantity_only' || variant === 'vendor_enquiry';

    const rows = items
      .map((item, index) => {
        return `

<tr>

<td>
${index + 1}
</td>


<td>
${this.formatValue(item.description)}
</td>


<td>
${this.formatValue(item.location)}
</td>


<td>
${this.formatValue(item.unit)}
</td>


<td>
${this.formatValue(item.quantity)}
</td>



${
  hidePrice
    ? ''
    : `

<td>
${this.formatValue(item.rate)}
</td>


<td>
${this.formatValue(item.amount)}
</td>

`
}


</tr>

`;
      })
      .join('');

    return `

<!DOCTYPE html>

<html>

<head>

<meta charset="utf-8"/>

<style>


body {

    font-family: Arial, sans-serif;

    font-size: 12px;

}


h1 {

    text-align:center;

    margin-bottom:20px;

}


.info {

    margin-bottom:20px;

}


table {

    width:100%;

    border-collapse:collapse;

}


th {

    background:#eeeeee;

}


th,
td {

    border:1px solid #444;

    padding:6px;

    text-align:left;

}



.summary {

    margin-top:25px;

    font-size:14px;

}



.footer {

    margin-top:40px;

}


</style>

</head>



<body>



<h1>

${this.formatValue(boq.title) || 'BOQ'}

</h1>



<div class="info">


<p>

<strong>
BOQ Number:
</strong>

${this.formatValue(boq.boq_number)}

</p>



<p>

<strong>
Version:
</strong>

${this.formatValue(boq.version)}

</p>



<p>

<strong>
Variant:
</strong>

${variant}

</p>



</div>





<table>


<thead>


<tr>


<th>
S.No
</th>


<th>
Description
</th>


<th>
Location
</th>


<th>
Unit
</th>


<th>
Quantity
</th>


${
  hidePrice
    ? ''
    : `

<th>
Rate
</th>


<th>
Amount
</th>

`
}


</tr>


</thead>



<tbody>


${rows}


</tbody>


</table>





<div class="summary">


<h3>
Cost Summary
</h3>



<p>

<strong>
Total Value:
</strong>

${this.formatValue(boq.total_value)}

</p>



</div>





<div class="footer">


<p>

Generated by Rippotai ERP

</p>


</div>



</body>


</html>

`;
  }

  private itemsForVariant(boq: BoqJSON, variant: PdfVariant): BoqItemJSON[] {
    const items = boq.items ?? [];

    if (variant === 'client') {
      return items.filter((item) => !item.hidden);
    }

    return items;
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      // Sequelize / Decimal values

      if (
        typeof value.toString === 'function' &&
        value.toString() !== '[object Object]'
      ) {
        return value.toString();
      }

      // Handle common object formats

      return (
        value.value ??
        value.amount ??
        value.total ??
        value.rate ??
        JSON.stringify(value)
      );
    }

    return String(value);
  }
}
