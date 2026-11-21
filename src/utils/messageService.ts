import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { OrderMessage } from '../types';

function isPermissionDeniedError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  const msg = err instanceof Error ? err.message : String(err);
  return code === 'permission-denied' || msg.includes('Missing or insufficient permissions');
}

/**
 * Sends a message between Admin and Customer for an order.
 */
export const sendOrderMessage = async (msg: Omit<OrderMessage, 'id'>): Promise<string> => {
  try {
    const messagesRef = collection(db, 'messages');
    const payload = {
      ...msg,
      createdAt: msg.createdAt || new Date().toISOString(),
      read: false,
    };
    const docRef = await addDoc(messagesRef, payload);
    return docRef.id;
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    }
    throw err;
  }
};

/**
 * Listens to real-time messages for a specific order.
 * Non-admin customers must supply customerId to satisfy Firestore list rules without a composite index.
 */
export const listenOrderMessages = (
  orderId: string, 
  onUpdate: (messages: OrderMessage[]) => void,
  customerId?: string
): (() => void) => {
  if (!orderId) return () => {};

  const messagesRef = collection(db, 'messages');
  const q = customerId
    ? query(messagesRef, where('customerId', '==', customerId))
    : query(messagesRef, where('orderId', '==', orderId));

  return onSnapshot(
    q, 
    (snapshot) => {
      const messages: OrderMessage[] = snapshot.docs
        .map(docSnap => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<OrderMessage, 'id'>)
        }))
        .filter(msg => msg.orderId === orderId);
      // Sort by createdAt ascending in memory
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onUpdate(messages);
    },
    (err) => {
      console.error('Error listening to order messages:', err);
      if (isPermissionDeniedError(err)) {
        try {
          handleFirestoreError(err, OperationType.LIST, `messages/${orderId}`);
        } catch {
          // Structured error already logged to console
        }
      }
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
      if (isPermissionDeniedError(err)) {
        try {
          handleFirestoreError(err, OperationType.LIST, `messages/customer/${customerId}`);
        } catch {
          // Structured error already logged to console
        }
      }
    }
  );
};

/**
 * Marks messages as read for a given order when viewed by readerType ('admin' or 'customer').
 */
export const markOrderMessagesAsRead = async (
  orderId: string, 
  readerType: 'admin' | 'customer',
  customerId?: string
): Promise<void> => {
  try {
    const messagesRef = collection(db, 'messages');
    const targetSenderType = readerType === 'admin' ? 'customer' : 'admin';
    const q = customerId
      ? query(messagesRef, where('customerId', '==', customerId))
      : query(messagesRef, where('orderId', '==', orderId));
    const snap = await getDocs(q);
    const unreadDocs = snap.docs.filter(d => {
      const data = d.data();
      return data.orderId === orderId && data.senderType === targetSenderType && !data.read;
    });
    const updates = unreadDocs.map(d => updateDoc(doc(db, 'messages', d.id), { read: true }));
    await Promise.all(updates);
  } catch (err) {
    console.error('Error marking messages as read:', err);
    if (isPermissionDeniedError(err)) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, `messages/${orderId}`);
      } catch {
        // Structured error already logged to console
      }
    }
  }
};
