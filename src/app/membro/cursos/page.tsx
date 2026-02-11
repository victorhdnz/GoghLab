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
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
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
        console.log('IDs dos cursos para buscar lessons:', courseIds)
        
        const { data: lessonsData, error: lessonsError } = await (supabase as any)
          .from('course_lessons')
          .select('*')
          .in('course_id', courseIds)

        if (lessonsError) {
          console.error('Erro ao buscar lessons:', lessonsError)
          console.error('Detalhes do erro de lessons:', JSON.stringify(lessonsError, null, 2))
          // Continuar mesmo se houver erro nas lessons
        }
        
        console.log('Lessons encontradas:', lessonsData?.length || 0, lessonsData)
        
        // Combinar cursos com suas lessons
        const coursesWithOrderedLessons = coursesData.map((course: Course) => {
          const courseLessons = (lessonsData || []).filter((l: Lesson) => l.course_id === course.id)
          console.log(`Curso ${course.title} (${course.id}): ${courseLessons.length} lessons`, courseLessons)
          return {
            ...course,
            lessons: courseLessons.sort((a: Lesson, b: Lesson) => (a.order_position || a.order || 0) - (b.order_position || b.order || 0))
          }
        })
        
        console.log('Cursos finais com lessons:', coursesWithOrderedLessons.length, coursesWithOrderedLessons)
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

      {!hasCourseAccess && hasActiveSubscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6"
        >
          <p className="text-amber-800">
            Os cursos são exclusivos para o plano Pro. <Link href="/precos" className="font-medium underline">Faça upgrade agora</Link>
          </p>
        </motion.div>
      )}
      
      {!hasActiveSubscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6"
        >
          <p className="text-amber-800">
            Você precisa de uma assinatura ativa para acessar os cursos. <Link href="/precos" className="font-medium underline">Ver planos</Link>
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
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!hasCourseAccess ? 'relative' : ''}`}>
            {!hasCourseAccess && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
                <div className="text-center p-8">
                  <BookOpen className="w-16 h-16 text-gogh-grayDark mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-gogh-black mb-2">
                    Cursos Exclusivos do Plano Pro
                  </h3>
                  <p className="text-gogh-grayDark mb-6 max-w-md">
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
            {canvaCourses.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} hasAccess={hasCourseAccess} />
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
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!hasCourseAccess ? 'relative' : ''}`}>
            {!hasCourseAccess && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
                <div className="text-center p-8">
                  <BookOpen className="w-16 h-16 text-gogh-grayDark mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-gogh-black mb-2">
                    Cursos Exclusivos do Plano Pro
                  </h3>
                  <p className="text-gogh-grayDark mb-6 max-w-md">
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
            {capcutCourses.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} hasAccess={hasCourseAccess} />
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
  const [expanded, setExpanded] = useState(false)

  const lessonsCount = course.lessons?.length || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl border border-gogh-grayLight shadow-sm overflow-hidden"
    >
      {/* Course Header - clicável para expandir/recolher aulas */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 border-b border-gogh-grayLight text-left hover:bg-amber-50/50 transition-colors rounded-t-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gogh-black mb-2">{course.title}</h3>
            <p className="text-sm text-gogh-grayDark">{course.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gogh-grayDark">
              <span className="flex items-center gap-1">
                <Video className="w-4 h-4" />
                {lessonsCount} aula{lessonsCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <span className="flex-shrink-0 text-gogh-grayDark mt-1" aria-hidden>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </div>
      </button>

      {/* Lessons List - visível apenas quando expandido */}
      {expanded && (
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
