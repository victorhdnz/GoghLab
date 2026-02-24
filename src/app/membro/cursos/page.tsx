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
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import Link from 'next/link'
import { 
  getYouTubeId, 
  getYouTubeEmbedUrl,
  getYouTubeContainerClasses 
} from '@/lib/utils/youtube'

interface Course {
  id: string
  title: string
  description: string | null
  thumbnail_url?: string | null
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
  const { user, hasActiveSubscription, subscription, isPro } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [planHasCoursesProduct, setPlanHasCoursesProduct] = useState<boolean | null>(null)

  const supabase = createClient()

  // Acesso aos cursos: plano tem produto "cursos-edicao" OU legado (isPro)
  const hasCourseAccess =
    planHasCoursesProduct === true || (planHasCoursesProduct !== false && isPro && hasActiveSubscription)

  useEffect(() => {
    const checkPlanProducts = async () => {
      const planId = subscription?.plan_id
      if (!planId) {
        setPlanHasCoursesProduct(false)
        return
      }
      try {
        const { data } = await (supabase as any)
          .from('plan_products')
          .select('product_id, products(slug)')
          .eq('plan_id', planId)
        const hasCursos = (Array.isArray(data) && data.some((pp: any) => pp.products?.slug === 'cursos-edicao')) ?? false
        setPlanHasCoursesProduct(hasCursos)
      } catch (_) {
        setPlanHasCoursesProduct(false)
      }
    }
    checkPlanProducts()
  }, [subscription?.plan_id, supabase])

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
          throw coursesError
        }

        if (!coursesData || coursesData.length === 0) {
          setCourses([])
          return
        }

        const courseIds = coursesData.map((c: Course) => c.id)
        const { data: lessonsData, error: lessonsError } = await (supabase as any)
          .from('course_lessons')
          .select('*')
          .in('course_id', courseIds)

        if (lessonsError) {
          console.error('Erro ao buscar lessons:', lessonsError)
        }

        const coursesWithOrderedLessons = coursesData.map((course: Course) => {
          const courseLessons = (lessonsData || []).filter((l: Lesson) => l.course_id === course.id)
          return {
            ...course,
            lessons: courseLessons.sort((a: Lesson, b: Lesson) => (a.order_position || a.order || 0) - (b.order_position || b.order || 0))
          }
        })
        setCourses(coursesWithOrderedLessons)
      } catch (error: any) {
        console.error('Error fetching courses:', error)
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
          <LumaSpin size="default" className="mx-auto mb-4" />
          <p className="text-gogh-grayDark">Carregando cursos...</p>
        </div>
      </div>
    )
  }

  const canvaCourses = courses.filter(c => c.course_type === 'canva' || (!c.course_type && c.title?.toLowerCase().includes('canva')))
  const capcutCourses = courses.filter(c => c.course_type === 'capcut' || (!c.course_type && c.title?.toLowerCase().includes('capcut')))
  const strategyCourses = courses.filter(c => c.course_type === 'strategy')
  const otherCourses = courses.filter(c => c.course_type === 'other')

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-gogh-black mb-1">
          Cursos
        </h1>
        <p className="text-xs sm:text-sm text-gogh-grayDark">
          Aprenda novas habilidades com nossos cursos exclusivos de criação de conteúdo.
        </p>
      </div>

      {/* Uma única mensagem geral de restrição (estilo ferramentas) */}
      {(!hasCourseAccess || !hasActiveSubscription) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6"
        >
          <p className="text-amber-800">
            {!hasActiveSubscription
              ? <>Você precisa de uma assinatura ativa para acessar os cursos. <Link href="/precos" className="font-medium underline">Ver planos</Link></>
              : <>Os cursos são exclusivos para o plano Pro. <Link href="/precos" className="font-medium underline">Faça upgrade agora</Link></>
            }
          </p>
        </motion.div>
      )}

      {/* Área de cursos com um único overlay geral quando sem acesso */}
      {courses.length > 0 && (
        <div className={!hasCourseAccess ? 'relative' : ''}>
          {!hasCourseAccess && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center min-h-[280px]">
              <div className="text-center p-4 sm:p-6 md:p-8">
                <BookOpen className="w-16 h-16 text-gogh-grayDark mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-gogh-black mb-2">
                  Cursos Exclusivos do Plano Pro
                </h3>
                <p className="text-gogh-grayDark mb-6 max-w-md mx-auto">
                  Faça upgrade para o plano Pro e tenha acesso completo a todos os nossos cursos de Canva e CapCut.
                </p>
                <Link
                  href="/precos"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-xl hover:bg-gogh-yellow/90 transition-colors"
                >
                  Fazer Upgrade
                </Link>
              </div>
            </div>
          )}

          <div className={!hasCourseAccess ? 'pointer-events-none select-none blur-sm opacity-60' : ''}>
            {/* Canva Courses */}
            {canvaCourses.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-1.5 mb-3">
                  <Palette className="w-4 h-4 text-purple-600" />
                  <h2 className="text-base font-bold text-gogh-black">Cursos de Canva</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {canvaCourses.map((course, index) => (
                    <CourseCard key={course.id} course={course} index={index} hasAccess={hasCourseAccess} />
                  ))}
                </div>
              </div>
            )}

            {/* CapCut Courses */}
            {capcutCourses.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Scissors className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-base font-bold text-gogh-black">Cursos de CapCut</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {capcutCourses.map((course, index) => (
                    <CourseCard key={course.id} course={course} index={index} hasAccess={hasCourseAccess} />
                  ))}
                </div>
              </div>
            )}

            {/* Strategy Courses */}
            {strategyCourses.length > 0 && (
              <div className="mt-6 sm:mt-8">
                <div className="flex items-center gap-1.5 mb-3">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <h2 className="text-base font-bold text-gogh-black">Cursos de Estratégia</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {strategyCourses.map((course, index) => (
                    <CourseCard key={course.id} course={course} index={index} hasAccess={hasCourseAccess} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Courses */}
            {otherCourses.length > 0 && (
              <div className="mt-6 sm:mt-8">
                <div className="flex items-center gap-1.5 mb-3">
                  <BookOpen className="w-4 h-4 text-slate-600" />
                  <h2 className="text-base font-bold text-gogh-black">Outros Cursos</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {otherCourses.map((course, index) => (
                    <CourseCard key={course.id} course={course} index={index} hasAccess={hasCourseAccess} />
                  ))}
                </div>
              </div>
            )}
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
  const [expanded, setExpanded] = useState(false)

  const lessonsCount = course.lessons?.length || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-white rounded-xl border border-gogh-grayLight shadow-sm overflow-hidden transition-all duration-300 hover:shadow-[0_8px_22px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[length:4px_4px]" />
      </div>
      {/* Course Header - clicável para expandir/recolher aulas */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="relative w-full p-3 sm:p-4 border-b border-gogh-grayLight text-left hover:bg-amber-50/40 transition-colors rounded-t-xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg border border-gray-200 bg-black/5 overflow-hidden flex items-center justify-center flex-shrink-0">
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-gogh-black mb-0.5">{course.title}</h3>
            <p className="text-xs text-gogh-grayDark line-clamp-2">{course.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gogh-grayDark">
              <span className="flex items-center gap-1">
                <Video className="w-4 h-4" />
                {lessonsCount} aula{lessonsCount !== 1 ? 's' : ''}
              </span>
            </div>
            </div>
          </div>
          <span className="flex-shrink-0 text-gogh-grayDark mt-1" aria-hidden>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </div>
      </button>

      {/* Lessons List - visível apenas quando expandido */}
      {expanded && (
      <div className="p-3 sm:p-4">
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
                  </button>
                  
                  {selectedLesson?.id === lesson.id && lesson.video_url && (() => {
                    const youtubeId = getYouTubeId(lesson.video_url)
                    const isYouTube = !!youtubeId
                    
                    if (!isYouTube || !youtubeId) {
                      return (
                        <div className="mt-3 p-4 bg-gogh-grayLight rounded-lg">
                          <div className="flex justify-center">
                            <div className="relative w-full max-w-sm mx-auto">
                              <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center">
                                <p className="text-white text-sm">URL de vídeo inválida. Use uma URL do YouTube.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    
                    const containerClasses = getYouTubeContainerClasses(lesson.video_url)
                    const embedUrl = getYouTubeEmbedUrl(lesson.video_url)
                    
                    return (
                      <div className="mt-3 p-4 bg-gogh-grayLight rounded-lg">
                        <div className="flex justify-center">
                          <div className={`relative w-full ${containerClasses.wrapper}`}>
                            {/* Container com gradiente sutil ao redor */}
                            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-1 shadow-2xl">
                              <div className={`relative ${containerClasses.aspectRatio} rounded-xl overflow-hidden bg-black`}>
                                <iframe
                                  src={embedUrl || ''}
                                  title={lesson.title}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
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
              href="/precos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-xl hover:bg-gogh-yellow/90 transition-colors"
            >
              Ver Planos
            </Link>
          </div>
        )}
      </div>
      )}
    </motion.div>
  )
}
