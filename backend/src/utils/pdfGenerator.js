import PDFDocument from "pdfkit";

export function generatePdfFromText(title, content, res) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${title}.pdf"`
  );

  doc.pipe(res);

  doc.fontSize(18).text(title, { underline: true });
  doc.moveDown();

  doc.fontSize(11).text(content, {
    align: "left"
  });

  doc.end();
}
