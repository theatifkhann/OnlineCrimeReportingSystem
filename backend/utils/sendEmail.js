import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    const emailEnabled = String(process.env.EMAIL_ENABLED ?? 'true').trim().toLowerCase();

    if (emailEnabled === 'false') {
        console.warn(`Email skipped because EMAIL_ENABLED=false. To: ${options.email}, Subject: ${options.subject}`);
        return;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email service is not configured. Set EMAIL_USER and EMAIL_PASS.');
    }

    // 1. Create a transporter with explicit host/port
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Use SSL (True for port 465)
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // 2. Define the email options
    const mailOptions = {
        from: `"CRMS Automated System" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    // 3. Send the email with error logging
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
    } catch (error) {
        if (error.code === 'EAUTH' || error.responseCode === 535) {
            throw new Error('Email authentication failed. Use a valid Gmail App Password in EMAIL_PASS.');
        }

        console.error("Nodemailer Error: ", error);
        throw new Error(error.message || "Could not send email.");
    }
};

export default sendEmail;
