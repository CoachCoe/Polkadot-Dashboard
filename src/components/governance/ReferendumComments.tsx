'use client';

import { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar } from '@/components/ui/Avatar';
import { formatTimeAgo } from '@/utils/formatters';

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  authorName?: string;
  authorAvatar?: string | null;
}

interface ReferendumCommentsProps {
  referendumId: number;
}

export function ReferendumComments({ referendumId }: ReferendumCommentsProps) {
  const { selectedAccount } = useWalletStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [referendumId]);

  async function loadComments() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/governance/referenda/${referendumId}/comments`);
      if (!response.ok) throw new Error('Failed to load comments');
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmitComment() {
    if (!selectedAccount || !newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/governance/referenda/${referendumId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          author: selectedAccount.address,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit comment');

      const comment = await response.json();
      setComments([...comments, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-4">
            <Avatar
              src={comment.authorAvatar || null}
              alt={comment.authorName || comment.author}
              fallback={comment.authorName?.[0] || comment.author.slice(0, 2)}
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {comment.authorName || `${comment.author.slice(0, 6)}...${comment.author.slice(-4)}`}
                </span>
                <span className="text-sm text-gray-500">
                  {formatTimeAgo(new Date(comment.timestamp))}
                </span>
              </div>
              <p className="mt-1 text-gray-700">{comment.content}</p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>

      {selectedAccount && (
        <div className="space-y-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add your comment..."
            className="w-full min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Comment'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 