import { NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST() {
  try {
    const uploadUrl = await convex.mutation(api.documents.generateUploadUrl, {})
    return NextResponse.json({ uploadUrl })
  } catch (error) {
    console.error('Failed to generate upload URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
