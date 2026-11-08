const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');

async function createNotification({ user, type = 'system', title, message, link = '' }) {
  if (!user) return null;
  return Notification.create({ user, type, title, message, link });
}

async function createManyNotifications(items) {
  if (!items || !items.length) return [];
  return Notification.insertMany(items);
}

const listNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const query = { user: req.user._id };
  if (req.query.unread === 'true') query.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  res.json({
    success: true,
    notifications,
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ success: true, unreadCount: count });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found.' });
  }
  return res.json({ success: true, notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read.' });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found.' });
  }
  return res.json({ success: true, message: 'Notification deleted.' });
});

module.exports = {
  createNotification,
  createManyNotifications,
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
  deleteNotification,
};
