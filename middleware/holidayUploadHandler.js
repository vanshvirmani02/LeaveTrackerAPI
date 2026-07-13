import multer from "multer";

const ALLOWED_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);

const ALLOWED_EXTENSIONS = new Set([".csv", ".xls", ".xlsx"]);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const originalName = file.originalname?.toLowerCase() || "";
  const extension = originalName.slice(originalName.lastIndexOf("."));
  const hasValidExtension = ALLOWED_EXTENSIONS.has(extension);
  const hasValidMimeType =
    ALLOWED_MIME_TYPES.has(file.mimetype) || file.mimetype?.startsWith("text/");

  if (hasValidExtension && hasValidMimeType) {
    return cb(null, true);
  }

  return cb(
    new Error("Invalid file type. Only CSV and Excel (.csv, .xls, .xlsx) files are allowed."),
  );
};

export const holidayFileUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");

export default holidayFileUpload;
