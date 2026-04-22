/**
 * ============================================================
 * MÓDULO DE EXPORTAÇÃO DE ORÇAMENTOS
 * Formatos suportados: PDF, Excel (.xlsx), Word (.docx)
 * Identidade visual: Segalla (vermelho, azul, cinza)
 * ============================================================
 */

import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ShadingType,
} from "docx";
import { getQuoteById, getQuoteItems, getAllPaymentMethods } from "./db";

// ─── Segalla Brand Colors ─────────────────────────────────────────────────────
const SEGALLA_RED = "#C0392B";
const SEGALLA_BLUE = "#1A3A6B";
const SEGALLA_GRAY = "#7F8C8D";
const SEGALLA_LIGHT_GRAY = "#F5F5F5";

// ─── Company Info ─────────────────────────────────────────────────────────────
// Altere aqui as informações da empresa que aparecerão nos documentos exportados
const COMPANY_NAME = "Segalla Peças Automotivas";
const COMPANY_TAGLINE = "Qualidade e confiança para sua oficina";
const COMPANY_PHONE = ""; // Ex: "(00) 0000-0000"
const COMPANY_EMAIL = ""; // Ex: "contato@segalla.com.br"
const COMPANY_ADDRESS = ""; // Ex: "Rua das Peças, 123 - São Paulo/SP"

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuoteExportData {
  id: number;
  number: string;
  customerName: string | null;
  customerPhone: string | null;
  observations: string | null;
  status: string;
  totalAmount: string | null;
  createdAt: Date;
  paymentMethodName: string | null;
  items: Array<{
    productCode: string;
    productName: string;
    productReference: string | null;
    quantity: string;
    unitPrice: string;
    totalPrice: string;
  }>;
}

// ─── Data loader ─────────────────────────────────────────────────────────────
export async function loadQuoteExportData(quoteId: number): Promise<QuoteExportData | null> {
  const quote = await getQuoteById(quoteId);
  if (!quote) return null;

  const items = await getQuoteItems(quoteId);
  const paymentMethods = await getAllPaymentMethods();
  const paymentMethod = paymentMethods.find((pm) => pm.id === quote.paymentMethodId);

  return {
    id: quote.id,
    number: quote.number,
    customerName: quote.customerName,
    customerPhone: quote.customerPhone,
    observations: quote.observations,
    status: quote.status,
    totalAmount: quote.totalAmount,
    createdAt: quote.createdAt,
    paymentMethodName: paymentMethod?.name || null,
    items: items.map((item) => ({
      productCode: item.productCode,
      productName: item.productName,
      productReference: item.productReference,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCurrency(value: string | number | null): string {
  const num = parseFloat(String(value || 0));
  return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Recusado",
};

// ─── PDF Export ───────────────────────────────────────────────────────────────
export async function exportQuotePDF(data: QuoteExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 100; // margins

    // ── Header bar ──────────────────────────────────────────────────────────
    doc.rect(50, 50, pageWidth, 70).fill(SEGALLA_RED);

    // Company name
    doc.fillColor("white").fontSize(22).font("Helvetica-Bold")
      .text(COMPANY_NAME, 65, 65, { width: pageWidth - 20 });
    doc.fillColor("white").fontSize(10).font("Helvetica")
      .text(COMPANY_TAGLINE, 65, 90, { width: pageWidth - 20 });

    // Quote number (top right)
    doc.fillColor("white").fontSize(11).font("Helvetica-Bold")
      .text(`Orçamento #${data.number}`, 65, 65, { width: pageWidth - 20, align: "right" });
    doc.fillColor("white").fontSize(9).font("Helvetica")
      .text(formatDate(data.createdAt), 65, 82, { width: pageWidth - 20, align: "right" });

    // ── Company contact info ────────────────────────────────────────────────
    let yPos = 135;
    if (COMPANY_PHONE || COMPANY_EMAIL || COMPANY_ADDRESS) {
      doc.fillColor(SEGALLA_GRAY).fontSize(9).font("Helvetica");
      if (COMPANY_PHONE) {
        doc.text(`Tel: ${COMPANY_PHONE}`, 50, yPos);
        yPos += 13;
      }
      if (COMPANY_EMAIL) {
        doc.text(`E-mail: ${COMPANY_EMAIL}`, 50, yPos);
        yPos += 13;
      }
      if (COMPANY_ADDRESS) {
        doc.text(COMPANY_ADDRESS, 50, yPos);
        yPos += 13;
      }
      yPos += 5;
    } else {
      yPos = 135;
    }

    // ── Divider ─────────────────────────────────────────────────────────────
    doc.moveTo(50, yPos).lineTo(50 + pageWidth, yPos).strokeColor(SEGALLA_BLUE).lineWidth(2).stroke();
    yPos += 15;

    // ── Client info ─────────────────────────────────────────────────────────
    doc.fillColor(SEGALLA_BLUE).fontSize(11).font("Helvetica-Bold").text("DADOS DO CLIENTE", 50, yPos);
    yPos += 18;

    doc.rect(50, yPos, pageWidth, 55).fill(SEGALLA_LIGHT_GRAY);
    doc.fillColor("#333").fontSize(9).font("Helvetica");

    const clientName = data.customerName || "Não informado";
    const clientPhone = data.customerPhone || "Não informado";
    const paymentMethod = data.paymentMethodName || "Não informado";
    const status = statusLabels[data.status] || data.status;

    doc.text(`Cliente: ${clientName}`, 60, yPos + 8);
    doc.text(`Telefone: ${clientPhone}`, 60, yPos + 22);
    doc.text(`Forma de Pagamento: ${paymentMethod}`, 60, yPos + 36);
    doc.text(`Status: ${status}`, 300, yPos + 8);
    doc.text(`Data: ${formatDate(data.createdAt)}`, 300, yPos + 22);

    yPos += 70;

    // ── Items table ─────────────────────────────────────────────────────────
    doc.fillColor(SEGALLA_BLUE).fontSize(11).font("Helvetica-Bold").text("ITENS DO ORÇAMENTO", 50, yPos);
    yPos += 18;

    // Table header
    const colWidths = [60, 200, 80, 70, 80, 80];
    const colHeaders = ["Código", "Descrição", "Referência", "Qtd", "Preço Unit.", "Total"];
    const colX = [50, 110, 310, 390, 460, 530];

    doc.rect(50, yPos, pageWidth, 20).fill(SEGALLA_BLUE);
    doc.fillColor("white").fontSize(8).font("Helvetica-Bold");
    colHeaders.forEach((header, i) => {
      const align = i >= 3 ? "right" : "left";
      doc.text(header, colX[i] + 3, yPos + 6, { width: colWidths[i] - 6, align });
    });
    yPos += 20;

    // Table rows
    data.items.forEach((item, idx) => {
      const rowHeight = 18;
      if (idx % 2 === 0) {
        doc.rect(50, yPos, pageWidth, rowHeight).fill("#F9F9F9");
      }
      doc.fillColor("#333").fontSize(8).font("Helvetica");
      doc.text(item.productCode, colX[0] + 3, yPos + 5, { width: colWidths[0] - 6 });
      doc.text(item.productName, colX[1] + 3, yPos + 5, { width: colWidths[1] - 6, ellipsis: true });
      doc.text(item.productReference || "—", colX[2] + 3, yPos + 5, { width: colWidths[2] - 6 });
      doc.text(parseFloat(item.quantity).toString(), colX[3] + 3, yPos + 5, { width: colWidths[3] - 6, align: "right" });
      doc.text(formatCurrency(item.unitPrice), colX[4] + 3, yPos + 5, { width: colWidths[4] - 6, align: "right" });
      doc.text(formatCurrency(item.totalPrice), colX[5] + 3, yPos + 5, { width: colWidths[5] - 6, align: "right" });
      yPos += rowHeight;

      // Page break check
      if (yPos > doc.page.height - 150) {
        doc.addPage();
        yPos = 50;
      }
    });

    // ── Total ────────────────────────────────────────────────────────────────
    yPos += 5;
    doc.rect(50 + pageWidth - 200, yPos, 200, 28).fill(SEGALLA_RED);
    doc.fillColor("white").fontSize(12).font("Helvetica-Bold")
      .text("TOTAL:", 50 + pageWidth - 195, yPos + 8, { width: 80 });
    doc.fillColor("white").fontSize(12).font("Helvetica-Bold")
      .text(formatCurrency(data.totalAmount), 50 + pageWidth - 115, yPos + 8, { width: 110, align: "right" });

    yPos += 40;

    // ── Observations ─────────────────────────────────────────────────────────
    if (data.observations) {
      doc.fillColor(SEGALLA_BLUE).fontSize(10).font("Helvetica-Bold").text("OBSERVAÇÕES", 50, yPos);
      yPos += 15;
      doc.rect(50, yPos, pageWidth, 1).fill(SEGALLA_GRAY);
      yPos += 8;
      doc.fillColor("#333").fontSize(9).font("Helvetica").text(data.observations, 50, yPos, {
        width: pageWidth,
        lineGap: 3,
      });
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 50;
    doc.moveTo(50, footerY - 10).lineTo(50 + pageWidth, footerY - 10).strokeColor(SEGALLA_LIGHT_GRAY).lineWidth(1).stroke();
    doc.fillColor(SEGALLA_GRAY).fontSize(8).font("Helvetica")
      .text(`${COMPANY_NAME} — Documento gerado em ${new Date().toLocaleString("pt-BR")}`, 50, footerY, {
        width: pageWidth,
        align: "center",
      });

    doc.end();
  });
}

// ─── Excel Export ─────────────────────────────────────────────────────────────
export async function exportQuoteXLSX(data: QuoteExportData): Promise<Buffer> {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Quote details ──────────────────────────────────────────────
  const headerRows = [
    [COMPANY_NAME, "", "", "", "", ""],
    [`Orçamento #${data.number}`, "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["Cliente:", data.customerName || "Não informado", "", "Data:", formatDate(data.createdAt), ""],
    ["Telefone:", data.customerPhone || "Não informado", "", "Status:", statusLabels[data.status] || data.status, ""],
    ["Pagamento:", data.paymentMethodName || "Não informado", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["Código", "Descrição", "Referência", "Quantidade", "Preço Unit. (R$)", "Total (R$)"],
  ];

  const itemRows = data.items.map((item) => [
    item.productCode,
    item.productName,
    item.productReference || "",
    parseFloat(item.quantity),
    parseFloat(item.unitPrice),
    parseFloat(item.totalPrice),
  ]);

  const totalRow = ["", "", "", "", "TOTAL:", parseFloat(data.totalAmount || "0")];
  const obsRows = data.observations
    ? [[""], ["Observações:"], [data.observations]]
    : [];

  const allRows = [...headerRows, ...itemRows, [totalRow[0], totalRow[1], totalRow[2], totalRow[3], totalRow[4], totalRow[5]], ...obsRows];

  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Column widths
  ws["!cols"] = [
    { wch: 15 }, { wch: 40 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Orçamento");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buffer);
}

// ─── Word Export ──────────────────────────────────────────────────────────────
export async function exportQuoteDOCX(data: QuoteExportData): Promise<Buffer> {
  const total = parseFloat(data.totalAmount || "0");

  // Header table (company info + quote number)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "C0392B" },
            children: [
              new Paragraph({
                children: [new TextRun({ text: COMPANY_NAME, bold: true, color: "FFFFFF", size: 28 })],
                spacing: { before: 100, after: 60 },
              }),
              new Paragraph({
                children: [new TextRun({ text: COMPANY_TAGLINE, color: "FFFFFF", size: 18 })],
                spacing: { after: 100 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "C0392B" },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `Orçamento #${data.number}`, bold: true, color: "FFFFFF", size: 22 })],
                spacing: { before: 100, after: 60 },
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: formatDate(data.createdAt), color: "FFFFFF", size: 18 })],
                spacing: { after: 100 },
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Client info table
  const clientTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: "F5F5F5" },
            children: [
              new Paragraph({ children: [new TextRun({ text: "Cliente: ", bold: true }), new TextRun({ text: data.customerName || "Não informado" })] }),
              new Paragraph({ children: [new TextRun({ text: "Telefone: ", bold: true }), new TextRun({ text: data.customerPhone || "Não informado" })] }),
              new Paragraph({ children: [new TextRun({ text: "Pagamento: ", bold: true }), new TextRun({ text: data.paymentMethodName || "Não informado" })] }),
            ],
          }),
          new TableCell({
            shading: { type: ShadingType.SOLID, color: "F5F5F5" },
            children: [
              new Paragraph({ children: [new TextRun({ text: "Status: ", bold: true }), new TextRun({ text: statusLabels[data.status] || data.status })] }),
              new Paragraph({ children: [new TextRun({ text: "Data: ", bold: true }), new TextRun({ text: formatDate(data.createdAt) })] }),
            ],
          }),
        ],
      }),
    ],
  });

  // Items table
  const itemsHeaderRow = new TableRow({
    tableHeader: true,
    children: ["Código", "Descrição", "Referência", "Qtd", "Preço Unit.", "Total"].map(
      (header) =>
        new TableCell({
          shading: { type: ShadingType.SOLID, color: "1A3A6B" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: header, bold: true, color: "FFFFFF", size: 18 })],
            }),
          ],
        })
    ),
  });

  const itemRows = data.items.map(
    (item, idx) =>
      new TableRow({
        children: [
          new TableCell({
            shading: idx % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: "F9F9F9" },
            children: [new Paragraph({ children: [new TextRun({ text: item.productCode, size: 18 })] })],
          }),
          new TableCell({
            shading: idx % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: "F9F9F9" },
            children: [new Paragraph({ children: [new TextRun({ text: item.productName, size: 18 })] })],
          }),
          new TableCell({
            shading: idx % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: "F9F9F9" },
            children: [new Paragraph({ children: [new TextRun({ text: item.productReference || "—", size: 18 })] })],
          }),
          new TableCell({
            shading: idx % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: "F9F9F9" },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: parseFloat(item.quantity).toString(), size: 18 })] })],
          }),
          new TableCell({
            shading: idx % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: "F9F9F9" },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(item.unitPrice), size: 18 })] })],
          }),
          new TableCell({
            shading: idx % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: "F9F9F9" },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(item.totalPrice), size: 18 })] })],
          }),
        ],
      })
  );

  const totalRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 5,
        shading: { type: ShadingType.SOLID, color: "C0392B" },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "TOTAL GERAL:", bold: true, color: "FFFFFF", size: 22 })] })],
      }),
      new TableCell({
        shading: { type: ShadingType.SOLID, color: "C0392B" },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(total), bold: true, color: "FFFFFF", size: 22 })] })],
      }),
    ],
  });

  const itemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [itemsHeaderRow, ...itemRows, totalRow],
  });

  // Document sections
  const sections: (Paragraph | Table)[] = [
    headerTable,
    new Paragraph({ spacing: { after: 200 } }),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: "DADOS DO CLIENTE", color: "1A3A6B", bold: true })],
    }),
    clientTable,
    new Paragraph({ spacing: { after: 200 } }),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: "ITENS DO ORÇAMENTO", color: "1A3A6B", bold: true })],
    }),
    itemsTable,
  ];

  if (data.observations) {
    sections.push(
      new Paragraph({ spacing: { after: 200 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "OBSERVAÇÕES", color: "1A3A6B", bold: true })],
      }),
      new Paragraph({ children: [new TextRun({ text: data.observations, size: 20 })] })
    );
  }

  // Footer
  sections.push(
    new Paragraph({ spacing: { before: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `${COMPANY_NAME} — Documento gerado em ${new Date().toLocaleString("pt-BR")}`, color: "7F8C8D", size: 16 }),
      ],
    })
  );

  const doc = new Document({
    sections: [{ children: sections }],
  });

  return Packer.toBuffer(doc);
}
