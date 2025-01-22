import { InternalServerError } from "~/managers/ErrorManager";
import Mailer from "~/managers/MailerManager";

export type MailOptions = {
    from?: string;
    subject: string;
    text?: string;
    html?: string;
};

export class Mail {
    private mailData: MailOptions;

    constructor(mailData: MailOptions) {
        this.mailData = mailData;
    }

    async send(to: string): Promise<void> {
        try {
            await Mailer.sendMail({
                from: `${
                    process.env.SMTP_DISPLAY_NAME || process.env.SMTP_USER
                } <${process.env.SMTP_USER}>`,
                to: to,
                subject: this.mailData.subject,
                text: this.mailData.text,
                html: this.mailData.html,
            });
        } catch (err: any) {
            console.error(err);
            throw new InternalServerError({
                message: "Error delivering the email",
            });
        }
    }

    static TEMPLATE = {
        VERIFY_EMAIL: (verificationUrl: string) => {
            return {
                subject: "Verify your email address at ArtiomsHosting",
                text: `Welcome to ArtiomsHosting! Please click the following link to verify your email address: ${verificationUrl}`,
                html:
                    `<div style="font-family: Arial, sans-serif; color: #333;">` +
                    `<h1>Welcome to ArtiomsHosting!</h1>` +
                    `<p>To complete your registration, please verify your email address by clicking the link below:</p>` +
                    `<p><a href="${verificationUrl}" style="color: #007BFF; font-size: 18px; font-weight: bold;">Verify Your Email</a></p>` +
                    `<p>If the button does not work please click on the link below</p>` +
                    `<p>${verificationUrl}</p>` +
                    `<p>If you did not request this email, please ignore it.</p>` +
                    `</div>`,
            };
        },

        MFA_EMAIL: (code: string) => {
            return {
                subject: "Your Multi-Factor Authentication (MFA) Code",
                text: `Your Multi-Factor Authentication code is: ${code}\n\nIf you did not request this code, please contact support immediately.`,
                html:
                    `<div style="font-family: Arial, sans-serif; color: #333;">` +
                    `<h1>Multi-Factor Authentication (MFA) Code</h1>` +
                    `<p>Your MFA code is:</p>` +
                    `<p style="font-size: 24px; font-weight: bold; color: #007BFF;">${code}</p>` +
                    `<p>Enter this code in the application to proceed.</p>` +
                    `<p>If you did not request this code, please contact support immediately.</p>` +
                    `</div>`,
            };
        },
    };
}
