import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  try {
    const favorites = await kv.get<number[]>(`favorites:${address}`) || [];
    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Failed to get favorites:', error);
    return NextResponse.json(
      { error: 'Failed to get favorites' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { address, referendumId } = await request.json();

    if (!address || typeof referendumId !== 'number') {
      return NextResponse.json(
        { error: 'Address and referendumId are required' },
        { status: 400 }
      );
    }

    const favorites = await kv.get<number[]>(`favorites:${address}`) || [];
    if (!favorites.includes(referendumId)) {
      favorites.push(referendumId);
      await kv.set(`favorites:${address}`, favorites);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to add favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { address, referendumId } = await request.json();

    if (!address || typeof referendumId !== 'number') {
      return NextResponse.json(
        { error: 'Address and referendumId are required' },
        { status: 400 }
      );
    }

    const favorites = await kv.get<number[]>(`favorites:${address}`) || [];
    const updatedFavorites = favorites.filter(id => id !== referendumId);
    await kv.set(`favorites:${address}`, updatedFavorites);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
} 