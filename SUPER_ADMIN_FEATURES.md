# Super Admin Features Documentation

## Overview
This document outlines all super-admin exclusive features in the Chottola e-commerce platform.

## User Role Hierarchy
1. **Customer** - Regular shoppers (default role)
2. **Moderator** - Entry-level admin with limited permissions
3. **Admin** - Full product/order management
4. **Super-Admin** - Complete system control

---

## Super Admin Features

### 1. User Management (`/admin/users`)
**Exclusive Capabilities:**
- ✅ View all users with advanced filtering
- ✅ Change user roles (Customer → Moderator → Admin → Super-Admin)
- ✅ Delete any user account
- ✅ Edit user permissions for admins/moderators
- ✅ Suspend/activate user accounts
- ✅ View user statistics by role

**Features:**
- Search by name, email, or phone
- Filter by role (customer, moderator, admin, super-admin)
- Real-time role updates via dropdown
- Status management (active, inactive, suspended, pending-verification)
- Permission assignment for admin roles
- User analytics dashboard

**Available Permissions:**
- `manage-products` - Create, edit, delete products
- `manage-orders` - Process and manage orders
- `manage-users` - View and manage users (super-admin only)
- `manage-categories` - Create and edit categories
- `view-analytics` - Access analytics dashboard
- `manage-reviews` - Moderate product reviews
- `manage-inventory` - Stock management
- `manage-discounts` - Create coupons and discounts
- `manage-shipping` - Shipping method configuration
- `system-settings` - Access system settings (super-admin only)

---

### 2. System Settings (`/admin/settings`)
**Access:** Super-Admin Only

#### General Settings
- Site name and description
- Contact email and phone
- Currency selection (USD, EUR, GBP, BDT, INR)

#### Commerce Settings
- Tax rate configuration
- Shipping fee settings
- Free shipping threshold
- Loyalty points per dollar
- Auto-cancel unpaid orders (hours)

#### Feature Toggles
- Enable/disable newsletter subscription
- Enable/disable product reviews
- Enable/disable wishlist feature
- Enable/disable loyalty points system
- Enable/disable SMS notifications

#### Security & Access
- **Maintenance Mode** - Take site offline for maintenance
- Allow/block new registrations
- Require email verification for new users
- Session timeout duration
- Maximum login attempts before account lock

#### Payment Gateways
- **Stripe** - Public key & secret key configuration
- **PayPal** - Client ID & secret configuration
- **Razorpay** - Key ID & secret configuration

#### Email Configuration
- Email service provider (Gmail, Outlook, SendGrid, Mailgun)
- SMTP credentials
- Test email functionality

---

### 3. Enhanced Dashboard (`/admin/dashboard`)
**Super-Admin View Includes:**

#### User Analytics
- Total users count
- Active users
- Total admins (admin + super-admin)
- Suspended accounts
- Breakdown by role:
  - Customers
  - Moderators
  - Admins
  - Super Admins

#### Order Statistics
- Total orders (all time)
- Total revenue
- Average order value
- Orders by status breakdown

#### Visual Enhancements
- Gradient cards for statistics
- Icons for quick navigation
- Direct link to System Settings
- Real-time data updates

---

## Backend API Routes

### User Management Routes
```
GET    /api/users              - Get all users
GET    /api/users/:id          - Get user by ID
PUT    /api/users/:id/role     - Update user role (super-admin only)
PUT    /api/users/:id/status   - Update user status
PUT    /api/users/:id          - Update user details & permissions
DELETE /api/users/:id          - Delete user (super-admin only)
```

### Role-Based Access Control
- **Customer**: Shopping features only
- **Moderator**: Limited admin access (reviews, basic inventory)
- **Admin**: Full product/order management
- **Super-Admin**: All features + user management + system settings

---

## Technical Implementation

### Frontend Components
1. **AdminUsers.jsx** - Complete user management interface
   - User table with role badges
   - Status dropdown for quick updates
   - Edit modal with permission checkboxes
   - Search and filter functionality

2. **SystemSettings.jsx** - Comprehensive settings panel
   - Form-based configuration
   - Organized into logical sections
   - Save all settings functionality
   - Test email feature

3. **Dashboard.jsx** - Enhanced analytics
   - Role-based content rendering
   - User statistics (super-admin only)
   - Order analytics (all admins)

### Backend Controllers
- `userController.js`:
  - `updateUserRole()` - Change user roles
  - `updateUserStatus()` - Update account status
  - `updateUser()` - Comprehensive user updates

### Middleware Protection
- `requireUserManagement` - Restricts to super-admin
- `requireAdmin` - Allows admin and above
- Role validation in User model

---

## Security Features

### Rate Limiting
- Authentication: 10,000 requests/15 min (effectively disabled for dev)
- Registration: 10,000 requests/hour
- API calls: 10,000 requests/15 min
- Admin routes: 10,000 requests/15 min

### Access Control
- JWT-based authentication
- Role-based route protection
- Cannot delete own account (super-admin)
- Permission-based feature access

---

## Usage Instructions

### To Access Super-Admin Features:
1. Register/login with super-admin credentials
2. Navigate to `/admin/dashboard`
3. Access features:
   - Users: `/admin/users`
   - Settings: `/admin/settings`

### To Assign Permissions:
1. Go to `/admin/users`
2. Click "Edit" on target user
3. Select role (moderator/admin/super-admin)
4. Check desired permissions
5. Click "Save Changes"

### To Change User Role:
- **Method 1:** Use dropdown in user table (quick)
- **Method 2:** Click "Edit" → Select role → Save

### To Suspend Users:
1. Find user in `/admin/users`
2. Change status dropdown to "Suspended"
3. User account is immediately locked

---

## Future Enhancements (Suggested)

- [ ] Activity logs for admin actions
- [ ] Bulk user operations
- [ ] Advanced analytics with charts
- [ ] Email templates customization
- [ ] Backup and restore functionality
- [ ] Multi-language support
- [ ] Custom permission creation
- [ ] Audit trail for sensitive operations

---

## Notes
- Only super-admins can create/delete other admins
- Deleting own account is prevented
- All actions are immediately effective
- Backend server restart required for system settings changes
- Email configuration requires valid SMTP credentials

---

**Last Updated:** January 20, 2026  
**Version:** 1.0
