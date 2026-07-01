const { Announcement, Notification, User } = require('../models');
const { sendMail } = require('../services/mail');
const { sendSMS } = require('../services/sms');

// Announcement CRUD
exports.getAllAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(announcements);
  } catch (err) {
    next(err);
  }
};

exports.createAnnouncement = async (req, res, next) => {
  const { title, content } = req.body;
  try {
    const announcement = await Announcement.create({
      title,
      content,
      createdById: req.user.id
    });
    res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
};

// Internal notification CRUD
exports.getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!notif) return res.status(404).json({ msg: 'Notification not found' });
    notif.isRead = true;
    await notif.save();
    res.json(notif);
  } catch (err) {
    next(err);
  }
};

// Send direct email notification
exports.sendEmailTrigger = async (req, res, next) => {
  const { userId, subject, body } = req.body;
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ msg: 'Recipient user not found' });

    const info = await sendMail({
      to: user.email,
      subject,
      text: body,
      html: `<p>${body}</p>`
    });

    res.json({ msg: 'Email notification processed', info });
  } catch (err) {
    next(err);
  }
};

// Send direct SMS notification
exports.sendSMSTrigger = async (req, res, next) => {
  const { phone, body } = req.body;
  try {
    const info = await sendSMS(phone, body);
    res.json({ msg: 'SMS notification processed', info });
  } catch (err) {
    next(err);
  }
};
