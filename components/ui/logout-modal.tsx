'use client';

import React from 'react';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/ui/toast-provider';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectPath?: string;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, redirectPath }) => {
  const { logout } = useAuth();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleConfirmLogout = () => {
    showToast("Logged out successfully.", "info");
    onClose();
    logout(redirectPath);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate__animated animate__fadeIn animate__faster font-sans">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-red-50/60 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <LogOut size={18} />
            </div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Confirm Logout</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700 leading-relaxed">
            Are you sure you want to end your active session and log out of the portal?
          </p>
          <p className="text-xs text-gray-400 font-semibold">
            You will need to sign in again to access your dashboard.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmLogout}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <LogOut size={14} /> Yes, Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
