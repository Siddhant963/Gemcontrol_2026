const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const GirviModel = require('../Models/GirviModel');
const GirviInterestModel = require('../Models/GirviInterestModel');
const ActivityModel = require('../Models/ActivitesModel');
const { buildFullExportWorkbook } = require('../Controllers/adminController');

const EXPORTS_DIR = path.join(__dirname, '../Exports');

// Function to add activity (reused from controller)
const addActivity = async (userId, activityType, description) => {
  try {
    const newActivity = new ActivityModel({
      userId: userId || 'system',
      activityType,
      description,
      timestamp: new Date(),
    });
    await newActivity.save();
    return newActivity;
  } catch (error) {
    console.error("Error adding activity:", error);
    throw new Error("Internal server error");
  }
};

// Monthly interest calculation function
const calculateMonthlyInterest = async () => {
  try {
    console.log('Starting monthly Girvi interest calculation...');
    
    const activeGirviItems = await GirviModel.find({ 
      status: 'active', 
      removeAt: null 
    });

    let totalItemsUpdated = 0;
    let totalInterestAdded = 0;
    
    for (const girviItem of activeGirviItems) {
      const preview = girviItem.previewInterest();

      if (preview.monthsElapsed > 0) {
        const interestRecord = new GirviInterestModel({
          girvi: girviItem._id,
          customer: girviItem.Customer,
          firm: girviItem.firm,
          interestAmount: preview.interestAmount,
          monthsCalculated: preview.monthsElapsed,
        });
        await interestRecord.save();

        girviItem.accrueInterest();
        await girviItem.save();

        totalItemsUpdated++;
        totalInterestAdded += preview.interestAmount;

        console.log(`Interest calculated for ${girviItem.itemName}: ₹${preview.interestAmount}`);
      }
    }

    // Add system activity log
    await addActivity(
      'system',
      'monthlyInterestCalculation',
      `Monthly interest calculated for ${totalItemsUpdated} Girvi items. Total interest: ₹${totalInterestAdded}`
    );

    console.log(`Monthly interest calculation completed. Updated ${totalItemsUpdated} items with total interest of ₹${totalInterestAdded}`);
    
    return {
      success: true,
      itemsUpdated: totalItemsUpdated,
      totalInterestAdded: totalInterestAdded
    };
  } catch (error) {
    console.error("Error in monthly interest calculation:", error);
    
    // Log error activity
    await addActivity(
      'system',
      'monthlyInterestCalculationError',
      `Error in monthly interest calculation: ${error.message}`
    );
    
    return {
      success: false,
      error: error.message
    };
  }
};

// Schedule monthly interest calculation (runs on 1st of every month at 2 AM)
const scheduleMonthlyInterestCalculation = () => {
  // Cron expression: '0 2 1 * *' means "At 02:00 on day-of-month 1"
  cron.schedule('0 2 1 * *', async () => {
    console.log('Running scheduled monthly Girvi interest calculation...');
    await calculateMonthlyInterest();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Indian timezone
  });
  
  console.log('Monthly Girvi interest calculation cron job scheduled for 1st of every month at 2 AM IST');
};

// Function to check overdue Girvi items (runs daily at 9 AM)
const checkOverdueGirviItems = async () => {
  try {
    console.log('Checking for overdue Girvi items...');
    
    const today = new Date();
    const overdueItems = await GirviModel.find({
      status: 'active',
      lastDateToTake: { $lt: today },
      removeAt: null
    }).populate('Customer', 'name email');

    if (overdueItems.length > 0) {
      console.log(`Found ${overdueItems.length} overdue Girvi items`);
      
      // Log activity for overdue items
      for (const item of overdueItems) {
        const daysPastDue = Math.floor((today - new Date(item.lastDateToTake)) / (1000 * 60 * 60 * 24));
        
        await addActivity(
          'system',
          'girviOverdue',
          `${item.itemName} by ${item.Customer.name} is ${daysPastDue} days overdue. Amount due: ₹${item.currentOutstandingAmount}`
        );
      }
    }
    
    return overdueItems;
  } catch (error) {
    console.error("Error checking overdue Girvi items:", error);
    return [];
  }
};

// Schedule overdue check (runs daily at 9 AM)
const scheduleOverdueCheck = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily overdue Girvi items check...');
    await checkOverdueGirviItems();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
  
  console.log('Daily overdue Girvi items check scheduled for 9 AM IST');
};

// Builds a full-data export and saves it to Backend/Exports/ automatically, so nobody has to
// remember to click "Export All Data to Excel" at the end of the week.
const runWeeklyExport = async () => {
  try {
    console.log('Running weekly automatic data export...');
    const excelBuffer = await buildFullExportWorkbook();

    if (!fs.existsSync(EXPORTS_DIR)) {
      fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    }

    const fileName = `GemControl_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(EXPORTS_DIR, fileName);
    fs.writeFileSync(filePath, excelBuffer);

    await addActivity('system', 'weeklyAutoExport', `Weekly data export saved to ${fileName}`);
    console.log(`Weekly export saved to ${filePath}`);

    return { success: true, filePath };
  } catch (error) {
    console.error("Error running weekly export:", error);
    await addActivity('system', 'weeklyAutoExportError', `Weekly export failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Schedule weekly export (runs every Sunday at midnight IST)
const scheduleWeeklyExport = () => {
  cron.schedule('0 0 * * 0', async () => {
    console.log('Running scheduled weekly data export...');
    await runWeeklyExport();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('Weekly automatic data export cron job scheduled for Sunday midnight IST');
};

// Initialize all cron jobs
const initializeCronJobs = () => {
  scheduleMonthlyInterestCalculation();
  scheduleOverdueCheck();
  scheduleWeeklyExport();
  console.log('All Girvi cron jobs initialized successfully');
};

module.exports = {
  calculateMonthlyInterest,
  checkOverdueGirviItems,
  runWeeklyExport,
  initializeCronJobs,
  scheduleMonthlyInterestCalculation,
  scheduleOverdueCheck,
  scheduleWeeklyExport
};