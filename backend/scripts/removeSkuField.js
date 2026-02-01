const mongoose = require('mongoose');
require('dotenv').config();

const removeSkuField = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');

    // Get all indexes
    const indexes = await productsCollection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}`);
    });

    // Check if sku_1 index exists and drop it
    const skuIndexExists = indexes.some(index => index.name === 'sku_1');
    
    if (skuIndexExists) {
      console.log('\n🔧 Dropping SKU index...');
      await productsCollection.dropIndex('sku_1');
      console.log('✅ SKU index dropped successfully');
    } else {
      console.log('\n✅ SKU index does not exist');
    }

    // Remove SKU field from all products
    console.log('\n🔄 Removing SKU field from all products...');
    const result = await productsCollection.updateMany(
      {},
      { $unset: { sku: '' } }
    );
    console.log(`✅ Removed SKU field from ${result.modifiedCount} products`);

    // Verify final indexes
    const finalIndexes = await productsCollection.indexes();
    console.log('\n📋 Final indexes:');
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}`);
    });

    console.log('\n✨ SKU field and index removed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing SKU field:', error);
    process.exit(1);
  }
};

removeSkuField();
