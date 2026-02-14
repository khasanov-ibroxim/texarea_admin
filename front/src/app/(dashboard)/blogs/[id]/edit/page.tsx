'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BlogForm from '@/components/blog/BlogForm';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { BlogFormData } from '@/types';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

export default function EditBlogPage({ params }: { params: { id: string } }) {
  const [initialData, setInitialData] = useState<BlogFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBlog();
  }, [params.id]);

  const fetchBlog = async () => {
    try {
      const response = await api.get('/blogs/admin/all');
      const blog = response.data.data.find((b: any) => b.id === parseInt(params.id));

      if (blog) {
        setInitialData({
          type: blog.type,
          blogs: blog.translations,
        });
      } else {
        toast.error('Blog topilmadi');
        router.push('/');
      }
    } catch (error) {
      toast.error('Blog yuklashda xatolik');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: BlogFormData) => {
    try {
      await api.put(`/blogs/${params.id}`, data);
      toast.success('Blog yangilandi!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!initialData) {
    return null;
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Edit Blog</h1>
        <p className="text-gray-600 mt-1">Blog ID: {params.id}</p>
      </div>

      <BlogForm
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Update Blog"
      />
    </div>
  );
}
