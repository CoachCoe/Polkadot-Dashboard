import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  authorName?: string;
  authorAvatar?: string;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const referendumId = params.id;

  try {
    const comments = await kv.get<Comment[]>(`comments:${referendumId}`) || [];
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Failed to get comments:', error);
    return NextResponse.json(
      { error: 'Failed to get comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const referendumId = params.id;

  try {
    const { content, author } = await request.json();

    if (!content || !author) {
      return NextResponse.json(
        { error: 'Content and author are required' },
        { status: 400 }
      );
    }

    const comment: Comment = {
      id: uuidv4(),
      author,
      content,
      timestamp: Date.now(),
    };

    const comments = await kv.get<Comment[]>(`comments:${referendumId}`) || [];
    comments.push(comment);
    await kv.set(`comments:${referendumId}`, comments);

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Failed to add comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
} 