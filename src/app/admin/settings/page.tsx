'use client';

import React from 'react';
import { Settings, Shield, Globe, Info, RefreshCw, Key } from 'lucide-react';

export default function AdminSettingsPage() {
  const adminCodeValue = 'HACKPASS_ADMIN_2026';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(adminCodeValue);
    alert('Admin registration code copied to clipboard!');
  };

  return (
    <div className="space-y-8 animate-slide-up text-left">
      {/* Title */}
      <div className="pb-4 border-b border-brand-brown/5">
        <h2 className="text-3xl font-black text-brand-black">Settings</h2>
        <p className="text-sm text-brand-brown/70 font-medium">Configure global variables, security protocols, and check-in parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Security Box */}
          <div className="glass-panel rounded-3xl p-6 border border-white/50 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-brand-brown/5 text-brand-black">
              <Shield className="w-5 h-5" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Gatekeeper Security</h3>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <span className="text-xs font-extrabold text-brand-black block">Admin Registration Passcode</span>
                  <span className="text-[10px] text-brand-brown/50 block mt-0.5">Required for enrolling new system administrators.</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-brown text-brand-bg font-extrabold rounded-xl text-xs active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" /> Copy Code
                </button>
              </div>

              <div className="p-4 bg-brand-brown/5 border border-brand-brown/10 rounded-2xl flex gap-2">
                <Info className="w-4 h-4 text-brand-brown/65 shrink-0 mt-0.5" />
                <p className="text-[10px] font-semibold text-brand-brown/80 leading-relaxed">
                  The admin passcode can be customized by adding the `ADMIN_REGISTRATION_CODE` environment variable inside Vercel's console settings.
                </p>
              </div>
            </div>
          </div>

          {/* Third-Party APIs Status */}
          <div className="glass-panel rounded-3xl p-6 border border-white/50 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-brand-brown/5 text-brand-black">
              <Globe className="w-5 h-5" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Integrations Hub</h3>
            </div>

            <div className="divide-y divide-brand-brown/5 font-semibold text-xs text-brand-brown/85">
              <div className="py-4 flex justify-between items-center">
                <div>
                  <span className="text-brand-black font-extrabold block">Google Wallet API</span>
                  <span className="text-[10px] text-brand-brown/45 block mt-0.5">JWT token generation for pass class saves</span>
                </div>
                <span className="text-[9px] font-bold bg-green-500/10 border border-green-500/20 text-green-700 px-2 py-0.5 rounded-lg">
                  READY (DEMO COMPATIBLE)
                </span>
              </div>

              <div className="py-4 flex justify-between items-center">
                <div>
                  <span className="text-brand-black font-extrabold block">Web Push Server</span>
                  <span className="text-[10px] text-brand-brown/45 block mt-0.5">VAPID keys for system push alerts</span>
                </div>
                <span className="text-[9px] font-bold bg-brand-yellow/15 border border-brand-yellow/20 text-brand-brown px-2 py-0.5 rounded-lg">
                  STANDBY
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Informational Widget */}
        <div className="glass-card rounded-3xl p-6 border border-white/40 space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-brown/65">Deployment Check</h3>
          <p className="text-xs text-brand-brown/70 leading-relaxed font-semibold">
            HackPass is configured to deploy directly to Vercel. Database schema migrations must be loaded in the Supabase Dashboard SQL editor.
          </p>
          <div className="border-t border-brand-brown/5 pt-4 space-y-1 text-[10px] font-bold text-brand-brown/55 uppercase tracking-wide">
            <p>Framework: Next.js (App Router)</p>
            <p className="mt-1">PWA manifest: Active</p>
            <p className="mt-1">Service Worker: Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
