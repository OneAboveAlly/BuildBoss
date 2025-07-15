import React from 'react';
import type { Conversation } from '../../types/message';
import { messageService } from '../../services/messageService';
import { 
  UserCircleIcon, 
  BriefcaseIcon, 
  ClipboardDocumentListIcon,
  ChatBubbleLeftIcon 
} from '@heroicons/react/24/outline';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation
}) => {
  const getContextIcon = (conversation: Conversation) => {
    if (conversation.jobOffer) {
      return <BriefcaseIcon className="h-4 w-4 text-blue-500" />;
    } else if (conversation.workRequest) {
      return <ClipboardDocumentListIcon className="h-4 w-4 text-green-500" />;
    } else {
      return <ChatBubbleLeftIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getContextText = (conversation: Conversation) => {
    if (conversation.jobOffer) {
      return conversation.jobOffer.title;
    } else if (conversation.workRequest) {
      return conversation.workRequest.title;
    } else {
      return 'Wiadomość bezpośrednia';
    }
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

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => {
        const isSelected = selectedConversation?.otherUser.id === conversation.otherUser.id &&
                          selectedConversation?.jobOffer?.id === conversation.jobOffer?.id &&
                          selectedConversation?.workRequest?.id === conversation.workRequest?.id;
        
        const isAdmin = conversation.otherUser.email && (conversation.otherUser.email.includes('admin') || conversation.otherUser.email.includes('plansadmin'));

        return (
          <div
            key={`${conversation.otherUser.id}-${conversation.jobOffer?.id || ''}-${conversation.workRequest?.id || ''}`}
            onClick={() => onSelectConversation(conversation)}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
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

              {/* Treść konwersacji */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={isSelected ? 'font-medium text-gray-900' : 'text-gray-600'}>
                      {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                    </span>
                    {isAdmin && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">ADMIN</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {conversation.unreadCount > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {conversation.unreadCount}
                      </span>
                    )}
                    <p className="text-xs text-gray-500">
                      {messageService.formatMessageTime(conversation.lastMessage.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Kontekst (ogłoszenie/zlecenie) */}
                <div className="flex items-center space-x-1 mt-1">
                  {getContextIcon(conversation)}
                  <p className="text-xs text-gray-500 truncate">
                    {getContextText(conversation)}
                  </p>
                </div>

                {/* Ostatnia wiadomość */}
                <p className={`text-sm mt-1 truncate ${
                  conversation.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
                }`}>
                  {conversation.lastMessage.content}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList; 