import { body } from "express-validator";

export const addBankDetailsValidation = [
  body("accountHolderName")
    .trim()
    .notEmpty()
    .withMessage("Account holder name is required.")
    .isLength({ max: 100 })
    .withMessage("Account holder name must not exceed 100 characters."),

  body("bankName")
    .trim()
    .notEmpty()
    .withMessage("Bank name is required.")
    .isLength({ max: 100 })
    .withMessage("Bank name must not exceed 100 characters."),

  body("accountNumber")
    .trim()
    .notEmpty()
    .withMessage("Account number is required.")
    .matches(/^[0-9]{9,18}$/)
    .withMessage("Account number must be 9 to 18 digits."),

  body("ifscCode")
    .trim()
    .notEmpty()
    .withMessage("IFSC code is required.")
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/i)
    .withMessage("IFSC code must be a valid format."),

  body("branch")
    .trim()
    .notEmpty()
    .withMessage("Branch is required.")
    .isLength({ max: 100 })
    .withMessage("Branch must not exceed 100 characters."),

  body("upiId")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("UPI ID must not exceed 100 characters."),
];

export const updateBankDetailsValidation = [
  body("accountHolderName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Account holder name cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Account holder name must not exceed 100 characters."),

  body("bankName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Bank name cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Bank name must not exceed 100 characters."),

  body("accountNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Account number cannot be empty.")
    .matches(/^[0-9]{9,18}$/)
    .withMessage("Account number must be 9 to 18 digits."),

  body("ifscCode")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("IFSC code cannot be empty.")
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/i)
    .withMessage("IFSC code must be a valid format."),

  body("branch")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Branch cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Branch must not exceed 100 characters."),

  body("upiId")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("UPI ID must not exceed 100 characters."),
];

export const addSkillsValidation = [
  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array.")
    .custom((skills) =>
      skills.every((skill) => typeof skill === "string" && skill.trim()),
    )
    .withMessage("Each skill must be a non-empty string."),

  body("primarySkill")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Primary skill must not exceed 100 characters."),

  body("certifications")
    .optional()
    .isArray()
    .withMessage("Certifications must be an array.")
    .custom((certs) =>
      certs.every((cert) => typeof cert === "string" && cert.trim()),
    )
    .withMessage("Each certification must be a non-empty string."),

  body("resumeUrl")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Resume URL must not exceed 500 characters."),
];

export const updateSkillsValidation = [
  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array.")
    .custom((skills) =>
      skills.every((skill) => typeof skill === "string" && skill.trim()),
    )
    .withMessage("Each skill must be a non-empty string."),

  body("primarySkill")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Primary skill must not exceed 100 characters."),

  body("certifications")
    .optional()
    .isArray()
    .withMessage("Certifications must be an array.")
    .custom((certs) =>
      certs.every((cert) => typeof cert === "string" && cert.trim()),
    )
    .withMessage("Each certification must be a non-empty string."),

  body("resumeUrl")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Resume URL must not exceed 500 characters."),
];
