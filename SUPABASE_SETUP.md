# Supabase Setup Guide

This application uses Supabase for storing trade-related images. Follow these steps to set it up:

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in the project details:
   - Name: e.g., "trade-journal"
   - Database Password: Create a strong password
   - Region: Choose the closest region to you
5. Click "Create new project" and wait for it to initialize (5-10 minutes)

## 2. Get Your API Credentials

1. After project creation, go to **Settings** > **API**
2. You'll see:
   - **Project URL** (copy this as `EXPO_PUBLIC_SUPABASE_URL`)
   - **Project API keys** (copy the "anon/public" key as `EXPO_PUBLIC_SUPABASE_ANON_KEY`)

## 3. Create a Storage Bucket

1. Go to **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Name it: `trade-images`
4. Uncheck "Private bucket" (make it public for easier access)
5. Click **Create bucket**

## 4. Set Bucket Policies (Optional but Recommended)

To allow authenticated users to upload and delete images:

1. Select the `trade-images` bucket
2. Click **Policies** tab
3. Add a policy to allow authenticated uploads:
   - Click **New Policy** > **For full customization, use SQL editor**
   - Use the following SQL:

```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'trade-images');

CREATE POLICY "Allow authenticated users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'trade-images' AND auth.uid()::text = owner);

CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'trade-images');
```

## 5. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 6. Using Image Storage in Your App

The `supabaseImageService.ts` provides these functions:

### Upload an image:

```typescript
import { uploadTradeImage } from "../services/supabaseImageService";

const imageUrl = await uploadTradeImage(tradeId, fileObject);
```

### Get all images for a trade:

```typescript
import { getTradeImages } from "../services/supabaseImageService";

const images = await getTradeImages(tradeId);
```

### Delete an image:

```typescript
import { deleteTradeImage } from "../services/supabaseImageService";

await deleteTradeImage(imageUrl);
```

### Update an image:

```typescript
import { updateTradeImage } from "../services/supabaseImageService";

const newImageUrl = await updateTradeImage(tradeId, oldImageUrl, newFile);
```

## Troubleshooting

### Images not uploading?

- Check that environment variables are correctly set
- Ensure the bucket name is `trade-images`
- Verify the bucket is public or has proper policies

### Getting CORS errors?

- Go to your Supabase project Settings > CORS
- Add your application's domain to the allowed origins

### Can't see images?

- Check that the bucket is public or policies allow public read access
- Verify the image file exists in the bucket (check Storage tab)

## Storage Limits

Supabase offers:

- **Free tier**: 1 GB storage per project
- **Pro tier**: Starting at $25/month with 100 GB

For pricing details, visit: https://supabase.com/pricing
