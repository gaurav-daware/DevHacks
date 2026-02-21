import { useState } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function CodeReview({ submissionId, onClose }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReview = async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/ai/code-review", { submission_id: submissionId });
      setReview(res.data);
    } catch (error) {
      toast.error("Failed to get code review");
    } finally {
      setLoading(false);
    }
  };

  // Render markdown-like content
  const renderContent = (content) => {
    if (!content) return null;
    
    // Simple markdown parsing
    return content.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-semibold text-white mt-4 mb-2">{line.slice(4)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold text-white mt-4 mb-2">{line.slice(3)}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-bold text-white mt-4 mb-2">{line.slice(2)}</h1>;
      }
      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="text-zinc-300 ml-4">{line.slice(2)}</li>;
      }
      // Bold text (simple)
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={i} className="text-zinc-300">
            {parts.map((part, j) => 
              j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
            )}
          </p>
        );
      }
      // Code blocks
      if (line.startsWith('```')) {
        return null; // Skip code block markers
      }
      // Empty line
      if (!line.trim()) {
        return <br key={i} />;
      }
      // Regular text
      return <p key={i} className="text-zinc-300">{line}</p>;
    });
  };

  return (
    <Card className="bg-[#0a0a0b] border-zinc-800" data-testid="code-review">
      <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Code Review
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {!review && !loading && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-primary/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Get AI-Powered Feedback</h3>
            <p className="text-muted-foreground mb-6">
              Our AI will analyze your code for complexity, style, and potential improvements.
            </p>
            <Button onClick={fetchReview} data-testid="get-review-btn">
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze My Code
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Analyzing your code...</p>
          </div>
        )}

        {review && (
          <div className="space-y-4">
            {review.source === "error" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400">Review temporarily unavailable</span>
              </div>
            )}
            
            {review.source === "ai" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-primary">AI-Generated Review</span>
              </div>
            )}

            <div className="prose prose-invert prose-sm max-w-none">
              {renderContent(review.review)}
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <Button variant="outline" onClick={fetchReview} disabled={loading}>
                <Sparkles className="w-4 h-4 mr-2" />
                Get New Review
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
