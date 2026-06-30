import { COMPANY_PREFIX } from "../config/constants.js";

const MAX_ATTEMPTS = 20;

const getRandomFourDigits = () =>
  String(Math.floor(1000 + Math.random() * 9000));

export const buildEmployeeId = (joiningDate) => {
  const year = new Date(joiningDate).getFullYear();
  const lastDigit = year % 10;
  const yearPart = String(year).slice(-2);
  const randomPart = getRandomFourDigits();

  return `${COMPANY_PREFIX}${lastDigit}${yearPart}${randomPart}`;
};

export const generateEmployeeId = async (joiningDate, UserModel) => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const employeeId = buildEmployeeId(joiningDate);
    const existing = await UserModel.findOne({ employeeId }).select("_id").lean();

    if (!existing) {
      return employeeId;
    }
  }

  throw new Error("Unable to generate a unique employee ID. Please try again.");
};
