'use client';

import { useState, useEffect, useCallback } from 'react';
import { Language, BlogType, BlogFormData } from '@/types';
import { FiUpload, FiTrash2, FiPlus, FiChevronUp, FiChevronDown, FiAlignLeft, FiType, FiMessageSquare, FiList, FiImage } from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const LANGUAGES: Language[] = ['ru', 'en', 'es', 'fr'];

const MONTHS = {
    ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
};

// Content block types (+ image)
type ContentBlock =
    | { text: string }
    | { title: string }
    | { quote: string }
    | { list: string[] }
    | { image: string; caption?: string } // NEW

const quillModules = {
    toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link'],
        ['clean']
    ],
};

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
    const [mainImages, setMainImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const [contentBlocks, setContentBlocks] = useState<Record<Language, ContentBlock[]>>({
        ru: [],
        en: [],
        es: [],
        fr: [],
    });

    const [formData, setFormData] = useState<BlogFormData>({
        type: 'article',
        blogs: {
            ru: { title: '', date: '', content: '', source: '' },
            en: { title: '', date: '', content: '', source: '' },
            es: { title: '', date: '', content: '', source: '' },
            fr: { title: '', date: '', content: '', source: '' },
        },
        images: {
            ru: [],
            en: [],
            es: [],
            fr: [],
        }
    });

    useEffect(() => {
        // FIXED: Calendar date initialization
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to midnight
        setSelectedDate(today);
        updateAllDates(today);

        // Load initial data if editing
        if (initialData) {
            setType(initialData.type || 'article');
            setFormData(initialData);

            // Load images
            if (initialData.images?.ru) {
                setMainImages(initialData.images.ru);
            }

            // Load content blocks
            if (initialData.blogs?.ru?.content) {
                try {
                    const parsedRu = JSON.parse(initialData.blogs.ru.content);
                    const parsedEn = initialData.blogs.en?.content ? JSON.parse(initialData.blogs.en.content) : [];
                    const parsedEs = initialData.blogs.es?.content ? JSON.parse(initialData.blogs.es.content) : [];
                    const parsedFr = initialData.blogs.fr?.content ? JSON.parse(initialData.blogs.fr.content) : [];

                    setContentBlocks({
                        ru: Array.isArray(parsedRu) ? parsedRu : [],
                        en: Array.isArray(parsedEn) ? parsedEn : [],
                        es: Array.isArray(parsedEs) ? parsedEs : [],
                        fr: Array.isArray(parsedFr) ? parsedFr : [],
                    });
                } catch (e) {
                    console.error('Error parsing content blocks:', e);
                }
            }

            // Load date
            if (initialData.blogs?.ru?.date) {
                // Parse date from formatted string (e.g., "13 февраля 2026")
                // For simplicity, use today's date in edit mode
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setSelectedDate(today);
            }
        }
    }, [initialData]);

    const formatDate = (date: Date, lang: Language): string => {
        const day = date.getDate();
        const month = MONTHS[lang][date.getMonth()];
        const year = date.getFullYear();

        switch (lang) {
            case 'en':
                return `${day} ${month} ${year}`;
            case 'es':
                return `${day} de ${month} de ${year}`;
            default:
                return `${day} ${month} ${year}`;
        }
    };

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
        // FIXED: Properly parse date without timezone issues
        const inputDate = e.target.value; // YYYY-MM-DD
        const [year, month, day] = inputDate.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed
        date.setHours(0, 0, 0, 0);

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

    // Upload helper function
    const uploadImageFile = async (file: File): Promise<string | null> => {
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('image', file);

            const response = await api.post('/upload/single', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                return response.data.data.url;
            }
            return null;
        } catch (error) {
            console.error('Upload error:', error);
            return null;
        }
    };

    // Main image upload
    const handleMainImageUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploading(true);

        try {
            const uploadedUrls: string[] = [];

            for (const file of Array.from(files)) {
                const url = await uploadImageFile(file);
                if (url) uploadedUrls.push(url);
            }

            const newImages = [...mainImages, ...uploadedUrls];
            setMainImages(newImages);

            setFormData((prev) => {
                const updatedImages: any = {};
                LANGUAGES.forEach((lang) => {
                    updatedImages[lang] = newImages;
                });
                return { ...prev, images: updatedImages };
            });

            toast.success(`${uploadedUrls.length} ta rasm yuklandi!`);
        } catch (error: any) {
            toast.error('Rasm yuklashda xatolik');
        } finally {
            setUploading(false);
        }
    };

    // Drag & drop handlers
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleMainImageUpload(e.dataTransfer.files);
        }
    }, [mainImages]);

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

        toast.success('Rasm o\'chirildi');
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

    // Content blocks
    const addContentBlock = (blockType: 'text' | 'title' | 'quote' | 'list' | 'image') => {
        const addToOthers = window.confirm(
            `Boshqa tillarga (${LANGUAGES.filter(l => l !== currentLang).join(', ')}) ham "${blockType}" blokini qo'shamizmi?\n\n✅ OK = Ha, barcha tillarga\n❌ Cancel = Yo'q, faqat ${currentLang} ga`
        );

        setContentBlocks((prev) => {
            const newBlocks = { ...prev };

            const createEmptyBlock = (): ContentBlock => {
                switch (blockType) {
                    case 'text': return { text: '' };
                    case 'title': return { title: '' };
                    case 'quote': return { quote: '' };
                    case 'list': return { list: [''] };
                    case 'image': return { image: '', caption: '' };
                }
            };

            newBlocks[currentLang] = [...newBlocks[currentLang], createEmptyBlock()];

            if (addToOthers) {
                LANGUAGES.forEach((lang) => {
                    if (lang !== currentLang) {
                        newBlocks[lang] = [...newBlocks[lang], createEmptyBlock()];
                    }
                });
                toast.success(`Blok barcha tillarga qo'shildi!`);
            } else {
                toast.success(`Blok faqat ${currentLang} ga qo'shildi`);
            }

            return newBlocks;
        });
    };

    const updateContentBlock = (index: number, value: any) => {
        setContentBlocks((prev) => {
            const newBlocks = { ...prev };
            const blocks = [...newBlocks[currentLang]];
            const block = blocks[index];

            if ('text' in block) {
                blocks[index] = { text: value };
            } else if ('title' in block) {
                blocks[index] = { title: value };
            } else if ('quote' in block) {
                blocks[index] = { quote: value };
            } else if ('list' in block) {
                blocks[index] = { list: value };
            } else if ('image' in block) {
                blocks[index] = { ...block, ...value };
            }

            newBlocks[currentLang] = blocks;
            return newBlocks;
        });
    };

    const uploadBlockImage = async (index: number, file: File) => {
        setUploading(true);
        const url = await uploadImageFile(file);
        setUploading(false);

        if (url) {
            updateContentBlock(index, { image: url });
            toast.success('Rasm yuklandi!');
        } else {
            toast.error('Rasm yuklashda xatolik');
        }
    };

    const deleteContentBlock = (index: number) => {
        if (!window.confirm('Bu blokni o\'chirishni xohlaysizmi?')) return;

        setContentBlocks((prev) => {
            const newBlocks = { ...prev };
            newBlocks[currentLang] = newBlocks[currentLang].filter((_, i) => i !== index);
            return newBlocks;
        });

        toast.success('Blok o\'chirildi');
    };

    const moveContentBlock = (index: number, direction: 'up' | 'down') => {
        setContentBlocks((prev) => {
            const newBlocks = { ...prev };
            const blocks = [...newBlocks[currentLang]];
            const newIndex = direction === 'up' ? index - 1 : index + 1;

            if (newIndex < 0 || newIndex >= blocks.length) return prev;

            [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
            newBlocks[currentLang] = blocks;
            return newBlocks;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.blogs[currentLang].title) {
            toast.error('Title kiritish majburiy!');
            return;
        }

        setSubmitting(true);

        try {
            const dataToSubmit = {
                ...formData,
                type,
            };

            LANGUAGES.forEach((lang) => {
                dataToSubmit.blogs[lang] = {
                    ...dataToSubmit.blogs[lang],
                    content: JSON.stringify(contentBlocks[lang]),
                };
            });

            await onSubmit(dataToSubmit);
        } catch (error) {
            toast.error('Xatolik yuz berdi');
        } finally {
            setSubmitting(false);
        }
    };

    const currentBlocks = contentBlocks[currentLang];

    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${process.env.NEXT_PUBLIC_UPLOADS_URL || 'http://localhost:5000'}${cleanUrl}`;
    };

    // Format date for input (YYYY-MM-DD)
    const formatDateForInput = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">
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
                                className="mr-2 w-4 h-4 text-indigo-600"
                            />
                            <span className="capitalize text-gray-900 dark:text-gray-100">
                {t === 'interview' ? 'Intervyu' : t === 'article' ? 'Maqola' : 'Fakt'}
              </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Date - FIXED */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">
                    Sana
                </label>
                <input
                    type="date"
                    value={formatDateForInput(selectedDate)}
                    onChange={handleDateChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {LANGUAGES.map((lang) => (
                        <div key={lang}>
                            <span className="font-semibold uppercase">{lang}:</span> {formData.blogs[lang].date}
                        </div>
                    ))}
                </div>
            </div>

            {/* Images with Drag & Drop */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                            Main Images ({mainImages.length})
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Drag & drop yoki click qiling
                        </p>
                    </div>
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleMainImageUpload(e.target.files)}
                            className="hidden"
                            disabled={uploading}
                        />
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
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

                {/* Drag & Drop Zone */}
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                        dragActive
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-300 dark:border-gray-600'
                    }`}
                >
                    <FiUpload className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                        Rasmlarni bu yerga sudrab tashlang
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        yoki yuqoridagi "Upload" tugmasini bosing
                    </p>
                </div>

                {/* Image Grid */}
                {mainImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                        {mainImages.map((url, index) => (
                            <div key={index} className="relative group border dark:border-gray-700 rounded-lg overflow-hidden">
                                <div className="aspect-square relative bg-gray-100 dark:bg-gray-700">
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
                )}
            </div>

            {/* Language Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="flex border-b dark:border-gray-700">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang}
                            type="button"
                            onClick={() => setCurrentLang(lang)}
                            className={`flex-1 px-4 py-3 font-medium uppercase transition ${
                                currentLang === lang
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>

                <div className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={formData.blogs[currentLang].title}
                            onChange={(e) => updateBlog(currentLang, 'title', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                            required
                            placeholder="Blog sarlavhasini kiriting..."
                        />
                    </div>

                    {/* Source */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                            Source (manba)
                        </label>
                        <input
                            type="text"
                            value={formData.blogs[currentLang].source || ''}
                            onChange={(e) => updateBlog(currentLang, 'source', e.target.value)}
                            placeholder="Reuters, BBC, CNN..."
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                        />
                    </div>

                    {/* Content Blocks */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Content Blocks ({currentBlocks.length})
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => addContentBlock('text')}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                                >
                                    <FiAlignLeft className="w-4 h-4" />
                                    <span>Text</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addContentBlock('title')}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
                                >
                                    <FiType className="w-4 h-4" />
                                    <span>Title</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addContentBlock('image')}
                                    className="px-3 py-1.5 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700 flex items-center gap-1"
                                >
                                    <FiImage className="w-4 h-4" />
                                    <span>Image</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addContentBlock('quote')}
                                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 flex items-center gap-1"
                                >
                                    <FiMessageSquare className="w-4 h-4" />
                                    <span>Quote</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addContentBlock('list')}
                                    className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 flex items-center gap-1"
                                >
                                    <FiList className="w-4 h-4" />
                                    <span>List</span>
                                </button>
                            </div>
                        </div>

                        {/* Blocks */}
                        <div className="space-y-4">
                            {currentBlocks.map((block, index) => {
                                const blockType = 'text' in block ? 'text' : 'title' in block ? 'title' : 'quote' in block ? 'quote' : 'list' in block ? 'list' : 'image';
                                const blockColors = {
                                    text: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
                                    title: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
                                    quote: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700',
                                    list: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
                                    image: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700',
                                };

                                return (
                                    <div
                                        key={`${currentLang}-block-${index}`}
                                        className={`p-4 border-2 rounded-lg ${blockColors[blockType]}`}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold uppercase text-gray-700 dark:text-gray-300">
                        {blockType}
                      </span>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => moveContentBlock(index, 'up')}
                                                    disabled={index === 0}
                                                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-30"
                                                >
                                                    <FiChevronUp className="w-5 h-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => moveContentBlock(index, 'down')}
                                                    disabled={index === currentBlocks.length - 1}
                                                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-30"
                                                >
                                                    <FiChevronDown className="w-5 h-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteContentBlock(index)}
                                                    className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-800"
                                                >
                                                    <FiTrash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Text */}
                                        {'text' in block && (
                                            <ReactQuill
                                                key={`quill-${currentLang}-${index}`}
                                                theme="snow"
                                                value={block.text}
                                                onChange={(value) => updateContentBlock(index, value)}
                                                modules={quillModules}
                                                className="bg-white dark:bg-gray-800 rounded"
                                                placeholder="Matn kiriting..."
                                            />
                                        )}

                                        {/* Title */}
                                        {'title' in block && (
                                            <input
                                                type="text"
                                                value={block.title}
                                                onChange={(e) => updateContentBlock(index, e.target.value)}
                                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 font-bold text-xl"
                                                placeholder="Sarlavha..."
                                            />
                                        )}

                                        {/* Image */}
                                        {'image' in block && (
                                            <div className="space-y-3">
                                                {block.image ? (
                                                    <div className="relative">
                                                        <Image
                                                            src={getImageUrl(block.image)}
                                                            alt="Block image"
                                                            width={400}
                                                            height={300}
                                                            className="rounded-lg w-full"
                                                            unoptimized
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => updateContentBlock(index, { image: '', caption: block.caption })}
                                                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="block cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                if (e.target.files?.[0]) {
                                                                    uploadBlockImage(index, e.target.files[0]);
                                                                }
                                                            }}
                                                            className="hidden"
                                                        />
                                                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-pink-500 transition">
                                                            <FiImage className="mx-auto w-12 h-12 text-gray-400 mb-2" />
                                                            <p className="text-gray-600 dark:text-gray-400">
                                                                Rasm yuklash uchun bosing
                                                            </p>
                                                        </div>
                                                    </label>
                                                )}
                                                <input
                                                    type="text"
                                                    value={block.caption || ''}
                                                    onChange={(e) => updateContentBlock(index, { image: block.image, caption: e.target.value })}
                                                    placeholder="Rasm uchun izoh (caption)..."
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 text-sm"
                                                />
                                            </div>
                                        )}

                                        {/* Quote */}
                                        {'quote' in block && (
                                            <textarea
                                                value={block.quote}
                                                onChange={(e) => updateContentBlock(index, e.target.value)}
                                                rows={3}
                                                className="w-full p-3 border-l-4 border-purple-500 dark:border-purple-400 bg-white dark:bg-gray-700 rounded dark:text-gray-100 italic"
                                                placeholder="Iqtibos matni..."
                                            />
                                        )}

                                        {/* List */}
                                        {'list' in block && (
                                            <div className="space-y-2">
                                                {block.list.map((item, itemIndex) => (
                                                    <div key={itemIndex} className="flex gap-2">
                            <span className="pt-2 text-gray-500 dark:text-gray-400 font-bold">
                              {itemIndex + 1}.
                            </span>
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(e) => {
                                                                const newList = [...block.list];
                                                                newList[itemIndex] = e.target.value;
                                                                updateContentBlock(index, newList);
                                                            }}
                                                            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                                                            placeholder={`Element ${itemIndex + 1}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newList = block.list.filter((_, i) => i !== itemIndex);
                                                                updateContentBlock(index, newList.length > 0 ? newList : ['']);
                                                            }}
                                                            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                            disabled={block.list.length === 1}
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newList = [...block.list, ''];
                                                        updateContentBlock(index, newList);
                                                    }}
                                                    className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1"
                                                >
                                                    <FiPlus className="w-4 h-4" />
                                                    <span>Element qo'shish</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {currentBlocks.length === 0 && (
                                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                                    <p className="text-gray-500 dark:text-gray-400 mb-3">
                                        Hali content block yo'q
                                    </p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500">
                                        Yuqoridagi tugmalardan birini bosib block qo'shing
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4 sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                    {submitting ? (
                        <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Saqlanmoqda...
            </span>
                    ) : (
                        submitLabel
                    )}
                </button>
            </div>
        </form>
    );
}