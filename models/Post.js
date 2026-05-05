const mongoose = require('mongoose');

const ReactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  authorRoll: { type: String, required: true },
  authorName: { type: String, required: true }
}, { _id: false });

const ReplySchema = new mongoose.Schema({
  authorRoll: { type: String, required: true },
  authorName: { type: String, required: true },
  text: { type: String, required: true },
  reactions: { type: [ReactionSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

const CommentSchema = new mongoose.Schema({
  authorRoll: { type: String, required: true },
  authorName: { type: String, required: true },
  text: { type: String, required: true },
  reactions: { type: [ReactionSchema], default: [] },
  replies: { type: [ReplySchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  authorRoll: { type: String, ref: 'User', required: true },
  authorName: { type: String, required: true },
  companyName: { type: String, required: true },
  interviewDate: { type: Date, default: Date.now },
  experience: { type: String, required: true },
  postType: { type: String, enum: ['Interview', 'Discussion'], default: 'Interview' },
  result: { type: String, enum: ['Selected', 'Rejected', 'Pending', 'In Progress'], default: 'Pending' },
  reactions: { type: [ReactionSchema], default: [] },
  comments: { type: [CommentSchema], default: [] }
}, { timestamps: true });

PostSchema.index({ companyName: 'text' });

module.exports = mongoose.model('Post', PostSchema);
