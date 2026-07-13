import XLSX from "xlsx";
import { HOLIDAY_TYPES } from "../config/constants.js";

export const HOLIDAY_FILE_HEADERS = ["holidayName", "date", "type"];
const HOLIDAY_TYPE_VALUES = Object.values(HOLIDAY_TYPES);

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .replace(/^\uFEFF/, "");

const normalizeCell = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).trim();
};

export const buildHolidayKey = (holidayName, date) => {
  const normalizedDate =
    date instanceof Date
      ? date.toISOString().slice(0, 10)
      : String(date).slice(0, 10);

  return `${holidayName.trim().toLowerCase()}|${normalizedDate}`;
};

export const formatHolidayDate = (date) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().slice(0, 10);
};

export const holidaysToRows = (holidays = []) =>
  holidays.map((holiday) => ({
    holidayName: holiday.holidayName,
    date: formatHolidayDate(holiday.date),
    type: holiday.type,
  }));

export const buildHolidaysWorkbook = (holidays = []) => {
  const rows = holidaysToRows(holidays);
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: HOLIDAY_FILE_HEADERS,
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Holidays");
  return workbook;
};

export const buildHolidaysCsvBuffer = (holidays = []) => {
  const workbook = buildHolidaysWorkbook(holidays);
  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "csv" }),
  );
};

export const buildHolidaysExcelBuffer = (holidays = []) => {
  const workbook = buildHolidaysWorkbook(holidays);
  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
};

const parseDateValue = (value) => {
  const normalized = normalizeCell(value);
  if (!normalized) {
    return null;
  }

  // Excel serial date number
  if (/^\d+(\.\d+)?$/.test(normalized)) {
    const serial = Number(normalized);
    const parsed = XLSX.SSF.parse_date_code(serial);
    if (!parsed) {
      return null;
    }
    const iso = `${String(parsed.y).padStart(4, "0")}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    const date = new Date(`${iso}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const date = new Date(`${normalized}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const validateHolidayFileHeaders = (headers = []) => {
  const normalizedHeaders = headers.map(normalizeHeader);
  const expected = HOLIDAY_FILE_HEADERS;

  if (normalizedHeaders.length < expected.length) {
    return {
      valid: false,
      message: `Invalid file format. Required columns are: ${expected.join(", ")}.`,
    };
  }

  for (let i = 0; i < expected.length; i += 1) {
    if (normalizedHeaders[i] !== expected[i]) {
      return {
        valid: false,
        message: `Invalid file format. Expected header row: ${expected.join(", ")}.`,
      };
    }
  }

  return { valid: true };
};

export const parseHolidayUploadFile = (fileBuffer, originalName = "") => {
  const workbook = XLSX.read(fileBuffer, {
    type: "buffer",
    cellDates: true,
    raw: false,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return {
      valid: false,
      message: "Invalid file format. No worksheet found.",
    };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  });

  if (!rows.length) {
    return {
      valid: false,
      message: "Invalid file format. File is empty.",
    };
  }

  const headerValidation = validateHolidayFileHeaders(rows[0]);
  if (!headerValidation.valid) {
    return headerValidation;
  }

  const dataRows = rows.slice(1).filter((row) =>
    row.some((cell) => normalizeCell(cell) !== ""),
  );

  if (!dataRows.length) {
    return {
      valid: false,
      message: "No holiday rows found in the file.",
    };
  }

  const holidays = [];
  const errors = [];
  const seenInFile = new Set();

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const holidayName = normalizeCell(row[0]);
    const dateValue = normalizeCell(row[1]);
    const type = normalizeCell(row[2]).toUpperCase();

    if (!holidayName || !dateValue || !type) {
      errors.push(
        `Row ${rowNumber}: holidayName, date, and type are required.`,
      );
      return;
    }

    if (holidayName.length > 100) {
      errors.push(
        `Row ${rowNumber}: holidayName must not exceed 100 characters.`,
      );
      return;
    }

    const date = parseDateValue(row[1]);
    if (!date) {
      errors.push(
        `Row ${rowNumber}: date must be a valid date (YYYY-MM-DD).`,
      );
      return;
    }

    if (!HOLIDAY_TYPE_VALUES.includes(type)) {
      errors.push(
        `Row ${rowNumber}: type must be one of: ${HOLIDAY_TYPE_VALUES.join(", ")}.`,
      );
      return;
    }

    const key = buildHolidayKey(holidayName, date);
    if (seenInFile.has(key)) {
      errors.push(
        `Row ${rowNumber}: duplicate holidayName and date in the file.`,
      );
      return;
    }
    seenInFile.add(key);

    holidays.push({
      holidayName,
      date,
      type,
    });
  });

  if (errors.length) {
    return {
      valid: false,
      message: "Invalid file content. Fix the errors and upload again.",
      errors,
    };
  }

  return {
    valid: true,
    holidays,
    fileName: originalName,
  };
};

export default {
  HOLIDAY_FILE_HEADERS,
  buildHolidaysCsvBuffer,
  buildHolidaysExcelBuffer,
  parseHolidayUploadFile,
  buildHolidayKey,
  formatHolidayDate,
};
