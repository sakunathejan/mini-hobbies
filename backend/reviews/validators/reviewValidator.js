export function validateReviewInput(body) {
  const errors = [];
  const { rating, comment, title } = body;

  if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push("Rating must be an integer between 1 and 5.");
  }

  if (!comment || typeof comment !== "string" || comment.trim().length < 10) {
    errors.push("Comment must be at least 10 characters.");
  }

  if (comment && comment.length > 5000) {
    errors.push("Comment must not exceed 5000 characters.");
  }

  if (title && title.length > 200) {
    errors.push("Title must not exceed 200 characters.");
  }

  return errors;
}

export function sanitizeComment(text) {
  if (!text) return "";
  return text
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}
