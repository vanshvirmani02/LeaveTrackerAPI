import PDFDocument from "pdfkit";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatMonthYearLabel = (monthYear) => {
  const [year, month] = String(monthYear).split("-");
  const monthIndex = Number(month) - 1;
  const monthName = MONTH_NAMES[monthIndex] || month;
  return `${monthName} ${year}`;
};

/**
 * Builds a salary slip PDF buffer for an approved payroll entry.
 */
export const buildSalarySlipPdf = ({
  organizationName,
  employee,
  bankDetails,
  monthYear,
  payrollEntry,
}) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const grossSalary = Number(payrollEntry.grossSalary) || 0;
    const deduction = Number(payrollEntry.deduction) || 0;
    const bonus = Number(payrollEntry.bonus) || 0;
    const netSalary = Math.round((grossSalary - deduction + bonus + Number.EPSILON) * 100) / 100;
    const periodLabel = formatMonthYearLabel(monthYear);
    const orgName = organizationName || "Organization";

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(orgName, { align: "center" });
    doc.moveDown(0.3);
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Salary Slip", { align: "center" });
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`For the month of ${periodLabel}`, { align: "center" });

    doc.moveDown(1.2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke("#333333");
    doc.moveDown(1);

    doc.fontSize(12).font("Helvetica-Bold").text("Employee Details");
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(10);

    const leftX = 50;
    const rightX = 300;
    let rowY = doc.y;

    const drawDetailRow = (label, value, x, y) => {
      doc.font("Helvetica-Bold").text(label, x, y, { continued: false });
      doc.font("Helvetica").text(value || "-", x, y + 14, { width: 220 });
    };

    drawDetailRow("Employee Name", employee?.name, leftX, rowY);
    drawDetailRow("Employee ID", employee?.employeeId, rightX, rowY);
    rowY += 42;
    drawDetailRow("Designation", employee?.designation, leftX, rowY);
    drawDetailRow("Department", employee?.department, rightX, rowY);
    rowY += 42;
    drawDetailRow(
      "Bank Account",
      bankDetails?.accountNumber
        ? `XXXX${String(bankDetails.accountNumber).slice(-4)}`
        : null,
      leftX,
      rowY,
    );
    drawDetailRow("IFSC", bankDetails?.ifscCode, rightX, rowY);

    doc.y = rowY + 50;
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke("#333333");
    doc.moveDown(1);

    doc.fontSize(12).font("Helvetica-Bold").text("Earnings & Deductions");
    doc.moveDown(0.6);

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 340;
    const col3 = 470;

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Particulars", col1, tableTop);
    doc.text("Type", col2, tableTop);
    doc.text("Amount (INR)", col3, tableTop, { width: 75, align: "right" });

    doc
      .moveTo(50, tableTop + 16)
      .lineTo(545, tableTop + 16)
      .stroke("#999999");

    const rows = [
      { label: "Gross Salary", type: "Earning", amount: grossSalary },
      { label: "Bonus", type: "Earning", amount: bonus },
      { label: "Leave Deduction (LOP)", type: "Deduction", amount: deduction },
    ];

    let currentY = tableTop + 24;
    doc.font("Helvetica");

    for (const row of rows) {
      doc.text(row.label, col1, currentY);
      doc.text(row.type, col2, currentY);
      doc.text(formatCurrency(row.amount), col3, currentY, {
        width: 75,
        align: "right",
      });
      currentY += 22;
    }

    doc
      .moveTo(50, currentY)
      .lineTo(545, currentY)
      .stroke("#333333");
    currentY += 12;

    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("Net Disbursement", col1, currentY);
    doc.text(formatCurrency(netSalary), col3, currentY, {
      width: 75,
      align: "right",
    });

    currentY += 40;
    doc.font("Helvetica").fontSize(9).fillColor("#555555");
    doc.text(
      "This is a system-generated salary slip and does not require a signature.",
      50,
      currentY,
      { align: "center", width: 495 },
    );
    doc.text(
      `Generated on ${new Date().toLocaleDateString("en-IN")}`,
      50,
      currentY + 16,
      { align: "center", width: 495 },
    );

    doc.end();
  });
