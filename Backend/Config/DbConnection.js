const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

// Node's default DNS resolver can fail SRV lookups (mongodb+srv://) on some
// Windows setups where the OS-assigned DNS server is an IPv6 link-local
// address (e.g. router-assigned fe80::1). Point it at public resolvers instead.
dns.setServers(["8.8.8.8", "1.1.1.1"]);
 
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(mongoURI, {
      // Mongoose 6+ doesn't need these options, but keeping for compatibility
      // useNewUrlParser and useUnifiedTopology are now default
    });

    console.log("✅ MongoDB connected successfully");
    console.log(`📦 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
