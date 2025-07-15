import React from 'react';

interface AdminModalProps {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  confirmText?: string;
}

export const AdminModal: React.FC<AdminModalProps> = ({ open, title, message, onClose, confirmText = 'OK' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full animate-fade-in">
        {title && <h3 className="text-lg font-bold mb-2 text-gray-900">{title}</h3>}
        <div className="text-gray-700 mb-6 whitespace-pre-line">{message}</div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}; 