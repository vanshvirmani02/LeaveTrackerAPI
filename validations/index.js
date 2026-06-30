import { validationResult } from "express-validator";

export * from "./authValidations.js";

export const validateReq = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));
  const jsonResp = {
    status: "REQUEST FAILURE",
    message: "Validation Failed",
    data: extractedErrors,
  };
  return res.status(400).send(jsonResp);
};
