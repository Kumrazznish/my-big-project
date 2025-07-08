const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/learnai';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// User Schema
const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Learning History Schema
const learningHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  roadmapId: {
    type: String,
    required: true
  },
  chapterProgress: [{
    chapterId: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    }
  }],
  learningPreferences: {
    learningStyle: {
      type: String,
      required: true
    },
    timeCommitment: {
      type: String,
      required: true
    },
    goals: [{
      type: String
    }]
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: String
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
const LearningHistory = mongoose.model('LearningHistory', learningHistorySchema);

// Routes

// Get or create user
app.post('/api/users/get-or-create', async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, imageUrl } = req.body;

    let user = await User.findOne({ clerkId });

    if (!user) {
      user = new User({
        clerkId,
        email,
        firstName,
        lastName,
        imageUrl
      });
      await user.save();
    } else {
      // Update user info if it has changed
      user.email = email;
      user.firstName = firstName;
      user.lastName = lastName;
      user.imageUrl = imageUrl;
      await user.save();
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting or creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user learning history
app.get('/api/users/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;

    const history = await LearningHistory.find({ userId })
      .sort({ lastAccessedAt: -1 });

    res.json(history);
  } catch (error) {
    console.error('Error getting user history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to learning history
app.post('/api/users/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const historyData = req.body;

    const history = new LearningHistory({
      userId,
      ...historyData
    });

    await history.save();
    res.json(history);
  } catch (error) {
    console.error('Error adding to history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update chapter progress
app.put('/api/users/:userId/history/:historyId/chapter/:chapterId', async (req, res) => {
  try {
    const { userId, historyId, chapterId } = req.params;
    const { completed, completedAt } = req.body;

    const history = await LearningHistory.findOne({
      _id: historyId,
      userId
    });

    if (!history) {
      return res.status(404).json({ error: 'Learning history not found' });
    }

    // Find and update the chapter progress
    const chapterIndex = history.chapterProgress.findIndex(
      chapter => chapter.chapterId === chapterId
    );

    if (chapterIndex !== -1) {
      history.chapterProgress[chapterIndex].completed = completed;
      history.chapterProgress[chapterIndex].completedAt = completed ? completedAt || new Date() : null;
    } else {
      // Add new chapter progress if it doesn't exist
      history.chapterProgress.push({
        chapterId,
        completed,
        completedAt: completed ? completedAt || new Date() : null
      });
    }

    // Update last accessed time
    history.lastAccessedAt = new Date();

    // Check if all chapters are completed
    const allCompleted = history.chapterProgress.every(chapter => chapter.completed);
    if (allCompleted && !history.completedAt) {
      history.completedAt = new Date();
    }

    await history.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating chapter progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});