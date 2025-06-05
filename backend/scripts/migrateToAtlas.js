const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Local MongoDB connection
const localMongoURI = 'mongodb://127.0.0.1:27017/toko1';

// Connect to local MongoDB
mongoose.connect(localMongoURI)
  .then(async () => {
    console.log('Connected to local MongoDB');
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Migrate each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`Migrating collection: ${collectionName}`);
      
      // Get all documents from the collection
      const documents = await mongoose.connection.db.collection(collectionName).find({}).toArray();
      
      // Connect to MongoDB Atlas
      const atlasMongoURI = process.env.MONGODB_URI;
      const atlasConnection = await mongoose.createConnection(atlasMongoURI);
      
      // Insert documents into Atlas
      if (documents.length > 0) {
        await atlasConnection.db.collection(collectionName).insertMany(documents);
        console.log(`Migrated ${documents.length} documents to ${collectionName}`);
      }
      
      // Close Atlas connection
      await atlasConnection.close();
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  }); 