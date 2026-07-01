const fs = require('fs');
const path = require('path');
const models = require('../models');

async function performBackup() {
  const backupDir = path.join(__dirname, '../../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

  const backupData = {};

  try {
    // Export data from all registered Sequelize models
    for (const modelName of Object.keys(models)) {
      if (modelName === 'sequelize' || modelName === 'Sequelize') continue;
      const records = await models[modelName].findAll({ raw: true });
      backupData[modelName] = records;
    }

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`Backup completed successfully: ${backupFile}`);
    return { success: true, file: backupFile };
  } catch (err) {
    console.error('Backup failed:', err.message);
    throw err;
  }
}

module.exports = {
  performBackup
};
