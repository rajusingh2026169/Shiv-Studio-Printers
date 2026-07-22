import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { BlogItem } from '../types';
import { BookOpen, User, Calendar, Tag, ChevronRight } from 'lucide-react';

export const Blog: React.FC = () => {
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
    <div className="bg-slate-950 min-h-screen text-slate-100 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Page Header */}
        <div className="text-center space-y-4">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            SEO Optimised Studio Insights
          </span>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold text-white tracking-tight">
            The Shiv Studio Blog & Tips
          </h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
            Professional wedding photography poses, color depth calibrations, and paper texture guides written by our senior directors and print technicians.
          </p>
        </div>

        {/* Blog layout */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((n) => (
              <div key={n} className="bg-slate-900 rounded-3xl h-96 animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 rounded-3xl border border-slate-800 p-8 space-y-4 max-w-xl mx-auto w-full">
            <BookOpen className="h-8 w-8 text-amber-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Blog Articles Available</h3>
            <p className="text-xs text-slate-400">Our senior designers and print technicians are currently preparing our latest guides.</p>
            <Link to="/dashboard/admin" className="inline-block bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs hover:bg-amber-600 transition-all">
              Add New Post (Admin)
            </Link>
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
                    <img src={blog.image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" referrerPolicy="no-referrer" loading="lazy" />
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
                <img src={selectedBlog.image} alt={selectedBlog.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
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
