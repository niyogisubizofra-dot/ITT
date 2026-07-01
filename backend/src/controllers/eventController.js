const { Event, User } = require('../models');

exports.getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      include: [{ model: User, as: 'organizer', attributes: ['username', 'email'] }]
    });
    res.json(events);
  } catch (err) {
    next(err);
  }
};

exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: User, as: 'organizer', attributes: ['username', 'email'] }]
    });
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const event = await Event.create({
      ...req.body,
      organizerId: req.user.id
    });
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    await event.update(req.body);
    res.json(event);
  } catch (err) {
    next(err);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    await event.destroy();
    res.json({ msg: 'Event deleted successfully' });
  } catch (err) {
    next(err);
  }
};
