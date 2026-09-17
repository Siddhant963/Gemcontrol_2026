const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const GirviModel = require('../Models/GirviModel');
const GirviInterestModel = require('../Models/GirviInterestModel');
const ActivityModel = require('../Models/ActivitesModel');
const DailrateModel = require('../Models/DailrateModel');
const { buildFullExportWorkbook, deriveGoldPurities, normalizeToUtcDate } = require('../Controllers/adminController');

const OROPOCKET_PRICES_URL = 'https://api.oropocket.com/public/prices';

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

    const fileName = `RatnSetu_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
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

// Pulls live gold/silver rates from OroPocket and saves them as today's
// Dailrate. Uses the "buy" price (per gram) as-is, excluding the API's
// separate "gst" figure -- GST continues to be applied per-invoice via each
// Firm's own gstConfig, so folding it into the stored rate would double it.
const fetchAndSaveLiveRates = async () => {
  try {
    console.log('Fetching live gold/silver rates from OroPocket...');
    const { data } = await axios.get(OROPOCKET_PRICES_URL, { timeout: 10000 });
    const goldBuy = data?.data?.gold?.buy;
    const silverBuy = data?.data?.silver?.buy;

    if (typeof goldBuy !== 'number' || typeof silverBuy !== 'number') {
      throw new Error('Unexpected response shape from OroPocket');
    }

    const today = normalizeToUtcDate(new Date());
    const goldPurities = deriveGoldPurities(goldBuy);
    const setFields = { 'rate.silver': silverBuy };
    Object.entries(goldPurities).forEach(([karat, value]) => {
      setFields[`rate.gold.${karat}`] = value;
    });

    let dailrate = await DailrateModel.findOneAndUpdate(
      { date: today },
      { $set: setFields },
      { new: true }
    );

    if (!dailrate) {
      // First update of a new day -- no document to $set into yet. Carry
      // forward the most recent diamond rates (OroPocket doesn't cover
      // diamonds) rather than starting the day with unset diamond pricing.
      const previous = await DailrateModel.findOne({ date: { $lt: today } }).sort({ date: -1 });
      const daimond = previous?.rate?.daimond || {
        "0_5 Carat": 0,
        "1 Carat": 0,
        "1_5 Carat": 0,
        "2 Carat": 0,
        "2_5 Carat": 0,
        "3 Carat": 0,
      };
      dailrate = await DailrateModel.create({
        date: today,
        rate: { gold: goldPurities, silver: silverBuy, daimond },
      });
    }

    await addActivity(
      'system',
      'liveRateUpdate',
      `Live gold/silver rate updated: gold ₹${goldBuy}/g, silver ₹${silverBuy}/g`
    );
    console.log(`Live rates saved: gold ₹${goldBuy}/g, silver ₹${silverBuy}/g`);

    return { success: true, gold: goldBuy, silver: silverBuy, dailrate };
  } catch (error) {
    console.error('Error fetching/saving live gold/silver rates:', error.message);
    await addActivity('system', 'liveRateUpdateError', `Live rate update failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Schedule live rate updates (runs at the top of every hour)
const scheduleLiveRateUpdates = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled live gold/silver rate update...');
    await fetchAndSaveLiveRates();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('Live gold/silver rate update cron job scheduled for every hour');
};

// Initialize all cron jobs
const initializeCronJobs = () => {
  scheduleMonthlyInterestCalculation();
  scheduleOverdueCheck();
  scheduleWeeklyExport();
  scheduleLiveRateUpdates();
  // Run once immediately on boot too, so today's rate is populated right
  // away instead of waiting for the next hour boundary.
  fetchAndSaveLiveRates();
  console.log('All Girvi cron jobs initialized successfully');
};

module.exports = {
  calculateMonthlyInterest,
  checkOverdueGirviItems,
  runWeeklyExport,
  fetchAndSaveLiveRates,
  initializeCronJobs,
  scheduleMonthlyInterestCalculation,
  scheduleOverdueCheck,
  scheduleWeeklyExport,
  scheduleLiveRateUpdates
};