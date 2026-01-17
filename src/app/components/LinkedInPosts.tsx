'use client';

import { useState, useEffect } from 'react';
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
  Send
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

  useEffect(() => {
    setMounted(true);
    
    // Load posts from localStorage or use defaults
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
        }
      ];
      setPosts(defaultPosts);
    }
    
    const savedMaster = localStorage.getItem('isPortfolioMaster');
    if (savedMaster === 'true') {
      setIsMaster(true);
    }
  }, []);

  // Save posts to localStorage whenever they change
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0077b5] rounded-xl shadow-lg shadow-blue-500/20">
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
              className="bg-[#0077b5] hover:bg-[#006396] text-white rounded-full gap-2 shadow-md"
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
            <div className="p-4 bg-white/60 backdrop-blur-xl border border-gray-200 rounded-2xl flex gap-3 shadow-xl">
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="font-bold text-xl text-gray-900">Create a post</h3>
                <button onClick={() => setIsAddingPost(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-14 h-14 border-2 border-gray-100">
                    <AvatarFallback className="bg-gray-900 text-white text-lg">YS</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-gray-900">Yash Shah</p>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full mt-1">
                      <span className="text-[10px] font-semibold text-gray-600">Post to Anyone</span>
                    </div>
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
                  className="bg-[#0077b5] hover:bg-[#006396] text-white rounded-full px-8 py-6 text-base font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
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
        <div 
          className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {posts.map((post) => (
            <motion.div 
              key={post.id}
              whileHover={{ y: -5 }}
              className="min-w-[320px] md:min-w-[450px] bg-white/70 backdrop-blur-2xl border border-white/40 rounded-[2rem] shadow-2xl snap-center flex flex-col overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-6 flex items-start justify-between">
                <div className="flex gap-4">
                  <Avatar className="w-14 h-14 border-2 border-white shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-gray-800 to-black text-white font-bold">YS</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg leading-tight">{post.author}</h4>
                    <p className="text-[11px] text-gray-500 mt-1 font-medium line-clamp-1 max-w-[200px] md:max-w-[280px]">{post.role}</p>
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
                <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              {/* Post Stats */}
              <div className="px-6 py-3 border-t border-gray-100/50 flex items-center justify-between text-[11px] text-gray-500 bg-gray-50/30">
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
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
              <div className="px-3 py-2 border-t border-gray-100/50 flex justify-around bg-white/50">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-gray-100/80 rounded-xl transition-all ${post.hasLiked ? 'text-blue-600' : 'text-gray-600'}`}
                >
                  <ThumbsUp className={`w-4 h-4 ${post.hasLiked ? 'fill-current' : ''}`} />
                  <span className="text-xs font-bold">{post.hasLiked ? 'Liked' : 'Like'}</span>
                </button>
                <button 
                  onClick={() => toggleComments(post.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-gray-100/80 rounded-xl text-gray-600 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-bold">Comment</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-gray-100/80 rounded-xl text-gray-600 transition-all">
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
                    className="bg-gray-50/80 border-t border-gray-100 overflow-hidden"
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
                            className="h-8 text-xs bg-white"
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
                            <div className="flex-1 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
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