export function validateReplyInput(body) {
  const errors = [];
  const { message, reviewId } = body;

  if (!reviewId) {
    errors.push("Review ID is required.");
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    errors.push("Message is required.");
  } else if (message.trim().length > 2000) {
    errors.push("Message must not exceed 2000 characters.");
  }

  return errors;
}

export function sanitizeReplyMessage(text) {
  if (!text) return "";
  return text
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}
