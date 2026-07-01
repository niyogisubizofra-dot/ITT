const express = require('express');
const router = express.Router();
const partnershipController = require('../controllers/partnershipController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const schemas = require('../validations/schemas');

router.use(auth);

// CRUD
router.get('/', authorize(['CEO', 'Chairman', 'Operations Manager']), partnershipController.getAllPartnerships);
router.get('/:id', authorize(['CEO', 'Chairman', 'Operations Manager']), partnershipController.getPartnershipById);
router.post('/', authorize(['CEO', 'Chairman', 'Operations Manager']), validate(schemas.partnership), partnershipController.createPartnership);
router.put('/:id', authorize(['CEO', 'Chairman', 'Operations Manager']), validate(schemas.partnership), partnershipController.updatePartnership);
router.delete('/:id', authorize(['CEO', 'Chairman']), partnershipController.deletePartnership);

// Applications
router.post('/sponsorship', authorize(['CEO', 'Operations Manager']), partnershipController.applyForSponsorship);
router.post('/funding', authorize(['CEO', 'Chairman']), partnershipController.applyForFunding);

module.exports = router;
