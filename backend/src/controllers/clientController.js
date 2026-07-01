const { Client } = require('../models');

exports.getAllClients = async (req, res, next) => {
  try {
    const clients = await Client.findAll();
    res.json(clients);
  } catch (err) {
    next(err);
  }
};

exports.getClientById = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ msg: 'Client not found' });
    res.json(client);
  } catch (err) {
    next(err);
  }
};

exports.createClient = async (req, res, next) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
};

exports.updateClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ msg: 'Client not found' });
    await client.update(req.body);
    res.json(client);
  } catch (err) {
    next(err);
  }
};

exports.deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ msg: 'Client not found' });
    await client.destroy();
    res.json({ msg: 'Client deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Client specific mocks
exports.submitServiceRequest = async (req, res, next) => {
  const { clientId, requestDetails } = req.body;
  res.status(201).json({
    msg: 'Service request submitted successfully',
    request: {
      id: Math.round(Math.random() * 1000),
      clientId,
      requestDetails,
      status: 'Open',
      createdAt: new Date()
    }
  });
};

exports.submitFeedback = async (req, res, next) => {
  const { clientId, feedbackText, rating } = req.body;
  res.status(201).json({
    msg: 'Feedback submitted',
    feedback: {
      id: Math.round(Math.random() * 1000),
      clientId,
      feedbackText,
      rating,
      createdAt: new Date()
    }
  });
};

exports.manageContract = async (req, res, next) => {
  const { clientId, contractDetails, action } = req.body; // e.g. "renew", "terminate"
  res.json({
    msg: `Contract ${action}ed successfully`,
    contract: {
      clientId,
      contractDetails,
      status: action === 'renew' ? 'Active' : 'Terminated',
      updatedAt: new Date()
    }
  });
};
