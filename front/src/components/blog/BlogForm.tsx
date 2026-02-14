'use client';

import { useState } from 'react';
import { Language, BlogType, ContentBlock, BlogFormData } from '@/types';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const LANGUAGES: Language[] = ['ru', 'en', 'es', 'fr'];

interface Props {
  initialData?: BlogFormData;
  onSubmit: (data: BlogFormData) => Promise<void>;
  submitLabel: string;
}

export default function BlogForm({ initialData, onSubmit, submitLabel }: Props) {
  const [currentLang, setCurrentLang] = useState<Language>('ru');
  const [type, setType] = useState<BlogType>(initialData?.type || 'article');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<BlogFormData>(
    initialData || {
      type: 'article',
      blogs: {
        ru: { title: '', date: '', content: [] },
        en: { title: '', date: '', content: [] },
        es: { title: '', date: '', content: [] },
        fr: { title: '', date: '', content: [] },
      },
    }
  );

  const updateBlog = (lang: Language, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      blogs: {
        ...prev.blogs,
        [lang]: {
          ...prev.blogs[lang],
          [field]: value,
        },
      },
    }));
  };

  const addContentBlock = (lang: Language, blockType: 'text' | 'title' | 'quote' | 'list') => {
    const newBlock: ContentBlock =
      blockType === 'list'
        ? { list: [''] }
        : { [blockType]: '' };

    updateBlog(lang, 'content', [...formData.blogs[lang].content, newBlock]);
  };

  const updateContentBlock = (lang: Language, index: number, value: any) => {
    const newContent = [...formData.blogs[lang].content];
    newContent[index] = value;
    updateBlog(lang, 'content', newContent);
  };

  const removeContentBlock = (lang: Language, index: number) => {
    const newContent = formData.blogs[lang].content.filter((_, i) => i !== index);
    updateBlog(lang, 'content', newContent);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ ...formData, type });
    } finally {
      setSubmitting(false);
    }
  };

  const currentBlog = formData.blogs[currentLang];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Blog Type
        </label>
        <div className="flex gap-4">
          {(['interview', 'article', 'fact'] as BlogType[]).map((t) => (
            <label key={t} className="flex items-center cursor-pointer">
              <input
                type="radio"
                value={t}
                checked={type === t}
                onChange={(e) => setType(e.target.value as BlogType)}
                className="mr-2"
              />
              <span className="capitalize">{t}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Language Tabs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex border-b">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setCurrentLang(lang)}
              className={`flex-1 px-4 py-3 font-medium uppercase transition ${
                currentLang === lang
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={currentBlog.title}
              onChange={(e) => updateBlog(currentLang, 'title', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="text"
              value={currentBlog.date}
              onChange={(e) => updateBlog(currentLang, 'date', e.target.value)}
              placeholder="13 февраля 2026"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source (optional)
            </label>
            <input
              type="text"
              value={currentBlog.source || ''}
              onChange={(e) => updateBlog(currentLang, 'source', e.target.value)}
              placeholder="Reuters"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Content Blocks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Content Blocks
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addContentBlock(currentLang, 'text')}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  + Text
                </button>
                <button
                  type="button"
                  onClick={() => addContentBlock(currentLang, 'title')}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  + Title
                </button>
                <button
                  type="button"
                  onClick={() => addContentBlock(currentLang, 'quote')}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                >
                  + Quote
                </button>
                <button
                  type="button"
                  onClick={() => addContentBlock(currentLang, 'list')}
                  className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                >
                  + List
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {currentBlog.content.map((block, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      {'text' in block
                        ? 'Text'
                        : 'title' in block
                        ? 'Title'
                        : 'quote' in block
                        ? 'Quote'
                        : 'List'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeContentBlock(currentLang, index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>

                  {'text' in block && (
                    <textarea
                      value={block.text}
                      onChange={(e) =>
                        updateContentBlock(currentLang, index, { text: e.target.value })
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter text..."
                    />
                  )}

                  {'title' in block && (
                    <input
                      type="text"
                      value={block.title}
                      onChange={(e) =>
                        updateContentBlock(currentLang, index, { title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter title..."
                    />
                  )}

                  {'quote' in block && (
                    <textarea
                      value={block.quote}
                      onChange={(e) =>
                        updateContentBlock(currentLang, index, { quote: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter quote..."
                    />
                  )}

                  {'list' in block && (
                    <div className="space-y-2">
                      {block.list?.map((item, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const newList = [...(block.list || [])];
                              newList[i] = e.target.value;
                              updateContentBlock(currentLang, index, { list: newList });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                            placeholder={`Item ${i + 1}...`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newList = block.list?.filter((_, idx) => idx !== i);
                              updateContentBlock(currentLang, index, { list: newList });
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newList = [...(block.list || []), ''];
                          updateContentBlock(currentLang, index, { list: newList });
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        + Add item
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {currentBlog.content.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No content blocks. Add some using the buttons above.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
