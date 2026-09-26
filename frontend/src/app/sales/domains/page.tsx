'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCrm } from '../../../context/CrmContext';
import { CrmSidebar } from '../../../components/crm/CrmSidebar';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  ArrowUpDown,
  Search,
  Check,
  X,
  RefreshCw,
  Globe,
  Sliders,
} from 'lucide-react';

interface DomainItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
}

export default function CounsellingDomainsManagementPage() {
  const { crmUser, loading: authLoading } = useCrm();
  const router = useRouter();

  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOrder, setFormOrder] = useState<number>(100);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !crmUser) {
      router.replace('/sales/login');
    }
  }, [authLoading, crmUser, router]);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/counselling/domains?all=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.domains)) {
        setDomains(data.domains);
      } else {
        setNotice({ type: 'error', text: data.message || 'Failed to load domains.' });
      }
    } catch {
      setNotice({ type: 'error', text: 'Network error loading domains.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (crmUser) {
      fetchDomains();
    }
  }, [crmUser]);

  const openCreateModal = () => {
    setEditingDomain(null);
    setFormName('');
    setFormDescription('');
    setFormOrder((domains.length + 1) * 10);
    setFormIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (dom: DomainItem) => {
    setEditingDomain(dom);
    setFormName(dom.name);
    setFormDescription(dom.description || '');
    setFormOrder(dom.order || 0);
    setFormIsActive(dom.isActive !== false);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setNotice({ type: 'error', text: 'Please enter a domain name.' });
      return;
    }

    setSaving(true);
    try {
      if (editingDomain) {
        // Update
        const res = await fetch(`/api/counselling/domains/${editingDomain.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim(),
            order: Number(formOrder),
            isActive: formIsActive,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setNotice({ type: 'success', text: `Domain "${formName}" updated successfully.` });
          setModalOpen(false);
          fetchDomains();
        } else {
          setNotice({ type: 'error', text: data.message || 'Failed to update domain.' });
        }
      } else {
        // Create
        const res = await fetch('/api/counselling/domains', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim(),
            order: Number(formOrder),
            isActive: formIsActive,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setNotice({ type: 'success', text: `Domain "${formName}" created successfully.` });
          setModalOpen(false);
          fetchDomains();
        } else {
          setNotice({ type: 'error', text: data.message || 'Failed to create domain.' });
        }
      }
    } catch {
      setNotice({ type: 'error', text: 'Network error saving domain.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/counselling/domains/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', text: 'Domain deleted successfully.' });
        setDeleteConfirmId(null);
        fetchDomains();
      } else {
        setNotice({ type: 'error', text: data.message || 'Failed to delete domain.' });
      }
    } catch {
      setNotice({ type: 'error', text: 'Network error deleting domain.' });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (dom: DomainItem) => {
    try {
      const res = await fetch(`/api/counselling/domains/${dom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !dom.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({
          type: 'success',
          text: `"${dom.name}" is now ${!dom.isActive ? 'Active' : 'Inactive'}.`,
        });
        fetchDomains();
      }
    } catch {
      setNotice({ type: 'error', text: 'Network error updating status.' });
    }
  };

  const filteredDomains = domains.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <CrmSidebar />

      <main style={{ flex: 1, padding: '32px 24px 60px', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <Sparkles size={13} />
                Lead Gen &amp; CRM Admin
              </span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                {domains.length} Total Domains
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Counselling Domains Management
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', maxWidth: '640px' }}>
              Create, edit, or delete domains. Every update here automatically reflects on the public{' '}
              <Link href="/get-counselling" target="_blank" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}>
                /get-counselling form
              </Link>{' '}
              and across the CRM system in real time.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              href="/get-counselling"
              target="_blank"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '13.5px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Globe size={15} color="#2563eb" />
              View Live Form
              <ExternalLink size={13} color="#94a3b8" />
            </Link>

            <button
              onClick={openCreateModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Plus size={16} />
              Add New Domain
            </button>
          </div>
        </div>

        {/* Notice Alert */}
        {notice && (
          <div style={{
            backgroundColor: notice.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${notice.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: notice.type === 'success' ? '#065f46' : '#991b1b',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {notice.text}
            </div>
            <button
              onClick={() => setNotice(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Search Bar & Actions Bar */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={fetchDomains}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} />
            Refresh List
          </button>
        </div>

        {/* Domains Table / List */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <div style={{
                width: '28px',
                height: '28px',
                border: '3px solid #bfdbfe',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px',
              }} />
              Loading counselling domains...
            </div>
          ) : filteredDomains.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <Layers size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>No domains found</div>
              <div style={{ fontSize: '13.5px', marginTop: '4px' }}>
                {search ? 'Try clearing your search term.' : 'Click "Add New Domain" above to create your first domain.'}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '14px 16px' }}>Domain Name</th>
                    <th style={{ padding: '14px 16px' }}>Slug / Key</th>
                    <th style={{ padding: '14px 16px' }}>Display Order</th>
                    <th style={{ padding: '14px 16px' }}>Status in Form</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDomains.map((dom) => (
                    <tr key={dom.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Name */}
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: dom.isActive ? '#059669' : '#94a3b8',
                          }} />
                          {dom.name}
                        </div>
                        {dom.description && (
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400, marginTop: '2px' }}>
                            {dom.description}
                          </div>
                        )}
                      </td>

                      {/* Slug */}
                      <td style={{ padding: '14px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>
                        {dom.slug || dom.name.toLowerCase().replace(/\s+/g, '-')}
                      </td>

                      {/* Order */}
                      <td style={{ padding: '14px 16px', color: '#475569' }}>
                        <span style={{
                          backgroundColor: '#f1f5f9',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '12px',
                        }}>
                          #{dom.order || 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => handleToggleStatus(dom)}
                          title="Click to toggle status"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: dom.isActive ? '#ecfdf5' : '#f1f5f9',
                            color: dom.isActive ? '#059669' : '#64748b',
                            transition: 'all 0.15s',
                          }}
                        >
                          {dom.isActive ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                          {dom.isActive ? 'Active (Live)' : 'Inactive (Hidden)'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(dom)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              backgroundColor: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#2563eb',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Edit2 size={13} />
                            Edit
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(dom.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Create or Edit Domain */}
        {modalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              boxSizing: 'border-box',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {editingDomain ? 'Edit Counselling Domain' : 'Add New Counselling Domain'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Domain Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Domain Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Artificial Intelligence & Robotics"
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Description (Optional) */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Brief Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g. Deep learning, neural networks, computer vision"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Display Order & Active Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formOrder}
                      onChange={(e) => setFormOrder(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Status
                    </label>
                    <select
                      value={formIsActive ? 'active' : 'inactive'}
                      onChange={(e) => setFormIsActive(e.target.value === 'active')}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        cursor: 'pointer',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value="active">Active (Visible)</option>
                      <option value="inactive">Inactive (Hidden)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    {saving ? 'Saving...' : editingDomain ? 'Save Changes' : 'Create Domain'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '16px',
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              width: '100%',
              maxWidth: '400px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Trash2 size={28} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                Delete Domain?
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
                Are you sure you want to remove this domain from the counselling options? This will remove it from the public form immediately.
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
