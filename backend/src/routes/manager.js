const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const schemas = require('../validations/schemas');

// All manager endpoints require authentication
router.use(auth);

// Managers can list and manage employees (limited compared to CEO/Chairman)
router.get('/employees', authorize(['CEO', 'Chairman', 'Manager', 'HR Manager', 'Operations Manager']), employeeController.getAllEmployees);
router.get('/employees/:id', authorize(['CEO', 'Chairman', 'Manager', 'HR Manager', 'Operations Manager']), employeeController.getEmployeeById);
router.post('/employees', authorize(['CEO', 'Chairman', 'Manager', 'HR Manager']), validate(schemas.employee), employeeController.createEmployee);
router.put('/employees/:id', authorize(['CEO', 'Chairman', 'Manager', 'HR Manager']), validate(schemas.employee), employeeController.updateEmployee);
router.delete('/employees/:id', authorize(['CEO', 'Chairman', 'Manager']), employeeController.deleteEmployee);

// Suspend / reactivate employee (toggle status) - managers allowed
router.post('/employees/:id/suspend', authorize(['CEO', 'Chairman', 'Manager', 'HR Manager']), async (req, res, next) => {
  try {
    const emp = await employeeController.getEmployeeByIdHandler ? employeeController.getEmployeeByIdHandler(req.params.id) : null;
    // Fallback: load model directly if helper not present
    const { Employee } = require('../models');
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });
    employee.status = (employee.status === 'Active') ? 'Terminated' : 'Active';
    await employee.save();
    res.json({ msg: `Employee status updated to ${employee.status}`, employee });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
