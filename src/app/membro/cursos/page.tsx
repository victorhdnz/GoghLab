'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Play, 
  Video,
  Palette,
  Scissors,
  CheckCircle2,
  Clock
} from 'lucide-react'
import Link from 'next/link'

interface Course {
  id: string
  title: string
  description: string | null
  course_type?: 'canva' | 'capcut' | 'strategy' | 'other'
  order?: number
  order_position?: number
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
}

export default function CoursesPage() {
  const { user, hasActiveSubscription } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return

      try {
        // Primeiro, buscar apenas os cursos para verificar se há algum
        const { data: coursesData, error: coursesError } = await (supabase as any)
          .from('courses')
          .select('*')
          .eq('is_published', true)
          .order('course_type', { ascending: true, nullsLast: true })
          .order('order_position', { ascending: true, nullsLast: true })

        if (coursesError) {
          console.error('Erro ao buscar cursos:', coursesError)
          console.error('Detalhes do erro:', JSON.stringify(coursesError, null, 2))
          throw coursesError
        }
        
        console.log('Cursos encontrados (sem lessons):', coursesData?.length || 0, coursesData)
        
        if (!coursesData || coursesData.length === 0) {
          setCourses([])
          return
        }

        // Buscar lessons separadamente para cada curso
        const courseIds = coursesData.map((c: Course) => c.id)
        const { data: lessonsData, error: lessonsError } = await (supabase as any)
          .from('course_lessons')
          .select('*')
          .in('course_id', courseIds)
          .order('order_position', { ascending: true, nullsLast: true })
          .order('order', { ascending: true, nullsLast: true })

        if (lessonsError) {
          console.error('Erro ao buscar lessons:', lessonsError)
          // Continuar mesmo se houver erro nas lessons
        }
        
        console.log('Lessons encontradas:', lessonsData?.length || 0)
        
        // Combinar cursos com suas lessons
        const coursesWithOrderedLessons = coursesData.map((course: Course) => {
          const courseLessons = (lessonsData || []).filter((l: Lesson) => l.course_id === course.id)
          return {
            ...course,
            lessons: courseLessons.sort((a: Lesson, b: Lesson) => (a.order_position || a.order || 0) - (b.order_position || b.order || 0))
          }
        })
        
        console.log('Cursos finais:', coursesWithOrderedLessons.length, coursesWithOrderedLessons)
        setCourses(coursesWithOrderedLessons)
      } catch (error: any) {
        console.error('Error fetching courses:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gogh-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gogh-grayDark">Carregando cursos...</p>
        </div>
      </div>
    )
  }

  const canvaCourses = courses.filter(c => c.course_type === 'canva' || (!c.course_type && c.title?.toLowerCase().includes('canva')))
  const capcutCourses = courses.filter(c => c.course_type === 'capcut' || (!c.course_type && c.title?.toLowerCase().includes('capcut')))

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gogh-black mb-2">
          Cursos
        </h1>
        <p className="text-gogh-grayDark">
          Aprenda novas habilidades com nossos cursos exclusivos de criação de conteúdo.
        </p>
      </div>

      {!hasActiveSubscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6"
        >
          <p className="text-amber-800">
            Você precisa de uma assinatura ativa para acessar os cursos. <Link href="/#pricing" className="font-medium underline">Ver planos</Link>
          </p>
        </motion.div>
      )}

      {/* Canva Courses */}
      {canvaCourses.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-gogh-black">Cursos de Canva</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {canvaCourses.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} hasAccess={hasActiveSubscription} />
            ))}
          </div>
        </div>
      )}

      {/* CapCut Courses */}
      {capcutCourses.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Scissors className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-gogh-black">Cursos de CapCut</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {capcutCourses.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} hasAccess={hasActiveSubscription} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {courses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gogh-grayDark mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gogh-black mb-2">
            Nenhum curso disponível
          </h3>
          <p className="text-gogh-grayDark">
            Os cursos estão sendo preparados. Volte em breve!
          </p>
        </div>
      )}
    </div>
  )
}

function CourseCard({ 
  course, 
  index, 
  hasAccess 
}: { 
  course: Course
  index: number
  hasAccess: boolean
}) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  const embedVideoUrl = (url: string) => {
    // YouTube
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    // Vimeo
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
      return `https://player.vimeo.com/video/${videoId}`
    }
    return url
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl border border-gogh-grayLight shadow-sm overflow-hidden"
    >
      {/* Course Header */}
      <div className="p-6 border-b border-gogh-grayLight">
        <h3 className="text-xl font-bold text-gogh-black mb-2">{course.title}</h3>
        <p className="text-sm text-gogh-grayDark">{course.description}</p>
        <div className="flex items-center gap-4 mt-4 text-sm text-gogh-grayDark">
          <span className="flex items-center gap-1">
            <Video className="w-4 h-4" />
            {course.lessons?.length || 0} aulas
          </span>
        </div>
      </div>

      {/* Lessons List */}
      <div className="p-6">
        {hasAccess ? (
          <div className="space-y-2">
            {course.lessons && course.lessons.length > 0 ? (
              course.lessons.map((lesson) => (
                <div key={lesson.id}>
                  <button
                    onClick={() => setSelectedLesson(selectedLesson?.id === lesson.id ? null : lesson)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gogh-grayLight transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gogh-yellow/20 rounded-lg flex items-center justify-center">
                        <Play className="w-4 h-4 text-gogh-black" />
                      </div>
                      <div>
                        <p className="font-medium text-gogh-black text-sm">{lesson.title}</p>
                        {lesson.description && (
                          <p className="text-xs text-gogh-grayDark mt-0.5">{lesson.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gogh-grayDark">#{lesson.order_position || lesson.order || 0}</span>
                  </button>
                  
                  {selectedLesson?.id === lesson.id && lesson.video_url && (
                    <div className="mt-3 p-4 bg-gogh-grayLight rounded-lg">
                      <div className="aspect-video rounded-lg overflow-hidden bg-black">
                        {/* Verificar se é URL do Supabase Storage (vídeo direto) ou URL externa (YouTube/Vimeo) */}
                        {lesson.video_url.includes('supabase.co') || lesson.video_url.includes('storage.googleapis.com') || lesson.video_url.endsWith('.mp4') || lesson.video_url.endsWith('.webm') || lesson.video_url.endsWith('.mov') ? (
                          <video
                            src={lesson.video_url}
                            controls
                            className="w-full h-full"
                            title={lesson.title}
                          >
                            Seu navegador não suporta a reprodução de vídeo.
                          </video>
                        ) : (
                          <iframe
                            src={embedVideoUrl(lesson.video_url)}
                            title={lesson.title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gogh-grayDark text-center py-4">
                Nenhuma aula disponível ainda
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gogh-grayDark mb-4">
              Você precisa de uma assinatura ativa para acessar este curso
            </p>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-xl hover:bg-gogh-yellow/90 transition-colors"
            >
              Ver Planos
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  )
}
