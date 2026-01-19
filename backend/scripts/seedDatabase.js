const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Inventory = require('../models/Inventory');
const config = require('../config/db');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI || 'mongodb://localhost:27017/chottola');
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

// Categories data
const categoriesData = [
  {
    name: 'Imported Foods',
    slug: 'imported-foods',
    description: 'Premium imported food products from around the world',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop',
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Cosmetics',
    slug: 'cosmetics',
    description: 'Premium cosmetics and skincare products',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&h=300&fit=crop',
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Bakery',
    slug: 'bakery',
    description: 'Fresh bakery items and baked goods',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=300&fit=crop',
    isActive: true,
    sortOrder: 3
  }
];

// Helper function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Products data
const getProductsData = (categories) => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
  
  return [
    // Featured Products
    {
      name: 'Premium Turkish Baklava Mix',
      description: 'Indulge in our premium Turkish baklava, handcrafted with layers of phyllo pastry, premium pistachios, and pure honey. Each piece is a perfect balance of crispy texture and sweet, nutty flavor.',
      price: 850,
      discountPrice: 720,
      discountPercentage: 15,
      sku: 'TUR-BAK-001',
      seoData: {
        metaTitle: 'Premium Turkish Baklava Mix - Authentic Handcrafted',
        metaDescription: 'Authentic Turkish baklava with honey and pistachios. Premium handcrafted layers of phyllo pastry.',
        slug: generateSlug('Premium Turkish Baklava Mix')
      },
      images: [
        {
          url: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=800&h=800&fit=crop',
          alt: 'Turkish Baklava Mix',
          isPrimary: true
        },
        {
          url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop',
          alt: 'Turkish Baklava Close-up'
        }
      ],
      category: categories.find(c => c.slug === 'imported-foods')._id,
      brand: 'Anatolian Sweets',
      weight: { value: 500, unit: 'g' },
      stock: 25,
      manufactureDate: now,
      expiryDate: futureDate,
      isFeatured: true,
      isActive: true,
      tags: ['turkish', 'premium', 'honey', 'pistachio', 'handcrafted'],
      ingredients: [
        { name: 'Phyllo pastry', percentage: 40 },
        { name: 'Pistachios', percentage: 25 },
        { name: 'Honey', percentage: 20 },
        { name: 'Butter', percentage: 10 },
        { name: 'Sugar', percentage: 5 }
      ],
      allergens: ['nuts', 'gluten'],
      nutritionInfo: {
        calories: 350,
        protein: 8,
        carbohydrates: 45,
        fat: 16,
        fiber: 3
      },
      origin: {
        country: 'Turkey',
        manufacturer: 'Anatolian Sweets Ltd.'
      },
      storageInstructions: 'Store in cool, dry place'
    },
    {
      name: 'French Skincare Collection',
      description: 'Transform your skincare routine with this premium French collection featuring anti-aging serum and hydrating moisturizer. Formulated with natural ingredients.',
      price: 2500,
      discountPrice: 2100,
      discountPercentage: 16,
      sku: 'FRA-SKN-001',
      seoData: {
        metaTitle: 'French Skincare Collection - Premium Anti-Aging Set',
        metaDescription: 'Luxury French skincare with anti-aging serum and moisturizer. Natural ingredients for all skin types.',
        slug: generateSlug('French Skincare Collection')
      },
      images: [
        {
          url: 'https://images.unsplash.com/photo-1556228578-dd9317543689?w=800&h=800&fit=crop',
          alt: 'French Skincare Collection',
          isPrimary: true
        }
      ],
      category: categories.find(c => c.slug === 'cosmetics')._id,
      brand: 'Luxe Paris',
      weight: { value: 80, unit: 'ml' },
      stock: 15,
      manufactureDate: now,
      expiryDate: futureDate,
      isFeatured: true,
      isActive: true,
      tags: ['french', 'anti-aging', 'natural', 'premium', 'skincare'],
      ingredients: [
        { name: 'Hyaluronic Acid', percentage: 10 },
        { name: 'Vitamin C', percentage: 15 },
        { name: 'Natural Oils', percentage: 75 }
      ],
      allergens: [],
      origin: {
        country: 'France',
        manufacturer: 'Luxe Paris Cosmetics'
      },
      storageInstructions: 'Store in cool place, away from direct sunlight'
    },
    {
      name: 'Japanese Wagyu Beef Jerky',
      description: 'Experience the ultimate in gourmet snacking with our Japanese Wagyu beef jerky. Made from authentic Wagyu beef with traditional teriyaki seasoning.',
      price: 1800,
      discountPrice: 1530,
      discountPercentage: 15,
      sku: 'JPN-WAG-001',
      seoData: {
        metaTitle: 'Japanese Wagyu Beef Jerky - Premium Teriyaki Flavor',
        metaDescription: 'Premium Japanese Wagyu beef jerky with traditional teriyaki seasoning. High protein gourmet snack.',
        slug: generateSlug('Japanese Wagyu Beef Jerky')
      },
      images: [
        {
          url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&h=800&fit=crop',
          alt: 'Japanese Wagyu Beef Jerky',
          isPrimary: true
        }
      ],
      category: categories.find(c => c.slug === 'imported-foods')._id,
      brand: 'Tokyo Gourmet',
      weight: { value: 100, unit: 'g' },
      stock: 8,
      manufactureDate: now,
      expiryDate: futureDate,
      isFeatured: true,
      isActive: true,
      tags: ['japanese', 'wagyu', 'premium', 'protein', 'teriyaki'],
      ingredients: [
        { name: 'Wagyu Beef', percentage: 85 },
        { name: 'Soy Sauce', percentage: 8 },
        { name: 'Spices', percentage: 7 }
      ],
      allergens: ['soy'],
      nutritionInfo: {
        calories: 420,
        protein: 65,
        carbohydrates: 8,
        fat: 12,
        fiber: 1
      },
      origin: {
        country: 'Japan',
        manufacturer: 'Tokyo Gourmet Co.'
      }
    },
    {
      name: 'Swiss Chocolate Truffle Box',
      description: 'Luxury Swiss chocolate truffles made with finest Belgian cocoa and filled with champagne, raspberry, and hazelnut ganache.',
      price: 1200,
      discountPrice: 999,
      discountPercentage: 17,
      sku: 'SWI-CHO-001',
      seoData: {
        metaTitle: 'Swiss Chocolate Truffle Box - Handcrafted Premium',
        metaDescription: 'Luxury Swiss chocolate truffles with Belgian cocoa. Perfect for gifting. Champagne and fruit filled.',
        slug: generateSlug('Swiss Chocolate Truffle Box')
      },
      images: [
        {
          url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&h=800&fit=crop',
          alt: 'Swiss Chocolate Truffles',
          isPrimary: true
        }
      ],
      category: categories.find(c => c.slug === 'imported-foods')._id,
      brand: 'Alpine Chocolatier',
      weight: { value: 250, unit: 'g' },
      stock: 20,
      manufactureDate: now,
      expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // 3 months
      isFeatured: true,
      isActive: true,
      tags: ['swiss', 'handcrafted', 'premium', 'gift', 'chocolate'],
      ingredients: [
        { name: 'Belgian Cocoa', percentage: 45 },
        { name: 'Heavy Cream', percentage: 30 },
        { name: 'Nuts', percentage: 25 }
      ],
      allergens: ['dairy', 'nuts'],
      origin: {
        country: 'Switzerland',
        manufacturer: 'Alpine Chocolatier SA'
      },
      storageInstructions: 'Store below 18°C'
    },

    // Regular Products
    {
      name: 'Italian Pasta Variety Pack',
      description: 'Discover the taste of Italy with our premium pasta variety pack featuring penne, fusilli, and linguine made from durum wheat.',
      price: 450,
      sku: 'ITA-PAS-001',
      seoData: {
        metaTitle: 'Italian Pasta Variety Pack - Authentic Durum Wheat',
        metaDescription: 'Premium Italian pasta variety pack. Penne, fusilli, and linguine made from durum wheat.',
        slug: generateSlug('Italian Pasta Variety Pack')
      },
      images: [
        {
          url: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=800&h=800&fit=crop',
          alt: 'Italian Pasta Variety',
          isPrimary: true
        }
      ],
      category: categories.find(c => c.slug === 'imported-foods')._id,
      brand: 'Bella Italia',
      weight: { value: 1000, unit: 'g' },
      stock: 50,
      manufactureDate: now,
      expiryDate: futureDate,
      isFeatured: false,
      isActive: true,
      tags: ['italian', 'pasta', 'durum', 'variety'],
      ingredients: [
        { name: 'Durum Wheat Semolina', percentage: 98 },
        { name: 'Water', percentage: 2 }
      ],
      allergens: ['gluten'],
      nutritionInfo: {
        calories: 350,
        protein: 12,
        carbohydrates: 70,
        fat: 2,
        fiber: 3
      },
      origin: {
        country: 'Italy',
        manufacturer: 'Bella Italia Foods'
      }
    },
    {
      name: 'Korean Face Mask Set',
      description: 'Korean beauty face mask set with collagen, vitamin C, and green tea for deep hydration and skin brightening.',
      price: 850,
      sku: 'KOR-MSK-001',
      seoData: {
        metaTitle: 'Korean Face Mask Set - Collagen & Vitamin C',
        metaDescription: 'Korean beauty face masks with collagen, vitamin C, and green tea for hydration and brightening.',
        slug: generateSlug('Korean Face Mask Set')
      },
      images: [
        {
          url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&h=800&fit=crop',
          alt: 'Korean Face Masks',
          isPrimary: true
        }
      ],
      category: categories.find(c => c.slug === 'cosmetics')._id,
      brand: 'Seoul Beauty',
      weight: { value: 200, unit: 'g' },
      stock: 35,
      manufactureDate: now,
      expiryDate: futureDate,
      isFeatured: false,
      isActive: true,
      tags: ['korean', 'hydrating', 'collagen', 'vitamin-c'],
      ingredients: [
        { name: 'Collagen', percentage: 20 },
        { name: 'Vitamin C', percentage: 15 },
        { name: 'Green Tea Extract', percentage: 65 }
      ],
      allergens: [],
      origin: {
        country: 'South Korea',
        manufacturer: 'Seoul Beauty Co.'
      }
    },
    {
      name: 'Fresh Croissant Assortment',
      description: 'Freshly baked croissant assortment including classic butter, chocolate-filled, and almond varieties made with French butter.',
      price: 380,
      sku: 'BGD-CRO-001',
      seoData: {
        metaTitle: 'Fresh Croissant Assortment - Butter, Chocolate, Almond',
        metaDescription: 'Freshly baked croissants with butter, chocolate, and almond varieties. Made with French butter.',
        slug: generateSlug('Fresh Croissant Assortment')
      },
      images: [
        {
          url: 'https://images.unsplash.com/photo-1555507036-ab794f0ecb4c?w=800&h=800&fit=crop',
          alt: 'Fresh Croissants',
          isPrimary: true
        }
      ],
      category: categories.find(c => c.slug === 'bakery')._id,
      brand: 'The Chattala Bakery',
      weight: { value: 360, unit: 'g' },
      stock: 12,
      manufactureDate: now,
      expiryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
      isFeatured: false,
      isActive: true,
      tags: ['fresh', 'butter', 'chocolate', 'almond'],
      ingredients: [
        { name: 'Wheat Flour', percentage: 60 },
        { name: 'Butter', percentage: 25 },
        { name: 'Other', percentage: 15 }
      ],
      allergens: ['gluten', 'dairy', 'eggs'],
      origin: {
        country: 'Bangladesh',
        manufacturer: 'The Chattala Bakery'
      },
      storageInstructions: 'Best consumed fresh, store in airtight container'
    },
    {
      name: 'Thai Green Curry Paste',
      description: 'Traditional Thai green curry paste made with fresh herbs and spices. Perfect for creating authentic Thai cuisine at home.',
      price: 320,
      sku: 'THA-CUR-001',
      seoData: {
        metaTitle: 'Thai Green Curry Paste - Authentic Traditional Recipe',
        metaDescription: 'Traditional Thai green curry paste with fresh herbs and spices. Perfect for authentic Thai cooking.',
        slug: generateSlug('Thai Green Curry Paste')
      },
      images: [
        {
          url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=800&fit=crop',
          alt: 'Thai Green Curry Paste',
          isPrimary: true
        }
      ],
      category: categories.find(c => c.slug === 'imported-foods')._id,
      brand: 'Bangkok Spice Co.',
      weight: { value: 200, unit: 'g' },
      stock: 45,
      manufactureDate: now,
      expiryDate: new Date(now.getTime() + 18 * 30 * 24 * 60 * 60 * 1000), // 18 months
      isFeatured: false,
      isActive: true,
      tags: ['thai', 'spicy', 'authentic', 'herbs'],
      ingredients: [
        { name: 'Green Chili', percentage: 40 },
        { name: 'Herbs', percentage: 35 },
        { name: 'Spices', percentage: 25 }
      ],
      allergens: [],
      origin: {
        country: 'Thailand',
        manufacturer: 'Bangkok Spice Co.'
      },
      storageInstructions: 'Refrigerate after opening'
    }
  ];
};

// Inventory data generator
const generateInventory = (product) => ({
  product: product._id,
  sku: product.sku,
  stock: {
    current: Math.floor(Math.random() * 50) + 10, // 10-60 stock
    reserved: Math.floor(Math.random() * 5), // 0-5 reserved
    available: Math.floor(Math.random() * 50) + 10,
    reorderLevel: Math.floor(Math.random() * 10) + 5, // 5-15 reorder level
    maxStock: Math.floor(Math.random() * 50) + 100, // 100-150 max stock
  },
  pricing: {
    costPrice: product.price * 0.7, // 70% of selling price as cost
    sellingPrice: product.price,
    discountPrice: product.discountPrice || 0,
    margin: product.price * 0.3,
    currency: 'BDT'
  },
  supplier: {
    primary: {
      name: `${product.brand} Supplier`,
      contact: '+880-1XXX-XXXXXX',
      email: `supplier@${product.brand.toLowerCase().replace(/\s+/g, '')}.com`,
      address: `${product.origin.country}`,
      leadTime: 7,
      minimumOrder: 1
    }
  },
  batches: [{
    batchNumber: `B${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    quantity: Math.floor(Math.random() * 30) + 10,
    manufactureDate: product.manufactureDate,
    expiryDate: product.expiryDate,
    costPrice: product.price * 0.7,
    status: 'fresh',
    location: {
      warehouse: 'Main Warehouse',
      section: 'A',
      shelf: Math.floor(Math.random() * 10) + 1,
      position: Math.floor(Math.random() * 20) + 1
    }
  }],
  lastRestocked: new Date(),
  isActive: true
});

// Seed function
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Inventory.deleteMany({});
    console.log('Cleared existing data');

    // Seed categories
    const categories = await Category.insertMany(categoriesData);
    console.log(`Seeded ${categories.length} categories`);

    // Seed products
    const productsData = getProductsData(categories);
    const products = await Product.insertMany(productsData);
    console.log(`Seeded ${products.length} products`);

    // Seed inventory for each product
    const inventoryData = products.map(product => generateInventory(product));
    const inventory = await Inventory.insertMany(inventoryData);
    console.log(`Seeded ${inventory.length} inventory records`);

    console.log('Database seeding completed successfully!');
    console.log('Summary:');
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Featured Products: ${products.filter(p => p.isFeatured).length}`);
    console.log(`- Inventory Records: ${inventory.length}`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Clear database function
const clearDatabase = async () => {
  try {
    console.log('Clearing database...');
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Inventory.deleteMany({});
    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--clear')) {
    await clearDatabase();
  } else {
    await seedDatabase();
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedDatabase, clearDatabase };