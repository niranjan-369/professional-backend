import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({
    path: "./env"
}); // Load environment variables from .env file ye karna jaruri


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER, // your SMTP username
        pass: process.env.SMTP_PASSWORD // your SMTP password
    }
});

const sendMail = async (to, subject, data) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM, // sender address
            to: to, // list of receivers
            subject: subject, // Subject line
            html: `
                    <div style="display: flex; justify-content: center; align-items: center; font-family:sans-serif; height: 100vh; background-color:rgb(173, 238, 135);">
                        <div style="text-align: left; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);"> 
                        <h1>Welcome to Our PawSome Pets Family!</h1> 
                        <p style="font-size:18px ; font-wieght:600;" >${data.username.toUpperCase()},</p>
                        <p style="font-size:16px ; font-wieght:600;">${data.message}</p></br>
                        <p style="font-size:18px ; font-wieght:600;">Best Regards,</p>
                        <p style="font-size:18px ; font-wieght:600;">By PawSome Pets Team.</p> 
                        </div>
                    </div>` // HTML body
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

export { sendMail };
