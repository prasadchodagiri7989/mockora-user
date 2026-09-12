import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import { CardSkeleton } from '../../components/SkeletonLoader';
import { 
  FileText, 
  Video, 
  BookOpen, 
  Download, 
  Bookmark, 
  Search, 
  ExternalLink, 
  Play, 
  Eye, 
  Filter,
  Check
} from 'lucide-react';

export default function Resources() {
  const { user, updateUser } = useAuth();
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all'); // all, pdf, note, video
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active View Modal (PDF or Video)
  const [activeResource, setActiveResource] = useState(null);

  // Bookmarks array from user
  const savedIds = user?.savedResources || [];

  useEffect(() => {
    api.get('/categories').then(res => {
      if (res.data.success) setCategories(res.data.categories);
    });
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (typeFilter !== 'all') query.append('type', typeFilter);
      if (categoryFilter !== 'all') query.append('categoryId', categoryFilter);
      if (searchQuery.trim()) query.append('search', searchQuery.trim());

      const res = await api.get(`/resources?${query.toString()}`);
      if (res.data.success) {
        setResources(res.data.resources);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [typeFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResources();
  };

  const handleToggleBookmark = async (resourceId) => {
    try {
      const res = await api.post(`/resources/${resourceId}/bookmark`);
      if (res.data.success) {
        updateUser({ savedResources: res.data.savedResources });
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Study Library & Knowledge Vault
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Curated high-yield PDF summaries, formula cheat sheets, and concept breakdown video lectures.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, tags, topics..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 transition"
          />
        </form>
      </div>

      {/* Filter Tabs and Stream Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Type Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          {[
            { id: 'all', label: 'All Resources' },
            { id: 'pdf', label: 'PDF Documents' },
            { id: 'note', label: 'High-Yield Notes' },
            { id: 'video', label: 'Video Lectures' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                typeFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Examination Streams</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Resources Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No study resources matched your filter criteria.
          </p>
          <p className="text-xs text-slate-400 mt-1">Try broadening your search or selecting all types.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => {
            const isBookmarked = savedIds.some(id => (typeof id === 'string' ? id : id?._id) === res._id);
            const isPDF = res.type === 'pdf';
            const isVideo = res.type === 'video';

            return (
              <div
                key={res._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                      isPDF ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50' :
                      isVideo ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50' :
                      'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'
                    }`}>
                      {isPDF ? <FileText className="w-3.5 h-3.5" /> : isVideo ? <Video className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                      <span>{res.type.toUpperCase()}</span>
                    </span>

                    <button
                      onClick={() => handleToggleBookmark(res._id)}
                      className={`p-2 rounded-xl border transition ${
                        isBookmarked
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-500'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                      title={isBookmarked ? 'Remove Bookmark' : 'Save for Later'}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>

                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    {res.categoryId?.name || 'General Stream'}
                  </span>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {res.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {res.description}
                  </p>

                  {/* Tags */}
                  {res.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {res.tags.map((t, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {res.fileSize || res.duration || 'Study Guide'}
                  </span>

                  <button
                    onClick={() => setActiveResource(res)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                  >
                    {isVideo ? <Play className="w-3.5 h-3.5 fill-white" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{isVideo ? 'Watch Video' : 'Read Inline'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Modal for Inline PDF / Notes / Embedded Video */}
      {activeResource && (
        <Modal
          isOpen={!!activeResource}
          onClose={() => setActiveResource(null)}
          title={activeResource.title}
          subtitle={`${activeResource.type.toUpperCase()} • ${activeResource.categoryId?.name || 'Knowledge Vault'}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            {activeResource.type === 'video' ? (
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
                {activeResource.videoUrl.includes('youtube.com') || activeResource.videoUrl.includes('youtu.be') ? (
                  <iframe
                    className="w-full h-full"
                    src={activeResource.videoUrl.replace('watch?v=', 'embed/')}
                    title={activeResource.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={activeResource.videoUrl}
                    controls
                    className="w-full h-full"
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-bold text-indigo-950 dark:text-indigo-200 mb-1">
                    Document Overview:
                  </p>
                  <p>{activeResource.description}</p>
                </div>

                {activeResource.fileUrl ? (
                  <div className="h-[500px] w-full border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <iframe
                      src={activeResource.fileUrl.startsWith('http') ? activeResource.fileUrl : `${(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '')}${activeResource.fileUrl}`}
                      className="w-full h-full"
                      title={activeResource.title}
                    />
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-500">
                    High-yield interactive study summary loaded. Review the key notes above.
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Author: {activeResource.author || 'Universal Editorial Team'}
              </span>

              {activeResource.fileUrl && (
                <a
                  href={activeResource.fileUrl.startsWith('http') ? activeResource.fileUrl : `${(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '')}${activeResource.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
