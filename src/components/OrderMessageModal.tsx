import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderMessage, UploadedFileRecord } from '../types';
import { sendOrderMessage, listenOrderMessages, markOrderMessagesAsRead } from '../utils/messageService';
import { downloadOriginalFile } from '../utils/clientPhotoUploader';
import { StudioImage } from './StudioMedia';
import { 
  X, 
  Send, 
  Download, 
  MessageSquare, 
  FileCheck, 
  User, 
  ShieldCheck, 
  Clock, 
  Image as ImageIcon,
  CheckCheck
} from 'lucide-react';

interface OrderMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  currentSenderType: 'admin' | 'customer';
  currentUserId: string;
  currentUserName: string;
}

export const OrderMessageModal: React.FC<OrderMessageModalProps> = ({
  isOpen,
  onClose,
  order,
  currentSenderType,
  currentUserId,
  currentUserName,
}) => {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !order?.id) return;

    const scopedCustomerId =
      currentSenderType === 'customer' ? (currentUserId || order.customerId) : undefined;

    // Mark messages as read when modal opens
    markOrderMessagesAsRead(order.id, currentSenderType, scopedCustomerId);

    // Listen to real-time messages for this order
    const unsubscribe = listenOrderMessages(
      order.id,
      (fetchedMessages) => {
        setMessages(fetchedMessages);
        markOrderMessagesAsRead(order.id, currentSenderType, scopedCustomerId);
      },
      scopedCustomerId
    );

    return () => unsubscribe();
  }, [isOpen, order?.id, order?.customerId, currentSenderType, currentUserId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isOpen || !order) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await sendOrderMessage({
        conversationId: `order_${order.id}`,
        orderId: order.id,
        customerId: order.customerId || 'anonymous',
        customerName: order.customerName,
        senderId: currentUserId || 'user',
        senderName: currentUserName || (currentSenderType === 'admin' ? 'Studio Admin' : 'Customer'),
        senderType: currentSenderType,
        message: newMessage.trim(),
        createdAt: new Date().toISOString(),
        read: false
      });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Helper to format file sizes nicely
  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Extract list of uploaded files safely
  const uploadedFileList: UploadedFileRecord[] = order.uploadedFiles && order.uploadedFiles.length > 0
    ? order.uploadedFiles
    : order.uploadedFileUrl
      ? [{
          originalFileUrl: order.uploadedFileUrl,
          originalFileName: order.uploadedFileName || 'uploaded_photo.jpg',
          originalFileType: 'image/jpeg',
          originalFileSize: 0,
          uploadedAt: order.createdAt,
          name: order.uploadedFileName || 'uploaded_photo.jpg',
          url: order.uploadedFileUrl
        }]
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 font-sans">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Order Communications</h2>
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono text-xxs font-bold uppercase">
                  #{order.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Client: <strong className="text-slate-200">{order.customerName}</strong> • {order.customerPhone || order.customerEmail}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Main Body (2 Panels: Uploaded Files + Message Chat) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Customer Uploaded Photos Section with Download Original */}
          <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-amber-500" />
                <span>Uploaded Client Assets ({uploadedFileList.length})</span>
              </h3>
              <span className="text-xxs text-emerald-400 font-semibold font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ✓ Original Uncompressed Resolution Stored
              </span>
            </div>

            {uploadedFileList.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-2">No custom photos attached to this order.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {uploadedFileList.map((fileRec, idx) => {
                  const targetUrl = fileRec.originalFileUrl || fileRec.url || '';
                  const targetName = fileRec.originalFileName || fileRec.name || `Asset_${idx + 1}.jpg`;
                  return (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition-all">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="h-10 w-10 bg-slate-950 border border-slate-800 rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
                          {targetUrl ? (
                            <StudioImage 
                              src={fileRec.thumbnailUrl || targetUrl} 
                              alt={targetName} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileCheck className="h-5 w-5 text-amber-400" />
                          )}
                        </div>
                        <div className="truncate text-xs">
                          <p className="font-bold text-white truncate" title={targetName}>{targetName}</p>
                          <p className="text-xxs text-slate-400 font-mono mt-0.5">
                            {formatBytes(fileRec.originalFileSize)}
                            {fileRec.originalWidth && fileRec.originalHeight ? ` • ${fileRec.originalWidth}x${fileRec.originalHeight}px` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Download Original Button */}
                      <button
                        type="button"
                        onClick={() => downloadOriginalFile(targetUrl, targetName)}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xxs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
                        title="Download Original Uncompressed File"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Original</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat Message Thread */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-500" />
              <span>Conversation History</span>
            </h3>

            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 min-h-[220px] max-h-[320px] overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500 space-y-2">
                  <MessageSquare className="h-8 w-8 text-slate-600 animate-bounce" />
                  <p className="text-xs">No messages exchanged yet for this order.</p>
                  <p className="text-xxs text-slate-600">Send a message below to coordinate print designs or status updates.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.senderType === currentSenderType;
                  const isAdminMsg = msg.senderType === 'admin';
                  return (
                    <div 
                      key={msg.id || i}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-xxs text-slate-400">
                        {isAdminMsg ? (
                          <span className="font-bold text-amber-400 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-amber-400" /> Studio Team
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
                            <User className="h-3 w-3 text-emerald-400" /> {msg.customerName || 'Customer'}
                          </span>
                        )}
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div 
                        className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl text-xs space-y-1 ${
                          isMe 
                            ? 'bg-amber-500/15 border border-amber-500/30 text-amber-100 rounded-tr-none' 
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                        <div className="flex justify-end items-center gap-1 pt-1 text-[10px] text-slate-400 font-mono">
                          <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                          {isMe && (
                            <CheckCheck className={`h-3 w-3 ${msg.read ? 'text-amber-400' : 'text-slate-500'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

        </div>

        {/* Modal Footer / Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex gap-2">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={currentSenderType === 'admin' ? "Write a message to the client..." : "Write a reply to studio team..."}
              disabled={sending}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shrink-0"
            >
              <Send className="h-4 w-4" />
              <span>{sending ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
