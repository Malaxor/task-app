const { model, Schema } = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const Task  = require('./task')

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is invalid');
      }
    }
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) {
        throw new Error('Age must be a positive number');
      }
    }
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minLength: 7,
    validate(value) {
      if (value.toLowerCase().includes('password')) {
        throw new Error('Password must not contain the word password');
      }
    }
  },
  tokens: [{ 
    token: {
      type: String,
      required: true
    }
  }],
  avatar: Buffer
}, {
  timestamps: true
});

// associate a user with a list of tasks
userSchema.virtual('tasks', {
  ref: 'tasks',
  localField: '_id',
  foreignField: 'owner'
});

// returns only the fields that you want the public to see
// toJSON run everything res.send() is invoked
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;
  return userObject;
}

userSchema.methods.generateAuthToken = async function () {
  const token = jwt.sign({ id: this.id.toString() }, process.env.JWT_SECRET);
  this.tokens =  this.tokens.concat({ token });
  await this.save();
  return token;
}

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Unable to login');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Unable to login');
  }
  return user;
}

// delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
  await Task.deleteMany({ owner: this.id });
  next();
});

// hash password before saving
userSchema.pre('save', async function (next) {
  // true when user is created and when the user changes his/her password
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

const User = model('users', userSchema);
module.exports = User;