import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { X, Heart, MessageCircle, Share2, Loader2, MapPin, Building, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import API_BASE from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

const SharedItemViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const postId = searchParams.get('post');
  const jobId = searchParams.get('job');
  const eventId = searchParams.get('event');

  const [itemType, setItemType] = useState(null);
  const [itemId, setItemId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (postId) {
      setItemType('post');
      setItemId(postId);
    } else if (jobId) {
      setItemType('job');
      setItemId(jobId);
    } else if (eventId) {
      setItemType('event');
      setItemId(eventId);
    } else {
      setItemType(null);
      setItemId(null);
      setData(null);
    }
  }, [postId, jobId, eventId]);

  useEffect(() => {
    if (!itemType || !itemId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        let endpoint = '';
        if (itemType === 'post') endpoint = `/api/posts/${itemId}`;
        if (itemType === 'job') endpoint = `/api/jobs/${itemId}`;
        if (itemType === 'event') endpoint = `/api/events/${itemId}`;

        const res = await fetch(`${API_BASE}${endpoint}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          toast.error('Failed to load shared item');
          closeModal();
        }
      } catch (err) {
        console.error('Error fetching shared item:', err);
        toast.error('Server error');
        closeModal();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemType, itemId]);

  const closeModal = () => {
    // Remove the query parameter from the URL, keeping the path intact
    const params = new URLSearchParams(searchParams);
    if (itemType) params.delete(itemType);
    const newSearch = params.toString() ? `?${params.toString()}` : '';
    navigate(`${location.pathname}${newSearch}`, { replace: true });
  };

  if (!itemType || !itemId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="relative bg-card w-full max-w-5xl h-[85vh] md:h-[80vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200 border border-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={closeModal}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground font-medium">Loading details...</p>
          </div>
        ) : data ? (
          <>
            {/* Left Media Area */}
            <div className="w-full md:w-[55%] lg:w-[60%] bg-black flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-border/50 shrink-0">
              {itemType === 'post' && (
                data.images && data.images.length > 0 ? (
                  <img src={data.images[0]} alt="Post media" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-8 text-center">
                    <p className="text-2xl md:text-4xl font-extrabold text-primary/80 leading-tight">
                      {data.content.substring(0, 150)}{data.content.length > 150 ? '...' : ''}
                    </p>
                  </div>
                )
              )}
              {itemType === 'job' && (
                <div className="w-full h-full bg-gradient-to-br from-blue-900/40 to-black flex flex-col items-center justify-center p-8 text-center relative">
                  {data.companyLogo && (
                    <img src={data.companyLogo} alt={data.company} className="w-32 h-32 object-contain rounded-2xl bg-white p-2 shadow-2xl mb-6" />
                  )}
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2">{data.title}</h2>
                  <p className="text-xl text-blue-200 font-semibold">{data.company}</p>
                </div>
              )}
              {itemType === 'event' && (
                data.image ? (
                  <img src={data.image} alt={data.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-black flex flex-col items-center justify-center p-8 text-center">
                    <CalendarIcon className="w-24 h-24 text-indigo-400 mb-6 opacity-80" />
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2">{data.name}</h2>
                    <p className="text-xl text-indigo-200 font-semibold">{data.type} Event</p>
                  </div>
                )
              )}
            </div>

            {/* Right Info Area */}
            <div className="w-full md:w-[45%] lg:w-[40%] bg-card flex flex-col h-full overflow-hidden shrink-0">
              
              {/* Header: Author / Company Info */}
              <div className="p-4 border-b border-border/50 flex items-center gap-3 bg-muted/10 shrink-0">
                {itemType === 'post' && (
                  <>
                    <img src={data.author?.image || `https://ui-avatars.com/api/?name=${data.author?.name || 'User'}`} className="w-10 h-10 rounded-full border border-border" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{data.author?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{data.author?.role}</p>
                    </div>
                  </>
                )}
                {itemType === 'job' && (
                  <>
                    <img src={data.companyLogo || `https://ui-avatars.com/api/?name=${data.company}`} className="w-10 h-10 rounded-lg border border-border bg-white object-contain" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{data.company}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3"/> {data.location}</p>
                    </div>
                  </>
                )}
                {itemType === 'event' && (
                  <>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{data.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> {new Date(data.date).toLocaleDateString()}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {itemType === 'post' && (
                  <>
                    {/* Post Content */}
                    <div className="flex items-start gap-3">
                      <img src={data.author?.image || `https://ui-avatars.com/api/?name=${data.author?.name || 'User'}`} className="w-8 h-8 rounded-full border border-border mt-1" alt="" />
                      <div>
                        <p className="text-sm font-bold text-foreground inline mr-2">{data.author?.name}</p>
                        <span className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{data.content}</span>
                        <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wide">
                          {data.createdAt ? formatDistanceToNow(new Date(data.createdAt), { addSuffix: true }) : ''}
                        </p>
                      </div>
                    </div>
                    
                    {/* Comments Placeholder (if we had fully enriched comments we would map here) */}
                    <div className="border-t border-border/30 pt-4 mt-4">
                      {data.comments && data.comments.length > 0 ? (
                        data.comments.map((comment, idx) => (
                          <div key={idx} className="flex items-start gap-3 mb-4">
                            <img src={comment.author?.image || `https://ui-avatars.com/api/?name=${comment.author?.name || 'User'}`} className="w-8 h-8 rounded-full border border-border" alt="" />
                            <div className="bg-muted/50 p-2.5 rounded-xl rounded-tl-sm flex-1">
                              <p className="text-xs font-bold text-foreground mb-1">{comment.author?.name}</p>
                              <p className="text-xs text-foreground/90">{comment.text}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-xs font-medium">No comments yet.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {itemType === 'job' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{data.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md">{data.type}</span>
                        <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-md">{data.workplaceType}</span>
                        {data.salary && <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-bold rounded-md">{data.salary}</span>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5"><Building className="w-4 h-4"/> Job Description</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{data.description}</p>
                    </div>
                    {data.requirements && data.requirements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-foreground mb-2">Requirements</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {data.requirements.map((req, i) => (
                            <li key={i} className="text-sm text-muted-foreground">{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {itemType === 'event' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1">{data.name}</h3>
                      <p className="text-sm font-medium text-primary bg-primary/10 inline-flex px-2.5 py-1 rounded-lg">{data.type}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Date</p>
                        <p className="text-sm font-bold">{new Date(data.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Time</p>
                        <p className="text-sm font-bold">{data.time}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">Location</p>
                        <p className="text-sm font-bold flex items-start gap-1"><MapPin className="w-4 h-4 text-primary shrink-0"/> {data.location}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-2">About this event</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{data.description}</p>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer Engagement / Actions Area */}
              <div className="p-4 border-t border-border/50 bg-card shrink-0">
                {itemType === 'post' && (
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors group">
                      <Heart className="w-6 h-6 group-hover:fill-primary/20" />
                      <span className="font-bold">{data.likes?.length || 0}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors group">
                      <MessageCircle className="w-6 h-6 group-hover:fill-primary/20" />
                      <span className="font-bold">{data.comments?.length || 0}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors ml-auto group">
                      <Share2 className="w-6 h-6 group-hover:fill-primary/20" />
                    </button>
                  </div>
                )}

                {itemType === 'job' && (
                  <button className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" /> View Full Job Details
                  </button>
                )}

                {itemType === 'event' && (
                  <button className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                    <CalendarIcon className="w-4 h-4" /> View Full Event
                  </button>
                )}
              </div>

            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20">
            <p className="text-muted-foreground font-medium">Item not found.</p>
          </div>
        )}
      </div>
      
      {/* Click outside to close (background area) */}
      <div className="absolute inset-0 z-[-1]" onClick={closeModal}></div>
    </div>
  );
};

export default SharedItemViewer;
