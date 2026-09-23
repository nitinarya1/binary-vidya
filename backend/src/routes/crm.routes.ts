import { Router } from 'express';
import {
  crmLogin,
  crmSendOtp,
  crmVerifyOtp,
  crmLogout,
  crmMe,
  getLeads,
  createLead,
  updateLeadStatus,
  sendPaymentLink,
  capturePublicLead,
  getAgents,
  addAgent,
  updateAgentTeam,
  removeAgent,
  getDashboardStats,
  claimLead,
  reassignLead,
  logDisposition,
  getLeadHistory,
  bulkAssignLeads,
  bulkUpdateStatus,
  getCallbacksToday,
  getLeaderboardStats,
  updateLead,
  deleteLead,
  bulkDeleteLeads,
} from '../controllers/crm.controller';
import { crmProtect, requireSuperAdmin } from '../middleware/crm.middleware';

const router = Router();

// ── CRM Auth ─────────────────────────────────────────────────────────────────
router.post('/auth/send-otp', crmSendOtp);
router.post('/auth/verify-otp', crmVerifyOtp);
router.post('/auth/login', crmLogin);
router.post('/auth/logout', crmLogout);
router.get('/auth/me', crmProtect, crmMe);

// ── Dashboard & Stats ────────────────────────────────────────────────────────
router.get('/dashboard', crmProtect, getDashboardStats);
router.get('/stats/leaderboard', crmProtect, getLeaderboardStats);

// ── Leads ─────────────────────────────────────────────────────────────────────
router.get('/leads/callbacks-today', crmProtect, getCallbacksToday);
router.post('/leads/bulk-assign', crmProtect, bulkAssignLeads);
router.patch('/leads/bulk-status', crmProtect, bulkUpdateStatus);
router.post('/leads/bulk-delete', crmProtect, bulkDeleteLeads);
router.delete('/leads/bulk-delete', crmProtect, bulkDeleteLeads);

router.get('/leads', crmProtect, getLeads);
router.post('/leads', crmProtect, createLead);
router.put('/leads/:leadId', crmProtect, updateLead);
router.delete('/leads/:leadId', crmProtect, deleteLead);
router.patch('/leads/:leadId/status', crmProtect, updateLeadStatus);
router.post('/leads/:leadId/disposition', crmProtect, logDisposition);
router.post('/leads/:leadId/claim', crmProtect, claimLead);
router.post('/leads/:leadId/reassign', crmProtect, reassignLead);
router.get('/leads/:leadId/history', crmProtect, getLeadHistory);
router.post('/leads/:leadId/send-link', crmProtect, sendPaymentLink);

// ── Team (Super Admin only) ───────────────────────────────────────────────────
router.get('/team', crmProtect, requireSuperAdmin, getAgents);
router.post('/team', crmProtect, requireSuperAdmin, addAgent);
router.patch('/team/:agentId', crmProtect, requireSuperAdmin, updateAgentTeam);
router.delete('/team/:agentId', crmProtect, requireSuperAdmin, removeAgent);

export default router;
