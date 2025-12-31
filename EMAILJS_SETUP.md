# EmailJS Setup Guide for Password Reset

This guide will help you set up EmailJS to send verification codes via email for password reset functionality.

## Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account (free tier includes 200 emails/month)
3. Verify your email address

## Step 2: Connect Email Service

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions to connect your email
5. Note your **Service ID** (e.g., `service_xxxxx`)

## Step 3: Create Email Template

1. Go to **Email Templates** in EmailJS dashboard
2. Click **Create New Template**
3. Use this template structure:

**Subject:**
```
Password Reset Verification Code - {{app_name}}
```

**Content:**
```
Hello,

You requested a password reset for your {{app_name}} account.

Your verification code is: {{verification_code}}

This code will expire in {{expiration_time}}.

If you didn't request this, please ignore this email.

Best regards,
{{app_name}} Team
```

4. Save the template and note your **Template ID** (e.g., `template_xxxxx`)

## Step 4: Get Public Key

1. Go to **Account** → **General** in EmailJS dashboard
2. Find your **Public Key** (e.g., `xxxxxxxxxxxxx`)
3. Copy it

## Step 5: Configure in Project

1. Create a `.env` file in the project root (copy from `.env.example`)
2. Add your EmailJS credentials:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

3. Save the `.env` file
4. Restart your development server (`npm run dev`)

## Step 6: Test

1. Start the app: `npm run dev`
2. Click "Forgot password?" on the login form
3. Enter a registered email address
4. Check your email inbox for the verification code
5. Enter the code to reset your password

## Troubleshooting

### Email not sending?
- Check that all three environment variables are set correctly
- Verify your email service is connected in EmailJS dashboard
- Check browser console for error messages
- Make sure you're not exceeding the free tier limit (200 emails/month)

### Code not received?
- Check spam/junk folder
- Verify email address is correct
- Check EmailJS dashboard for delivery status
- Try resending the code

### Still having issues?
- Check EmailJS documentation: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- Verify template placeholders match: `{{to_email}}`, `{{verification_code}}`, `{{app_name}}`, `{{expiration_time}}`

## Security Notes

- Never commit `.env` file to version control
- The `.env` file is already in `.gitignore`
- In production, consider using a backend service for email sending
- EmailJS free tier is suitable for development and small projects

## Alternative: Backend Email Service

For production applications, consider:
- Node.js backend with Nodemailer
- AWS SES (Simple Email Service)
- SendGrid
- Mailgun
- Firebase Cloud Functions with email service
