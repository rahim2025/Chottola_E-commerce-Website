# Email Service Setup Guide

The application uses Nodemailer to send order confirmation and status update emails.

## Current Status

**The email service is currently in DEV MODE** - emails are logged to the console instead of being sent. This prevents errors during development.

## To Enable Real Email Sending

Add these environment variables to your `.env` file in the `backend` folder:

### Option 1: Gmail (Recommended for testing)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM="Chottola E-Commerce <your-email@gmail.com>"
```

**Important for Gmail:**
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password (not your regular Gmail password) in `EMAIL_PASS`

### Option 2: SendGrid (Recommended for production)

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM="Chottola E-Commerce <noreply@yourdomain.com>"
```

### Option 3: Other SMTP Services

For services like:
- AWS SES
- Mailgun
- Postmark
- Mailtrap (for testing)

```env
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-username
EMAIL_PASS=your-password
EMAIL_FROM="Chottola E-Commerce <noreply@yourdomain.com>"
```

## Environment Variables Explained

- `EMAIL_HOST`: SMTP server hostname
- `EMAIL_PORT`: SMTP port (usually 587 for TLS, 465 for SSL)
- `EMAIL_SECURE`: Set to `true` for port 465, `false` for other ports
- `EMAIL_USER`: Your SMTP username
- `EMAIL_PASS`: Your SMTP password or API key
- `EMAIL_FROM`: The "From" address that appears in emails

## Testing Email Configuration

After adding the environment variables:

1. Restart your backend server
2. Place a test order
3. Check the console logs for:
   - ✅ Success: "Order confirmation email sent"
   - ❌ Error: Check the error message for troubleshooting

## Current Behavior (DEV Mode)

When email credentials are NOT configured:
- Order placement works normally
- Emails are logged to console with this format:
  ```
  📧 ================== EMAIL (DEV MODE) ==================
  From: "Chottola E-Commerce" <noreply@chottola.com>
  To: customer@example.com
  Subject: Order Confirmation - ORD-12345678-001
  ========================================================
  ```

## Troubleshooting

### "Email service not configured"
- Add the EMAIL_* variables to your `.env` file

### Gmail "Less secure app" error
- Use App Password instead of your regular password
- Enable 2-Factor Authentication first

### Connection timeout
- Check your firewall settings
- Verify EMAIL_HOST and EMAIL_PORT are correct
- Some ISPs block port 587, try port 465 with EMAIL_SECURE=true

### Authentication failed
- Double-check EMAIL_USER and EMAIL_PASS
- For Gmail, ensure you're using an App Password

## Production Recommendations

1. **Use a dedicated email service** (SendGrid, AWS SES, etc.)
2. **Set up SPF, DKIM, and DMARC records** for your domain
3. **Use a custom domain** instead of Gmail
4. **Monitor email delivery rates** and bounces
5. **Implement email templates** with your branding
