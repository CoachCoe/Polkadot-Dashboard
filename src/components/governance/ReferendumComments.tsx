'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ReferendumComment } from '@/services/governance';
import { governanceService } from '@/services/governance';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { EmojiPicker } from '@/components/ui/emoji-picker';

interface Props {
  referendumIndex: number;
}

export function ReferendumComments({ referendumIndex }: Props) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [comments, setComments] = useState<ReferendumComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadComments();
  }, [referendumIndex]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const fetchedComments = await governanceService.getComments(referendumIndex);
      setComments(fetchedComments);
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to load comments. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!session?.user?.address) {
      showToast({
        title: 'Error',
        description: 'Please connect your wallet to comment.',
        variant: 'destructive'
      });
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      await governanceService.addComment(
        {
          referendumIndex,
          content: newComment.trim(),
          parentId: replyTo
        },
        session.user.address
      );

      setNewComment('');
      setReplyTo(undefined);
      await loadComments();

      showToast({
        title: 'Success',
        description: 'Your comment has been added.',
        variant: 'default'
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = async (commentId: string, reaction: string) => {
    if (!session?.user?.address) {
      showToast({
        title: 'Error',
        description: 'Please connect your wallet to react.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await governanceService.reactToComment(
        commentId,
        reaction,
        session.user.address
      );
      await loadComments();
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to add reaction. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const renderComment = (comment: ReferendumComment) => (
    <Card key={comment.id} className="p-4 mb-4">
      <div className="flex items-start space-x-4">
        <Avatar address={comment.author} size="sm" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">{comment.author}</span>
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
            </span>
          </div>
          <p className="mt-2 text-gray-700">{comment.content}</p>
          <div className="mt-4 flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyTo(comment.id)}
            >
              Reply
            </Button>
            <EmojiPicker
              onSelect={(emoji: string) => handleReaction(comment.id, emoji)}
            />
            <div className="flex space-x-2">
              {Object.entries(comment.reactions).map(([emoji, users]) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(comment.id, emoji)}
                >
                  {emoji} {users.length}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Comments</h2>
      
      {session?.user?.address ? (
        <div className="space-y-4">
          <Textarea
            value={newComment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
            placeholder={
              replyTo
                ? "Write your reply..."
                : "Share your thoughts on this referendum..."
            }
            rows={4}
          />
          <div className="flex justify-end space-x-4">
            {replyTo && (
              <Button
                variant="ghost"
                onClick={() => setReplyTo(undefined)}
                disabled={isLoading}
              >
                Cancel Reply
              </Button>
            )}
            <Button
              onClick={handleSubmitComment}
              disabled={isLoading || !newComment.trim()}
            >
              {isLoading ? "Submitting..." : "Submit Comment"}
            </Button>
          </div>
        </div>
      ) : (
        <Card className="p-4 text-center">
          <p>Please connect your wallet to participate in the discussion.</p>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading && comments.length === 0 ? (
          <div className="text-center py-8">Loading comments...</div>
        ) : comments.length > 0 ? (
          comments.map(renderComment)
        ) : (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </div>
  );
} 