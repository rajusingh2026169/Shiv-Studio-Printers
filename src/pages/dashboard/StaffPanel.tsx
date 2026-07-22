import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Order } from '../../types';
import { Layers, Printer, ArrowRight, CheckCircle, FileText, Download, FolderArchive } from 'lucide-react';

export const StaffPanel: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<string>('');

  const handleBulkDownload = async (orderId: string, customerName: string, files: any) => {
    try {
      setDownloadingOrderId(orderId);
      setDownloadProgress('Starting...');

      const fileList: { url: string; name: string }[] = [];
      if (Array.isArray(files)) {
        files.forEach((f) => {
          if (f && typeof f === 'object' && f.url) {
            fileList.push({ url: f.url, name: f.name || 'custom_image.jpg' });
          } else if (typeof f === 'string') {
            fileList.push({ url: f, name: f.split('/').pop()?.split('?')[0] || 'custom_image.jpg' });
          }
        });
      } else if (typeof files === 'string' && files.trim() !== '') {
        fileList.push({ url: files, name: files.split('/').pop()?.split('?')[0] || 'custom_image.jpg' });
      }

      if (fileList.length === 0) {
        alert('No downloadable files associated with this order.');
        setDownloadingOrderId(null);
        return;
      }

      const zip = new JSZip();
      let succeededCount = 0;

      for (let i = 0; i < fileList.length; i++) {
        const fileInfo = fileList[i];
        setDownloadProgress(`Fetching ${i + 1}/${fileList.length}...`);
        
        try {
          const response = await fetch(fileInfo.url);
          if (!response.ok) throw new Error(`HTTP error ${response.status}`);
          const blob = await response.blob();
          
          let cleanName = fileInfo.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
          if (!cleanName.includes('.')) {
            cleanName += '.jpg';
          }
          zip.file(cleanName, blob);
          succeededCount++;
        } catch (err) {
          console.error(`Failed to fetch file: ${fileInfo.url}`, err);
          window.open(fileInfo.url, '_blank');
        }
      }

      if (succeededCount > 0) {
        setDownloadProgress('Creating ZIP...');
        const zipContent = await zip.generateAsync({ type: 'blob' });
        const cleanCustomerName = customerName.replace(/[^a-zA-Z0-9]/g, '_') || 'Customer';
        const zipName = `${cleanCustomerName}_Order_${orderId.slice(0, 8).toUpperCase()}_Photos.zip`;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipContent);
        link.download = zipName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setDownloadProgress('Completed!');
      } else {
        alert('Could not download any files in a ZIP. Opening them in separate browser tabs.');
        fileList.forEach(f => window.open(f.url, '_blank'));
      }
      
      setTimeout(() => {
        setDownloadingOrderId(null);
      }, 1000);
    } catch (err) {
      console.error('Error in bulk download:', err);
      alert('An error occurred during bulk zip generation. Opening files individually.');
      setDownloadingOrderId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      setOrders(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    } catch (err) {
      console.error('Error fetching staff orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStatus = async (orderId: string, currentStatus: Order['status']) => {
    let nextStatus: Order['status'] = 'Designing';
    
    if (currentStatus === 'Pending') nextStatus = 'Accepted';
    else if (currentStatus === 'Accepted') nextStatus = 'Designing';
    else if (currentStatus === 'Designing') nextStatus = 'Printing';
    else if (currentStatus === 'Printing') nextStatus = 'Ready';
    else if (currentStatus === 'Ready') nextStatus = 'Shipped';
    else if (currentStatus === 'Shipped') nextStatus = 'Delivered';
    else return;

    try {
      await updateDoc(doc(db, 'orders', orderId), { status: nextStatus });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="border-b border-slate-900 pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Printer className="h-7 w-7 text-amber-500" />
            <span>Studio Production & Design Queue</span>
          </h1>
          <p className="text-xxs sm:text-xs text-slate-400 mt-1">Trace industrial album printing, spot UV layout cards, and coordinate client source files.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => <div key={n} className="bg-slate-900 h-32 rounded-2xl animate-pulse"></div>)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p>No active print jobs currently waiting in the manufacturing queue.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xxs text-slate-500 font-mono font-bold">INVOICE ID: #{order.id}</span>
                    <h3 className="text-sm font-bold text-white mt-1">Billed to {order.customerName}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-xxs font-bold uppercase tracking-wider font-mono">
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Bundle items list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-slate-400">
                  <div>
                    <p className="text-slate-500 font-semibold uppercase tracking-wider font-mono">Deliverables</p>
                    <ul className="list-disc pl-4 mt-1.5 text-slate-300 space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx}>{item.productTitle} (x{item.quantity})</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-slate-500 font-semibold uppercase tracking-wider font-mono">Client RAW Assets</p>
                      {((order.uploadedFiles && order.uploadedFiles.length > 0) || order.uploadedFileUrl) && (
                        <button
                          type="button"
                          onClick={() => handleBulkDownload(order.id, order.customerName || 'Client', order.uploadedFiles || order.uploadedFileUrl)}
                          disabled={downloadingOrderId === order.id}
                          className="px-2.5 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 active:bg-amber-400/30 text-amber-400 disabled:text-slate-500 disabled:bg-slate-800/30 border border-amber-400/15 disabled:border-slate-850 rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-all select-none cursor-pointer"
                        >
                          {downloadingOrderId === order.id ? (
                            <>
                              <span className="animate-spin inline-block h-3 w-3 border-2 border-amber-400 border-t-transparent rounded-full shrink-0" />
                              <span>{downloadProgress}</span>
                            </>
                          ) : (
                            <>
                              <FolderArchive className="h-3 w-3 shrink-0" />
                              <span>Bulk Download ZIP</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {order.uploadedFiles && order.uploadedFiles.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {order.uploadedFiles.map((f, fIdx) => (
                            <a
                              key={fIdx}
                              href={f.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-amber-400 font-bold border border-slate-850 rounded-lg text-xxs transition-colors max-w-sm truncate"
                              title={f.name}
                            >
                              <Download className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">Download: {f.name}</span>
                            </a>
                          ))}
                        </div>
                      ) : order.uploadedFileUrl ? (
                        <a
                          href={order.uploadedFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-amber-400 font-bold border border-slate-850 rounded-lg text-xxs transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download Client Layout: {order.uploadedFileName}</span>
                        </a>
                      ) : (
                        <span className="text-slate-600 font-mono italic text-xxs">No raw files uploaded by customer</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pipeline status advancer */}
                <div className="pt-3 border-t border-slate-800/60 flex justify-end">
                  {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                    <button
                      onClick={() => handleAdvanceStatus(order.id, order.status)}
                      className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xxs rounded-xl flex items-center gap-1 transition-all"
                    >
                      <span>Move to Next Pipeline Stage</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
