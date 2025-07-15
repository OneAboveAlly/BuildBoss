import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadMessages } from '../contexts/UnreadMessagesContext';
import { messageService, type AdminMessage } from '../services/messageService';
import type { Conversation, Message, MessageThread } from '../types/message';
import ConversationList from '../components/messages/ConversationList';
import MessageThreadComponent from '../components/messages/MessageThread';
import { ChatBubbleLeftRightIcon, InboxIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Modal } from '../components/ui/Modal';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const { totalUnread, refreshCounts } = useUnreadMessages();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [selectedAdminMessage, setSelectedAdminMessage] = useState<AdminMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminMessagesLoading, setAdminMessagesLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  const [adminMessageIdToDelete, setAdminMessageIdToDelete] = useState<string | null>(null);

  // Ładowanie listy konwersacji i wiadomości od admina
  useEffect(() => {
    loadConversations();
    loadAdminMessages();
  }, []);

  // Ładowanie wiadomości dla wybranej konwersacji
  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation && selectedConversation.jobOffer) {
      setDefaultJobMessage();
    }
  }, [selectedConversation]);

  const [defaultJobMessage, setDefaultJobMessageState] = useState('');
  const setDefaultJobMessage = () => {
    if (selectedConversation && selectedConversation.jobOffer) {
      setDefaultJobMessageState(
        `Szanowni Państwo,\n\nW odpowiedzi na ofertę pracy \"${selectedConversation.jobOffer.title}\" chciałbym/chciałabym zgłosić swoją kandydaturę.\n\nPozostaję do dyspozycji w razie pytań.\n\nZ poważaniem,\n[Twoje imię i nazwisko]`
      );
    } else {
      setDefaultJobMessageState('');
    }
  };

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

  const loadAdminMessages = async () => {
    try {
      setAdminMessagesLoading(true);
      const data = await messageService.getAdminMessages();
      setAdminMessages(data.messages);
    } catch (error) {
      console.error('Błąd ładowania wiadomości od admina:', error);
    } finally {
      setAdminMessagesLoading(false);
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
      
      // Emituj event dla globalnych liczników
      window.dispatchEvent(new Event('notifications_marked_read'));
      
      // Odśwież globalne liczniki
      await refreshCounts();
      
      // Odśwież listę konwersacji (aktualizuj status przeczytania)
      loadConversations();
    } catch (error) {
      console.error('Błąd ładowania wiadomości:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (content: string, file?: File) => {
    if (!selectedConversation || !content.trim()) return;

    try {
      const messageData = {
        content: content.trim(),
        receiverId: selectedConversation.otherUser.id,
        jobOfferId: selectedConversation.jobOffer?.id,
        workRequestId: selectedConversation.workRequest?.id
      };

      const newMessage = await messageService.sendMessage(messageData, file);
      setMessages(prev => [...prev, newMessage]);
      loadConversations();
      await refreshCounts();
    } catch (error) {
      console.error('Błąd wysyłania wiadomości:', error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await messageService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // Odśwież globalne liczniki
      await refreshCounts();
    } catch (error) {
      console.error('Błąd usuwania wiadomości:', error);
    }
  };

  const handleAdminMessageClick = async (message: AdminMessage) => {
    try {
      const fullMessage = await messageService.getAdminMessage(message.id);
      setSelectedAdminMessage(fullMessage);
      
      // Emituj event dla globalnych liczników
      window.dispatchEvent(new Event('notifications_marked_read'));
      
      // Odśwież globalne liczniki po otwarciu wiadomości
      await refreshCounts();
      
      // Odśwież listę wiadomości od admina (aktualizuj status przeczytania)
      loadAdminMessages();
    } catch (error) {
      console.error('Błąd ładowania wiadomości od admina:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'NORMAL': return 'text-blue-600 bg-blue-50';
      case 'LOW': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UNREAD': return 'text-yellow-600 bg-yellow-50';
      case 'READ': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
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

  // Połącz wszystkie wiadomości w jedną listę
  const allMessages = [
    // Konwersacje jako wiadomości
    ...conversations.map(conv => ({
      id: `conv-${conv.otherUser.id}`,
      type: 'conversation' as const,
      conversation: conv,
      title: messageService.getConversationTitle(conv),
      content: conv.lastMessage?.content || 'Brak wiadomości',
      timestamp: conv.lastMessage?.createdAt || new Date().toISOString(),
      isRead: conv.unreadCount === 0,
      unreadCount: conv.unreadCount || 0
    })),
    // Wiadomości od admina
    ...adminMessages.map(msg => ({
      id: `admin-${msg.id}`,
      type: 'admin' as const,
      adminMessage: msg,
      title: msg.subject,
      content: msg.content,
      timestamp: msg.createdAt,
      isRead: msg.status === 'READ',
      priority: msg.priority,
      status: msg.status
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
                Komunikuj się z kandydatami, zleceniodawcami i administratorami
              </p>
            </div>
            {totalUnread > 0 && (
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {totalUnread} nieprzeczytanych
              </div>
            )}
          </div>
        </div>

        {/* Messenger Layout */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex h-[600px]">
            {/* Lista wszystkich wiadomości - lewa strona */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">
                  Wszystkie wiadomości
                </h2>
                {allMessages.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {allMessages.length} {allMessages.length === 1 ? 'wiadomość' : 'wiadomości'}
                  </p>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {loading && adminMessagesLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Ładowanie wiadomości...</p>
                  </div>
                ) : allMessages.length === 0 ? (
                  <div className="p-8 text-center">
                    <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Brak wiadomości</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Rozpocznij rozmowę aplikując na ogłoszenie lub kontaktując się w sprawie zlecenia.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {allMessages.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          (item.type === 'conversation' && selectedConversation?.otherUser.id === item.conversation.otherUser.id) ||
                          (item.type === 'admin' && selectedAdminMessage?.id === item.adminMessage.id)
                            ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          if (item.type === 'conversation') {
                            setSelectedConversation(item.conversation);
                            setSelectedAdminMessage(null);
                          } else {
                            handleAdminMessageClick(item.adminMessage);
                            setSelectedConversation(null);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              {item.type === 'admin' && (
                                <ShieldCheckIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              )}
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {item.title}
                              </h3>
                              {!item.isRead && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate mt-1">
                              {item.content}
                            </p>
                            {item.type === 'admin' && (
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                  {item.priority}
                                </span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                  {item.status}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 ml-2">
                            {new Date(item.timestamp).toLocaleDateString('pl-PL')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Wątek wiadomości - prawa strona */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                // Zwykłe konwersacje
                <MessageThreadComponent
                  conversation={selectedConversation}
                  messages={messages}
                  loading={messagesLoading}
                  currentUserId={user.id}
                  onSendMessage={handleSendMessage}
                  onDeleteMessage={handleDeleteMessage}
                  defaultMessage={defaultJobMessage}
                />
              ) : selectedAdminMessage ? (
                // Wiadomości od admina
                <div className="flex-1 flex flex-col">
                  {/* Header wiadomości */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{selectedAdminMessage.subject}</h3>
                        <p className="text-sm text-gray-500">
                          Od: {selectedAdminMessage.sender.firstName} {selectedAdminMessage.sender.lastName} ({selectedAdminMessage.sender.email})
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedAdminMessage.priority)}`}>
                          {selectedAdminMessage.priority}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAdminMessage.status)}`}>
                          {selectedAdminMessage.status}
                        </span>
                        {/* Przycisk usuwania */}
                        <button
                          className="ml-2 px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                          onClick={() => {
                            setAdminMessageIdToDelete(selectedAdminMessage.id);
                            setShowDeleteAdminModal(true);
                          }}
                        >
                          Usuń
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Treść wiadomości */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedAdminMessage.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(selectedAdminMessage.createdAt).toLocaleString('pl-PL')}
                      </p>
                    </div>

                    {/* Odpowiedzi */}
                    {selectedAdminMessage.replies && selectedAdminMessage.replies.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900">Odpowiedzi:</h4>
                        {selectedAdminMessage.replies.map((reply) => (
                          <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-900 whitespace-pre-wrap">{reply.content}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Od: {reply.sender.firstName} {reply.sender.lastName} - {new Date(reply.createdAt).toLocaleString('pl-PL')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Wybierz wiadomość</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Wybierz wiadomość z listy, aby rozpocząć rozmowę.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Modal
        isOpen={showDeleteAdminModal}
        onClose={() => setShowDeleteAdminModal(false)}
        title="Usuń wiadomość od admina"
        size="sm"
      >
        <p className="mb-4">Czy na pewno chcesz trwale usunąć tę wiadomość od admina? Tej operacji nie można cofnąć.</p>
        <div className="flex gap-2 justify-end">
          <button
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            onClick={() => setShowDeleteAdminModal(false)}
          >
            Anuluj
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={async () => {
              if (adminMessageIdToDelete) {
                try {
                  await import('../services/adminMessageService').then(m => m.adminMessageService.deleteAdminMessage(adminMessageIdToDelete));
                  setSelectedAdminMessage(null);
                  await loadAdminMessages();
                  await refreshCounts();
                } catch (error) {
                  alert('Błąd podczas usuwania wiadomości od admina');
                }
                setShowDeleteAdminModal(false);
                setAdminMessageIdToDelete(null);
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

export default MessagesPage; 