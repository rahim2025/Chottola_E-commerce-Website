const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  // Check if email is configured
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false // Accept self-signed certificates
        }
      });
    } catch (error) {
      console.error('❌ Error creating email transporter:', error.message);
      return null;
    }
  }
  
  // Development fallback - logs to console instead of sending
  console.log('⚠️  Email service not configured - emails will be logged to console');
  return {
    sendMail: async (mailOptions) => {
      console.log('\n📧 ================== EMAIL (DEV MODE) ==================');
      console.log('From:', mailOptions.from);
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('========================================================\n');
      return { messageId: 'dev-mode', accepted: [mailOptions.to] };
    },
    verify: async () => {
      console.log('✅ Email service in DEV mode (console logging only)');
      return true;
    }
  };
};

// Send OTP email (for email-based verification/login)
exports.sendEmailOTP = async ({ to, code, expiresInMinutes = 5, purpose = 'verification' }) => {
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error('Email transporter not available');
  }

  const subject = `Your OTP Code (${code})`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Chottola E-Commerce" <noreply@chottola.com>',
    to,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; padding: 24px; }
          .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; }
          .code { font-size: 32px; letter-spacing: 6px; font-weight: 700; padding: 12px 16px; background: #f3f4f6; border-radius: 8px; display: inline-block; }
          .muted { color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <h2>Your OTP Code</h2>
            <p>Use the following one-time password to complete your ${purpose}.</p>
            <p><span class="code">${code}</span></p>
            <p class="muted">This code expires in ${expiresInMinutes} minutes.</p>
            <p class="muted">If you didn’t request this, you can ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Your OTP code is ${code}. It expires in ${expiresInMinutes} minutes. If you didn’t request this, ignore this email.`
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('✅ OTP email sent:', info.messageId);
  return info;
};

// Send order confirmation email
exports.sendOrderConfirmation = async (order, userEmail) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('⚠️  Email transporter not available - skipping email');
      return null;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Chottola E-Commerce" <noreply@chottola.com>',
      to: userEmail,
      subject: `Order Placed - ${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .item { border-bottom: 1px solid #e5e7eb; padding: 15px 0; }
            .item:last-child { border-bottom: none; }
            .total { font-size: 18px; font-weight: bold; color: #4F46E5; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Order Placed!</h1>
              <p>Thank you for your order</p>
            </div>
            
            <div class="content">
              <p>Dear ${order.shippingAddress.fullName || order.shippingAddress.name},</p>
              
              <p>Your order has been successfully placed and is being processed. Here are your order details:</p>
              
              <div class="order-details">
                <h2>Order #${order.orderNumber}</h2>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod.replace('_', ' ').toUpperCase()}</p>
                <p><strong>Order Status:</strong> ${order.orderStatus.toUpperCase()}</p>
                
                <h3 style="margin-top: 25px;">Items Ordered:</h3>
                ${order.items.map(item => `
                  <div class="item">
                    <strong>${item.name}</strong><br>
                    Quantity: ${item.quantity} × ৳${item.price.toFixed(2)} = ৳${(item.quantity * item.price).toFixed(2)}
                  </div>
                `).join('')}
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                  <p><strong>Subtotal:</strong> ৳${order.subtotal.toFixed(2)}</p>
                  ${order.tax > 0 ? `<p><strong>Tax:</strong> ৳${order.tax.toFixed(2)}</p>` : ''}
                  <p><strong>Shipping:</strong> ${order.shippingCost > 0 ? `৳${order.shippingCost.toFixed(2)}` : 'Free'}</p>
                  ${order.discount > 0 ? `<p style="color: #10b981;"><strong>Discount:</strong> -৳${order.discount.toFixed(2)}</p>` : ''}
                  <p class="total">Total: ৳${order.totalAmount.toFixed(2)}</p>
                </div>
                
                <h3 style="margin-top: 25px;">Shipping Address:</h3>
                <p>
                  ${order.shippingAddress.fullName || order.shippingAddress.name}<br>
                  ${order.shippingAddress.phone}<br>
                  ${order.shippingAddress.address || order.shippingAddress.street}<br>
                  ${order.shippingAddress.city}, ${order.shippingAddress.division || order.shippingAddress.state} ${order.shippingAddress.postalCode || order.shippingAddress.zipCode || ''}<br>
                  ${order.shippingAddress.country || 'Bangladesh'}
                </p>
                
                ${order.notes ? `
                  <h3 style="margin-top: 25px;">Order Notes:</h3>
                  <p style="background: #f3f4f6; padding: 15px; border-radius: 6px;">${order.notes}</p>
                ` : ''}
              </div>
              
              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order._id}" class="button">
                  Track Your Order
                </a>
              </center>
              
              <p>You can track your order status anytime by logging into your account.</p>
              
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
              
              <p>Thank you for shopping with us!</p>
            </div>
            
            <div class="footer">
              <p>Chottola E-Commerce<br>
              Questions? Contact us at support@chottola.com</p>
              <p style="font-size: 12px; color: #9ca3af;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Order Placed - ${order.orderNumber}

Dear ${order.shippingAddress.fullName || order.shippingAddress.name},

Your order has been successfully placed!

Order Number: ${order.orderNumber}
Order Date: ${new Date(order.createdAt).toLocaleDateString()}
Payment Method: ${order.paymentMethod.replace('_', ' ').toUpperCase()}
Status: ${order.orderStatus.toUpperCase()}

Items Ordered:
${order.items.map(item => 
  `- ${item.name}\n  Quantity: ${item.quantity} × ৳${item.price.toFixed(2)} = ৳${(item.quantity * item.price).toFixed(2)}`
).join('\n')}

Subtotal: ৳${order.subtotal.toFixed(2)}
${order.tax > 0 ? `Tax: ৳${order.tax.toFixed(2)}\n` : ''}Shipping: ${order.shippingCost > 0 ? `৳${order.shippingCost.toFixed(2)}` : 'Free'}
${order.discount > 0 ? `Discount: -৳${order.discount.toFixed(2)}\n` : ''}Total: ৳${order.totalAmount.toFixed(2)}

Shipping Address:
${order.shippingAddress.fullName || order.shippingAddress.name}
${order.shippingAddress.phone}
${order.shippingAddress.address || order.shippingAddress.street}
${order.shippingAddress.city}, ${order.shippingAddress.division || order.shippingAddress.state} ${order.shippingAddress.postalCode || order.shippingAddress.zipCode || ''}
${order.shippingAddress.country || 'Bangladesh'}

${order.notes ? `Order Notes: ${order.notes}\n` : ''}
Track your order: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order._id}

Thank you for shopping with us!

Chottola E-Commerce
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Order confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error);
    // Don't throw error - email failure shouldn't break order creation
    return null;
  }
};

// Send order status update email
exports.sendOrderStatusUpdate = async (order, userEmail) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('⚠️  Email transporter not available - skipping email');
      return null;
    }
    
    const statusMessages = {
      pending: { emoji: '⏳', title: 'Order Received', message: 'Your order is pending confirmation.' },
      processing: { emoji: '⚙️', title: 'Processing Your Order', message: 'We are preparing your order for shipment.' },
      shipped: { emoji: '🚚', title: 'Order Shipped', message: 'Your order is on its way!' },
      delivered: { emoji: '📦', title: 'Order Delivered', message: 'Your order has been delivered. Enjoy your purchase!' },
      cancelled: { emoji: '❌', title: 'Order Cancelled', message: 'Your order has been cancelled.' }
    };
    
    const status = statusMessages[order.orderStatus] || statusMessages.pending;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Chottola E-Commerce" <noreply@chottola.com>',
      to: userEmail,
      subject: `${status.title} - Order #${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .status-box { background: white; padding: 30px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${status.emoji} ${status.title}</h1>
            </div>
            
            <div class="content">
              <p>Dear ${order.shippingAddress.fullName || order.shippingAddress.name},</p>
              
              <div class="status-box">
                <h2 style="font-size: 48px; margin: 0;">${status.emoji}</h2>
                <h3>Order #${order.orderNumber}</h3>
                <p style="font-size: 18px; color: #4F46E5; font-weight: bold;">${status.message}</p>
              </div>
              
              <p>You can track your order and view full details by clicking the button below:</p>
              
              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order._id}" class="button">
                  Track Your Order
                </a>
              </center>
              
              <p>Thank you for shopping with us!</p>
            </div>
            
            <div class="footer">
              <p>Chottola E-Commerce</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
${status.title}

Dear ${order.shippingAddress.fullName || order.shippingAddress.name},

Order #${order.orderNumber}

${status.message}

Track your order: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order._id}

Thank you for shopping with us!
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Order status email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending order status email:', error);
    return null;
  }
};

module.exports = {
  sendEmailOTP: exports.sendEmailOTP,
  sendOrderConfirmation: exports.sendOrderConfirmation,
  sendOrderStatusUpdate: exports.sendOrderStatusUpdate
};
