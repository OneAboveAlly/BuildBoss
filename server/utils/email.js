const nodemailer = require('nodemailer');
const { logger } = require('../config/logger');

// Konfiguracja transportera email
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Produkcja - użyj prawdziwego SMTP
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development - użyj Ethereal Email (testowy)
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
    });
  }
};

const sendConfirmationEmail = async (email, confirmationToken) => {
  try {
    const transporter = createTransporter();
    
    const confirmationUrl = `${process.env.FRONTEND_URL}/confirm-email/${confirmationToken}`;
    
    const mailOptions = {
          from: process.env.FROM_EMAIL || 'noreply@siteboss.com',
    to: email,
    subject: 'Potwierdź swój adres email - SiteBoss',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Witaj w SiteBoss! 🏗️</h2>
          <p>Dziękujemy za rejestrację. Aby aktywować swoje konto, kliknij poniższy link:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Potwierdź adres email
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Jeśli nie rejestrowałeś się w SiteBoss, zignoruj tę wiadomość.
          </p>
          <p style="color: #666; font-size: 14px;">
            Link wygaśnie za 24 godziny.
          </p>
        </div>
      `,
    };

        const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('Email confirmation sent', {
        to: email,
        confirmationUrl,
        previewUrl: nodemailer.getTestMessageUrl(info)
      });
    }

    logger.info('Confirmation email sent successfully', {
      to: email,
      messageId: info.messageId
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email sending error', {
      error: error.message,
      stack: error.stack,
      to: email,
      type: 'confirmation'
    });
    return { success: false, error: error.message };
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@siteboss.com',
      to: email,
      subject: 'Reset hasła - SiteBoss',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Reset hasła - SiteBoss</h2>
          <p>Otrzymaliśmy prośbę o reset hasła do Twojego konta.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Zresetuj hasło
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.
          </p>
          <p style="color: #666; font-size: 14px;">
            Link wygaśnie za 1 godzinę.
          </p>
        </div>
      `,
    };

        const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('Password reset email sent', {
        to: email,
        resetUrl,
        previewUrl: nodemailer.getTestMessageUrl(info)
      });
    }

    logger.info('Password reset email sent successfully', {
      to: email,
      messageId: info.messageId
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email sending error', {
      error: error.message,
      stack: error.stack,
      to: email,
      type: 'password_reset'
    });
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendConfirmationEmail,
  sendPasswordResetEmail
}; 