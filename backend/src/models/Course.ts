import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IVideoLesson {
  id?: string;
  title: string;
  videoUrl: string;
  duration: string;
  thumbnail?: string;
  description?: string;
}

export interface IChapter {
  id?: string;
  title: string;
  description?: string;
  lessons: IVideoLesson[];
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  duration: string;
  price: number;
  instructor: string;
  thumbnail?: string;
  tags: string[];
  chapters: IChapter[];
  modules: { title: string; lecturesCount: number; duration: string }[];
  status: 'active' | 'draft' | 'archived';
  enrolledCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true, default: 'Full Stack Development' },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'Beginner',
    },
    duration: { type: String, required: true, default: '10 Weeks' },
    price: { type: Number, default: 0 },
    instructor: { type: String, required: true, default: 'Binary Vidya Faculty' },
    thumbnail: { type: String, default: '' },
    tags: [{ type: String }],
    chapters: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        lessons: [
          {
            title: { type: String, required: true },
            videoUrl: { type: String, default: '' },
            duration: { type: String, default: '15 Mins' },
            thumbnail: { type: String, default: '' },
            description: { type: String, default: '' },
          },
        ],
      },
    ],
    modules: [
      {
        title: { type: String, required: true },
        lecturesCount: { type: Number, default: 5 },
        duration: { type: String, default: '2 Hours' },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },
    enrolledCount: { type: Number, default: 0 },
    rating: { type: Number, default: 4.8 },
  },
  { timestamps: true }
);

export const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);
