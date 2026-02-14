'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Blog } from '@/types';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function DashboardPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'interview' | 'article' | 'fact'>('all');
  const router = useRouter();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await api.get('/blogs/admin/all');
      setBlogs(response.data.data);
    } catch (error: any) {
      toast.error('Bloglarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const deleteBlog = async (id: number) => {
    if (!confirm('Blogni o\'chirishni tasdiqlaysizmi?')) return;

    try {
      await api.delete(`/blogs/${id}`);
      toast.success('Blog o\'chirildi');
      fetchBlogs();
    } catch (error: any) {
      toast.error('O\'chirishda xatolik');
    }
  };

  const filteredBlogs = blogs.filter((blog) =>
    filter === 'all' ? true : blog.type === filter
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Blogs</h1>
          <p className="text-gray-600 mt-1">Barcha bloglarni boshqarish</p>
        </div>
        <Link
          href="/blogs/new"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition"
        >
          <FiPlus size={20} />
          <span>New Blog</span>
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'interview', 'article', 'fact'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as any)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === type
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Blogs Grid */}
      {filteredBlogs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">Blog topilmadi</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredBlogs.map((blog) => (
            <div
              key={blog.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        blog.type === 'interview'
                          ? 'bg-blue-100 text-blue-700'
                          : blog.type === 'article'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {blog.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      ID: {blog.id}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {blog.translations?.ru?.title || 'No title'}
                  </h3>

                  <p className="text-sm text-gray-600">
                    {blog.translations?.ru?.date}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.keys(blog.translations || {}).map((lang) => (
                      <span
                        key={lang}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs uppercase"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/blogs/${blog.id}/edit`}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  >
                    <FiEdit2 size={20} />
                  </Link>
                  <button
                    onClick={() => deleteBlog(blog.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <FiTrash2 size={20} />
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
