import { Request, Response } from 'express';
import { Lead } from '../models/Lead';
import { User } from '../models/User';
import { Otp } from '../models/Otp';
import { sendOtpEmail, sendTeamCredentialsEmail } from '../config/mailer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Coupon } from '../models/Coupon';

const JWT_SECRET = process.env.JWT_SECRET || 'binaryvidya_crm_secret_2024';

// ── CRM Auth ─────────────────────────────────────────────────────────────────

/**
 * POST /api/crm/auth/send-otp
 * Agent passwordless login — sends 6-digit OTP to agent's email if registered in database
 */
export const crmSendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your registered email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if email exists in database (lean query)
    const user: any = await User.findOne({ email: normalizedEmail }).select('isTeamMember role isSuperAdmin email').lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'This email is not registered in our database. Please contact an administrator.',
      });
    }

    // 2. Check if user is an authorized CRM team member / agent
    const isSalesAgent =
      user.isTeamMember ||
      user.role === 'admin' ||
      (user as any).isSuperAdmin ||
      user.email === 'aryar0779@gmail.com';

    if (!isSalesAgent) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This email is not registered as an authorized sales agent.',
      });
    }

    // 3. Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 4. Save/update OTP in collection
    await Otp.findOneAndUpdate(
      { email: normalizedEmail, purpose: 'CRM_AGENT_LOGIN' },
      {
        email: normalizedEmail,
        otp: otpCode,
        purpose: 'CRM_AGENT_LOGIN',
        expiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 5. Send OTP to mail in background (fire-and-forget for instant API response)
    sendOtpEmail(normalizedEmail, otpCode, 'Binary Vidya Agent Sign In').catch((err: any) => {
      console.error('[Send Agent Login OTP Error]:', err?.message || err);
    });

    console.log(`[CRM OTP]: Generated code ${otpCode} for agent ${normalizedEmail}`);

    return res.json({
      success: true,
      message: `A 6-digit login code has been sent to ${normalizedEmail}.`,
      email: normalizedEmail,
    });
  } catch (err: any) {
    console.error('[CRM Send OTP Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to send login code. Please try again.' });
  }
};

/**
 * POST /api/crm/auth/verify-otp
 * Direct agent login with OTP — no password required
 */
export const crmVerifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    // 1. Verify OTP record
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      otp: cleanOtp,
      purpose: 'CRM_AGENT_LOGIN',
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or incorrect verification code. Please check and try again.' });
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
    }

    // Delete used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    // 2. Fetch User and issue session
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    const isSuperAdmin =
      (user as any).isSuperAdmin ||
      user.email === 'aryar0779@gmail.com' ||
      user.role === 'admin';

    const teamName =
      user.department && ['CSM', 'BDA', 'Lead Generation'].includes(user.department)
        ? user.department
        : (user as any).salesTeam && ['CSM', 'BDA', 'Lead Generation'].includes((user as any).salesTeam)
        ? (user as any).salesTeam
        : user.department && user.department !== 'sales'
        ? user.department
        : 'BDA';

    const payload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: isSuperAdmin ? 'super_admin' : 'agent',
      department: teamName,
      salesTeam: teamName,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

    res.cookie('crm_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      success: true,
      user: payload,
      message: 'Logged in successfully.',
    });
  } catch (err: any) {
    console.error('[CRM Verify OTP Error]:', err);
    return res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
  }
};

/**
 * POST /api/crm/auth/login
 * Staff login — issues HttpOnly JWT cookie
 */
export const crmLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isSalesAgent =
      user.isTeamMember ||
      user.role === 'admin' ||
      (user as any).isSuperAdmin ||
      user.email === 'aryar0779@gmail.com';

    if (!isSalesAgent) {
      return res.status(403).json({ success: false, message: 'Access denied. Not an authorized team member.' });
    }

    const isMatch = user.password && (await bcrypt.compare(password, user.password));
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isSuperAdmin =
      (user as any).isSuperAdmin ||
      user.email === 'aryar0779@gmail.com' ||
      user.role === 'admin';

    const teamName =
      user.department && ['CSM', 'BDA', 'Lead Generation'].includes(user.department)
        ? user.department
        : (user as any).salesTeam && ['CSM', 'BDA', 'Lead Generation'].includes((user as any).salesTeam)
        ? (user as any).salesTeam
        : user.department && user.department !== 'sales'
        ? user.department
        : 'BDA';

    const payload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: isSuperAdmin ? 'super_admin' : 'agent',
      department: teamName,
      salesTeam: teamName,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

    res.cookie('crm_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      success: true,
      user: payload,
      message: 'Logged in successfully.',
    });
  } catch (err: any) {
    console.error('[CRM Login Error]:', err);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

/**
 * POST /api/crm/auth/logout
 */
export const crmLogout = (_req: Request, res: Response) => {
  res.clearCookie('crm_token', { path: '/' });
  return res.json({ success: true, message: 'Logged out.' });
};

/**
 * GET /api/crm/auth/me
 */
export const crmMe = async (req: Request, res: Response) => {
  const sessionUser = (req as any).crmUser;
  if (!sessionUser) return res.status(401).json({ success: false, message: 'Not authenticated.' });

  try {
    const user: any = await User.findById(sessionUser.id)
      .select('name email role isSuperAdmin department salesTeam isTeamMember')
      .lean();

    if (!user) {
      return res.json({ success: true, user: sessionUser });
    }

    const isSuperAdmin =
      (user as any).isSuperAdmin ||
      user.email === 'aryar0779@gmail.com' ||
      user.role === 'admin' ||
      sessionUser.role === 'super_admin';

    const teamName =
      user.department && ['CSM', 'BDA', 'Lead Generation'].includes(user.department)
        ? user.department
        : (user as any).salesTeam && ['CSM', 'BDA', 'Lead Generation'].includes((user as any).salesTeam)
        ? (user as any).salesTeam
        : user.department && user.department !== 'sales'
        ? user.department
        : 'BDA';

    const payload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: isSuperAdmin ? 'super_admin' : 'agent',
      department: teamName,
      salesTeam: teamName,
    };

    return res.json({ success: true, user: payload });
  } catch {
    return res.json({ success: true, user: sessionUser });
  }
};

// ── Leads ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/crm/leads
 * Super Admin sees all; Agent sees only their assigned leads
 */
export const getLeads = async (req: Request, res: Response) => {
  try {
    const {
      status,
      search,
      college,
      year,
      course,
      startDate,
      endDate,
      page = 1,
      limit = 100,
    } = req.query;

    const query: any = {};

    // In Leads Calling, show all leads to everyone across all teams (Super Admin, BDA, Lead Gen, CSM)

    // 1. Status Filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // 2. Course Filter
    if (course && course !== 'all') {
      query.course = { $regex: String(course).trim(), $options: 'i' };
    }

    // 3. Year Wise Filter
    if (year && year !== 'all') {
      query.year = { $regex: String(year).trim(), $options: 'i' };
    }

    // 4. College Filter
    if (college && college !== 'all') {
      query.collegeName = { $regex: String(college).trim(), $options: 'i' };
    }

    // 5. Date Filter (From Date & To Date)
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) {
        let start: Date;
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(startDate).trim())) {
          const [y, m, d] = String(startDate).trim().split('-').map(Number);
          start = new Date(y, m - 1, d, 0, 0, 0, 0);
        } else {
          start = new Date(String(startDate));
          start.setHours(0, 0, 0, 0);
        }
        if (!isNaN(start.getTime())) {
          dateFilter.$gte = start;
        }
      }
      if (endDate) {
        let end: Date;
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(endDate).trim())) {
          const [y, m, d] = String(endDate).trim().split('-').map(Number);
          end = new Date(y, m - 1, d, 23, 59, 59, 999);
        } else {
          end = new Date(String(endDate));
          end.setHours(23, 59, 59, 999);
        }
        if (!isNaN(end.getTime())) {
          dateFilter.$lte = end;
        }
      }
      if (Object.keys(dateFilter).length > 0) {
        query.createdAt = dateFilter;
      }
    }

    // 6. Search Query (Name, Phone, Email, College, Course)
    if (search) {
      const s = String(search).trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { collegeName: { $regex: s, $options: 'i' } },
        { course: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [leads, total, distinctColleges, distinctCourses] = await Promise.all([
      Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Lead.countDocuments(query),
      Lead.distinct('collegeName'),
      Lead.distinct('course'),
    ]);

    const colleges = (distinctColleges || [])
      .map((c: any) => String(c || '').trim())
      .filter(Boolean)
      .sort((a: string, b: string) => a.localeCompare(b));

    const courses = (distinctCourses || [])
      .map((c: any) => String(c || '').trim())
      .filter(Boolean)
      .sort((a: string, b: string) => a.localeCompare(b));

    return res.json({
      success: true,
      leads,
      total,
      page: Number(page),
      limit: Number(limit),
      availableColleges: Array.from(new Set(colleges)),
      availableCourses: Array.from(new Set(courses)),
    });
  } catch (err: any) {
    console.error('[Get Leads Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch leads.' });
  }
};

/**
 * POST /api/crm/leads
 * Manual lead creation (authenticated)
 */
export const createLead = async (req: Request, res: Response) => {
  try {
    const crmUser = (req as any).crmUser;
    const { name, phone, email, course, assignedTo } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required.' });
    }

    // Assign to agent or self
    let agentId = crmUser.id;
    let agentName = crmUser.name;

    if (assignedTo && crmUser.role === 'super_admin') {
      const agent: any = await User.findById(assignedTo).lean();
      if (agent) {
        agentId = agent._id.toString();
        agentName = agent.name;
      }
    }

    const {
      collegeName,
      year,
      branch,
      status = 'new',
      temperature = 'warm',
    } = req.body;

    const lead = await Lead.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || '',
      course: course?.trim() || '',
      collegeName: collegeName?.trim() || '',
      year: year?.trim() || '',
      branch: branch?.trim() || '',
      source: 'manual',
      status: status || 'new',
      temperature: temperature || 'warm',
      statusUpdatedBy: crmUser.id,
      statusUpdatedByName: crmUser.name,
      statusUpdatedAt: new Date(),
      assignedTo: agentId,
      assignedAgentName: agentName,
    });

    return res.status(201).json({ success: true, lead, message: 'Lead created successfully.' });
  } catch (err: any) {
    console.error('[Create Lead Error]:', err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'A lead with this phone already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create lead.' });
  }
};

/**
 * PUT /api/crm/leads/:leadId
 * Update lead details (CRM Agent & Super Admin)
 */
export const updateLead = async (req: Request, res: Response) => {
  try {
    const crmUser = (req as any).crmUser;
    const { leadId } = req.params;
    const {
      name,
      phone,
      email,
      course,
      collegeName,
      year,
      branch,
      status,
      temperature,
      assignedTo,
    } = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    if (name !== undefined) lead.name = name.trim();
    if (phone !== undefined) lead.phone = phone.trim();
    if (email !== undefined) lead.email = email.trim();
    if (course !== undefined) lead.course = course.trim();
    if (collegeName !== undefined) lead.collegeName = collegeName.trim();
    if (year !== undefined) lead.year = year.trim();
    if (branch !== undefined) lead.branch = branch.trim();
    if (temperature !== undefined) lead.temperature = temperature;

    if (status && status !== lead.status) {
      lead.status = status;
      lead.statusUpdatedBy = crmUser.id;
      lead.statusUpdatedByName = crmUser.name;
      lead.statusUpdatedAt = new Date();
    }

    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === '') {
        lead.assignedTo = undefined;
        lead.assignedAgentName = undefined;
      } else {
        const agent: any = await User.findById(assignedTo).lean();
        if (agent) {
          lead.assignedTo = agent._id.toString();
          lead.assignedAgentName = agent.name;
        }
      }
    }

    await lead.save();
    return res.json({ success: true, lead, message: 'Lead updated successfully.' });
  } catch (err: any) {
    console.error('[Update Lead Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update lead.' });
  }
};

/**
 * DELETE /api/crm/leads/:leadId
 * Single lead delete (CRM Agent & Super Admin)
 */
export const deleteLead = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const deleted = await Lead.findByIdAndDelete(leadId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }
    return res.json({ success: true, message: 'Lead deleted successfully.' });
  } catch (err: any) {
    console.error('[Delete Lead Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete lead.' });
  }
};

/**
 * POST /api/crm/leads/bulk-delete
 * Bulk delete selected leads (CRM Agent & Super Admin)
 */
export const bulkDeleteLeads = async (req: Request, res: Response) => {
  try {
    const { leadIds } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of lead IDs to delete.' });
    }

    const result = await Lead.deleteMany({ _id: { $in: leadIds } });
    return res.json({
      success: true,
      message: `${result.deletedCount} lead(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (err: any) {
    console.error('[Bulk Delete Leads Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete selected leads.' });
  }
};

/**
 * PATCH /api/crm/leads/:leadId/status
 * Update disposition + append call note
 */
export const updateLeadStatus = async (req: Request, res: Response) => {
  try {
    const crmUser = (req as any).crmUser;
    const { leadId } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const validStatuses = ['new', 'contacted', 'interested', 'follow_up', 'converted', 'not_interested', 'no_answer', 'invalid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const update: any = {
      status,
      statusUpdatedBy: crmUser.id,
      statusUpdatedByName: crmUser.name,
      statusUpdatedAt: new Date(),
      lastContactedAt: new Date(),
    };

    const noteEntry = note?.trim()
      ? {
          agentId: crmUser.id,
          agentName: crmUser.name,
          note: note.trim(),
          status,
          createdAt: new Date(),
        }
      : null;

    const lead = await Lead.findByIdAndUpdate(
      leadId,
      {
        $set: update,
        ...(noteEntry ? { $push: { callNotes: noteEntry } } : {}),
      },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    return res.json({ success: true, lead, message: 'Lead updated.' });
  } catch (err: any) {
    console.error('[Update Lead Status Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update lead.' });
  }
};

/**
 * POST /api/crm/leads/:leadId/send-link
 * Trigger dynamic discount checkout link with agent coupon
 */
export const sendPaymentLink = async (req: Request, res: Response) => {
  try {
    const crmUser = (req as any).crmUser;
    const { leadId } = req.params;
    const { couponCode, courseSlug, message } = req.body;

    const lead = await Lead.findById(leadId).lean();
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    let couponDetails: any = null;
    if (couponCode) {
      couponDetails = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true }).lean();
    }

    const targetSlug = courseSlug || 'frontend-developer-training-internship';
    const isTraining = targetSlug.includes('training') || targetSlug.includes('internship');

    const baseUrl = process.env.FRONTEND_URL || 'https://binaryvidya.com';
    const checkoutPath = isTraining
      ? '/training-and-internship/checkout'
      : `/courses/${targetSlug}/checkout`;
    const checkoutUrl = couponCode
      ? `${baseUrl}${checkoutPath}?coupon=${encodeURIComponent(couponCode.toUpperCase())}`
      : `${baseUrl}${checkoutPath}`;

    // Mark lead as link sent
    await Lead.findByIdAndUpdate(leadId, {
      $set: {
        paymentLinkSent: true,
        paymentLinkSentAt: new Date(),
        couponUsed: couponCode || '',
        status: 'interested',
        lastContactedAt: new Date(),
      },
      $push: {
        callNotes: {
          agentId: crmUser.id,
          agentName: crmUser.name,
          note: `Payment link sent${couponCode ? ` with coupon ${couponCode}` : ''}. ${message || ''}`.trim(),
          status: 'interested',
          createdAt: new Date(),
        },
      },
    });

    return res.json({
      success: true,
      checkoutUrl,
      couponDetails: couponDetails
        ? {
            code: couponDetails.code,
            discountType: couponDetails.discountType,
            discountValue: couponDetails.discountValue,
            description: couponDetails.description,
          }
        : null,
      message: `Checkout link generated${couponCode ? ` with coupon ${couponCode}` : ''}.`,
    });
  } catch (err: any) {
    console.error('[Send Payment Link Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate payment link.' });
  }
};

// ── Public Lead Capture ──────────────────────────────────────────────────────

/**
 * POST /api/public/leads
 * Unauthenticated — captures public counselling lead
 */
export const capturePublicLead = async (req: Request, res: Response) => {
  try {
    const { phone, name, course, interest, email, collegeName, year, branch } = req.body;
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    const selectedCourse = (interest || course || '').trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email?.trim().toLowerCase() || undefined;

    const existing = await Lead.findOne({ phone: cleanPhone });
    if (existing) {
      if (cleanEmail && !existing.email) existing.email = cleanEmail;
      if (name?.trim() && (!existing.name || existing.name === 'Not Provided')) existing.name = name.trim();
      if (selectedCourse && !existing.course) existing.course = selectedCourse;
      if (collegeName?.trim() && !existing.collegeName) existing.collegeName = collegeName.trim();
      if (year?.trim() && !existing.year) existing.year = year.trim();
      if (branch?.trim() && !existing.branch) existing.branch = branch.trim();
      await existing.save();
      return res.json({ success: true, message: 'Thanks! Our team will call you soon.' });
    }

    await Lead.create({
      name: name?.trim() || 'Not Provided',
      phone: cleanPhone,
      email: cleanEmail,
      course: selectedCourse,
      collegeName: collegeName?.trim() || '',
      year: year?.trim() || '',
      branch: branch?.trim() || '',
      source: 'public_form',
      status: 'new',
      statusUpdatedByName: 'Online Form',
      statusUpdatedAt: new Date(),
    });

    return res.json({ success: true, message: 'Thanks! Our career counselling team will call you within 24 hours.' });
  } catch (err: any) {
    console.error('[Capture Public Lead Error]:', err);
    return res.status(500).json({ success: false, message: 'Submission failed. Please try again.' });
  }
};

// ── Team Management ──────────────────────────────────────────────────────────

/**
 * GET /api/crm/team  – List all sales agents
 */
export const getAgents = async (_req: Request, res: Response) => {
  try {
    const agents = await User.find({
      $or: [
        { department: { $in: ['CSM', 'BDA', 'Lead Generation', 'Sales', 'sales'] } },
        { salesTeam: { $in: ['CSM', 'BDA', 'Lead Generation'] } },
      ],
      isTeamMember: true,
    })
      .select('name email phone department salesTeam teamStatus isTeamMember role permissions createdAt')
      .lean();

    return res.json({ success: true, agents });
  } catch (err: any) {
    console.error('[Get Agents Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch agents.' });
  }
};

/**
 * POST /api/crm/team  – Add a new sales agent
 */
export const addAgent = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, team, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    const validTeams = ['BDA', 'Lead Generation', 'CSM'];
    const chosenTeam = validTeams.includes(team)
      ? team
      : department && validTeams.includes(department)
      ? department
      : team || 'BDA';

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      // Promote existing user to team member
      const updateData: any = {
        isTeamMember: true,
        department: chosenTeam,
        salesTeam: chosenTeam,
        teamStatus: 'active',
      };
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
        updateData.mustChangePassword = true;
      }
      await User.findByIdAndUpdate(existing._id, { $set: updateData });

      try {
        const portalUrl = (process.env.FRONTEND_URL || 'https://binaryvidya.vercel.app').replace(/\/+$/, '');
        await sendTeamCredentialsEmail({
          name: existing.name || name.trim(),
          email: existing.email,
          temporaryPassword: password,
          department: chosenTeam,
          team: chosenTeam,
          loginUrl: `${portalUrl}/sales/login`,
        });
        console.log(`[Team Welcome Email Sent] To: ${existing.email} (${chosenTeam})`);
      } catch (mailErr) {
        console.error('[Send Team Welcome Email Error]:', mailErr);
      }

      return res.json({ success: true, message: `${existing.name} assigned to ${chosenTeam} sales team. Login credentials sent to email!` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const agent = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || undefined,
      password: hashedPassword,
      role: 'student',
      authProvider: 'local',
      isVerified: true,
      isTeamMember: true,
      department: chosenTeam,
      salesTeam: chosenTeam,
      teamStatus: 'active',
      mustChangePassword: true,
    });

    try {
      const portalUrl = (process.env.FRONTEND_URL || 'https://binaryvidya.vercel.app').replace(/\/+$/, '');
      await sendTeamCredentialsEmail({
        name: agent.name,
        email: agent.email,
        temporaryPassword: password,
        department: chosenTeam,
        team: chosenTeam,
        loginUrl: `${portalUrl}/sales/login`,
      });
      console.log(`[Team Welcome Email Sent] To: ${agent.email} (${chosenTeam})`);
    } catch (mailErr) {
      console.error('[Send Team Welcome Email Error]:', mailErr);
    }

    return res.status(201).json({
      success: true,
      agent: {
        _id: agent._id,
        name: agent.name,
        email: agent.email,
        department: chosenTeam,
        salesTeam: chosenTeam,
      },
      message: `${chosenTeam} agent added successfully.`,
    });
  } catch (err: any) {
    console.error('[Add Agent Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to add agent.' });
  }
};

/**
 * PATCH /api/crm/team/:agentId  – Update an agent's team / details
 */
export const updateAgentTeam = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { team, department } = req.body;
    const chosenTeam = team || department;

    if (!chosenTeam) {
      return res.status(400).json({ success: false, message: 'Team is required.' });
    }

    const updated = await User.findByIdAndUpdate(
      agentId,
      { $set: { department: chosenTeam, salesTeam: chosenTeam } },
      { new: true }
    ).select('name email phone department salesTeam teamStatus role');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Agent not found.' });
    }

    return res.json({ success: true, agent: updated, message: `Team updated to ${chosenTeam}.` });
  } catch (err: any) {
    console.error('[Update Agent Team Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update agent team.' });
  }
};

/**
 * DELETE /api/crm/team/:agentId  – Remove/deactivate a sales agent
 */
export const removeAgent = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    await User.findByIdAndUpdate(agentId, {
      $set: { isTeamMember: false, teamStatus: 'suspended' },
    });

    return res.json({ success: true, message: 'Agent removed from sales team.' });
  } catch (err: any) {
    console.error('[Remove Agent Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove agent.' });
  }
};

// ── Analytics ─────────────────────────────────────────────────────────────────

/**
 * GET /api/crm/dashboard
 * Conversion analytics & call stats
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const crmUser = (req as any).crmUser;
    const { scope = 'all' } = req.query;
    const matchQuery: any = {};

    // By default, show real-time stats across the whole organization to everyone (Super Admin, BDA, CSM, Lead Gen)
    if (scope === 'my') {
      matchQuery.assignedTo = crmUser.id;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const [statusBreakdown, totalLeads, todayLeads, todayContacted, recentActivity, myAssignedCount] = await Promise.all([
      Lead.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Lead.countDocuments(matchQuery),
      Lead.countDocuments({
        ...matchQuery,
        createdAt: { $gte: startOfToday },
      }),
      Lead.countDocuments({
        ...matchQuery,
        lastContactedAt: { $gte: startOfToday },
      }),
      Lead.find(matchQuery)
        .sort({ updatedAt: -1 })
        .limit(8)
        .select('name phone course source status updatedAt statusUpdatedByName assignedAgentName lastContactedAt')
        .lean(),
      Lead.countDocuments({ assignedTo: crmUser.id }),
    ]);

    const statusMap: Record<string, number> = {};
    statusBreakdown.forEach((s: any) => {
      statusMap[s._id] = s.count;
    });

    const converted = statusMap['converted'] || 0;
    const interested = statusMap['interested'] || 0;
    const followUp = statusMap['follow_up'] || 0;
    const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : '0.0';

    return res.json({
      success: true,
      stats: {
        totalLeads,
        todayLeads,
        todayContacted,
        converted,
        interested,
        followUp,
        conversionRate,
        statusBreakdown: statusMap,
        recentActivity,
        myAssignedCount,
        scope,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('[Dashboard Stats Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};

/**
 * POST /api/crm/leads/:leadId/claim
 * 1-Click self-assignment
 */
export const claimLead = async (req: Request, res: Response) => {
  try {
    const crmUser = (req as any).crmUser;
    const { leadId } = req.params;

    const lead = await Lead.findByIdAndUpdate(
      leadId,
      {
        $set: {
          assignedTo: crmUser.id,
          assignedAgentName: crmUser.name,
        },
        $push: {
          callNotes: {
            agentId: crmUser.id,
            agentName: crmUser.name,
            note: `Lead claimed by ${crmUser.name}`,
            status: 'contacted',
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
    return res.json({ success: true, lead, message: 'Lead claimed successfully.' });
  } catch (err: any) {
    console.error('[Claim Lead Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/crm/leads/:leadId/reassign
 * Single reassign to specified agent
 */
export const reassignLead = async (req: Request, res: Response) => {
  try {
    const crmUser = (req as any).crmUser;
    const { leadId } = req.params;
    const { agentId, agentName } = req.body;

    if (!agentId || !agentName) {
      return res.status(400).json({ success: false, message: 'Agent ID and Name required.' });
    }

    const lead = await Lead.findByIdAndUpdate(
      leadId,
      {
        $set: {
          assignedTo: agentId,
          assignedAgentName: agentName,
        },
        $push: {
          callNotes: {
            agentId: crmUser.id,
            agentName: crmUser.name,
            note: `Lead reassigned to ${agentName} by ${crmUser.name}`,
            status: 'contacted',
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
    return res.json({ success: true, lead, message: `Lead reassigned to ${agentName}.` });
  } catch (err: any) {
    console.error('[Reassign Lead Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/crm/leads/:leadId/disposition
 * Follow-up datetime + note + status logging
 */
export const logDisposition = async (req: Request, res: Response) => {
  try {
    const crmUser = (req as any).crmUser;
    const { leadId } = req.params;
    const { status, note, followUpAt } = req.body;

    if (!status) return res.status(400).json({ success: false, message: 'Status is required.' });

    const parsedFollowUpAt = followUpAt ? new Date(followUpAt) : undefined;

    const update: any = {
      status,
      statusUpdatedBy: crmUser.id,
      statusUpdatedByName: crmUser.name,
      statusUpdatedAt: new Date(),
      lastContactedAt: new Date(),
    };

    if (parsedFollowUpAt && !isNaN(parsedFollowUpAt.getTime())) {
      update.followUpAt = parsedFollowUpAt;
    } else if (status !== 'follow_up') {
      update.followUpAt = null;
    }

    const noteEntry: any = {
      agentId: crmUser.id,
      agentName: crmUser.name,
      note: note?.trim() || `Status updated to ${status}`,
      status,
      createdAt: new Date(),
    };
    if (parsedFollowUpAt && !isNaN(parsedFollowUpAt.getTime())) {
      noteEntry.followUpAt = parsedFollowUpAt;
    }

    const lead = await Lead.findByIdAndUpdate(
      leadId,
      {
        $set: update,
        $push: { callNotes: noteEntry },
      },
      { new: true }
    );

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
    return res.json({ success: true, lead, message: 'Disposition recorded successfully.' });
  } catch (err: any) {
    console.error('[Disposition Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/crm/leads/:leadId/history
 * Full activity drawer timeline payload
 */
export const getLeadHistory = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const lead: any = await Lead.findById(leadId).lean();
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

    const timeline: any[] = [];

    // 1. Creation event
    timeline.push({
      type: 'created',
      title: 'Lead Inquired / Created',
      description: `Source: ${lead.source || 'Website'} · Course: ${lead.course || 'General'}`,
      timestamp: lead.createdAt,
      actor: lead.source === 'public_form' ? 'Student (Online Form)' : lead.assignedAgentName || 'System',
    });

    // 2. Payment link sent event (if any)
    if ((lead as any).paymentLinkSentAt) {
      timeline.push({
        type: 'payment_link',
        title: 'Payment Checkout Link Sent',
        description: `Coupon applied: ${(lead as any).couponUsed || 'Standard'}`,
        timestamp: (lead as any).paymentLinkSentAt,
        actor: lead.assignedAgentName || 'System',
      });
    }

    // 3. Call notes and status logs
    if (Array.isArray(lead.callNotes)) {
      lead.callNotes.forEach((cn: any) => {
        timeline.push({
          type: 'call_log',
          title: `Call Outcome: ${(cn.status || 'contacted').toUpperCase()}`,
          description: cn.note,
          status: cn.status,
          followUpAt: cn.followUpAt,
          timestamp: cn.createdAt,
          actor: cn.agentName,
        });
      });
    }

    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json({
      success: true,
      lead,
      timeline,
    });
  } catch (err: any) {
    console.error('[Lead History Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/crm/leads/bulk-assign
 * Multi-select bulk agent assignment
 */
export const bulkAssignLeads = async (req: Request, res: Response) => {
  try {
    const crmUser = (req as any).crmUser;
    const { leadIds, agentId, agentName } = req.body;

    if (!Array.isArray(leadIds) || leadIds.length === 0 || !agentId || !agentName) {
      return res.status(400).json({ success: false, message: 'leadIds array, agentId, and agentName are required.' });
    }

    await Lead.updateMany(
      { _id: { $in: leadIds } },
      {
        $set: {
          assignedTo: agentId,
          assignedAgentName: agentName,
        },
        $push: {
          callNotes: {
            agentId: crmUser.id,
            agentName: crmUser.name,
            note: `Bulk assigned to ${agentName} by ${crmUser.name}`,
            status: 'contacted',
            createdAt: new Date(),
          },
        },
      }
    );

    return res.json({ success: true, message: `Successfully assigned ${leadIds.length} leads to ${agentName}.` });
  } catch (err: any) {
    console.error('[Bulk Assign Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/crm/leads/bulk-status
 * Multi-select bulk status update
 */
export const bulkUpdateStatus = async (req: Request, res: Response) => {
  try {
    const crmUser = (req as any).crmUser;
    const { leadIds, status, note } = req.body;

    if (!Array.isArray(leadIds) || leadIds.length === 0 || !status) {
      return res.status(400).json({ success: false, message: 'leadIds array and status are required.' });
    }

    const noteEntry = {
      agentId: crmUser.id,
      agentName: crmUser.name,
      note: note?.trim() || `Bulk updated status to ${status}`,
      status,
      createdAt: new Date(),
    };

    await Lead.updateMany(
      { _id: { $in: leadIds } },
      {
        $set: {
          status,
          statusUpdatedBy: crmUser.id,
          statusUpdatedByName: crmUser.name,
          statusUpdatedAt: new Date(),
          lastContactedAt: new Date(),
        },
        $push: { callNotes: noteEntry },
      }
    );

    return res.json({ success: true, message: `Successfully updated status to ${status} for ${leadIds.length} leads.` });
  } catch (err: any) {
    console.error('[Bulk Status Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/crm/leads/callbacks-today
 * Count & list for "Today's Callbacks"
 */
export const getCallbacksToday = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const query = {
      status: 'follow_up',
      followUpAt: { $lte: endOfToday },
    };

    const [leads, count] = await Promise.all([
      Lead.find(query).sort({ followUpAt: 1 }).lean(),
      Lead.countDocuments(query),
    ]);

    return res.json({ success: true, count, leads });
  } catch (err: any) {
    console.error('[Callbacks Today Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/crm/stats/leaderboard
 * Daily call aggregation & conversion rankings
 */
export const getLeaderboardStats = async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const agents = await User.find({
      $or: [{ isTeamMember: true }, { role: 'admin' }],
    })
      .select('_id name email role department salesTeam avatar')
      .lean();

    const todayCallsAgg = await Lead.aggregate([
      { $unwind: '$callNotes' },
      { $match: { 'callNotes.createdAt': { $gte: startOfToday } } },
      {
        $group: {
          _id: '$callNotes.agentId',
          agentName: { $first: '$callNotes.agentName' },
          callsToday: { $sum: 1 },
        },
      },
      { $sort: { callsToday: -1 } },
    ]);

    const conversionsAgg = await Lead.aggregate([
      { $match: { status: 'converted' } },
      {
        $group: {
          _id: '$assignedTo',
          conversions: { $sum: 1 },
        },
      },
    ]);

    const convMap: Record<string, number> = {};
    conversionsAgg.forEach((c: any) => {
      if (c._id) convMap[String(c._id)] = c.conversions;
    });

    const callsMap: Record<string, number> = {};
    todayCallsAgg.forEach((c: any) => {
      if (c._id) callsMap[String(c._id)] = c.callsToday;
    });

    const rankings = agents.map((agent: any) => {
      const idStr = agent._id.toString();
      const team = agent.department || agent.salesTeam || 'BDA';
      return {
        agentId: idStr,
        name: agent.name,
        email: agent.email,
        team,
        avatar: agent.avatar,
        callsToday: callsMap[idStr] || 0,
        conversions: convMap[idStr] || 0,
      };
    });

    rankings.sort((a, b) => b.callsToday - a.callsToday || b.conversions - a.conversions);

    const teamBreakdown = {
      BDA: { totalCalls: 0, conversions: 0, members: 0 },
      CSM: { totalCalls: 0, conversions: 0, members: 0 },
      'Lead Generation': { totalCalls: 0, conversions: 0, members: 0 },
    };

    rankings.forEach((r) => {
      const t = r.team as keyof typeof teamBreakdown;
      if (teamBreakdown[t]) {
        teamBreakdown[t].totalCalls += r.callsToday;
        teamBreakdown[t].conversions += r.conversions;
        teamBreakdown[t].members += 1;
      }
    });

    const topCounselor = rankings[0] || null;
    const totalCallsToday = todayCallsAgg.reduce((acc, c) => acc + c.callsToday, 0);

    return res.json({
      success: true,
      rankings,
      topCounselor,
      totalCallsToday,
      teamBreakdown,
    });
  } catch (err: any) {
    console.error('[Leaderboard Stats Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
