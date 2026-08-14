import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { OrderMessage } from '../types';

/**
 * Sends a message between Admin and Customer for an order.
 */
export const sendOrderMessage = async (msg: Omit<OrderMessage, 'id'>): Promise<string> => {
  const messagesRef = collection(db, 'messages');
  const payload = {
    ...msg,
    createdAt: msg.createdAt || new Date().toISOString(),
    read: false,
  };
  const docRef = await addDoc(messagesRef, payload);
  return docRef.id;
};

/**
 * Listens to real-time messages for a specific order.
 */
export const listenOrderMessages = (
  orderId: string, 
  onUpdate: (messages: OrderMessage[]) => void
): (() => void) => {
  if (!orderId) return () => {};

  const messagesRef = collection(db, 'messages');
  // Avoid composite index requirement by querying on orderId only and sorting in memory
  const q = query(
    messagesRef, 
    where('orderId', '==', orderId)
  );

  return onSnapshot(
    q, 
    (snapshot) => {
      const messages: OrderMessage[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<OrderMessage, 'id'>)
      }));
      // Sort by createdAt ascending in memory
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onUpdate(messages);
    },
    (err) => {
      console.error('Error listening to order messages:', err);
    }
  );
};

/**
 * Listens to all messages for a specific customer across all their orders.
 */
export const listenCustomerMessages = (
  customerId: string, 
  onUpdate: (messages: OrderMessage[]) => void
): (() => void) => {
  if (!customerId) return () => {};

  const messagesRef = collection(db, 'messages');
  // Avoid composite index requirement by querying on customerId only and sorting in memory
  const q = query(
    messagesRef, 
    where('customerId', '==', customerId)
  );

  return onSnapshot(
    q, 
    (snapshot) => {
      const messages: OrderMessage[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<OrderMessage, 'id'>)
      }));
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onUpdate(messages);
    },
    (err) => {
      console.error('Error listening to customer messages:', err);
    }
  );
};

/**
 * Marks messages as read for a given order when viewed by readerType ('admin' or 'customer').
 */
export const markOrderMessagesAsRead = async (
  orderId: string, 
  readerType: 'admin' | 'customer'
): Promise<void> => {
  try {
    const messagesRef = collection(db, 'messages');
    const targetSenderType = readerType === 'admin' ? 'customer' : 'admin';
    const q = query(
      messagesRef, 
      where('orderId', '==', orderId)
    );
    const snap = await getDocs(q);
    const unreadDocs = snap.docs.filter(d => {
      const data = d.data();
      return data.senderType === targetSenderType && !data.read;
    });
    const updates = unreadDocs.map(d => updateDoc(doc(db, 'messages', d.id), { read: true }));
    await Promise.all(updates);
  } catch (err) {
    console.error('Error marking messages as read:', err);
  }
};
