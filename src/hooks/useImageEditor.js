import { useState, useCallback } from 'react';
import { getCroppedImg } from '@/lib/canvasUtils';
import { supabase } from '@/lib/customSupabaseClient';

export const useImageEditor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const readFile = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result));
      reader.readAsDataURL(file);
    });
  }, []);

  const generateOutput = useCallback(async (imageSrc, croppedAreaPixels, rotation = 0) => {
    try {
      setLoading(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      setLoading(false);
      return croppedBlob;
    } catch (e) {
      setLoading(false);
      setError(e);
      return null;
    }
  }, []);

  const uploadToStorage = useCallback(async (blob, bucketName, path) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(path, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    readFile,
    generateOutput,
    uploadToStorage,
    loading,
    error,
  };
};