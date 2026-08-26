const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const adminRoutes = require('./routes/adminRoutes');
const planRoutes = require('./routes/planRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const profileRoutes = require("./routes/profileRoutes");
const path = require("path");
const accountSettingRoutes = require("./routes/accountSettingRoutes");
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminReturnRoutes = require('./routes/adminReturnRoutes',);

const app = express();

app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'FX Wallet Backend Running',
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/settings', settingsRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/profile",profileRoutes );
app.use("/api/settings", accountSettingRoutes);
app.use("/uploads",express.static(path.join(__dirname, "../uploads")));
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/returns',adminReturnRoutes,);
app.use('/api/usdt-payment', require('./routes/usdtPaymentRoutes'));
app.use('/api/payment-proof', require('./routes/paymentProofRoutes'));
app.use('/api/cdm', require('./routes/cdmRoutes'));
app.use('/api/referral', require('./routes/referralRoutes'));

module.exports = app;