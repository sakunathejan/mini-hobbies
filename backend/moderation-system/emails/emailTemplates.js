export const warningIssued = (customerName, data) => ({
  subject: "Warning — Mini Hobbies",
  html: `<p>Hi ${customerName},</p>
<p>Your account has received a warning:</p>
<p><strong>Reason:</strong> ${data.reason}</p>
${data.message ? `<p>${data.message}</p>` : ""}
<p>Please review our terms of service. Further violations may result in suspension.</p>`
});

export const suspensionApplied = (customerName, data) => ({
  subject: "Account Suspended — Mini Hobbies",
  html: `<p>Hi ${customerName},</p>
<p>Your account has been suspended.</p>
<p><strong>Reason:</strong> ${data.reason}</p>
${data.message ? `<p>${data.message}</p>` : ""}
${data.endAt ? `<p><strong>Suspended until:</strong> ${new Date(data.endAt).toLocaleDateString()}</p>` : ""}
<p>If you believe this was a mistake, you can submit an appeal from your account.</p>`
});

export const suspensionExpired = (customerName) => ({
  subject: "Account Reactivated — Mini Hobbies",
  html: `<p>Hi ${customerName},</p>
<p>Your account suspension period has ended and your account has been reactivated. You can now log in and use your account normally.</p>`
});

export const banApplied = (customerName, data) => ({
  subject: "Account Banned — Mini Hobbies",
  html: `<p>Hi ${customerName},</p>
<p>Your account has been permanently banned.</p>
<p><strong>Reason:</strong> ${data.reason}</p>
${data.message ? `<p>${data.message}</p>` : ""}
<p>If you believe this was a mistake, you can submit an appeal.</p>`
});

export const appealReceived = () => ({
  subject: "New Appeal Submitted — Mini Hobbies",
  html: `<p>A new appeal has been submitted and is awaiting review.</p>`
});

export const appealApproved = (customerName) => ({
  subject: "Appeal Approved — Mini Hobbies",
  html: `<p>Hi ${customerName},</p>
<p>Your appeal has been approved. Your account restrictions have been lifted.</p>`
});

export const appealRejected = (customerName, notes) => ({
  subject: "Appeal Update — Mini Hobbies",
  html: `<p>Hi ${customerName},</p>
<p>Your appeal has been reviewed but was not approved.</p>
${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ""}`
});

export const moderationLifted = (customerName) => ({
  subject: "Account Restored — Mini Hobbies",
  html: `<p>Hi ${customerName},</p>
<p>All moderation actions on your account have been lifted. You can now use your account normally.</p>`
});

const STATUS_LABELS = {
  under_review: "Under Review",
  waiting_customer: "Awaiting Your Response",
  escalated: "Escalated",
};

export const appealStatusUpdated = (customerName, status) => ({
  subject: `Appeal ${STATUS_LABELS[status] || status} — Mini Hobbies`,
  html: `<p>Hi ${customerName},</p>
<p>Your appeal status has been updated to <strong>${STATUS_LABELS[status] || status}</strong>.</p>
${status === "under_review" ? "<p>Our team is now reviewing your case. We'll get back to you soon.</p>" : ""}
${status === "waiting_customer" ? "<p>We need additional information from you. Please check your appeal and respond when you can.</p>" : ""}
${status === "escalated" ? "<p>Your case has been escalated to a senior moderator for further review.</p>" : ""}
<p>You can check the latest status anytime from your account.</p>`
});
