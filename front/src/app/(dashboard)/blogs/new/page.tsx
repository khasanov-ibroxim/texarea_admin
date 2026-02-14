'use client';

import { useRouter } from 'next/navigation';
import BlogForm from '@/components/blog/BlogForm';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { BlogFormData } from '@/types';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

export default function NewBlogPage() {
  const router = useRouter();

  const handleSubmit = async (data: BlogFormData) => {
    try {
      await api.post('/blogs', data);
      toast.success('Blog yaratildi!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <FiArrowLeft />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Blog</h1>
        <p className="text-gray-600 mt-1">Barcha tillarda blog yarating</p>
      </div>

      <BlogForm onSubmit={handleSubmit} submitLabel="Create Blog" />
    </div>
  );
}
