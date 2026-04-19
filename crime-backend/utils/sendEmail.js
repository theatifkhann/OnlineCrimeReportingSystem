import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // 1. Create a transporter with explicit host/port
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Use SSL (True for port 465)
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
        console.error("Nodemailer Error: ", error);
        throw new Error("Could not send email.");
    }
};

export default sendEmail;