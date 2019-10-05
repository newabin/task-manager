const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)


const sendWelcomeEmail = (email, name)=>{
    sgMail.send({
        to : email,
        from : 'whopravinewa@gmail.com',
        subject : 'Thanks for Joining Task Manager App',
        text : `Welcome to the app, ${name}. Let me know how you get along with the app.`,
    })
}

const sendDeactivateEmail = (email, name)=>{
    sgMail.send({
        to : email,
        from : 'whopravinewa@gmail.com',
        subject : 'Deleted your Account',
        text : `${name}, You have succesfully deleted your account from Task Manager App.`,
    })
}

module.exports = {
    sendWelcomeEmail,
    sendDeactivateEmail
}