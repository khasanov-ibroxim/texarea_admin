'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { UploadedImage } from '@/types';
import toast from 'react-hot-toast';
import { FiUpload, FiTrash2, FiCopy, FiImage } from 'react-icons/fi';
import Image from 'next/image';

export default function ImagesPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await api.get('/upload/list');
      setImages(response.data.data || []);
    } catch (error) {
      toast.error('Rasmlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();

    if (files.length === 1) {
      formData.append('image', files[0]);
      try {
        await api.post('/upload/single', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Rasm yuklandi!');
        fetchImages();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Yuklashda xatolik');
      }
    } else {
      Array.from(files).forEach((file) => {
        formData.append('images', file);
      });
      try {
        await api.post('/upload/multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(`${files.length} ta rasm yuklandi!`);
        fetchImages();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Yuklashda xatolik');
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deleteImage = async (filename: string) => {
    if (!confirm('Rasmni o\'chirishni tasdiqlaysizmi?')) return;

    try {
      await api.delete(`/upload/${filename}`);
      toast.success('Rasm o\'chirildi');
      fetchImages();
    } catch (error) {
      toast.error('O\'chirishda xatolik');
    }
  };

  const copyUrl = (url: string) => {
    const fullUrl = `${process.env.NEXT_PUBLIC_UPLOADS_URL}${url.replace('/uploads', '')}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('URL nusxalandi!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Image Gallery</h1>
          <p className="text-gray-600 mt-1">{images.length} ta rasm</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50"
          >
            <FiUpload size={20} />
            <span>{uploading ? 'Yuklanmoqda...' : 'Upload Images'}</span>
          </button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg">
          <FiImage size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-4">Hali rasmlar yo'q</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            Birinchi rasmni yuklang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image) => (
            <div
              key={image.filename}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden group"
            >
              <div className="aspect-square relative bg-gray-100">
                <Image
                  src={`${process.env.NEXT_PUBLIC_UPLOADS_URL}/${image.filename}`}
                  alt={image.filename}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 truncate mb-2">
                  {image.filename}
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  {(image.size / 1024).toFixed(1)} KB
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyUrl(image.url)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition text-sm"
                  >
                    <FiCopy size={14} />
                    <span>Copy URL</span>
                  </button>
                  <button
                    onClick={() => deleteImage(image.filename)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
