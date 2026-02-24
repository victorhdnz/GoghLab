'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Video,
  Palette,
  Scissors,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { VideoUploader } from '@/components/ui/VideoUploader'
import { ImageUploader } from '@/components/ui/ImageUploader'

interface Course {
  id: string
  title: string
  description: string | null
  thumbnail_url?: string | null
  course_type?: 'canva' | 'capcut' | 'strategy' | 'other'
  order?: number
  order_position?: number
  slug?: string
  created_at: string
  updated_at: string
  lessons?: Lesson[]
}

interface Lesson {
  id: string
  course_id: string
  title: string
  description: string | null
  video_url: string | null
  order?: number
  order_position?: number
  created_at?: string
}

export default function CursosPage() {
  const supabase = createClient()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [showLessonForm, setShowLessonForm] = useState(false)
  
  // Form states
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    course_type: 'canva' as 'canva' | 'capcut' | 'strategy' | 'other'
  })
  
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    video_url: ''
  })

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    setLoading(true)
    try {
      const { data, error } = await (supabase as any)
        .from('courses')
        .select(`
          *,
          lessons:course_lessons(*)
        `)
        .order('course_type', { ascending: true, nullsLast: true })
        .order('order_position', { ascending: true, nullsLast: true })

      if (error) throw error
      
      // Ordenar lessons dentro de cada curso
      const coursesWithOrderedLessons = (data || []).map((course: Course) => ({
        ...course,
        lessons: (course.lessons || []).sort((a: Lesson, b: Lesson) => (a.order || a.order_position || 0) - (b.order || b.order_position || 0))
      }))
      
      setCourses(coursesWithOrderedLessons)
    } catch (error: any) {
      console.error('Erro ao carregar cursos:', error)
      toast.error('Erro ao carregar cursos')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async () => {
    try {
      if (!courseForm.title.trim()) {
        toast.error('O título do curso é obrigatório')
        return
      }

      // Gerar slug único
      const baseSlug = courseForm.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      let slug = baseSlug
      let slugCounter = 1
      
      // Verificar se slug já existe
      while (true) {
        const { data: existing } = await (supabase as any)
          .from('courses')
          .select('id')
          .eq('slug', slug)
          .maybeSingle()
        
        if (!existing) break
        slug = `${baseSlug}-${slugCounter}`
        slugCounter++
      }

      // Pegar o próximo order
      const maxOrder = courses
        .filter(c => c.course_type === courseForm.course_type)
        .reduce((max, c) => Math.max(max, c.order || c.order_position || 0), 0)

      // Preparar dados do curso
      const courseData: any = {
        title: courseForm.title.trim(),
        description: courseForm.description?.trim() || null,
        thumbnail_url: courseForm.thumbnail_url?.trim() || null,
        slug: slug,
        course_type: courseForm.course_type,
        order_position: maxOrder + 1,
        is_published: false, // Começar como não publicado
        is_featured: false,
        plan_required: 'all', // Padrão: todos podem acessar
        lessons_count: 0,
        duration_hours: 0,
        instructor_name: 'Gogh Lab',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error } = await (supabase as any)
        .from('courses')
        .insert(courseData)

      if (error) {
        console.error('Erro detalhado ao criar curso:', error)
        throw error
      }

      toast.success('Curso criado com sucesso!')
      setShowCourseForm(false)
      setCourseForm({ title: '', description: '', thumbnail_url: '', course_type: 'canva' })
      await loadCourses()
    } catch (error: any) {
      console.error('Erro ao criar curso:', error)
      toast.error(error.message || 'Erro ao criar curso. Verifique os campos obrigatórios.')
    }
  }

  const handleUpdateCourse = async () => {
    if (!editingCourse) return

    try {
      const { error } = await (supabase as any)
        .from('courses')
        .update(courseForm)
        .eq('id', editingCourse.id)

      if (error) throw error

      toast.success('Curso atualizado com sucesso!')
      setEditingCourse(null)
      setShowCourseForm(false)
      setCourseForm({ title: '', description: '', thumbnail_url: '', course_type: 'canva' })
      await loadCourses()
    } catch (error: any) {
      console.error('Erro ao atualizar curso:', error)
      toast.error('Erro ao atualizar curso')
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Tem certeza que deseja deletar este curso? Todas as aulas serão deletadas.')) return

    try {
      const { error } = await (supabase as any)
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error

      toast.success('Curso deletado com sucesso!')
      await loadCourses()
    } catch (error: any) {
      console.error('Erro ao deletar curso:', error)
      toast.error('Erro ao deletar curso')
    }
  }

  const handleCreateLesson = async () => {
    if (!selectedCourse) return

    try {
      const maxOrder = (selectedCourse.lessons || []).reduce((max, l) => Math.max(max, l.order_position || l.order || 0), 0)

      const { error } = await (supabase as any)
        .from('course_lessons')
        .insert({
          ...lessonForm,
          course_id: selectedCourse.id,
          order_position: maxOrder + 1
        })

      if (error) throw error

      toast.success('Aula criada com sucesso!')
      setShowLessonForm(false)
      setLessonForm({ title: '', description: '', video_url: '' })
      await loadCourses()
      if (selectedCourse) {
        const updated = courses.find(c => c.id === selectedCourse.id)
        if (updated) setSelectedCourse(updated)
      }
    } catch (error: any) {
      console.error('Erro ao criar aula:', error)
      toast.error('Erro ao criar aula')
    }
  }

  const handleUpdateLesson = async () => {
    if (!editingLesson) return

    try {
      const { error } = await (supabase as any)
        .from('course_lessons')
        .update(lessonForm)
        .eq('id', editingLesson.id)

      if (error) throw error

      toast.success('Aula atualizada com sucesso!')
      setEditingLesson(null)
      setShowLessonForm(false)
      setLessonForm({ title: '', description: '', video_url: '' })
      await loadCourses()
      if (selectedCourse) {
        const updated = courses.find(c => c.id === selectedCourse.id)
        if (updated) setSelectedCourse(updated)
      }
    } catch (error: any) {
      console.error('Erro ao atualizar aula:', error)
      toast.error('Erro ao atualizar aula')
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta aula?')) return

    try {
      const { error } = await (supabase as any)
        .from('course_lessons')
        .delete()
        .eq('id', lessonId)

      if (error) throw error

      toast.success('Aula deletada com sucesso!')
      await loadCourses()
      if (selectedCourse) {
        const updated = courses.find(c => c.id === selectedCourse.id)
        if (updated) setSelectedCourse(updated)
      }
    } catch (error: any) {
      console.error('Erro ao deletar aula:', error)
      toast.error('Erro ao deletar aula')
    }
  }

  const handleReorderLesson = async (lessonId: string, direction: 'up' | 'down') => {
    if (!selectedCourse) return

    const lessons = [...(selectedCourse.lessons || [])].sort((a, b) => (a.order || a.order_position || 0) - (b.order || b.order_position || 0))
    const index = lessons.findIndex(l => l.id === lessonId)
    
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === lessons.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const [moved] = lessons.splice(index, 1)
    lessons.splice(newIndex, 0, moved)

    // Atualizar orders
    try {
      for (let i = 0; i < lessons.length; i++) {
        await (supabase as any)
          .from('course_lessons')
          .update({ order_position: i + 1 })
          .eq('id', lessons[i].id)
      }

      toast.success('Ordem atualizada!')
      await loadCourses()
      if (selectedCourse) {
        const updated = courses.find(c => c.id === selectedCourse.id)
        if (updated) setSelectedCourse(updated)
      }
    } catch (error: any) {
      console.error('Erro ao reordenar:', error)
      toast.error('Erro ao reordenar aulas')
    }
  }

  const openCourseForm = (course?: Course) => {
    if (course) {
      setEditingCourse(course)
      // Garantir que course_type seja um tipo permitido
      const validCourseType = (
        course.course_type === 'canva'
        || course.course_type === 'capcut'
        || course.course_type === 'strategy'
        || course.course_type === 'other'
      )
        ? course.course_type 
        : 'canva'
      setCourseForm({
        title: course.title,
        description: course.description || '',
        thumbnail_url: course.thumbnail_url || '',
        course_type: validCourseType
      })
    } else {
      setEditingCourse(null)
      setCourseForm({ title: '', description: '', thumbnail_url: '', course_type: 'canva' })
    }
    setShowCourseForm(true)
  }

  const openLessonForm = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson)
      setLessonForm({
        title: lesson.title,
        description: lesson.description || '',
        video_url: lesson.video_url || ''
      })
    } else {
      setEditingLesson(null)
      setLessonForm({ title: '', description: '', video_url: '' })
    }
    setShowLessonForm(true)
  }

  const courseGroups = [
    {
      key: 'canva',
      title: 'Cursos de Canva',
      icon: Palette,
      iconClassName: 'text-purple-600',
      items: courses.filter(c => c.course_type === 'canva' || (!c.course_type && c.title?.toLowerCase().includes('canva')))
    },
    {
      key: 'capcut',
      title: 'Cursos de CapCut',
      icon: Scissors,
      iconClassName: 'text-emerald-600',
      items: courses.filter(c => c.course_type === 'capcut' || (!c.course_type && c.title?.toLowerCase().includes('capcut')))
    },
    {
      key: 'strategy',
      title: 'Cursos de Estratégia',
      icon: BookOpen,
      iconClassName: 'text-amber-600',
      items: courses.filter(c => c.course_type === 'strategy')
    },
    {
      key: 'other',
      title: 'Outros Cursos',
      icon: Video,
      iconClassName: 'text-slate-600',
      items: courses.filter(c => c.course_type === 'other')
    }
  ]

  const hasAnyCourse = courseGroups.some(group => group.items.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gerenciar Cursos
              </h1>
              <p className="text-gray-600">
                Crie novos cursos, personalize o card com imagem e gerencie as aulas de cada curso.
              </p>
            </div>
            <button
              onClick={() => openCourseForm()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Curso
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <LumaSpin size="default" className="mx-auto mb-4" />
            <p className="text-gray-500">Carregando cursos...</p>
          </div>
        ) : hasAnyCourse ? (
          <div className="space-y-8">
            {courseGroups.map((group) => {
              if (group.items.length === 0) return null
              const GroupIcon = group.icon
              return (
                <div key={group.key}>
                  <div className="flex items-center gap-2 mb-4">
                    <GroupIcon className={`w-5 h-5 ${group.iconClassName}`} />
                    <h2 className="text-xl font-bold text-gray-900">{group.title}</h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {group.items.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        onEdit={() => openCourseForm(course)}
                        onDelete={() => handleDeleteCourse(course.id)}
                        onSelect={() => setSelectedCourse(course)}
                        isSelected={selectedCourse?.id === course.id}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum curso cadastrado</h3>
            <p className="text-gray-500 mb-4">Clique em "Novo Curso" para criar seu primeiro card.</p>
            <button
              onClick={() => openCourseForm()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Curso
            </button>
          </div>
        )}

        {/* Selected Course Details */}
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedCourse.title}</h3>
                <p className="text-gray-600 mt-1">{selectedCourse.description}</p>
              </div>
              <button
                onClick={() => openLessonForm()}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Aula
              </button>
            </div>

            <div className="space-y-3">
              {selectedCourse.lessons && selectedCourse.lessons.length > 0 ? (
                selectedCourse.lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleReorderLesson(lesson.id, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorderLesson(lesson.id, 'down')}
                        disabled={index === selectedCourse.lessons!.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Video className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{lesson.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openLessonForm(lesson)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma aula criada ainda. Clique em "Nova Aula" para começar.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Course Form Modal */}
        {showCourseForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold mb-4">
                {editingCourse ? 'Editar Curso' : 'Novo Curso'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título do Curso
                  </label>
                  <input
                    type="text"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagem do Card (ícone/capa)
                  </label>
                  <ImageUploader
                    value={courseForm.thumbnail_url}
                    onChange={(url) => setCourseForm({ ...courseForm, thumbnail_url: url })}
                    placeholder="Clique para enviar a imagem do curso"
                    recommendedDimensions="Quadrado 512x512px (ou maior), fundo transparente opcional"
                    cropType="square"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Curso
                  </label>
                  <select
                    value={courseForm.course_type}
                    onChange={(e) => setCourseForm({ ...courseForm, course_type: e.target.value as 'canva' | 'capcut' | 'strategy' | 'other' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="canva">Canva</option>
                    <option value="capcut">CapCut</option>
                    <option value="strategy">Estratégia</option>
                    <option value="other">Outros</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowCourseForm(false)
                      setEditingCourse(null)
                      setCourseForm({ title: '', description: '', thumbnail_url: '', course_type: 'canva' })
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingCourse ? handleUpdateCourse : handleCreateCourse}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    {editingCourse ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Lesson Form Modal */}
        {showLessonForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold mb-4">
                {editingLesson ? 'Editar Aula' : 'Nova Aula'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título da Aula
                  </label>
                  <input
                    type="text"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vídeo da Aula
                  </label>
                  <VideoUploader
                    value={lessonForm.video_url || ''}
                    onChange={(url) => setLessonForm({ ...lessonForm, video_url: url })}
                    placeholder="Clique para fazer upload do vídeo da aula"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Faça upload do vídeo da aula ou cole a URL (YouTube, Vimeo, etc.)
                  </p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowLessonForm(false)
                      setEditingLesson(null)
                      setLessonForm({ title: '', description: '', video_url: '' })
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingLesson ? handleUpdateLesson : handleCreateLesson}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    {editingLesson ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

function CourseCard({ 
  course, 
  onEdit, 
  onDelete, 
  onSelect, 
  isSelected 
}: { 
  course: Course
  onEdit: () => void
  onDelete: () => void
  onSelect: () => void
  isSelected: boolean
}) {
  return (
    <div
      className={`
        group relative p-4 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer
        border bg-white hover:-translate-y-0.5
        ${isSelected
          ? 'border-blue-400 shadow-[0_6px_20px_rgba(59,130,246,0.18)]'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]'
        }
      `}
      onClick={onSelect}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[length:4px_4px]" />
      </div>

      <div className="relative flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg border border-gray-200 bg-black/5 flex items-center justify-center overflow-hidden flex-shrink-0">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="w-5 h-5 text-gray-600" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            aria-label="Editar curso"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            aria-label="Excluir curso"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative mb-2">
        <h3 className="font-bold text-gray-900">{course.title}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{course.description}</p>
      </div>

      <div className="relative flex items-center justify-between text-sm text-gray-500 mt-3">
        <span className="flex items-center gap-1">
          <Video className="w-4 h-4" />
          {course.lessons?.length || 0} aulas
        </span>
        <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
          Abrir curso →
        </span>
      </div>
    </div>
  )
}

