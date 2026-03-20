'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/data/Card';
import { Button } from '@/components/ui/Button';
import { Shield, Lock, Eye, Database, User, Clock, FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

const DPDPPolicyPage: React.FC = () => {
  const t = useTranslations('Public.dpdpPolicy');

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    collection: true,
    usage: false,
    sharing: false,
    retention: false,
    rights: false,
    contact: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const sections = [
    {
      id: 'collection',
      title: t('dataCollection'),
      icon: <FileText className="w-5 h-5" />,
      content: t('dataCollectionContent'),
    },
    {
      id: 'usage',
      title: t('dataUsage'),
      icon: <Eye className="w-5 h-5" />,
      content: t('dataUsageContent'),
    },
    {
      id: 'sharing',
      title: t('dataSharing'),
      icon: <User className="w-5 h-5" />,
      content: t('dataSharingContent'),
    },
    {
      id: 'retention',
      title: t('dataRetention'),
      icon: <Database className="w-5 h-5" />,
      content: t('dataRetentionContent'),
    },
    {
      id: 'rights',
      title: t('yourRights'),
      icon: <Lock className="w-5 h-5" />,
      content: t('yourRightsContent'),
    },
    {
      id: 'contact',
      title: t('contactComplaints'),
      icon: <Shield className="w-5 h-5" />,
      content: t('contactComplaintsContent'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Image src="/logo.png" alt="Logo" width={48} height={48} className="bg-white rounded-lg" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{t('title')}</h1>
              <p className="text-gray-300">{t('subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm bg-navy-800 p-4 rounded-lg">
            <Shield className="w-5 h-5 text-gold-500" />
            <span>{t('privacyBanner')}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card padding="lg" className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('quickSummary')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">{t('weCollect')}</span>
              </div>
              <p className="text-sm text-blue-800">{t('weCollectDesc')}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">{t('weUse')}</span>
              </div>
              <p className="text-sm text-green-800">{t('weUseDesc')}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">{t('weKeep')}</span>
              </div>
              <p className="text-sm text-purple-800">{t('weKeepDesc')}</p>
            </div>
          </div>
        </Card>

        <Card padding="none">
          <div className="divide-y divide-gray-200">
            {sections.map((section) => (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-navy-100 rounded-lg text-navy-700">{section.icon}</div>
                    <span className="font-semibold text-gray-900">{section.title}</span>
                  </div>
                  {expandedSections[section.id] ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedSections[section.id] && (
                  <div className="px-6 pb-6">
                    <div className="pl-12 prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg" className="mt-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">{t('policyUpdates')}</h3>
              <p className="text-sm text-amber-800 mb-3">
                {t('policyUpdatesText')}
              </p>
              <p className="text-sm text-amber-800">
                {t('consentRenewal')}
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>{t('policyQuestions')}</p>
          <p className="mt-1">
            <a href="mailto:dpo@hostelmanagement.in" className="text-navy-700 hover:underline">
              dpo@hostelmanagement.in
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default DPDPPolicyPage;
