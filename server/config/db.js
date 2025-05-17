const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// MongoDB connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connectDB = async () => {
  const TESTING_MODE = process.env.TESTING_MODE === 'true';
  
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'URI exists' : 'URI missing');
    console.log('MongoDB connection attempt starting...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`MongoDB Database Name: ${conn.connection.name}`);
    console.log(`MongoDB Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error('MongoDB Full Error:', error);
    
    // Don't exit if in TESTING_MODE
    if (TESTING_MODE) {
      console.warn('⚠️ Running in TEST MODE without database connection ⚠️');
      console.warn('The application will use mock data and not persist changes');
      return null;
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB; 