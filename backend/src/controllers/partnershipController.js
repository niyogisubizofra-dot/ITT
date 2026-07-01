const { Partnership } = require('../models');

exports.getAllPartnerships = async (req, res, next) => {
  try {
    const partnerships = await Partnership.findAll();
    res.json(partnerships);
  } catch (err) {
    next(err);
  }
};

exports.getPartnershipById = async (req, res, next) => {
  try {
    const partner = await Partnership.findByPk(req.params.id);
    if (!partner) return res.status(404).json({ msg: 'Partnership not found' });
    res.json(partner);
  } catch (err) {
    next(err);
  }
};

exports.createPartnership = async (req, res, next) => {
  try {
    const partner = await Partnership.create(req.body);
    res.status(201).json(partner);
  } catch (err) {
    next(err);
  }
};

exports.updatePartnership = async (req, res, next) => {
  try {
    const partner = await Partnership.findByPk(req.params.id);
    if (!partner) return res.status(404).json({ msg: 'Partnership not found' });
    await partner.update(req.body);
    res.json(partner);
  } catch (err) {
    next(err);
  }
};

exports.deletePartnership = async (req, res, next) => {
  try {
    const partner = await Partnership.findByPk(req.params.id);
    if (!partner) return res.status(404).json({ msg: 'Partnership not found' });
    await partner.destroy();
    res.json({ msg: 'Partnership deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.applyForSponsorship = async (req, res, next) => {
  const { partnershipId, sponsorshipDetails, requestedAmount } = req.body;
  res.status(201).json({
    msg: 'Sponsorship application submitted',
    application: {
      partnershipId,
      sponsorshipDetails,
      requestedAmount,
      status: 'Under Review',
      createdAt: new Date()
    }
  });
};

exports.applyForFunding = async (req, res, next) => {
  const { partnershipId, proposalDetails, fundingAmount } = req.body;
  res.status(201).json({
    msg: 'Funding application submitted',
    application: {
      partnershipId,
      proposalDetails,
      fundingAmount,
      status: 'Submitted',
      createdAt: new Date()
    }
  });
};
