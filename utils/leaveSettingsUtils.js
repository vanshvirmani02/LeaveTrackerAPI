import adminSettingsRepository from "../repository/adminSettingsRepository.js";

export const getLeaveSettings = async () => {
  const settings = await adminSettingsRepository.findLatest();
  const leaveSettings = settings?.leaveSettings || {};

  return {
    weekendAsWorkingDay: leaveSettings.weekendAsWorkingDay ?? false,
    autoApproveSickLeave: leaveSettings.autoApproveSickLeave ?? false,
    emailNotification: leaveSettings.emailNotification ?? true,
  };
};

export const isEmailNotificationEnabled = async () => {
  const { emailNotification } = await getLeaveSettings();
  return emailNotification === true;
};

export const isSickLeaveType = (leaveType) => {
  const name = String(leaveType?.leaveName || leaveType?.name || "").trim();
  return /sick/i.test(name);
};

/** Calendar days from request day to leave start date (local). */
export const getDaysUntilLeaveStart = (startDate, requestDate = new Date()) => {
  const start = new Date(startDate);
  const request = new Date(requestDate);

  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const requestUtc = Date.UTC(
    request.getFullYear(),
    request.getMonth(),
    request.getDate(),
  );

  return Math.round((startUtc - requestUtc) / (24 * 60 * 60 * 1000));
};

/**
 * Sick leave auto-approve when start is not more than 2 days ahead of request day.
 * Days ahead > 2 require admin approval.
 */
export const isWithinSickAutoApproveWindow = (
  startDate,
  requestDate = new Date(),
) => getDaysUntilLeaveStart(startDate, requestDate) <= 2;

export default {
  getLeaveSettings,
  isEmailNotificationEnabled,
  isSickLeaveType,
  getDaysUntilLeaveStart,
  isWithinSickAutoApproveWindow,
};
