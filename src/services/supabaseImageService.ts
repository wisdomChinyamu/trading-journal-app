import { supabase } from '../config/supabase';

const BUCKET_NAME = 'trade-images';

/**
 * Upload an image file to Supabase storage
 * @param tradeId - The ID of the trade to associate the image with
 * @param file - The image file to upload
 * @returns The public URL of the uploaded image or null if upload fails
 */
export async function uploadTradeImage(
  tradeId: string,
  file: File
): Promise<string | null> {
  try {
    // Check if Supabase is configured
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured. Image upload skipped.');
      return null;
    }

    if (!file) {
      throw new Error('No file provided');
    }

    // Create a unique filename: tradeId/timestamp_originalname
    const timestamp = Date.now();
    const fileName = `${tradeId}/${timestamp}_${file.name}`;

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    // Get public URL of uploaded image
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload trade image:', error);
    return null;
  }
}

/**
 * Delete an image from Supabase storage
 * @param imageUrl - The public URL or file path of the image to delete
 * @returns True if deletion was successful, false otherwise
 */
export async function deleteTradeImage(imageUrl: string): Promise<boolean> {
  try {
    // Check if Supabase is configured
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured. Image deletion skipped.');
      return false;
    }

    // Extract the file path from the URL if it's a full URL
    let filePath = imageUrl;
    if (imageUrl.includes('/storage/v1/object/public/')) {
      filePath = imageUrl.split('/storage/v1/object/public/trade-images/')[1];
    }

    const { error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete trade image:', error);
    return false;
  }
}

/**
 * Get images for a specific trade from Supabase storage
 * @param tradeId - The ID of the trade to get images for
 * @returns Array of image URLs or empty array if retrieval fails
 */
export async function getTradeImages(tradeId: string): Promise<string[]> {
  try {
    // Check if Supabase is configured
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured. Getting images skipped.');
      return [];
    }

    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(tradeId);

    if (error) {
      console.error('Error listing images:', error);
      return [];
    }

    // Map to public URLs
    return data.map((file) => {
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`${tradeId}/${file.name}`);
      return publicUrl;
    });
  } catch (error) {
    console.error('Failed to get trade images:', error);
    return [];
  }
}

/**
 * Update an existing image in Supabase storage
 * @param oldImageUrl - The URL of the existing image to replace
 * @param tradeId - The ID of the trade the image belongs to
 * @param file - The new image file
 * @returns The public URL of the updated image or null if update fails
 */
export async function updateTradeImage(
  oldImageUrl: string,
  tradeId: string,
  file: File
): Promise<string | null> {
  try {
    // Check if Supabase is configured
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured. Image update skipped.');
      return null;
    }

    // First delete the old image
    await deleteTradeImage(oldImageUrl);

    // Then upload the new image
    return await uploadTradeImage(tradeId, file);
  } catch (error) {
    console.error('Failed to update trade image:', error);
    return null;
  }
}