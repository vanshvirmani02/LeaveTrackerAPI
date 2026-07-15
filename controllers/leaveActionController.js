import asyncHandler from "../middleware/asyncHandler.js";
import emailActionTokenRepository from "../repository/emailActionTokenRepository.js";
import { processLeaveRequestAction } from "../utils/leaveRequestActionService.js";
import { portalLoginUrl } from "../config/index.js";
import { LEAVE_REQUEST_ACTION, LEAVE_APPROVED_BY } from "../config/constants.js";

const redirectToPortalLogin = (res) => {
  return res.redirect(302, portalLoginUrl);
};

const renderResultPage = (res, { title, message, redirectUrl }) => {
  return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="refresh" content="3;url=${redirectUrl}" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8fafc; color: #111827; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <h1 style="margin-top:0;">${title}</h1>
    <p>${message}</p>
    <p>You will be redirected to the portal login shortly.</p>
    <p><a href="${redirectUrl}">Go to login</a></p>
  </div>
</body>
</html>`);
};

export const handleEmailLeaveAction = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const actionToken = await emailActionTokenRepository.findByToken(token);
  if (!actionToken) {
    return redirectToPortalLogin(res);
  }

  if (actionToken.usedAt || new Date(actionToken.expiresAt) < new Date()) {
    return redirectToPortalLogin(res);
  }

  const result = await processLeaveRequestAction({
    leaveRequestId: actionToken.leaveRequestId,
    action: actionToken.action,
    approvedBy: LEAVE_APPROVED_BY.ADMIN,
  });

  if (!result.success) {
    if (
      result.message === "Only pending leave requests can be approved or rejected."
    ) {
      return redirectToPortalLogin(res);
    }

    return renderResultPage(res, {
      title: "Action failed",
      message: result.message,
      redirectUrl: portalLoginUrl,
    });
  }

  const actionLabel =
    actionToken.action === LEAVE_REQUEST_ACTION.APPROVE ? "approved" : "rejected";

  return renderResultPage(res, {
    title: `Leave request ${actionLabel}`,
    message: result.message,
    redirectUrl: portalLoginUrl,
  });
});

export default handleEmailLeaveAction;
