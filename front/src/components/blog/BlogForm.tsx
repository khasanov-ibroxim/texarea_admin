'use client';

import { useState, useEffect } from 'react';
import { Language, BlogType, BlogFormData } from '@/types';
import { FiUpload, FiTrash2 } from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// React Quill ni dynamic import qilish (SSR muammosini hal qilish uchun)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const LANGUAGES: Language[] = ['ru', 'en', 'es', 'fr'];

// Oylar
const MONTHS = {
    ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
};

// Quill modules (toolbar configuration)
const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
    ],
};

const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'blockquote', 'code-block',
    'align',
    'link', 'image'
];

interface Props {
    initialData?: BlogFormData;
    onSubmit: (data: BlogFormData) => Promise<void>;
    submitLabel: string;
}

export default function BlogForm({ initialData, onSubmit, submitLabel }: Props) {
    const [currentLang, setCurrentLang] = useState<Language>('ru');
    const [type, setType] = useState<BlogType>(initialData?.type || 'article');
    const [submitting, setSubmitting] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Main images - barcha tillar uchun bir xil
    const [mainImages, setMainImages] = useState<string[]>(initialData?.images?.ru || []);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState<BlogFormData>(
        initialData || {
            type: 'article',
            blogs: {
                ru: { title: '', date: '', content: '' },
                en: { title: '', date: '', content: '' },
                es: { title: '', date: '', content: '' },
                fr: { title: '', date: '', content: '' },
            },
            images: {
                ru: [],
                en: [],
                es: [],
                fr: [],
            }
        }
    );

    // Initial date va images
    useEffect(() => {
        const today = new Date();
        setSelectedDate(today);
        updateAllDates(today);

        // Agar initialData bor bo'lsa, main images ni o'rnatish
        if (initialData?.images?.ru) {
            setMainImages(initialData.images.ru);
        }
    }, []);

    // Sanani formatlash
    const formatDate = (date: Date, lang: Language): string => {
        const day = date.getDate();
        const month = MONTHS[lang][date.getMonth()];
        const year = date.getFullYear();

        switch (lang) {
            case 'en':
                return `${day} ${month} ${year}`;
            case 'es':
                return `${day} de ${month} de ${year}`;
            default: // ru, fr
                return `${day} ${month} ${year}`;
        }
    };

    // Barcha tillarda sanani yangilash
    const updateAllDates = (date: Date) => {
        setFormData((prev) => {
            const updatedBlogs = { ...prev.blogs };
            LANGUAGES.forEach((lang) => {
                updatedBlogs[lang] = {
                    ...updatedBlogs[lang],
                    date: formatDate(date, lang),
                };
            });
            return { ...prev, blogs: updatedBlogs };
        });
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = new Date(e.target.value + 'T00:00:00');
        setSelectedDate(date);
        updateAllDates(date);
    };

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

    // Main rasm yuklash
    const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);

        try {
            const uploadedUrls: string[] = [];

            for (const file of Array.from(files)) {
                const formDataUpload = new FormData();
                formDataUpload.append('image', file);

                const response = await api.post('/upload/single', formDataUpload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                if (response.data.success) {
                    uploadedUrls.push(response.data.data.url);
                }
            }

            const newImages = [...mainImages, ...uploadedUrls];
            setMainImages(newImages);

            // Barcha tillarga bir xil
            setFormData((prev) => {
                const updatedImages: any = {};
                LANGUAGES.forEach((lang) => {
                    updatedImages[lang] = newImages;
                });
                return { ...prev, images: updatedImages };
            });

            toast.success(`${uploadedUrls.length} ta main image yuklandi!`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Rasm yuklashda xatolik');
        } finally {
            setUploading(false);
        }
    };

    const removeMainImage = (index: number) => {
        const newImages = mainImages.filter((_, i) => i !== index);
        setMainImages(newImages);

        setFormData((prev) => {
            const updatedImages: any = {};
            LANGUAGES.forEach((lang) => {
                updatedImages[lang] = newImages;
            });
            return { ...prev, images: updatedImages };
        });
    };

    const moveMainImage = (index: number, direction: 'up' | 'down') => {
        const newImages = [...mainImages];
        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= newImages.length) return;

        [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
        setMainImages(newImages);

        setFormData((prev) => {
            const updatedImages: any = {};
            LANGUAGES.forEach((lang) => {
                updatedImages[lang] = newImages;
            });
            return { ...prev, images: updatedImages };
        });
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

    // Rasm URL ni to'liq qilish
    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${process.env.NEXT_PUBLIC_UPLOADS_URL || 'http://localhost:5000'}${cleanUrl}`;
    };

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
                            <span className="capitalize">
                {t === 'interview' ? 'Interview (Intervyu)' : t === 'article' ? 'Article (Maqola)' : 'Fact (Qisqa fakt)'}
              </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Date Picker */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Sana (Barcha tillarda avtomatik formatlanadi)
                </label>
                <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={handleDateChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    {LANGUAGES.map((lang) => (
                        <div key={lang} className="text-gray-600">
                            <span className="font-semibold uppercase">{lang}:</span> {formData.blogs[lang].date}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Images */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Main Images ({mainImages.length}) - Barcha tillarda bir xil
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                            Bu rasmlar blog boshida ko'rsatiladi (birinchi rasm - asosiy)
                        </p>
                    </div>
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleMainImageUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            {uploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span>Yuklanmoqda...</span>
                                </>
                            ) : (
                                <>
                                    <FiUpload />
                                    <span>Upload</span>
                                </>
                            )}
                        </div>
                    </label>
                </div>

                {mainImages.length > 0 ? (
                    <div className="grid grid-cols-4 gap-4">
                        {mainImages.map((url, index) => (
                            <div key={index} className="relative group border rounded-lg overflow-hidden">
                                <div className="aspect-square relative bg-gray-100">
                                    <Image
                                        src={getImageUrl(url)}
                                        alt={`Main ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => moveMainImage(index, 'up')}
                                        disabled={index === 0}
                                        className="px-2 py-1 bg-white text-gray-900 rounded text-xs disabled:opacity-50"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveMainImage(index, 'down')}
                                        disabled={index === mainImages.length - 1}
                                        className="px-2 py-1 bg-white text-gray-900 rounded text-xs disabled:opacity-50"
                                    >
                                        ↓
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeMainImage(index)}
                                        className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                                <div className="p-2 text-xs text-center bg-gray-900/75 text-white">
                                    #{index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        Hali main image yo'q. Upload tugmasini bosing.
                    </div>
                )}
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
                                currentLang === lang ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>

                <div className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                        <input
                            type="text"
                            value={currentBlog.title}
                            onChange={(e) => updateBlog(currentLang, 'title', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Date Display */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date (avtomatik)</label>
                        <input
                            type="text"
                            value={currentBlog.date}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                        />
                    </div>

                    {/* Source */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Source (optional)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Bu blog manbasini ko'rsatadi. Masalan: "Reuters", "BBC", "CNN" va h.k.
                        </p>
                        <input
                            type="text"
                            value={currentBlog.source || ''}
                            onChange={(e) => updateBlog(currentLang, 'source', e.target.value)}
                            placeholder="Reuters"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    {/* Rich Text Editor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content (Rich Text Editor)
                        </label>
                        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                            <ReactQuill
                                theme="snow"
                                value={currentBlog.content}
                                onChange={(value) => updateBlog(currentLang, 'content', value)}
                                modules={quillModules}
                                formats={quillFormats}
                                className="min-h-[400px]"
                                placeholder="Blog matnini yozing..."
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Rich text editor: bold, italic, sarlavhalar, ro'yxatlar, link va rasmlar qo'shishingiz mumkin.
                        </p>
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