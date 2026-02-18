# Video Upsell Feature — Exploration & Research

**Last Updated:** 2026-02-16
**Status:** Research Complete — Awaiting Implementation Decision

---

## Executive Summary

A video upsell feature that animates flipbook images into shareable 40-60 second videos is **technically feasible and cost-effective** at ~$3 per video using Fal.ai APIs.

**Recommended Stack:**
- **Image-to-video:** Fal.ai MiniMax Hailuo-02 (7 clips in parallel)
- **Video stitching:** Fal.ai FFmpeg merge API
- **Audio overlay:** Fal.ai FFmpeg audio merge
- **Architecture:** Async background job with webhook callbacks (BullMQ + Upstash Redis)

**Timeline:** 2-3 weeks for Phase 1 (admin-only MVP)
**Cost per video:** $3.07 (7 clips + stitching + audio)
**Generation time:** 35-40 seconds (parallelized)

---

## 1. Image-to-Video API Research

### Primary Recommendation: Fal.ai MiniMax Hailuo-02

**Model Options:**
- **Hailuo-02 Standard** @ 768P: $0.045/sec ($0.27 per 6-sec clip)
- **Hailuo-02 Pro** @ 1080P: $0.08/sec ($0.48 per 6-sec clip)
- **Hailuo-2.3-Fast (Pro)**: Faster generation, same pricing

**API Endpoint:** `fal.ai/models/fal-ai/minimax/hailuo-02/standard/image-to-video`

**Parameters:**
```json
{
  "image_url": "https://...",           // Starting frame (required)
  "end_image_url": "https://...",       // End frame (optional, enables transitions)
  "duration": "6",                      // "6" or "10" seconds
  "resolution": "768P",                 // "512P" or "768P"
  "prompt": "smooth transition...",     // Motion instruction
  "prompt_optimizer": true              // Auto-improve prompts
}
```

**Key Features:**
✅ **Start + End frame mode** (perfect for flipbook transitions)
✅ **6-second or 10-second clips**
✅ **768P resolution** (balance quality/cost)
✅ **Parallel execution** (can run 7 clips simultaneously)
✅ **Webhook callbacks** (async status updates)

**Generation Time:**
- Single clip: 12-15 seconds
- 7 clips in parallel: ~20 seconds total

### Alternative APIs (Not Recommended)

| Provider | Cost per 6-sec | Pros | Cons |
|----------|----------------|------|------|
| **Kling 2.6** | $0.42-$0.84 | Very high quality | 2-3× more expensive |
| **Runway Gen-4** | $1.44 | Best quality | 5× more expensive |
| **Replicate WAN-2.2** | $0.10-$0.20 | Open source | Less reliable |
| **Hailuo Direct** | Free (watermark) | Cheapest | Watermark, no API |

**Verdict:** Fal.ai MiniMax Hailuo-02 @ 768P is optimal for cost/quality balance.

---

## 2. Video Stitching Architecture

### Recommended: Fal.ai FFmpeg API

**Endpoint:** `fal.ai/models/fal-ai/ffmpeg-api/merge-videos`

**Parameters:**
```json
{
  "video_urls": [
    "https://clip1.mp4",
    "https://clip2.mp4",
    ...
  ],
  "target_fps": 30,                    // Optional, defaults to lowest input
  "resolution": "portrait_16_9"        // Predefined or custom
}
```

**Pricing:** ~$0.015/second of compute (~$0.68 for 45-second stitch)

**Why This Over Alternatives:**

| Option | Pros | Cons |
|--------|------|------|
| **Fal.ai FFmpeg API** ✅ | No Vercel timeout, no binary deploy, handles codecs | Vendor lock-in |
| **Vercel + FFmpeg binary** | Control | 300s timeout, 100MB+ binary, complex |
| **AWS Lambda + FFmpeg layer** | Scalable | Over-engineered for Phase 1 |
| **Replicate** | Open source | Separate vendor, less documented |

**Verdict:** Fal.ai FFmpeg API is simplest and most reliable.

---

## 3. Audio Layer

### Recommended: Fal.ai FFmpeg Audio Merge

**Endpoint:** `fal.ai/models/fal-ai/ffmpeg-api/merge-audio-video`

**Parameters:**
```json
{
  "video_url": "https://stitched-video.mp4",
  "audio_url": "https://background-music.mp3",
  "audio_volume": 0.5,                 // Optional, 0-1
  "audio_start_time": 0                // Optional, offset in seconds
}
```

**Pricing:** ~$0.01/second (~$0.50 for 50-second overlay)

### Music Source Options

**Phase 1 (Admin-only):** Pre-select a royalty-free track
- **Epidemic Sound:** ~$10/month unlimited (manual download)
- **YouTube Audio Library:** Free, no API
- **Uppbeat:** Free tier with attribution

**Phase 2 (User-facing):** API-first music
- **ElevenLabs Music API:** $0.10-$0.50/track, commercially licensed
- **Artlist API:** Per-track licensing, unified music/SFX

**Recommendation for MVP:** Use a single pre-selected track (upload to Supabase, reuse for all videos).

---

## 4. Cover Animation

### Three Options

| Option | Cost | Complexity | UX Quality |
|--------|------|-----------|------------|
| **A: Hailuo clip (cover → first image)** | $0.27 | Medium | Dynamic, smooth |
| **B: FFmpeg zoom/pan on cover** | $0.02 | Low | Professional |
| **C: Static title card (2-3 sec)** | $0 | Minimal | Simple, fast |

**Recommendation for Phase 1:** **Option C** (static cover)
- Zero cost, fastest implementation
- Text overlay: "Things [Name] Would Never Say"
- Can upgrade to B or A in Phase 2

---

## 5. Cost Analysis

### Per Video (8-Image Flipbook)

| Component | Quantity | Unit Cost | Total |
|-----------|----------|-----------|-------|
| Hailuo image-to-video clips | 7 | $0.27 @ 768P | **$1.89** |
| FFmpeg video merge (stitch) | 1 | $0.015 × 45s | **$0.68** |
| FFmpeg audio overlay | 1 | $0.01 × 50s | **$0.50** |
| Static cover (3 seconds) | 1 | $0 | **$0** |
| **TOTAL PER VIDEO** | | | **$3.07** |

### Scaling Estimates

| Books/Month | API Cost | Storage (50MB/video) | Total Monthly |
|-------------|----------|---------------------|---------------|
| 10 | $30.70 | 0.5 GB (free) | **$30.70** |
| 50 | $153.50 | 2.5 GB (free) | **$153.50** |
| 100 | $307 | 5 GB (free) | **$307** |
| 500 | $1,535 | 25 GB ($0.021/GB) | **$1,535.53** |

**Gross Margin (at $4.99 upsell price):**
- Per video: $4.99 - $3.07 = **$1.92 profit (38% margin)**
- Per video: $9.99 - $3.07 = **$6.92 profit (69% margin)** if bundled

---

## 6. Architecture Recommendation

### Approach: Async Background Job with Webhook Callbacks

```
┌─────────────────────────────────────────────────────────────┐
│ USER CLICKS "GENERATE VIDEO"                                │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ Next.js API Route: /api/video/generate                      │
│ - Validate bookId                                            │
│ - Check book.status === 'complete'                          │
│ - Check isAdminUser() (Phase 1)                             │
│ - Queue job in BullMQ (Upstash Redis)                       │
│ - Return { jobId, status: 'queued' }                        │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ BullMQ Worker (Background)                                   │
│ - Fetch book.full_image_urls (ordered array)                │
│ - Generate 7 Hailuo clips IN PARALLEL:                      │
│   ├─ Clip 1: image[0] → image[1]                           │
│   ├─ Clip 2: image[1] → image[2]                           │
│   ├─ Clip 3: image[2] → image[3]                           │
│   ├─ ...                                                     │
│   └─ Clip 7: image[6] → image[7]                           │
│ - Wait for all 7 clips (~20s due to parallelization)        │
│ - Call Fal.ai FFmpeg merge-videos API                       │
│ - Call Fal.ai FFmpeg merge-audio-video API                  │
│ - Download final video                                       │
│ - Upload to Supabase Storage:                               │
│   generated/{slug}/video_final.mp4                          │
│ - Update DB:                                                 │
│   UPDATE roast_books SET                                     │
│     video_url = '...',                                       │
│     video_generation_status = 'complete'                     │
│   WHERE id = bookId                                          │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ Webhook Callback → Next.js API Route                        │
│ /api/webhooks/video-complete                                │
│ - Verify webhook signature                                   │
│ - Trigger Supabase Realtime broadcast                        │
│ - Client UI updates: "Video ready! Download"                │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack Components

| Layer | Technology | Why |
|-------|-----------|-----|
| **Queue** | BullMQ + Upstash Redis | Vercel-compatible, pay-per-use, reliable |
| **Worker** | Vercel Cron or external worker | Handles background processing |
| **Image-to-video** | Fal.ai Hailuo | Best cost/quality, supports start+end frames |
| **Stitching** | Fal.ai FFmpeg merge API | No timeout issues, handles codecs |
| **Audio** | Fal.ai FFmpeg audio merge | Same vendor, simpler integration |
| **Storage** | Supabase Storage | Already in stack, 500GB Pro tier |
| **Status updates** | Supabase Realtime | Already in stack for image generation |

---

## 7. Timeline & Generation Time

### Best Case (Parallel Execution)

| Step | Time | Notes |
|------|------|-------|
| Queue job | <1s | Instant |
| Generate 7 Hailuo clips (parallel) | ~20s | Sequential would be 140s |
| FFmpeg merge videos | ~8s | 7 clips → 1 video |
| FFmpeg audio overlay | ~5s | Add background music |
| Download + upload to Supabase | ~5s | 50MB video transfer |
| **TOTAL** | **~40s** | User sees "processing..." UI |

### Worst Case (API Queuing)
- Fal.ai queue during peak hours: +20-30s
- **Total:** 60-90 seconds

---

## 8. Technical Risks & Mitigation

| Risk | Severity | Impact | Mitigation |
|------|----------|--------|-----------|
| **Fal.ai rate limits** | Medium | Job fails | Exponential backoff retry (already in codebase via `withRetryContext`) |
| **Webhook delivery failure** | Medium | User doesn't see completion | Polling fallback every 5s + email notification |
| **Video codec incompatibility** | Low | Output unusable | Fal.ai FFmpeg handles conversion automatically |
| **Upstash Redis cost explosion** | Low | Budget overrun | Monitor BullMQ usage, limit to 100 jobs/month in Phase 1 |
| **Storage cost** | Low | $0.021/GB after 1GB | 500GB free on Pro tier = 10,000 videos |
| **One clip fails (out of 7)** | High | Entire video fails | Retry failed clip 3× before marking job as failed |

### Failure Strategy

```typescript
// Pseudo-code
for (let i = 0; i < 7; i++) {
  try {
    clips[i] = await withRetryContext(
      () => generateHailuoClip(imageUrls[i], imageUrls[i+1]),
      { maxAttempts: 3, context: `Clip ${i}` }
    );
  } catch (error) {
    // Mark job as failed, save error to DB
    await updateJob({ status: 'failed', error: error.message });
    throw error; // Stop processing
  }
}
```

---

## 9. Implementation Phases

### Phase 1: Admin-Only MVP (2-3 weeks)

**Goal:** Prove technical feasibility, validate user excitement

**Database Schema:**
```sql
ALTER TABLE roast_books ADD COLUMN video_url TEXT;
ALTER TABLE roast_books ADD COLUMN video_generation_status TEXT DEFAULT 'not_started';
  -- Enum: 'not_started', 'queued', 'processing', 'complete', 'failed'
ALTER TABLE roast_books ADD COLUMN video_generation_started_at TIMESTAMPTZ;
ALTER TABLE roast_books ADD COLUMN video_generation_completed_at TIMESTAMPTZ;
ALTER TABLE roast_books ADD COLUMN video_generation_error TEXT;
ALTER TABLE roast_books ADD COLUMN video_generation_job_id TEXT;
```

**API Routes:**
- `POST /api/video/generate` — Queue video job (admin-only)
- `GET /api/video/status/[jobId]` — Polling endpoint
- `POST /api/webhooks/video-complete` — Fal.ai webhook receiver

**UI Changes:**
- Admin dashboard: "Generate Video" button (only if status === 'complete')
- Show "Processing video..." spinner
- Download button once video_url is set

**Environment Variables:**
```bash
FAL_API_KEY=fal_...
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...
VIDEO_WEBHOOK_SECRET=random_string_123
```

**Deliverables:**
- [ ] Database migrations
- [ ] BullMQ worker setup
- [ ] Fal.ai integration (Hailuo + FFmpeg)
- [ ] Admin UI with progress tracking
- [ ] Error handling & retry logic

---

### Phase 2: User-Facing (1-2 weeks)

**Goal:** Make video generation available to all paid users

**Features:**
- Video preview player on `/book/[slug]` page
- Download button for MP4 file
- Social media share templates:
  - Instagram Reels (9:16, 60s max)
  - TikTok (9:16, 60s max)
  - YouTube Shorts (9:16, 60s max)

**No payment yet** — free for all complete books as a value-add

---

### Phase 3: Monetization (3-4 weeks)

**Goal:** Upsell video as premium feature

**Pricing Options:**
| Option | Price | Strategy |
|--------|-------|----------|
| **A: Per-video upsell** | $4.99 | Low commitment, test demand |
| **B: Premium bundle** | $14.99 | Book + video upfront (better margin) |
| **C: Subscription tier** | $9.99/month | Unlimited videos (high LTV) |

**Recommendation:** Start with **Option A** ($4.99 upsell after book completion)

**Implementation:**
- Stripe checkout for video-only purchase
- Update webhook to mark `video_paid = true` in DB
- Show "Upgrade to video: $4.99" banner on complete books

---

### Phase 4: Advanced Features (Future)

**TTS Voiceover:**
- ElevenLabs API to read each quote during its clip
- Cost: ~$0.05/quote × 8 = $0.40 per video
- Total cost with voice: $3.47

**Custom Music Selection:**
- User picks from 3-5 music options
- Store selection in `video_music_choice` column

**Watermark Removal:**
- Optional $2.99 upsell to remove "Made with The Roast Book" watermark

---

## 10. Video File Specs

### Output Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Format** | MP4 (H.264) | Universal compatibility |
| **Resolution** | 768P (768×1344) | Portrait 9:16 for mobile |
| **FPS** | 30 | Standard for social media |
| **Duration** | 40-60 seconds | 7 clips × 6s + 3s cover + transitions |
| **File Size** | 35-50 MB | ~0.8 MB/sec @ 768P |
| **Audio** | AAC 128kbps | Background music only (Phase 1) |

### Storage Requirements

**Per video:** 50 MB
**100 videos:** 5 GB (free on Supabase Pro)
**1,000 videos:** 50 GB (still free)
**Cost at scale:** $0.021/GB after 500GB

---

## 11. Environment Variables Needed

Add to Vercel:
```bash
# Fal.ai API
FAL_API_KEY=fal_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Upstash Redis (for BullMQ)
UPSTASH_REDIS_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxA==

# Webhook Security
VIDEO_WEBHOOK_SECRET=random_secret_string_xyz789

# Optional: Music API (Phase 2+)
ELEVENLABS_API_KEY=xi_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 12. Database Schema Changes

```sql
-- Add video generation columns to roast_books table
ALTER TABLE roast_books
ADD COLUMN video_url TEXT,
ADD COLUMN video_generation_status TEXT DEFAULT 'not_started',
ADD COLUMN video_generation_started_at TIMESTAMPTZ,
ADD COLUMN video_generation_completed_at TIMESTAMPTZ,
ADD COLUMN video_generation_error TEXT,
ADD COLUMN video_generation_job_id TEXT,
ADD COLUMN video_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN video_music_choice TEXT DEFAULT 'default';

-- Create index for efficient queries
CREATE INDEX idx_roast_books_video_status
ON roast_books(video_generation_status);

-- Optional: Create separate video_jobs table for better tracking
CREATE TABLE IF NOT EXISTS video_generation_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES roast_books(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  clips_completed INT DEFAULT 0,
  total_clips INT DEFAULT 7,
  fal_job_ids JSONB,
  final_video_url TEXT
);
```

---

## 13. Key Integration Points

### Fal.ai API Calls

**1. Generate Image-to-Video Clip:**
```typescript
const response = await fetch('https://fal.ai/api/fal-ai/minimax/hailuo-02/standard/image-to-video', {
  method: 'POST',
  headers: {
    'Authorization': `Key ${process.env.FAL_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image_url: startImageUrl,
    end_image_url: endImageUrl,
    duration: '6',
    resolution: '768P',
    prompt: 'smooth transition between two images, maintain subject likeness',
    prompt_optimizer: true
  })
});

const { video_url } = await response.json();
```

**2. Merge Videos:**
```typescript
const response = await fetch('https://fal.ai/api/fal-ai/ffmpeg-api/merge-videos', {
  method: 'POST',
  headers: {
    'Authorization': `Key ${process.env.FAL_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    video_urls: [clip1Url, clip2Url, clip3Url, ...],
    target_fps: 30,
    resolution: 'portrait_16_9'
  })
});

const { output_url } = await response.json();
```

**3. Add Audio:**
```typescript
const response = await fetch('https://fal.ai/api/fal-ai/ffmpeg-api/merge-audio-video', {
  method: 'POST',
  headers: {
    'Authorization': `Key ${process.env.FAL_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    video_url: stitchedVideoUrl,
    audio_url: backgroundMusicUrl,
    audio_volume: 0.5
  })
});

const { output_url } = await response.json();
```

---

## 14. Success Metrics (Phase 1)

**Technical Validation:**
- [ ] 100% success rate for admin test videos (10+ tests)
- [ ] Average generation time < 60 seconds
- [ ] Zero storage failures
- [ ] Video playback on iPhone Safari, Chrome, Instagram

**Business Validation:**
- [ ] 10+ admin-generated videos shared to friends
- [ ] Qualitative feedback: "Would you pay $4.99 for this?"
- [ ] Shareability: Do videos get re-shared on social media?

**Go/No-Go Decision for Phase 2:**
- ✅ **GO** if: 80%+ positive feedback + 50%+ say they'd pay
- ❌ **NO-GO** if: <50% positive feedback or major technical issues

---

## 15. Open Questions

1. **Music licensing:** Do we need synchronization license for background music in user-generated content?
   - **Answer:** Yes, if user-facing. Use Epidemic Sound Personal ($15/month) or ElevenLabs Music API.

2. **Voiceover implementation:** Should TTS voice read quotes aloud during each clip?
   - **Recommendation:** Phase 4 feature, adds $0.40/video cost via ElevenLabs.

3. **Watermark strategy:** "Made with The Roast Book" watermark on free videos?
   - **Recommendation:** Phase 3, removable for $2.99 upsell.

4. **Social media optimization:** Auto-generate caption text for Instagram/TikTok?
   - **Recommendation:** Phase 2, use GPT-4o-mini to generate caption from quotes.

---

## 16. References & Documentation

### APIs & Services
- [Fal.ai MiniMax Hailuo-02 API](https://fal.ai/models/fal-ai/minimax/hailuo-02/standard/image-to-video/api)
- [Fal.ai FFmpeg Merge Videos](https://fal.ai/models/fal-ai/ffmpeg-api/merge-videos)
- [Fal.ai FFmpeg Audio Merge](https://fal.ai/models/fal-ai/ffmpeg-api/merge-audio-video)
- [Replicate Image-to-Video Models](https://replicate.com/collections/image-to-video)
- [Runway Gen-4 Pricing](https://docs.dev.runwayml.com/guides/pricing/)
- [Kling AI Documentation](https://piapi.ai/kling-2-6)

### Infrastructure
- [BullMQ with Upstash Redis](https://upstash.com/docs/redis/integrations/bullmq)
- [Vercel Functions Limits](https://vercel.com/docs/limits)
- [Supabase Storage Limits](https://supabase.com/docs/guides/storage/uploads/file-limits)
- [AWS Lambda FFmpeg Processing](https://aws.amazon.com/blogs/media/processing-user-generated-content-using-aws-lambda-and-ffmpeg/)

### Audio & Music
- [ElevenLabs Audio APIs](https://elevenlabs.io/developers)
- [Epidemic Sound Licensing](https://www.epidemicsound.com/pricing/)
- [Artlist API](https://artlist.io/api)

---

## 17. Final Recommendation

**✅ PROCEED with Phase 1 Implementation**

**Why this is a good idea:**
- **Cost-effective:** $3.07/video with healthy margin potential
- **Technically feasible:** Fal.ai handles hard parts (video generation, FFmpeg)
- **Fast to market:** 2-3 weeks for admin MVP
- **Low risk:** Start admin-only, validate before opening to users
- **High shareability:** Videos are more viral than static flipbooks
- **Upsell opportunity:** 38-69% margin depending on pricing strategy

**Hardest technical challenge:** Video stitching reliability
- **Mitigation:** Use Fal.ai FFmpeg API (serverless, no timeout issues)

**Next steps:**
1. Set up Fal.ai account + API key
2. Create Upstash Redis instance
3. Add database columns for video tracking
4. Build `/api/video/generate` route with BullMQ queue
5. Test with 5-10 admin books
6. Collect feedback before Phase 2

---

**Ready to start implementation? Let me know and I'll begin coding Phase 1.**
