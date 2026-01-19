const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a category name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot be more than 50 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  path: {
    type: String,
    default: ''
  },
  image: {
    url: { type: String, default: '' },
    alt: { type: String, default: '' }
  },
  icon: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#22c55e',
    match: [/^#[0-9A-Fa-f]{6}$/, 'Please provide a valid hex color']
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  metaData: {
    title: { type: String, maxlength: 60 },
    description: { type: String, maxlength: 160 },
    keywords: [{ type: String }]
  },
  filters: [{
    name: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['range', 'checkbox', 'radio', 'dropdown'],
      default: 'checkbox'
    },
    options: [{
      label: String,
      value: String,
      count: { type: Number, default: 0 }
    }]
  }],
  attributes: [{
    name: { type: String, required: true },
    required: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'date', 'select'],
      default: 'text'
    },
    options: [String]
  }],
  stats: {
    productCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Virtual for getting all children categories
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual for getting all products in this category
categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category'
});

// Virtual for breadcrumb path
categorySchema.virtual('breadcrumbs').get(function() {
  return this.path.split('/').filter(Boolean);
});

// Pre-save middleware to set path and level
categorySchema.pre('save', async function(next) {
  // Generate slug from name
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Set level and path based on parent
  if (this.parent) {
    const parent = await mongoose.model('Category').findById(this.parent);
    if (parent) {
      this.level = parent.level + 1;
      this.path = parent.path ? `${parent.path}/${parent._id}` : `/${parent._id}`;
    }
  } else {
    this.level = 0;
    this.path = '';
  }

  next();
});

// Method to get all descendants
categorySchema.methods.getDescendants = async function() {
  const descendants = [];
  const queue = [this._id];
  
  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = await mongoose.model('Category').find({ parent: currentId });
    
    for (const child of children) {
      descendants.push(child);
      queue.push(child._id);
    }
  }
  
  return descendants;
};

// Method to get ancestors
categorySchema.methods.getAncestors = async function() {
  const ancestors = [];
  let current = this;
  
  while (current.parent) {
    current = await mongoose.model('Category').findById(current.parent);
    if (current) {
      ancestors.unshift(current);
    }
  }
  
  return ancestors;
};

// Static method to get category tree
categorySchema.statics.getTree = async function(parentId = null) {
  const categories = await this.find({ parent: parentId, isActive: true })
    .sort({ sortOrder: 1, name: 1 });
  
  for (const category of categories) {
    category.children = await this.getTree(category._id);
  }
  
  return categories;
};

// Indexes for better performance
categorySchema.index({ parent: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ isFeatured: 1 });
categorySchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Category', categorySchema);
