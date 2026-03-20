'use client';

import { useState } from 'react';
import { Card } from '@/components/data/Card';
import { Button } from '@/components/ui/Button';
import { 
  BookOpen, 
  LayoutDashboard, 
  CalendarDays, 
  FileCheck, 
  Settings, 
  ShieldAlert, 
  Users,
  ChevronRight
} from 'lucide-react';

export default function SuperintendentUserManual() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'applications', label: 'Admission Applications', icon: <Users className="w-4 h-4" /> },
    { id: 'leaves', label: 'Leave Management', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'clearance', label: 'Exit & Clearance', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'config', label: 'System Configuration', icon: <Settings className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit & Compliance', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  return (
    <div style={{ background: 'var(--bg-page)' }} className="min-h-screen">
      <main className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Superintendent User Manual
            </h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Guide to managing hostel operations and student lifecycle
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                    {activeSection === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3 space-y-12">
              
              {/* Overview */}
              <section id="overview" className="scroll-mt-24">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Dashboard Overview</h2>
                  </div>
                  <div className="prose max-w-none text-gray-600 space-y-4">
                    <p>
                      The Superintendent Dashboard provides a high-level view of your vertical's operations (Boys Hostel, Girls Ashram, or Dharamshala).
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Key Metrics:</strong> View total occupancy, pending applications, and pending leave requests.</li>
                      <li><strong>Quick Navigation:</strong> Access core modules like Applications, Leaves, and Clearance directly.</li>
                      <li><strong>Alerts:</strong> System notifications regarding critical events or overdue tasks.</li>
                    </ul>
                  </div>
                </Card>
              </section>

              {/* Applications */}
              <section id="applications" className="scroll-mt-24">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      <Users className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Admission Applications</h2>
                  </div>
                  <div className="prose max-w-none text-gray-600 space-y-4">
                    <p>
                      Manage incoming student admission requests.
                    </p>
                    <h3 className="text-lg font-semibold text-gray-800">Review Process:</h3>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>View the list of <strong>Submitted</strong> applications.</li>
                      <li>Click on an application to review details (Personal Info, Academic Records).</li>
                      <li>Verify uploaded documents.</li>
                      <li><strong>Action:</strong> Mark as 'Under Review', 'Approved' (Forward to Trustee), or 'Rejected'.</li>
                      <li>Add mandatory remarks for any status change.</li>
                    </ol>
                  </div>
                </Card>
              </section>

              {/* Leaves */}
              <section id="leaves" className="scroll-mt-24">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      <CalendarDays className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Leave Management</h2>
                  </div>
                  <div className="prose max-w-none text-gray-600 space-y-4">
                    <p>
                      Handle student leave requests efficiently.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Filter:</strong> View requests by type (Short, Night-out, Multi-day).</li>
                      <li><strong>Review:</strong> Check leave history and reason.</li>
                      <li><strong>Parent Consent:</strong> Ensure parent approval is received for multi-day leaves.</li>
                      <li><strong>Action:</strong> Approve or Reject requests. Rejection requires a reason.</li>
                      <li><strong>Communication:</strong> Send SMS/WhatsApp updates to parents directly from the panel.</li>
                    </ul>
                  </div>
                </Card>
              </section>

              {/* Clearance */}
              <section id="clearance" className="scroll-mt-24">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Exit & Clearance</h2>
                  </div>
                  <div className="prose max-w-none text-gray-600 space-y-4">
                    <p>
                      Process student exit requests and ensure proper handover.
                    </p>
                    <h3 className="text-lg font-semibold text-gray-800">Clearance Steps:</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Room Inspection:</strong> Verify the room inventory (Bed, Table, etc.) against the check-in list.</li>
                      <li><strong>Damages:</strong> Record any damages or missing items.</li>
                      <li><strong>Key Handover:</strong> Confirm receipt of room keys and ID card.</li>
                      <li><strong>Final Approval:</strong> Mark clearance as complete to proceed to Accounts for refund processing.</li>
                    </ul>
                  </div>
                </Card>
              </section>

              {/* Configuration */}
              <section id="config" className="scroll-mt-24">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                      <Settings className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">System Configuration</h2>
                  </div>
                  <div className="prose max-w-none text-gray-600 space-y-4">
                    <p>
                      Customize system behavior for your vertical.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Leave Rules:</strong> Set max days per month, approval requirements, and blackout dates (e.g., during exams).</li>
                      <li><strong>Notifications:</strong> Configure automatic SMS/WhatsApp templates for parents (e.g., Leave Approval, Emergency).</li>
                    </ul>
                  </div>
                </Card>
              </section>

              {/* Audit */}
              <section id="audit" className="scroll-mt-24">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Audit & Compliance</h2>
                  </div>
                  <div className="prose max-w-none text-gray-600 space-y-4">
                    <p>
                      Ensure transparency and accountability.
                    </p>
                    <p>
                      All critical actions (Approvals, Rejections, Status Changes) are logged immutably.
                      You can view the <strong>Audit Log</strong> to trace the history of any application or student record.
                    </p>
                  </div>
                </Card>
              </section>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
