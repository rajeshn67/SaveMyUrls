import { Resend } from 'resend';

const getVerificationLink = (token) => {
  const baseUrl = process.env.BACKEND_PUBLIC_URL || process.env.FRONTEND_URL || '';
  const trimmedBaseUrl = baseUrl.replace(/\/$/, '');

  if (!trimmedBaseUrl) {
    return `/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  }

  return `${trimmedBaseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
};

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn('Resend email skipped: RESEND_API_KEY or RESEND_FROM_EMAIL is not configured');
    return { skipped: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject,
      html,
  });

  if (error) {
    throw new Error(`Resend email failed: ${error.message}`);
  }

  return data;
};

export const sendWelcomeEmail = async ({ to, fullName }) => {
  return sendEmail({
    to,
    subject: 'Welcome to SaveMyURLs',
    html: `
      <p>Hi ${fullName || 'there'},</p>
      <p>Welcome to SaveMyURLs. Your account is ready, and you can start saving links now.</p>
    `,
  });
};

export const sendVerificationEmail = async ({ to, fullName, token }) => {
  const verificationLink = getVerificationLink(token);

  return sendEmail({
    to,
    subject: 'Verify your SaveMyURLs email',
    html: `
      <p>Hi ${fullName || 'there'},</p>
      <p>Please verify your email address to finish setting up your SaveMyURLs account.</p>
      <p><a href="${verificationLink}">Verify email</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
};
