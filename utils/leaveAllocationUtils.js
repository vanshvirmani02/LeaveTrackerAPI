import { ACCRUAL_TYPES } from "../config/constants.js";

const isSameUtcDate = (dateA, dateB) => {
  const a = new Date(dateA);
  const b = new Date(dateB);

  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
};

export const calculateEligibleMonths = (joiningDate, referenceDate = new Date()) => {
  const join = new Date(joiningDate);
  const reference = new Date(referenceDate);
  const referenceYear = reference.getFullYear();
  const joinYear = join.getFullYear();

  if (joinYear > referenceYear) {
    return 0;
  }

  if (joinYear < referenceYear) {
    return 12;
  }

  return 12 - join.getMonth();
};

export const calculateEligibleQuarters = (joiningDate, referenceDate = new Date()) => {
  const eligibleMonths = calculateEligibleMonths(joiningDate, referenceDate);
  if (eligibleMonths === 0) {
    return 0;
  }

  const join = new Date(joiningDate);
  const reference = new Date(referenceDate);
  const joinYear = join.getFullYear();
  const referenceYear = reference.getFullYear();

  if (joinYear < referenceYear) {
    return 4;
  }

  const joinQuarter = Math.floor(join.getMonth() / 3);
  return 4 - joinQuarter;
};

export const calculateAllocatedLeaves = ({
  annualQuota,
  accrualType,
  joiningDate,
  referenceDate = new Date(),
}) => {
  if (!annualQuota || annualQuota <= 0) {
    return 0;
  }

  const eligibleMonths = calculateEligibleMonths(joiningDate, referenceDate);

  if (eligibleMonths === 0) {
    return 0;
  }

  switch (accrualType) {
    case ACCRUAL_TYPES.QUARTERLY: {
      const eligibleQuarters = calculateEligibleQuarters(
        joiningDate,
        referenceDate,
      );
      return Math.floor((annualQuota / 4) * eligibleQuarters);
    }
    case ACCRUAL_TYPES.NONE:
    case ACCRUAL_TYPES.MONTHLY:
    case ACCRUAL_TYPES.YEARLY:
    default:
      return Math.floor((annualQuota / 12) * eligibleMonths);
  }
};

export const calculateLeaveDays = ({
  startDate,
  endDate,
  halfDay = false,
  holidays = [],
}) => {
  if (halfDay) {
    return 0.5;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  if (end < start) {
    return 0;
  }

  let leaveDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const isHoliday = holidays.some((holiday) =>
      isSameUtcDate(holiday.date, current),
    );

    if (!isHoliday) {
      leaveDays += 1;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return leaveDays;
};
