import React, { useState, useRef, useEffect } from 'react';
import type { Conversation, Message } from '../../types/message';
import { messageService } from '../../services/messageService';
import MessageInput from './MessageInput';
import { 
  UserCircleIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  TrashIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { Modal } from '../ui/Modal';

interface MessageThreadProps {
  conversation: Conversation;
  messages: Message[];
  loading: boolean;
  currentUserId: string;
  onSendMessage: (content: string, file?: File) => void;
  onDeleteMessage: (messageId: number) => void;
  defaultMessage?: string;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  conversation,
  messages,
  loading,
  currentUserId,
  onSendMessage,
  onDeleteMessage,
  defaultMessage
}) => {
  const [showDeleteMenu, setShowDeleteMenu] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageIdToDelete, setMessageIdToDelete] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll do najnowszej wiadomości
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getUserName = (conversation: Conversation) => {
    const { firstName, lastName } = conversation.otherUser;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else {
      return 'Użytkownik';
    }
  };

  const getUserInitials = (conversation: Conversation) => {
    return messageService.getUserInitials(
      conversation.otherUser.firstName,
      conversation.otherUser.lastName
    );
  };

  const getContextInfo = () => {
    if (conversation.jobOffer) {
      return {
        icon: <BriefcaseIcon className="h-5 w-5 text-blue-500" />,
        title: conversation.jobOffer.title,
        type: 'Ogłoszenie o pracę'
      };
    } else if (conversation.workRequest) {
      return {
        icon: <ClipboardDocumentListIcon className="h-5 w-5 text-green-500" />,
        title: conversation.workRequest.title,
        type: 'Zlecenie pracy'
      };
    } else {
      return {
        icon: <UserCircleIcon className="h-5 w-5 text-gray-500" />,
        title: 'Wiadomość bezpośrednia',
        type: 'Czat prywatny'
      };
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    setMessageIdToDelete(messageId);
    setShowDeleteModal(true);
    setShowDeleteMenu(null);
  };

  const contextInfo = getContextInfo();

  return (
    <div className="flex flex-col h-full">
      {/* Header konwersacji */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {conversation.otherUser.avatar ? (
              <img
                className="h-10 w-10 rounded-full"
                src={conversation.otherUser.avatar}
                alt={getUserName(conversation)}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {getUserInitials(conversation)}
                </span>
              </div>
            )}
          </div>

          {/* Informacje o konwersacji */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {getUserName(conversation)}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              {contextInfo.icon}
              <div>
                <p className="text-sm text-gray-600 truncate">
                  {contextInfo.type}
                </p>
                {contextInfo.title !== 'Wiadomość bezpośrednia' && (
                  <p className="text-xs text-gray-500 truncate">
                    {contextInfo.title}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista wiadomości */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Brak wiadomości w tej konwersacji.</p>
            <p className="text-sm text-gray-400 mt-1">Napisz pierwszą wiadomość poniżej.</p>
          </div>
        ) : (
          messages.map((message) => {
            const isFromCurrentUser = messageService.isMessageFromUser(message, currentUserId);
            
            return (
              <div
                key={message.id}
                className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                  isFromCurrentUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {messageService.formatMessageTime(message.createdAt)}
                  </p>

                  {/* Menu usuwania (tylko dla własnych wiadomości) */}
                  {isFromCurrentUser && (
                    <div className="absolute top-0 right-0 -mr-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setShowDeleteMenu(showDeleteMenu === message.id ? null : message.id)}
                        className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <EllipsisVerticalIcon className="h-4 w-4 text-gray-500" />
                      </button>
                      
                      {showDeleteMenu === message.id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Usuń
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formularz wysyłania wiadomości */}
      <div className="border-t border-gray-200 bg-white">
        <MessageInput onSendMessage={onSendMessage} defaultValue={defaultMessage} />
      </div>
      {/* Modal potwierdzenia usuwania */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Usuń wiadomość"
        size="sm"
      >
        <p className="mb-4">Czy na pewno chcesz trwale usunąć tę wiadomość? Tej operacji nie można cofnąć.</p>
        <div className="flex gap-2 justify-end">
          <button
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            onClick={() => setShowDeleteModal(false)}
          >
            Anuluj
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => {
              if (messageIdToDelete !== null) {
                onDeleteMessage(messageIdToDelete);
                setShowDeleteModal(false);
                setMessageIdToDelete(null);
              }
            }}
          >
            Usuń
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default MessageThread; 