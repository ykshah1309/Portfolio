'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Linkedin, 
  Plus, 
  X, 
  MoreHorizontal, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Lock,
  Clock,
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface Post {
  id: string;
  author: string;
  role: string;
  content: string;
  timestamp: string;
  likes: number;
  hasLiked: boolean;
  comments: Comment[];
  showComments: boolean;
}

export default function LinkedInPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [isMaster, setIsMaster] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const savedPosts = localStorage.getItem('portfolio_posts');
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts));
    } else {
      const defaultPosts: Post[] = [
        {
          id: '1',
          author: 'Yash Shah',
          role: 'AI/ML Engineer | MS in Data Science @ NJIT',
          content: "Excited to share that I've just completed my MS in Data Science from NJIT with a 3.8 GPA! 🎓 It's been an incredible journey exploring the depths of Machine Learning and RAG systems. Looking forward to applying these skills to solve real-world problems. #DataScience #NJIT #AI #NewBeginnings",
          timestamp: '2d ago',
          likes: 42,
          hasLiked: false,
          comments: [
            { id: 'c1', author: 'Visitor', text: 'Congratulations Yash! Great achievement.', timestamp: '1d ago' }
          ],
          showComments: false
        },
        {
          id: '2',
          author: 'Yash Shah',
          role: 'AI/ML Engineer | MS in Data Science @ NJIT',
          content: "Just finished building 'Rose', a privacy-first offline voice assistant. 🌹 It runs entirely on a local 7B parameter model with sub-2s latency. Privacy in AI is more important than ever! #PrivacyFirst #OfflineAI #Python #LLM",
          timestamp: '1w ago',
          likes: 89,
          hasLiked: false,
          comments: [],
          showComments: false
        },
        {
          id: '3',
          author: 'Yash Shah',
          role: 'AI/ML Engineer | MS in Data Science @ NJIT',
          content: "Working on 'Pandora's Box', a health AI with 99.4% safety filtering. Safety and ethics in AI are paramount when dealing with sensitive health data. #AISafety #HealthTech #EthicsInAI",
          timestamp: '2w ago',
          likes: 56,
          hasLiked: false,
          comments: [],
          showComments: false
        }
      ];
      setPosts(defaultPosts);
    }
    
    const savedMaster = localStorage.getItem('isPortfolioMaster');
    if (savedMaster === 'true') {
      setIsMaster(true);
    }
  }, []);

  // Robust scroll handlers
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // Mouse wheel horizontal scroll fix
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const onWheel = (e: WheelEvent) => {
        if (e.deltaY === 0) return;
        const canScrollLeft = el.scrollLeft > 0;
        const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth;
        
        if ((e.deltaY < 0 && canScrollLeft) || (e.deltaY > 0 && canScrollRight)) {
          e.preventDefault();
          el.scrollTo({
            left: el.scrollLeft + e.deltaY * 2.5,
            behavior: 'auto'
          });
        }
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted && posts.length > 0) {
      localStorage.setItem('portfolio_posts', JSON.stringify(posts));
    }
  }, [posts, mounted]);

  if (!mounted) return null;

  const handleVerifyMaster = () => {
    if (masterKey === 'yash-master-2026') {
      setIsMaster(true);
      localStorage.setItem('isPortfolioMaster', 'true');
      setShowKeyInput(false);
      setMasterKey('');
    } else {
      alert('Invalid Master Key');
    }
  };

  const handleAddPost = () => {
    if (!newPostContent.trim()) return;

    const newPost: Post = {
      id: Date.now().toString(),
      author: 'Yash Shah',
      role: 'AI/ML Engineer | MS in Data Science @ NJIT',
      content: newPostContent,
      timestamp: 'Just now',
      likes: 0,
      hasLiked: false,
      comments: [],
      showComments: false
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setIsAddingPost(false);
  };

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.hasLiked ? post.likes - 1 : post.likes + 1,
          hasLiked: !post.hasLiked
        };
      }
      return post;
    }));
  };

  const toggleComments = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, showComments: !post.showComments } : post
    ));
  };

  const handleAddComment = (postId: string) => {
    const text = newCommentText[postId];
    if (!text?.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      author: 'Visitor',
      text: text,
      timestamp: 'Just now'
    };

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));

    setNewCommentText(prev => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-16 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0077b5] rounded-xl">
            <Linkedin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Professional Updates</h2>
            <p className="text-sm text-gray-500">Latest from my LinkedIn feed</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isMaster ? (
            <Button 
              onClick={() => setIsAddingPost(true)}
              className="bg-[#0077b5] hover:bg-[#006396] text-white rounded-full gap-2"
            >
              <Plus className="w-4 h-4" /> Post Update
            </Button>
          ) : (
            <button 
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              title="Master Access"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Master Key Input */}
      <AnimatePresence>
        {showKeyInput && !isMaster && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="p-4 bg-white/40 backdrop-blur-md border border-gray-200 rounded-2xl flex gap-3">
              <Input 
                type="password" 
                placeholder="Enter Master Key to post..." 
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                className="flex-1 bg-white/50"
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyMaster()}
              />
              <Button onClick={handleVerifyMaster} className="bg-gray-900 text-white hover:bg-gray-800">Verify</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Post Modal */}
      <AnimatePresence>
        {isAddingPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="font-bold text-xl text-gray-900">Create a post</h3>
                <button onClick={() => setIsAddingPost(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-14 h-14 border border-gray-100">
                    <AvatarFallback className="bg-gray-900 text-white text-lg">YS</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-gray-900">Yash Shah</p>
                    <p className="text-xs text-gray-500">Posting to Professional Updates</p>
                  </div>
                </div>
                <textarea
                  placeholder="What's on your mind, Yash?"
                  className="w-full h-48 resize-none border-none focus:ring-0 text-lg placeholder:text-gray-400 text-gray-800"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="p-6 border-t bg-gray-50/50 flex justify-end">
                <Button 
                  onClick={handleAddPost}
                  disabled={!newPostContent.trim()}
                  className="bg-[#0077b5] hover:bg-[#006396] text-white rounded-full px-8 py-6 text-base font-bold disabled:opacity-50"
                >
                  Post Update
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts Sliding Panel */}
      <div className="relative group">
        {/* Navigation Arrows */}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 p-2 bg-white/80 backdrop-blur-sm shadow-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden md:block border border-gray-100"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 p-2 bg-white/80 backdrop-blur-sm shadow-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden md:block border border-gray-100"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>

        <div 
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar scroll-smooth touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {posts.map((post) => (
            <motion.div 
              key={post.id}
              className="min-w-[280px] xs:min-w-[320px] md:min-w-[450px] bg-white/40 backdrop-blur-md border border-white/20 rounded-[1.5rem] sm:rounded-[2rem] snap-center flex flex-col overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-6 flex items-start justify-between">
                <div className="flex gap-4">
                  <Avatar className="w-10 h-10 sm:w-14 sm:h-14 border border-white shadow-sm">
                    <AvatarFallback className="bg-gray-900 text-white font-bold">YS</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base sm:text-lg leading-tight">{post.author}</h4>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1 font-medium line-clamp-1 max-w-[150px] xs:max-w-[200px] md:max-w-[280px]">{post.role}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{post.timestamp}</span>
                      <span>•</span>
                      <Linkedin className="w-3 h-3" />
                    </div>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Post Content */}
              <div className="px-6 pb-6 flex-1">
                <p className="text-sm sm:text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              {/* Post Stats */}
              <div className="px-6 py-3 border-t border-gray-100/30 flex items-center justify-between text-[11px] text-gray-500 bg-gray-50/20">
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                      <ThumbsUp className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <span className="font-semibold text-gray-600">{post.likes}</span>
                </div>
                <div className="flex gap-3 font-medium">
                  <button onClick={() => toggleComments(post.id)} className="hover:text-blue-600 transition-colors">
                    {post.comments.length} comments
                  </button>
                  <span>•</span>
                  <span>12 shares</span>
                </div>
              </div>

              {/* Post Actions */}
              <div className="px-3 py-2 border-t border-gray-100/30 flex justify-around bg-white/20">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-white/40 rounded-xl transition-all ${post.hasLiked ? 'text-blue-600' : 'text-gray-600'}`}
                >
                  <ThumbsUp className={`w-4 h-4 ${post.hasLiked ? 'fill-current' : ''}`} />
                  <span className="text-xs font-bold">{post.hasLiked ? 'Liked' : 'Like'}</span>
                </button>
                <button 
                  onClick={() => toggleComments(post.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-white/40 rounded-xl text-gray-600 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-bold">Comment</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-white/40 rounded-xl text-gray-600 transition-all">
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs font-bold">Share</span>
                </button>
              </div>

              {/* Comments Section */}
              <AnimatePresence>
                {post.showComments && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-gray-50/40 border-t border-gray-100/30 overflow-hidden"
                  >
                    <div className="p-4 space-y-4">
                      {/* Comment Input */}
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gray-200 text-gray-600 text-[10px]">V</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <Input 
                            placeholder="Add a comment..." 
                            className="h-8 text-xs bg-white/50"
                            value={newCommentText[post.id] || ''}
                            onChange={(e) => setNewCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          />
                          <Button 
                            size="icon" 
                            className="h-8 w-8 bg-[#0077b5] hover:bg-[#006396]"
                            onClick={() => handleAddComment(post.id)}
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-3 max-h-40 overflow-y-auto no-scrollbar">
                        {post.comments.map(comment => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gray-200 text-gray-600 text-[10px]">V</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-white/60 p-2 rounded-xl border border-white/20">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-gray-900">{comment.author}</span>
                                <span className="text-[9px] text-gray-400">{comment.timestamp}</span>
                              </div>
                              <p className="text-[11px] text-gray-700">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        
        {/* Custom Scrollbar Styling */}
        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </div>
  );
}