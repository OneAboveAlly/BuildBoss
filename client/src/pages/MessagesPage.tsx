import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { messageService } from '../services/messageService';
import type { Conversation, Message, MessageThread } from '../types/message';
import ConversationList from '../components/messages/ConversationList';
import MessageThreadComponent from '../components/messages/MessageThread';
import { ChatBubbleLeftRightIcon, InboxIcon } from '@heroicons/react/24/outline';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Ładowanie listy konwersacji
  useEffect(() => {
    loadConversations();
    loadUnreadCount();
  }, []);

  // Ładowanie wiadomości dla wybranej konwersacji
  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Błąd ładowania konwersacji:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    try {
      setMessagesLoading(true);
      const thread: MessageThread = {
        otherUserId: selectedConversation.otherUser.id,
        jobOfferId: selectedConversation.jobOffer?.id,
        workRequestId: selectedConversation.workRequest?.id
      };
      
      const data = await messageService.getMessageThread(thread);
      setMessages(data);

      // Oznacz konwersację jako przeczytaną
      await messageService.markThreadAsRead(thread);
      
      // Odśwież licznik nieprzeczytanych
      loadUnreadCount();
      
      // Odśwież listę konwersacji (aktualizuj status przeczytania)
      loadConversations();
    } catch (error) {
      console.error('Błąd ładowania wiadomości:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await messageService.getUnreadCount();
      setUnreadCount(count.total);
    } catch (error) {
      console.error('Błąd ładowania licznika:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation || !content.trim()) return;

    try {
      const messageData = {
        content: content.trim(),
        receiverId: selectedConversation.otherUser.id,
        jobOfferId: selectedConversation.jobOffer?.id,
        workRequestId: selectedConversation.workRequest?.id
      };

      const newMessage = await messageService.sendMessage(messageData);
      
      // Dodaj nową wiadomość do listy
      setMessages(prev => [...prev, newMessage]);
      
      // Odśwież listę konwersacji (nowa wiadomość na górze)
      loadConversations();
    } catch (error) {
      console.error('Błąd wysyłania wiadomości:', error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await messageService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Błąd usuwania wiadomości:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Brak dostępu</h3>
          <p className="mt-1 text-sm text-gray-500">
            Musisz być zalogowany, aby korzystać z wiadomości.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ChatBubbleLeftRightIcon className="h-8 w-8 mr-3 text-blue-600" />
                Wiadomości
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Komunikuj się z kandydatami i zleceniodawcami
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {unreadCount} nieprzeczytanych
              </div>
            )}
          </div>
        </div>

        {/* Messenger Layout */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex h-[600px]">
            {/* Lista konwersacji - lewa strona */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">Konwersacje</h2>
                {conversations.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {conversations.length} {conversations.length === 1 ? 'konwersacja' : 'konwersacji'}
                  </p>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Ładowanie konwersacji...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Brak konwersacji</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Rozpocznij rozmowę aplikując na ogłoszenie lub kontaktując się w sprawie zlecenia.
                    </p>
                  </div>
                ) : (
                  <ConversationList
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    onSelectConversation={setSelectedConversation}
                  />
                )}
              </div>
            </div>

            {/* Wątek wiadomości - prawa strona */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <MessageThreadComponent
                  conversation={selectedConversation}
                  messages={messages}
                  loading={messagesLoading}
                  currentUserId={user.id}
                  onSendMessage={handleSendMessage}
                  onDeleteMessage={handleDeleteMessage}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Wybierz konwersację</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Kliknij na konwersację z lewej strony, aby rozpocząć czat.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage; 