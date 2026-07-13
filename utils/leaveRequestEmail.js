import { sendEmail } from "./emailService.js";
import { apiBaseUrl } from "../config/index.js";

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

export default sendLeaveRequestActionEmail;
