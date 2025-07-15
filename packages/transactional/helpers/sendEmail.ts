import { env } from "@typebot.io/env";
import { type SendMailOptions, createTransport } from "nodemailer";

export const sendEmail = (
  props: Pick<SendMailOptions, "to" | "html" | "subject">,
) => {
  const transporter = createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USERNAME,
      pass: env.SMTP_PASSWORD,
    },
  });

  console.log('sendEmail', JSON.stringify({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USERNAME,
      pass: env.SMTP_PASSWORD,
    },
  }, null, 2));

  return transporter.sendMail({
    from: env.NEXT_PUBLIC_SMTP_FROM,
    ...props,
  });
};
