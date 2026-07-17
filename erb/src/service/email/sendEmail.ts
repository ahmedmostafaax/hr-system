import nodemailer, { Transporter } from "nodemailer";
import { emailTampelet } from "./emailTemplate";
import dotenv from "dotenv";

dotenv.config();


type SendEmailParams = {
  message: string;
  email: string;
};

export const sendEmail = async ({
  message,
  email,
}: SendEmailParams): Promise<void> => {
  try {
    const transporter: Transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER as string,
        pass: process.env.EMAIL_PASS as string,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: `"lame3" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Message from Lame3 Team",
      html: emailTampelet(message),
    });

    console.log("Email sent:", info.messageId);
  } catch (error: any) {
    console.error("Email error:", error);
    throw new Error("Failed to send email");
  }
};