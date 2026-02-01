const mongoose = require('mongoose');
require('dotenv').config();

const cleanDuplicateIndexes = async () => {
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
      console.log(`  - ${index.name}:`, JSON.stringify(index.key), 
        index.unique ? '(unique)' : '', 
        index.sparse ? '(sparse)' : '');
    });

    // List of indexes that should be removed or fixed
    const problematicIndexes = ['barcode_1'];
    
    for (const indexName of problematicIndexes) {
      const indexExists = indexes.some(index => index.name === indexName);
      if (indexExists) {
        console.log(`\n🔧 Dropping orphaned index: ${indexName}...`);
        try {
          await productsCollection.dropIndex(indexName);
          console.log(`✅ Dropped ${indexName}`);
        } catch (err) {
          console.log(`⚠️  Could not drop ${indexName}:`, err.message);
        }
      }
    }

    // Check for products with empty or null SKUs and update them
    console.log('\n🔍 Checking for products with problematic SKU values...');
    
    const productsWithEmptySKU = await productsCollection.find({
      $or: [
        { sku: '' },
        { sku: null },
        { sku: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${productsWithEmptySKU.length} products with empty/null SKU`);
    
    if (productsWithEmptySKU.length > 0) {
      console.log('\n🔄 Generating unique SKUs for products without SKU...');
      
      for (const product of productsWithEmptySKU) {
        const generateSKU = () => {
          const timestamp = Date.now().toString(36).toUpperCase();
          const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
          const extraRandom = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          return `SKU-${timestamp}-${randomStr}${extraRandom}`;
        };
        
        const newSKU = generateSKU();
        
        await productsCollection.updateOne(
          { _id: product._id },
          { $set: { sku: newSKU } }
        );
        
        console.log(`  ✅ Updated product "${product.name}" with SKU: ${newSKU}`);
      }
    }

    // Check for duplicate SKUs
    console.log('\n🔍 Checking for duplicate SKUs...');
    const duplicateSKUs = await productsCollection.aggregate([
      { $match: { sku: { $ne: null, $ne: '' } } },
      { $group: { _id: '$sku', count: { $sum: 1 }, products: { $push: { _id: '$_id', name: '$name' } } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (duplicateSKUs.length > 0) {
      console.log(`⚠️  Found ${duplicateSKUs.length} duplicate SKU(s):`);
      for (const dup of duplicateSKUs) {
        console.log(`\n  SKU: "${dup._id}" (${dup.count} products)`);
        console.log('  Products:');
        for (let i = 0; i < dup.products.length; i++) {
          const product = dup.products[i];
          if (i > 0) {
            // Update duplicate SKUs with new unique ones
            const generateSKU = () => {
              const timestamp = Date.now().toString(36).toUpperCase();
              const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
              const extraRandom = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
              return `SKU-${timestamp}-${randomStr}${extraRandom}`;
            };
            
            const newSKU = generateSKU();
            await productsCollection.updateOne(
              { _id: product._id },
              { $set: { sku: newSKU } }
            );
            console.log(`    - ${product.name} (${product._id}) - Updated to: ${newSKU}`);
          } else {
            console.log(`    - ${product.name} (${product._id}) - Kept original`);
          }
        }
      }
    } else {
      console.log('✅ No duplicate SKUs found');
    }

    // Verify the SKU index is correct
    console.log('\n🔍 Verifying SKU index...');
    const skuIndex = indexes.find(idx => idx.name === 'sku_1');
    
    if (!skuIndex || !skuIndex.sparse) {
      console.log('🔧 Recreating SKU index with sparse option...');
      
      // Drop if exists
      try {
        await productsCollection.dropIndex('sku_1');
      } catch (err) {
        // Index might not exist
      }
      
      // Create new sparse unique index
      await productsCollection.createIndex(
        { sku: 1 },
        { unique: true, sparse: true }
      );
      console.log('✅ SKU index recreated successfully');
    } else {
      console.log('✅ SKU index is correct');
    }

    // Final verification
    const finalIndexes = await productsCollection.indexes();
    console.log('\n📋 Final indexes:');
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key),
        index.unique ? '(unique)' : '',
        index.sparse ? '(sparse)' : '');
    });

    console.log('\n✨ Database cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
};

cleanDuplicateIndexes();
