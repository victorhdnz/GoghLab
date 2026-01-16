'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Video,
  Play,
  Palette,
  Scissors,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Course {
  id: string
  title: string
  description: string | null
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
  const router = useRouter()
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
    course_type: 'canva' as 'canva' | 'capcut'
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
        .order('order', { ascending: true, nullsLast: true })

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
      // Pegar o próximo order
      const maxOrder = courses
        .filter(c => c.course_type === courseForm.course_type)
        .reduce((max, c) => Math.max(max, c.order || c.order_position || 0), 0)

      const { error } = await (supabase as any)
        .from('courses')
        .insert({
          ...courseForm,
          order_position: maxOrder + 1,
          order: maxOrder + 1,
          slug: courseForm.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          is_published: true
        })

      if (error) throw error

      toast.success('Curso criado com sucesso!')
      setShowCourseForm(false)
      setCourseForm({ title: '', description: '', course_type: 'canva' })
      await loadCourses()
    } catch (error: any) {
      console.error('Erro ao criar curso:', error)
      toast.error('Erro ao criar curso')
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
      setCourseForm({ title: '', description: '', course_type: 'canva' })
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
      setCourseForm({
        title: course.title,
        description: course.description || '',
        course_type: course.course_type || 'canva'
      })
    } else {
      setEditingCourse(null)
      setCourseForm({ title: '', description: '', course_type: 'canva' })
    }
    setShowCourseForm(true)
  }

  const openLessonForm = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson)
      setLessonForm({
        title: lesson.title,
        description: lesson.description || '',
        video_url: lesson.video_url
      })
    } else {
      setEditingLesson(null)
      setLessonForm({ title: '', description: '', video_url: '' })
    }
    setShowLessonForm(true)
  }

  const canvaCourses = courses.filter(c => c.course_type === 'canva' || (!c.course_type && c.title?.toLowerCase().includes('canva')))
  const capcutCourses = courses.filter(c => c.course_type === 'capcut' || (!c.course_type && c.title?.toLowerCase().includes('capcut')))

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
                Crie e gerencie cursos de Canva e CapCut com vídeos e sequência de aulas
              </p>
            </div>
            <button
              onClick={() => openCourseForm()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Curso
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Carregando cursos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Canva Courses */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Cursos de Canva</h2>
              </div>
              <div className="space-y-4">
                {canvaCourses.length === 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum curso de Canva criado</p>
                  </div>
                ) : (
                  canvaCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onEdit={() => openCourseForm(course)}
                      onDelete={() => handleDeleteCourse(course.id)}
                      onSelect={() => setSelectedCourse(course)}
                      isSelected={selectedCourse?.id === course.id}
                    />
                  ))
                )}
              </div>
            </div>

            {/* CapCut Courses */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scissors className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-900">Cursos de CapCut</h2>
              </div>
              <div className="space-y-4">
                {capcutCourses.length === 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum curso de CapCut criado</p>
                  </div>
                ) : (
                  capcutCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onEdit={() => openCourseForm(course)}
                      onDelete={() => handleDeleteCourse(course.id)}
                      onSelect={() => setSelectedCourse(course)}
                      isSelected={selectedCourse?.id === course.id}
                    />
                  ))
                )}
              </div>
            </div>
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
                        <span className="text-xs text-gray-500">#{lesson.order_position || lesson.order || 0}</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Curso
                  </label>
                  <select
                    value={courseForm.course_type}
                    onChange={(e) => setCourseForm({ ...courseForm, course_type: e.target.value as 'canva' | 'capcut' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="canva">Canva</option>
                    <option value="capcut">CapCut</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowCourseForm(false)
                      setEditingCourse(null)
                      setCourseForm({ title: '', description: '', course_type: 'canva' })
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
                    URL do Vídeo (YouTube, Vimeo, etc.)
                  </label>
                  <input
                    type="url"
                    value={lessonForm.video_url}
                    onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cole a URL completa do vídeo (YouTube, Vimeo, ou outro serviço)
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
        bg-white rounded-lg border-2 p-4 cursor-pointer transition-all
        ${isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}
      `}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{course.title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{course.description}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
        <span className="flex items-center gap-1">
          <Video className="w-4 h-4" />
          {course.lessons?.length || 0} aulas
        </span>
      </div>
    </div>
  )
}

