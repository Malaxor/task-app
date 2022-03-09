const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = {
  sendWelcomeEmail(email, name) {
    sgMail.send({ 
      to: email,
      from: 'nogobaduk@gmail.com',
      subject: 'Thanks for Joining!',
      text: `Welcome to Task Manager, ${name}. Please let me know how you like it.`
    });
  },
  sendCancelationEmail(email, name) {
    sgMail.send({ 
      to: email,
      from: 'nogobaduk@gmail.com',
      subject: "You've Cancelled Your Account",
      text: `${name}, we're sorry to see you go. Is there anything we could have done better to have kept you?`
    });
  }
};