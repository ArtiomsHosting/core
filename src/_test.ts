import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "",
    port: 465,
    secure: true,
    auth: {
        user: "",
        pass: "",
    },
});

async function main() {
    const info = await transporter.sendMail({
        from: '"ArtiomsHosting" <@gmail.com>',
        to: "@gmail.com",
        subject: "Hello ✔",
        html: "<b>Hello world?</b>",
    });

    console.log("Message sent: %s", info.messageId);
}

main();
