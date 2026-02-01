const mongoose = require('mongoose');
require('dotenv').config();

const fixSkuIndex = async () => {
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
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Check if sku_1 index exists
    const skuIndexExists = indexes.some(index => index.name === 'sku_1');
    
    if (skuIndexExists) {
      console.log('\n🔧 Dropping old sku_1 index...');
      await productsCollection.dropIndex('sku_1');
      console.log('✅ Old SKU index dropped successfully');
    }

    // Update all empty SKU values to null
    console.log('\n🔄 Updating products with empty SKU to null...');
    const result = await productsCollection.updateMany(
      { sku: '' },
      { $unset: { sku: '' } }
    );
    console.log(`✅ Updated ${result.modifiedCount} products`);

    // Create new sparse unique index
    console.log('\n🆕 Creating new sparse unique index on SKU...');
    await productsCollection.createIndex(
      { sku: 1 },
      { unique: true, sparse: true }
    );
    console.log('✅ New sparse SKU index created successfully');

    // Verify new indexes
    const newIndexes = await productsCollection.indexes();
    console.log('\n📋 Updated indexes:');
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
      if (index.name === 'sku_1') {
        console.log(`    Options:`, JSON.stringify({ unique: index.unique, sparse: index.sparse }));
      }
    });

    console.log('\n✨ SKU index fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing SKU index:', error);
    process.exit(1);
  }
};

fixSkuIndex();
