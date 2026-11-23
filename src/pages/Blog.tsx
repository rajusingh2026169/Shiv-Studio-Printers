import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { BlogItem } from '../types';
import { SEOHead } from '../components/SEOHead';
import { StudioImage } from '../components/StudioMedia';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, Calendar, Tag, ChevronRight } from 'lucide-react';

export const Blog: React.FC = () => {
  const { isAdmin } = useAuth();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'blogs'));
        setBlogs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogItem)));
      } catch (err) {
        console.error('Error fetching blogs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="bg-[#111111] min-h-screen text-white py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <SEOHead
        title="Studio Journal & Guides — SHIV STUDIO"
        description="Wedding photography poses, lighting notes, album finishes, and framing guides from SHIV STUDIO in Khaga, Fatehpur."
      />
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Page Header */}
        <div className="text-center space-y-4">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4AF37]">
            Studio Insights & Guides
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-white tracking-tight">
            The SHIV STUDIO Journal
          </h1>
          <p className="max-w-2xl mx-auto text-neutral-400 text-sm sm:text-base leading-relaxed">
            Wedding photography tips, color-calibrated printing advice, and album material guides written by our studio team.
          </p>
        </div>

        {/* Blog layout */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((n) => (
              <div key={n} className="bg-[#1A1A1A] rounded-3xl h-96 border border-white/10"></div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-16 bg-[#1A1A1A] rounded-3xl border border-white/10 p-8 space-y-4 max-w-xl mx-auto w-full">
            <BookOpen className="h-8 w-8 text-[#D4AF37] mx-auto" />
            <h3 className="text-lg font-bold text-white">No Articles Published Yet</h3>
            <p className="text-xs text-neutral-400">Photography guides and studio updates will appear here once published.</p>
            {isAdmin() ? (
              <Link to="/admin/dashboard" className="inline-block bg-[#D4AF37] text-[#111111] font-bold px-4 py-2 rounded-xl text-xs hover:bg-[#c5a028] transition-colors">
                Publish Article (Admin)
              </Link>
            ) : (
              <Link to="/contact" className="inline-block bg-[#D4AF37] text-[#111111] font-bold px-4 py-2 rounded-xl text-xs hover:bg-[#c5a028] transition-colors">
                Ask Our Studio Team
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blogs.map((blog) => (
              <div 
                key={blog.id} 
                className="group bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-750 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video overflow-hidden">
                    <StudioImage src={blog.image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" loading="lazy" />
                    <span className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-md text-xxs font-bold text-amber-500 border border-slate-850 uppercase tracking-wide">
                      {blog.category}
                    </span>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Metadata line */}
                    <div className="flex items-center space-x-4 text-slate-500 text-xxs font-mono">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        <span>By {blog.author}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(blog.date).toLocaleDateString()}</span>
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-3">
                      {blog.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-850/50 flex justify-end">
                  <button 
                    onClick={() => setSelectedBlog(blog)}
                    className="mt-4 text-xs font-bold text-amber-400 hover:text-amber-500 transition-colors flex items-center space-x-1"
                  >
                    <span>Read Full Article</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blog Detail Modal */}
      {selectedBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 text-white max-h-[90vh] overflow-y-auto font-sans">
            <button 
              onClick={() => setSelectedBlog(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              ✕
            </button>

            <div className="space-y-6">
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800">
                <StudioImage src={selectedBlog.image} alt={selectedBlog.title} className="w-full h-full object-cover" loading="lazy" />
              </div>

              <div className="flex items-center space-x-4 text-slate-500 text-xxs font-mono">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-amber-500" />
                  <span>By {selectedBlog.author}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  <span>{new Date(selectedBlog.date).toLocaleDateString()}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 text-amber-500" />
                  <span>Category: {selectedBlog.category}</span>
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold leading-tight text-white">{selectedBlog.title}</h2>
              
              {/* Full Content */}
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4 font-sans whitespace-pre-wrap pt-4 border-t border-slate-800">
                {selectedBlog.content}
              </div>

              <div className="pt-6 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedBlog(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Close Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
