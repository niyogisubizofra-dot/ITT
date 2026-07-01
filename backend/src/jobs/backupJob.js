const { performBackup } = require('../services/backup');

function startBackupJob(intervalMs = 24 * 60 * 60 * 1000) { // Default: once per day
  console.log('Background backup job initialized.');
  
  // Set recurring interval
  setInterval(async () => {
    console.log('Executing scheduled database backup...');
    try {
      const result = await performBackup();
      console.log('Scheduled backup successfully saved to:', result.file);
    } catch (err) {
      console.error('Scheduled backup job failed:', err.message);
    }
  }, intervalMs);
}

module.exports = {
  startBackupJob
};
