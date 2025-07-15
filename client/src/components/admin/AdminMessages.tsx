import React, { useState, useEffect } from 'react';
import { adminMessageService, AdminMessage, AdminMessageStats } from '../../services/adminMessageService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';

interface AdminMessagesProps {
  onBack: () => void;
}

export const AdminMessages: React.FC<AdminMessagesProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [stats, setStats] = useState<AdminMessageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: ''
  });
  const [newMessageData, setNewMessageData] = useState({
    recipientId: '',
    subject: '',
    content: '',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdCompanies: Array<{ id: string; name: string }>;
  }>>([]);
  const [searching, setSearching] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadMessages();
    loadStats();
  }, [filters]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await adminMessageService.getMessages({
        status: filters.status || undefined,
        priority: filters.priority || undefined
      });
      setMessages(response.messages);
    } catch (error) {
      console.error('Błąd podczas ładowania wiadomości:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await adminMessageService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Błąd podczas ładowania statystyk:', error);
    }
  };

  const handleMessageClick = async (message: AdminMessage) => {
    try {
      const fullMessage = await adminMessageService.getMessage(message.id);
      setSelectedMessage(fullMessage);
      setShowMessageModal(true);
    } catch (error) {
      console.error('Błąd podczas ładowania wiadomości:', error);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;

    try {
      setSendingReply(true);
      await adminMessageService.replyToMessage(selectedMessage.id, replyContent);
      setReplyContent('');
      await loadMessages();
      await loadStats();
      // Odśwież wiadomość w modalu
      const updatedMessage = await adminMessageService.getMessage(selectedMessage.id);
      setSelectedMessage(updatedMessage);
    } catch (error) {
      console.error('Błąd podczas wysyłania odpowiedzi:', error);
    } finally {
      setSendingReply(false);
    }
  };

  const handleSearchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await adminMessageService.searchUsers(query);
      setSearchResults(response.users);
    } catch (error) {
      console.error('Błąd podczas wyszukiwania użytkowników:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessageData.recipientId || !newMessageData.subject || !newMessageData.content) return;

    try {
      setSendingMessage(true);
      await adminMessageService.createMessage(newMessageData);
      setNewMessageData({
        recipientId: '',
        subject: '',
        content: '',
        priority: 'NORMAL'
      });
      setSearchQuery('');
      setSearchResults([]);
      setShowNewMessageModal(false);
      await loadMessages();
      await loadStats();
    } catch (error) {
      console.error('Błąd podczas wysyłania wiadomości:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'danger';
      case 'NORMAL': return 'secondary';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'UNREAD': return 'warning';
      case 'READ': return 'success';
      case 'SENT': return 'secondary';
      case 'ARCHIVED': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Ładowanie wiadomości...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline" size="sm">
            ← Powrót
          </Button>
          <h1 className="text-2xl font-bold">Wiadomości Admina</h1>
        </div>
        <Button onClick={() => setShowNewMessageModal(true)}>
          Nowa Wiadomość
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalMessages}</div>
              <div className="text-sm text-gray-600">Wszystkie wiadomości</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.unreadMessages}</div>
              <div className="text-sm text-gray-600">Nieprzeczytane</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.highPriorityMessages}</div>
              <div className="text-sm text-gray-600">Wysoki priorytet</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.todayMessages}</div>
              <div className="text-sm text-gray-600">Dzisiaj</div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Wszystkie statusy</option>
            <option value="UNREAD">Nieprzeczytane</option>
            <option value="READ">Przeczytane</option>
            <option value="SENT">Wysłane</option>
            <option value="ARCHIVED">Zarchiwizowane</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Wszystkie priorytety</option>
            <option value="LOW">Niski</option>
            <option value="NORMAL">Normalny</option>
            <option value="HIGH">Wysoki</option>
          </select>
        </div>
      </Card>

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              Brak wiadomości
            </div>
          </Card>
        ) : (
          messages.map((message) => (
            <Card
              key={message.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                message.status === 'UNREAD' ? 'border-l-4 border-l-yellow-500' : ''
              }`}
              onClick={() => handleMessageClick(message)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold">{message.subject}</h3>
                                         <Badge variant={getPriorityVariant(message.priority)}>
                       {message.priority}
                     </Badge>
                     <Badge variant={getStatusVariant(message.status)}>
                       {message.status}
                     </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    {message.content.length > 100 
                      ? `${message.content.substring(0, 100)}...` 
                      : message.content
                    }
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Od: {message.sender.firstName} {message.sender.lastName} ({message.sender.email})</span>
                    <span>Do: {message.recipient.firstName} {message.recipient.lastName} ({message.recipient.email})</span>
                    <span>{formatDate(message.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <Modal
          isOpen={showMessageModal}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedMessage(null);
            setReplyContent('');
          }}
          title={`Wiadomość: ${selectedMessage.subject}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                                 <Badge variant={getPriorityVariant(selectedMessage.priority)}>
                   {selectedMessage.priority}
                 </Badge>
                 <Badge variant={getStatusVariant(selectedMessage.status)}>
                   {selectedMessage.status}
                 </Badge>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <div>Od: {selectedMessage.sender.firstName} {selectedMessage.sender.lastName} ({selectedMessage.sender.email})</div>
                <div>Do: {selectedMessage.recipient.firstName} {selectedMessage.recipient.lastName} ({selectedMessage.recipient.email})</div>
                <div>Data: {formatDate(selectedMessage.createdAt)}</div>
              </div>
              <div className="whitespace-pre-wrap">{selectedMessage.content}</div>
            </div>

            {/* Replies */}
            {selectedMessage.replies && selectedMessage.replies.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Odpowiedzi:</h4>
                <div className="space-y-2">
                  {selectedMessage.replies.map((reply) => (
                    <div key={reply.id} className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">
                        {reply.sender.firstName} {reply.sender.lastName} - {formatDate(reply.createdAt)}
                      </div>
                      <div className="whitespace-pre-wrap">{reply.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Form */}
            <div>
              <h4 className="font-semibold mb-2">Odpowiedz:</h4>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Napisz odpowiedź..."
                className="w-full p-3 border border-gray-300 rounded-md resize-none"
                rows={4}
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleReply}
                  disabled={!replyContent.trim() || sendingReply}
                  loading={sendingReply}
                >
                  Wyślij odpowiedź
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* New Message Modal */}
      <Modal
        isOpen={showNewMessageModal}
        onClose={() => {
          setShowNewMessageModal(false);
          setNewMessageData({
            recipientId: '',
            subject: '',
            content: '',
            priority: 'NORMAL'
          });
          setSearchQuery('');
          setSearchResults([]);
        }}
        title="Nowa Wiadomość"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Wyszukaj odbiorcę</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearchUsers(e.target.value);
                }}
                placeholder="Wpisz email, imię, nazwisko lub nazwę firmy..."
                className="w-full p-3 border border-gray-300 rounded-md"
              />
              {searching && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setNewMessageData(prev => ({ ...prev, recipientId: user.id }));
                      setSearchQuery(`${user.firstName} ${user.lastName} (${user.email})`);
                      setSearchResults([]);
                    }}
                    className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    {user.createdCompanies.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Firmy: {user.createdCompanies.map(c => c.name).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Temat</label>
            <input
              type="text"
              value={newMessageData.subject}
              onChange={(e) => setNewMessageData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Temat wiadomości"
              className="w-full p-3 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Priorytet</label>
            <select
              value={newMessageData.priority}
              onChange={(e) => setNewMessageData(prev => ({ ...prev, priority: e.target.value as 'LOW' | 'NORMAL' | 'HIGH' }))}
              className="w-full p-3 border border-gray-300 rounded-md"
            >
              <option value="NORMAL">Normalny</option>
              <option value="LOW">Niski</option>
              <option value="HIGH">Wysoki</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Treść</label>
            <textarea
              value={newMessageData.content}
              onChange={(e) => setNewMessageData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Treść wiadomości..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none"
              rows={6}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewMessageModal(false);
                setNewMessageData({
                  recipientId: '',
                  subject: '',
                  content: '',
                  priority: 'NORMAL'
                });
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              Anuluj
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessageData.recipientId || !newMessageData.subject || !newMessageData.content || sendingMessage}
              loading={sendingMessage}
            >
              Wyślij wiadomość
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}; 