import React, { useState, useRef } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || sending || disabled) return;

    try {
      setSending(true);
      await onSendMessage(message.trim());
      setMessage('');
      
      // Reset wysokości textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Błąd wysyłania wiadomości:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder="Napisz wiadomość..."
            disabled={disabled || sending}
            rows={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || sending || disabled}
          className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <PaperAirplaneIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Naciśnij Enter aby wysłać, Shift+Enter dla nowej linii
      </div>
    </form>
  );
};

export default MessageInput; 