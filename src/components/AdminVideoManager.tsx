import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  deleteVideo, 
  reorderVideos, 
  incrementVideoViews 
} from '../utils/videoService';
import { VideoItem } from '../types';
import { validateAndFilterVideoDocs } from '../utils/videoUtils';
import { VideoUploader } from './VideoUploader';
import { VideoPlayer } from './VideoPlayer';
import { VideoCard } from './VideoCard';
import { 
  Film, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw, 
  Play, 
  Eye, 
  Folder, 
  Layers,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AdminVideoManagerProps {
  initialCategory?: 'products' | 'services' | 'gallery' | 'portfolio' | 'all';
  entityId?: string;
  onVideoChange?: () => void;
}

export const AdminVideoManager: React.FC<AdminVideoManagerProps> = ({
  initialCategory = 'all',
  entityId = '',
  onVideoChange
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialCategory);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to Firestore 'videos' collection in real-time
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      collection(db, 'videos'),
      (snapshot) => {
        if (snapshot.metadata.fromCache) {
          console.log('[Video System] Data Source: Local Cache - loaded videos:', snapshot.docs.length);
        } else {
          console.log('[Video System] Data Source: Firestore - loaded videos:', snapshot.docs.length);
        }

        const loaded = snapshot.docs.map(
          doc => ({ id: doc.id, ...doc.data() } as VideoItem)
        );

        // Filter valid items with real permanent URLs and clean thumbnails
        const valid = validateAndFilterVideoDocs(loaded);

        // Category filter
        let filtered = valid;
        if (activeTab !== 'all') {
          filtered = valid.filter(v => v.category === activeTab);
        }
        if (entityId) {
          filtered = filtered.filter(v => v.entityId === entityId);
        }

        filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

        setVideos(filtered);
        setLoading(false);
        console.log(`[Video System] Gallery Reloaded: ${filtered.length} active videos.`);
      },
      (err) => {
        console.error('[Video System] Error listening to videos collection:', err);
        setError('Failed to fetch video assets from Firestore.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeTab, entityId]);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDelete = async (video: VideoItem) => {
    if (!window.confirm(`Are you sure you want to permanently delete video "${video.title}"?`)) return;

    try {
      await deleteVideo(video.id);
      notify(`Video "${video.title}" permanently deleted.`);
      if (onVideoChange) onVideoChange();
    } catch (err: any) {
      alert(`Error deleting video: ${err.message}`);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === videos.length - 1)
    ) {
      return;
    }

    const newVideos = [...videos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newVideos[index];
    newVideos[index] = newVideos[targetIndex];
    newVideos[targetIndex] = temp;

    setVideos(newVideos);
    await reorderVideos(newVideos);
  };

  const categories = [
    { id: 'all', label: 'All Videos' },
    { id: 'gallery', label: 'Gallery Videos' },
    { id: 'products', label: 'Product Videos' },
    { id: 'services', label: 'Service Videos' },
    { id: 'portfolio', label: 'Portfolio' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Film className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Video & Thumbnail Asset Manager</h2>
            <p className="text-xs text-slate-400">
              Manage production video uploads, storage files, and custom thumbnails
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingVideo(null);
            setShowUploader(!showUploader);
          }}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {showUploader ? (
            <>
              <X className="w-4 h-4" />
              <span>Close Uploader</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Upload New Video</span>
            </>
          )}
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-400 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Component */}
      {(showUploader || editingVideo) && (
        <VideoUploader
          category={(editingVideo?.category as any) || (activeTab === 'all' ? 'gallery' : activeTab as any)}
          entityId={editingVideo?.entityId || entityId}
          editingVideo={editingVideo}
          onUploadComplete={(video) => {
            notify(`Video "${video.title}" uploaded & saved to Firebase successfully!`);
            setShowUploader(false);
            setEditingVideo(null);
            if (onVideoChange) onVideoChange();
          }}
          onCancel={() => {
            setShowUploader(false);
            setEditingVideo(null);
          }}
        />
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === cat.id
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-slate-900 border border-slate-800 h-64 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Production Videos Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No video assets exist in category "{activeTab}". Click "Upload New Video" above to upload an MP4, MOV, or WEBM file.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUploader(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            Upload First Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid, idx) => (
            <div key={vid.id} className="relative group/item">
              <VideoCard
                video={vid}
                showAdminControls
                onPlay={(v) => {
                  incrementVideoViews(v.id).catch(() => {});
                  setPreviewVideo(v);
                }}
                onEdit={(v) => {
                  setEditingVideo(v);
                  setShowUploader(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onDelete={(v) => handleDelete(v)}
              />

              {/* Order Controls */}
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity z-10">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'up')}
                  className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 shadow transition-colors disabled:opacity-30"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === videos.length - 1}
                  onClick={() => handleMove(idx, 'down')}
                  className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 shadow transition-colors disabled:opacity-30"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-4xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white line-clamp-1">{previewVideo.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <VideoPlayer
              src={previewVideo.videoUrl}
              poster={previewVideo.thumbnailUrl}
              title={previewVideo.title}
              description={previewVideo.description}
            />
          </div>
        </div>
      )}
    </div>
  );
};
