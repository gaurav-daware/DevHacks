import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, ThumbsUp, ThumbsDown, Reply, Send, Loader2, User } from "lucide-react";

export default function DiscussionsTab({ problemId }) {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    if (problemId) {
      loadDiscussions();
    }
  }, [problemId]);

  const loadDiscussions = async () => {
    try {
      const res = await api.get(`/api/problems/${problemId}/discussions`);
      setDiscussions(res.data);
    } catch (error) {
      console.error("Failed to load discussions:", error);
    } finally {
      setLoading(false);
    }
  };

  const postComment = async () => {
    if (!newComment.trim()) {
      toast.error("Write something first");
      return;
    }
    if (!user) {
      toast.error("Login to post comments");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/api/problems/${problemId}/discussions`, {
        content: newComment.trim()
      });
      setNewComment("");
      loadDiscussions();
      toast.success("Comment posted!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const postReply = async (parentId) => {
    if (!replyContent.trim()) {
      toast.error("Write something first");
      return;
    }

    try {
      await api.post(`/api/problems/${problemId}/discussions`, {
        content: replyContent.trim(),
        parent_id: parentId
      });
      setReplyContent("");
      setReplyingTo(null);
      loadDiscussions();
      toast.success("Reply posted!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to post reply");
    }
  };

  const vote = async (discussionId, voteType) => {
    if (!user) {
      toast.error("Login to vote");
      return;
    }

    try {
      await api.post(`/api/discussions/${discussionId}/vote?vote_type=${voteType}`);
      loadDiscussions();
    } catch (error) {
      toast.error("Failed to vote");
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="discussions-tab">
      {/* New Comment */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <Textarea
            placeholder={user ? "Share your thoughts, ask questions, or help others..." : "Login to participate in discussions"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-zinc-800 border-zinc-700 min-h-[100px] mb-3"
            disabled={!user}
          />
          <div className="flex justify-end">
            <Button 
              onClick={postComment} 
              disabled={submitting || !user}
              data-testid="post-comment-btn"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Post Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Discussions List */}
      {discussions.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No discussions yet</h3>
          <p className="text-muted-foreground">Be the first to start a conversation!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {discussions.map((disc) => (
            <Card key={disc.id} className="bg-zinc-900/30 border-zinc-800">
              <CardContent className="p-4">
                {/* Main Comment */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-white">{disc.username}</span>
                      <span className="text-sm text-muted-foreground">{formatDate(disc.created_at)}</span>
                    </div>
                    <p className="text-zinc-300 whitespace-pre-wrap">{disc.content}</p>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={() => vote(disc.id, "up")}
                        className={`flex items-center gap-1.5 text-sm ${
                          disc.user_vote === "up" ? "text-primary" : "text-muted-foreground hover:text-white"
                        } transition-colors`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{disc.upvotes}</span>
                      </button>
                      <button
                        onClick={() => vote(disc.id, "down")}
                        className={`flex items-center gap-1.5 text-sm ${
                          disc.user_vote === "down" ? "text-red-400" : "text-muted-foreground hover:text-white"
                        } transition-colors`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>{disc.downvotes}</span>
                      </button>
                      {user && (
                        <button
                          onClick={() => setReplyingTo(replyingTo === disc.id ? null : disc.id)}
                          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
                        >
                          <Reply className="w-4 h-4" />
                          Reply
                        </button>
                      )}
                    </div>

                    {/* Reply Input */}
                    {replyingTo === disc.id && (
                      <div className="mt-4 flex gap-3">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="bg-zinc-800 border-zinc-700 min-h-[80px]"
                        />
                        <div className="flex flex-col gap-2">
                          <Button size="sm" onClick={() => postReply(disc.id)}>
                            Reply
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {disc.replies?.length > 0 && (
                      <div className="mt-4 pl-6 border-l-2 border-zinc-800 space-y-4">
                        {disc.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-white text-sm">{reply.username}</span>
                                <span className="text-xs text-muted-foreground">{formatDate(reply.created_at)}</span>
                              </div>
                              <p className="text-zinc-300 text-sm">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
