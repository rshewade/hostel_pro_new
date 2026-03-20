'use client';

import { useState } from 'react';
import { Card } from '@/components/data/Card';
import { Button } from '@/components/ui/Button';
import { 
  BookOpen, 
  Wallet, 
  BedDouble, 
  CalendarDays, 
  FileText, 
  LogOut, 
  ShieldCheck, 
  ChevronRight,
  Menu
} from 'lucide-react';

export default function StudentUserManual() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'fees', label: 'Fee Payments', icon: <Wallet className="w-4 h-4" /> },
    { id: 'room', label: 'Room & Stay', icon: <BedDouble className="w-4 h-4" /> },
    { id: 'leave', label: 'Leave Management', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'renewal', label: 'Stay Renewal', icon: <FileText className="w-4 h-4" /> },
    { id: 'exit', label: 'Exit Process', icon: <LogOut className="w-4 h-4" /> },
    { id: 'rules', label: 'Rules & Regulations', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div style={{ background: 'var(--bg-page)' }} className="min-h-screen">
      <main className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Student User Manual
            </h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Comprehensive guide to using the Hostel Management Portal
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
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Dashboard Overview</h2>
                  </div>
                  <div className="prose max-w-none text-gray-600 space-y-4">
                    <p>
                      Welcome to your Student Dashboard. This is your central hub for all hostel-related activities.
                      From here, you can manage your fees, room details, leave requests, and document renewals.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Quick Stats:</strong> View your current fee status, room number, and attendance at a glance.</li>
                      <li><strong>Quick Actions:</strong> Easy access buttons to pay fees, apply for leave, or view documents.</li>
                      <li><strong>Notifications:</strong> Important announcements from the Superintendent or Trust will appear here.</li>
                    </ul>
                  </div>
                </Card>
              </section>

              {/* Fee Payments */}
              <section id="fees" className="scroll-mt-24">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Fee Payments</h2>
                  </div>
                  <div className="prose max-w-none text-gray-600 space-y-4">
                    <p>
                      The <strong>Fees</strong> section allows you to view pending dues and payment history.
                    </p>
                    <h3 className="text-lg font-semibold text-gray-800">How to Pay Fees:</h3>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>Navigate to the <strong>Fees</strong> tab from the top menu.</li>
                      <li>Review the breakdown of pending fees (Hostel Fee, Mess Fee, etc.).</li>
                      <li>Click on "Pay Now" to initiate the payment process.</li>
                      <li>Select your preferred payment mode (UPI, Net Banking, Card).</li>
                      <li>Once successful, download the receipt immediately for your records.</li>
                    </ol>
                    <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-sm text-yellow-800">
                      <strong>Note:</strong> Late fees may apply if dues are not cleared by the stipulated deadline.
                    </div>
                  </div>
                </Card>
              </section>

              {/* Room & Stay */}
              <section id="room" className="scroll-mt-24">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      <BedDouble className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Room & Stay</h2>
                  </div>
                  <div className="prose max-w-none text-gray-600 space-y-4">
                    <p>
                      Manage your room allocation and inventory in the <strong>Room</strong> section.
                    </p>
                    <h3 className="text-lg font-semibold text-gray-800">Check-in Process:</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Upon arrival, go to the <strong>Room</strong> page.</li>
                      <li>Click "Check In Now" to start the verification process.</li>
                      <li>Verify the inventory checklist (Bed, Table, Chair, etc.).</li>
                      <li>Report any existing damages in the notes section.</li>
                      <li>Confirm your check-in to activate your stay status.</li>
                    </ul>
                    <p>
                      You can also view your roommates' details and room capacity in this section.
                    </p>
                  </div>
                </Card>
              </section>

              {/* Leave Management */}
              <section id="leave" className="scroll-mt-24">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      <CalendarDays className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Leave Management</h2>
                  </div>
                  <div className="prose max-w-none text-gray-600 space-y-4">
                    <p>
                      All leave requests must be submitted digitally through the portal.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 my-4">
                      <div className="border p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-700">Short Leave</h4>
                        <p className="text-sm">For day outings returning before curfew.</p>
                        <p className="text-xs text-gray-500 mt-1">Approval: Auto/Warden</p>
                      </div>
                      <div className="border p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-700">Long Leave</h4>
                        <p className="text-sm">For overnight stays or home visits.</p>
                        <p className="text-xs text-gray-500 mt-1">Approval: Parents + Warden</p>
                      </div>
                    </div>
                    <p>
                      <strong>Parent Consent:</strong> For long leaves, an SMS/WhatsApp notification is sent to your parents. 
                      They may need to approve the request via the link provided.
                    </p>
                  </div>
                </Card>
              </section>

              {/* Documents */}
              <section id="documents" className="scroll-mt-24">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Documents</h2>
                  </div>
                  <div className="prose max-w-none text-gray-600 space-y-4">
                    <p>
                      The <strong>Documents</strong> section serves as your digital repository for all hostel-related paperwork.
                    </p>
                    <h3 className="text-lg font-semibold text-gray-800">Available Documents:</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Admission Letter:</strong> Your proof of admission.</li>
                      <li><strong>Fee Receipts:</strong> Downloadable records of all payments made.</li>
                      <li><strong>Undertakings:</strong> Signed copies of anti-ragging and hostel rules.</li>
                    </ul>
                    <p>
                      You can also upload new documents if requested by the administration (e.g., renewed income certificate, medical reports).
                    </p>
                  </div>
                </Card>
              </section>

              {/* Renewal */}
              <section id="renewal" className="scroll-mt-24">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">6-Month Renewal</h2>
                  </div>
                  <div className="prose max-w-none text-gray-600 space-y-4">
                    <p>
                      Your stay is approved for 6 months at a time. The renewal process opens 30 days before your term ends.
                    </p>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>Go to the <strong>Renewal</strong> page when the window is open.</li>
                      <li>Review your personal and academic details. Update if necessary.</li>
                      <li>Re-upload valid documents (e.g., latest mark sheet).</li>
                      <li>Pay the renewal fee for the next semester.</li>
                      <li>Sign the digital undertaking/consent form.</li>
                    </ol>
                  </div>
                </Card>
              </section>

              {/* Exit Process */}
              <section id="exit" className="scroll-mt-24">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                      <LogOut className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Exit Process</h2>
                  </div>
                  <div className="prose max-w-none text-gray-600 space-y-4">
                    <p>
                      When you are ready to leave the hostel permanently (e.g., course completion):
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Submit an <strong>Exit Request</strong> via the Exit tab.</li>
                      <li>Complete the "No Dues" clearance from Accounts and Library.</li>
                      <li>Undergo room inventory check with the Superintendent.</li>
                      <li>Once approved, you will receive a digital <strong>Exit Certificate</strong>.</li>
                      <li>Your account will be converted to "Alumni" status.</li>
                    </ul>
                  </div>
                </Card>
              </section>

              {/* Rules */}
              <section id="rules" className="scroll-mt-24">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Rules & Regulations</h2>
                  </div>
                  <div className="prose max-w-none text-gray-600 space-y-2">
                    <p><strong>General Discipline:</strong></p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Ragging is strictly prohibited and is a punishable offense.</li>
                      <li>Silence hours must be observed from 10:00 PM to 6:00 AM.</li>
                      <li>Cleanliness of the room is the collective responsibility of roommates.</li>
                    </ul>
                    <p className="mt-4"><strong>Visitors:</strong></p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Visitors are allowed only in the common area/lobby.</li>
                      <li>No visitors are allowed inside student rooms.</li>
                      <li>Visiting hours: 5:00 PM to 8:00 PM on weekdays, 10:00 AM to 8:00 PM on Sundays.</li>
                    </ul>
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
