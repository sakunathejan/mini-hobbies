import { validationResult } from "express-validator";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validation failed.",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg }))
    });
  }

  next();
};

export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requirements: "Password must be 8–128 characters with at least one uppercase, one lowercase, and one number."
};

export const PASSWORD_VALIDATOR = (value) => {
  if (!value) throw new Error("Password is required.");
  if (value.length < PASSWORD_RULES.minLength) throw new Error(`Password must be at least ${PASSWORD_RULES.minLength} characters.`);
  if (value.length > PASSWORD_RULES.maxLength) throw new Error(`Password must be at most ${PASSWORD_RULES.maxLength} characters.`);
  if (!/[A-Z]/.test(value)) throw new Error("Password must include an uppercase letter.");
  if (!/[a-z]/.test(value)) throw new Error("Password must include a lowercase letter.");
  if (!/[0-9]/.test(value)) throw new Error("Password must include a number.");
  return true;
};
