'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWalletStore } from '@/store/useWalletStore';

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  authorName?: string;
  authorAvatar?: string;
}

interface ReferendumCommentsProps {
  referendumId: string;
}

export function ReferendumComments({ referendumId }: ReferendumCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedAccount } = useWalletStore();

  useEffect(() => {
    loadComments();
  }, [referendumId]);

  const loadComments = () => {
    try {
      const storedComments = localStorage.getItem(`comments:${referendumId}`);
      setComments(storedComments ? JSON.parse(storedComments) : []);
    } catch (err) {
      setError('Failed to load comments');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !newComment.trim()) return;

    try {
      const comment: Comment = {
        id: uuidv4(),
        author: selectedAccount.address,
        content: newComment.trim(),
        timestamp: Date.now(),
      };

      const updatedComments = [...comments, comment];
      localStorage.setItem(`comments:${referendumId}`, JSON.stringify(updatedComments));
      setComments(updatedComments);
      setNewComment('');
    } catch (err) {
      setError('Failed to add comment');
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading comments...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>
      
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-700">
                {comment.author.slice(0, 6)}...{comment.author.slice(-4)}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(comment.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-800">{comment.content}</p>
          </div>
        ))}
      </div>

      {selectedAccount ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full p-2 border rounded-lg"
            placeholder="Add a comment..."
            rows={3}
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            Post Comment
          </button>
        </form>
      ) : (
        <p className="text-gray-500">Connect your wallet to comment</p>
      )}
    </div>
  );
} 