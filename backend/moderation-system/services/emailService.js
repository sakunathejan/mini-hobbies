import { enqueue } from "../../utils/jobQueue.js";
import { sendMail } from "../../services/emailService.js";
import {
  warningIssued,
  suspensionApplied,
  suspensionExpired,
  banApplied,
  appealReceived,
  appealApproved,
  appealRejected,
  moderationLifted,
  appealStatusUpdated,
} from "../emails/emailTemplates.js";

export const queueWarningEmail = (customer, data) => {
  return enqueue("moderation-warning-email", async () => {
    const { subject, html } = warningIssued(customer.name, data);
    await sendMail(customer.email, subject, html);
  });
};

export const queueSuspensionEmail = (customer, data) => {
  return enqueue("moderation-suspension-email", async () => {
    const { subject, html } = suspensionApplied(customer.name, data);
    await sendMail(customer.email, subject, html);
  });
};

export const queueSuspensionExpiredEmail = (customer) => {
  return enqueue("moderation-suspension-expired-email", async () => {
    const { subject, html } = suspensionExpired(customer.name);
    await sendMail(customer.email, subject, html);
  });
};

export const queueBanEmail = (customer, data) => {
  return enqueue("moderation-ban-email", async () => {
    const { subject, html } = banApplied(customer.name, data);
    await sendMail(customer.email, subject, html);
  });
};

export const queueAppealReceivedEmail = () => {
  return enqueue("moderation-appeal-received-email", async () => {
    const { subject, html } = appealReceived();
    const adminEmail = process.env.ADMIN_EMAIL || "admin@minihobbies.lk";
    await sendMail(adminEmail, subject, html);
  });
};

export const queueAppealApprovedEmail = (customer) => {
  return enqueue("moderation-appeal-approved-email", async () => {
    const { subject, html } = appealApproved(customer.name);
    await sendMail(customer.email, subject, html);
  });
};

export const queueAppealRejectedEmail = (customer, notes) => {
  return enqueue("moderation-appeal-rejected-email", async () => {
    const { subject, html } = appealRejected(customer.name, notes);
    await sendMail(customer.email, subject, html);
  });
};

export const queueModerationLiftedEmail = (customer) => {
  return enqueue("moderation-lifted-email", async () => {
    const { subject, html } = moderationLifted(customer.name);
    await sendMail(customer.email, subject, html);
  });
};

export const queueAppealStatusUpdatedEmail = (customer, status) => {
  return enqueue("moderation-appeal-status-email", async () => {
    const { subject, html } = appealStatusUpdated(customer.name, status);
    await sendMail(customer.email, subject, html);
  });
};
