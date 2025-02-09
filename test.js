const { MongoClient } = require('mongodb');
require('dotenv').config();
const uri = process.env.MONGO_URI; // URI dans .env

const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

connectDB();
