import mongoose, { Document, Schema } from 'mongoose';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'follow_up'
  | 'converted'
  | 'not_interested'
  | 'no_answer'
  | 'invalid';

export interface ICallNote {
  agentId: string;
  agentName: string;
  note: string;
  status: LeadStatus;
  followUpAt?: Date;
  createdAt: Date;
}

export interface ILead extends Document {
  name: string;
  phone: string;
  email?: string;
  course?: string;
  source: string;
  status: LeadStatus;
  statusUpdatedBy?: string; // agent userId
  statusUpdatedByName?: string; // agent name
  statusUpdatedAt?: Date;
  followUpAt?: Date; // Scheduled callback date & time
  temperature?: 'hot' | 'warm' | 'cold';
  assignedTo?: string; // agent userId
  assignedAgentName?: string;
  callNotes: ICallNote[];
  callLogs: ICallNote[]; // Alias to callNotes
  lastContactedAt?: Date;
  paymentLinkSent?: boolean;
  paymentLinkSentAt?: Date;
  couponUsed?: string;
  collegeName?: string;
  year?: string;
  branch?: string;
  createdAt: Date;
  updatedAt: Date;
}

const callNoteSchema = new Schema<ICallNote>(
  {
    agentId: { type: String, required: true },
    agentName: { type: String, required: true },
    note: { type: String, required: true },
    status: { type: String, required: true },
    followUpAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const leadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, sparse: true },
    course: { type: String, default: '' },
    collegeName: { type: String, default: '' },
    year: { type: String, default: '' },
    branch: { type: String, default: '' },
    source: { type: String, default: 'manual' }, // manual, public_form, import
    status: {
      type: String,
      enum: ['new', 'contacted', 'interested', 'follow_up', 'converted', 'not_interested', 'no_answer', 'invalid'],
      default: 'new',
      index: true,
    },
    statusUpdatedBy: { type: String, default: '' },
    statusUpdatedByName: { type: String, default: '' },
    statusUpdatedAt: { type: Date },
    followUpAt: { type: Date, index: true }, // Scheduled callback date & time
    temperature: {
      type: String,
      enum: ['hot', 'warm', 'cold'],
      default: 'hot',
    },
    assignedTo: { type: String, default: null, index: true },
    assignedAgentName: { type: String, default: '' },
    callNotes: { type: [callNoteSchema], default: [] },
    lastContactedAt: { type: Date },
    paymentLinkSent: { type: Boolean, default: false },
    paymentLinkSentAt: { type: Date },
    couponUsed: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias callLogs -> callNotes
leadSchema.virtual('callLogs').get(function () {
  return this.callNotes;
});

export const Lead =
  mongoose.models.Lead || mongoose.model<ILead>('Lead', leadSchema);
