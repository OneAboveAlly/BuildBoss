import React, { useState } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { messageService } from '../../services/messageService';
import type { JobOffer } from '../../types/job';
import type { WorkRequest } from '../../types/request';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobOffer?: JobOffer;
  workRequest?: WorkRequest;
  recipientId: number;
  recipientName: string;
}

const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  jobOffer,
  workRequest,
  recipientId,
  recipientName
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || sending) return;

    try {
      setSending(true);
      
      await messageService.sendMessage({
        receiverId: recipientId,
        content: message.trim(),
        jobOfferId: jobOffer?.id ? parseInt(jobOffer.id) : undefined,
        workRequestId: workRequest?.id ? parseInt(workRequest.id) : undefined
      });

      setSent(true);
      setTimeout(() => {
        onClose();
        setMessage('');
        setSent(false);
      }, 2000);
    } catch (error) {
      console.error('Błąd wysyłania wiadomości:', error);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      onClose();
      setMessage('');
      setSent(false);
    }
  };

  if (!isOpen) return null;

  const contextTitle = jobOffer?.title || workRequest?.title || '';
  const contextType = jobOffer ? 'ogłoszenie o pracę' : workRequest ? 'zlecenie pracy' : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Kontakt z {recipientName}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              W sprawie: {contextType}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={sending}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Kontekst */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              {contextTitle}
            </h4>
            <p className="text-sm text-gray-600">
              {jobOffer ? (
                <>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                    {jobOffer.category}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {jobOffer.type}
                  </span>
                </>
              ) : workRequest ? (
                <>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                    {workRequest.category}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {workRequest.type}
                  </span>
                </>
              ) : null}
            </p>
          </div>

          {sent ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <PaperAirplaneIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Wiadomość wysłana!
              </h3>
              <p className="text-sm text-gray-500">
                Twoja wiadomość została dostarczona do {recipientName}.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Twoja wiadomość
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Napisz wiadomość do ${recipientName}...`}
                  rows={6}
                  disabled={sending}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Bądź uprzejmy i profesjonalny. Opisz swoje doświadczenie i zainteresowanie.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={sending}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={!message.trim() || sending}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Wysyłanie...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                      Wyślij wiadomość
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactModal; 