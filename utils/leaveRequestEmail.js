import { sendEmail } from "./emailService.js";
import { apiBaseUrl, portalLoginUrl, frontendUrl } from "../config/index.js";
import { LEAVE_REQUEST_STATUS } from "../config/constants.js";

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const buildLeaveRequestActionEmail = ({
  employeeName,
  employeeId,
  leaveTypeName,
  startDate,
  endDate,
  halfDay,
  reason,
  approveUrl,
  rejectUrl,
  expiresAt,
}) => {
  const subject = `Leave request from ${employeeName} (${employeeId})`;
  const halfDayText = halfDay ? "Yes" : "No";
  const expiryText = formatDate(expiresAt);

  const text = [
    `A new leave request needs your action.`,
    ``,
    `Employee: ${employeeName} (${employeeId})`,
    `Leave type: ${leaveTypeName}`,
    `Start date: ${formatDate(startDate)}`,
    `End date: ${formatDate(endDate)}`,
    `Half day: ${halfDayText}`,
    `Reason: ${reason || "-"}`,
    ``,
    `Approve: ${approveUrl}`,
    `Reject: ${rejectUrl}`,
    ``,
    `These links expire at ${expiryText} (valid for 2 hours). After expiry they redirect to the portal login.`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="margin-bottom: 8px;">New leave request</h2>
      <p style="margin-top: 0;">A leave request needs your approval. Use the buttons below to act directly from this email.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Employee</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${employeeName} (${employeeId})</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Leave type</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${leaveTypeName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Start date</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(startDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>End date</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(endDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Half day</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${halfDayText}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Reason</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${reason || "-"}</td>
        </tr>
      </table>
      <div style="margin: 24px 0;">
        <a href="${approveUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px; margin-right: 12px;">Approve</a>
        <a href="${rejectUrl}" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px;">Reject</a>
      </div>
      <p style="font-size: 13px; color: #6b7280;">
        These links are valid for 2 hours (until ${expiryText}). After that they redirect to the portal login.
      </p>
    </div>
  `;

  return { subject, html, text };
};

export const buildActionUrls = (approveToken, rejectToken) => ({
  approveUrl: `${apiBaseUrl}/api/leave-actions/${approveToken}`,
  rejectUrl: `${apiBaseUrl}/api/leave-actions/${rejectToken}`,
});

export const sendLeaveRequestActionEmail = async ({
  to,
  employeeName,
  employeeId,
  leaveTypeName,
  startDate,
  endDate,
  halfDay,
  reason,
  approveToken,
  rejectToken,
  expiresAt,
}) => {
  const { approveUrl, rejectUrl } = buildActionUrls(approveToken, rejectToken);
  const { subject, html, text } = buildLeaveRequestActionEmail({
    employeeName,
    employeeId,
    leaveTypeName,
    startDate,
    endDate,
    halfDay,
    reason,
    approveUrl,
    rejectUrl,
    expiresAt,
  });

  return sendEmail({ to, subject, html, text });
};

export const buildManagerLeaveRequestEmail = ({
  employeeName,
  employeeId,
  leaveTypeName,
  startDate,
  endDate,
  halfDay,
  reason,
  loginUrl,
}) => {
  const subject = `Team leave request: ${employeeName} (${employeeId})`;
  const halfDayText = halfDay ? "Yes" : "No";

  const text = [
    `An employee on your team has requested leave.`,
    ``,
    `Employee: ${employeeName} (${employeeId})`,
    `Leave type: ${leaveTypeName}`,
    `Start date: ${formatDate(startDate)}`,
    `End date: ${formatDate(endDate)}`,
    `Half day: ${halfDayText}`,
    `Reason: ${reason || "-"}`,
    ``,
    `Log in to the portal to review and take action: ${loginUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="margin-bottom: 8px;">Team leave request</h2>
      <p style="margin-top: 0;">An employee on your team has requested leave. Log in to the portal to review and take action.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Employee</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${employeeName} (${employeeId})</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Leave type</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${leaveTypeName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Start date</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(startDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>End date</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(endDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Half day</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${halfDayText}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Reason</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${reason || "-"}</td>
        </tr>
      </table>
      <div style="margin: 24px 0;">
        <a href="${loginUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px;">Login</a>
      </div>
      <p style="font-size: 13px; color: #6b7280;">
        After logging in, open your team leave requests to approve or reject this request.
      </p>
    </div>
  `;

  return { subject, html, text };
};

export const sendManagerLeaveRequestEmail = async ({
  to,
  employeeName,
  employeeId,
  leaveTypeName,
  startDate,
  endDate,
  halfDay,
  reason,
}) => {
  const { subject, html, text } = buildManagerLeaveRequestEmail({
    employeeName,
    employeeId,
    leaveTypeName,
    startDate,
    endDate,
    halfDay,
    reason,
    loginUrl: portalLoginUrl,
  });

  return sendEmail({ to, subject, html, text });
};

export const sendLeaveDecisionEmail = async ({
  to,
  employeeName,
  leaveTypeName,
  startDate,
  endDate,
  status,
}) => {
  const approved = status === LEAVE_REQUEST_STATUS.APPROVED;
  const statusLabel = approved ? "approved" : "rejected";
  const subject = `Your leave request has been ${statusLabel}`;

  const text = [
    `Hi ${employeeName || "there"},`,
    ``,
    `Your leave request has been ${statusLabel}.`,
    ``,
    `Leave type: ${leaveTypeName || "Leave"}`,
    `Start date: ${formatDate(startDate)}`,
    `End date: ${formatDate(endDate)}`,
    `Status: ${status}`,
    ``,
    `You can sign in here: ${portalLoginUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="margin-bottom: 8px;">Leave request ${statusLabel}</h2>
      <p style="margin-top: 0;">Hi ${employeeName || "there"},</p>
      <p>Your leave request has been <strong style="color: ${approved ? "#16a34a" : "#dc2626"};">${statusLabel}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Leave type</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${leaveTypeName || "Leave"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Start date</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(startDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>End date</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(endDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Status</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${status}</td>
        </tr>
      </table>
      <p><a href="${portalLoginUrl}" style="color: #2563eb;">Open Leave Tracker</a></p>
    </div>
  `;

  return sendEmail({ to, subject, html, text });
};

export const sendEmployeeWelcomeEmail = async ({
  to,
  employeeName,
  employeeId,
  password,
}) => {
  const subject = "Your Leave Tracker account credentials";

  const text = [
    `Hi ${employeeName || "there"},`,
    ``,
    `Your employee account has been created. Use the credentials below to sign in.`,
    ``,
    `Email: ${to}`,
    `Employee ID: ${employeeId || "-"}`,
    `Temporary password: ${password}`,
    ``,
    `Login: ${portalLoginUrl}`,
    ``,
    `Note: For your security, please change your password after your first login.`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="margin-bottom: 8px;">Welcome to Leave Tracker</h2>
      <p style="margin-top: 0;">Hi ${employeeName || "there"},</p>
      <p>Your employee account has been created. Use the credentials below to sign in.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Email</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${to}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Employee ID</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${employeeId || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Temporary password</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><code>${password}</code></td>
        </tr>
      </table>
      <p style="margin: 24px 0;">
        <a href="${portalLoginUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px;">Sign in</a>
      </p>
      <p style="font-size: 13px; color: #6b7280;">
        <strong>Note:</strong> For your security, please change your password after your first login.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html, text });
};

export const sendPayrollApprovedEmail = async ({
  to,
  employeeName,
  monthYear,
}) => {
  const subject = `Your salary for ${monthYear} has been approved`;
  const payrollUrl = `${frontendUrl}/payroll`;

  const text = [
    `Hi ${employeeName || "there"},`,
    ``,
    `Your payroll for ${monthYear} has been approved.`,
    `You can now download your salary slip from the employee portal.`,
    ``,
    `Portal: ${payrollUrl}`,
    `Login: ${portalLoginUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="margin-bottom: 8px;">Salary slip available</h2>
      <p style="margin-top: 0;">Hi ${employeeName || "there"},</p>
      <p>Your payroll for <strong>${monthYear}</strong> has been approved.</p>
      <p>You can now download your salary slip from the employee portal.</p>
      <p style="margin: 24px 0;">
        <a href="${payrollUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px;">View payroll</a>
      </p>
      <p style="font-size: 13px; color: #6b7280;">
        If the button does not work, sign in at <a href="${portalLoginUrl}">${portalLoginUrl}</a> and open Payroll to download your slip.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html, text });
};

export default sendLeaveRequestActionEmail;
