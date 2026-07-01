const { Project, ProjectTeam, Employee, User, Client, Document, Report } = require('../models');
const path = require('path');

exports.getAllProjects = async (req, res, next) => {
  try {
    const projects = await Project.findAll({
      include: [
        { model: Client, as: 'client', attributes: ['name', 'company'] },
        { model: Employee, as: 'teamMembers', attributes: ['id', 'position'], include: [{ model: User, as: 'user', attributes: ['username'] }] }
      ]
    });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: Employee, as: 'teamMembers', include: [{ model: User, as: 'user', attributes: ['username', 'email'] }] },
        { model: Document, as: 'documents' }
      ]
    });
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const newProj = await Project.create(req.body);
    res.status(201).json(newProj);
  } catch (err) {
    next(err);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });

    await project.update(req.body);
    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });

    await project.destroy();
    res.json({ msg: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Assign team member
exports.assignTeamMember = async (req, res, next) => {
  const { projectId, employeeId, role } = req.body;
  try {
    const teamAssignment = await ProjectTeam.create({
      projectId,
      employeeId,
      role: role || 'Member'
    });
    res.status(201).json({ msg: 'Team member assigned successfully', teamAssignment });
  } catch (err) {
    next(err);
  }
};

// Upload document
exports.uploadProjectDocument = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded' });
  }

  const { projectId, category } = req.body;
  try {
    const filePath = req.file.path.startsWith('http') 
      ? req.file.path 
      : path.relative(path.join(__dirname, '../../'), req.file.path);

    const doc = await Document.create({
      name: req.file.originalname,
      path: filePath,
      category: category || 'Project',
      projectId: projectId || null,
      uploadedById: req.user.id
    });

    res.status(201).json({ msg: 'File uploaded successfully', document: doc });
  } catch (err) {
    next(err);
  }
};

// Generate project progress report
exports.generateProjectReport = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [{ model: Client, as: 'client' }, { model: Document, as: 'documents' }]
    });
    if (!project) return res.status(404).json({ msg: 'Project not found' });

    const reportTitle = `${project.name} Progress Report`;
    const reportPath = `reports/project-${project.id}-${Date.now()}.json`;

    // Save report metadata
    const report = await Report.create({
      title: reportTitle,
      type: 'Project',
      path: reportPath,
      createdById: req.user.id
    });

    res.json({
      msg: 'Project report generated',
      report,
      details: {
        projectName: project.name,
        status: project.status,
        budget: project.budget,
        documentsCount: project.documents.length,
        client: project.client ? project.client.name : 'No client linked',
        timestamp: new Date()
      }
    });
  } catch (err) {
    next(err);
  }
};
