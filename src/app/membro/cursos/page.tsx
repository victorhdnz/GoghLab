'use client'

import { useEffect, useState, type ComponentType } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Play, 
  Video,
  Palette
} from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
import Link from 'next/link'
import { CourseBentoGrid } from '@/components/ui/bento-grid'
import { Modal } from '@/components/ui/Modal'
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
  const { user, hasActiveSubscription, subscription, isPro, loading: authLoading } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [planHasCoursesProduct, setPlanHasCoursesProduct] = useState<boolean | null>(null)

  const supabase = createClient()

  // Acesso aos cursos: plano tem produto "cursos-edicao" OU usuário Pro com assinatura ativa
  const hasCourseAccess =
    planHasCoursesProduct === true || (isPro && hasActiveSubscription)

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
      try {
        // Primeiro, buscar apenas os cursos para verificar se há algum
        const { data: coursesData, error: coursesError } = await (supabase as any)
          .from('courses')
          .select('*')
          .eq('is_published', true)
          .order('order_position', { ascending: true, nullsLast: true })
          .order('created_at', { ascending: true, nullsLast: true })

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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LumaSpin size="default" className="mx-auto mb-4" />
          <p className="text-gogh-grayDark">Carregando cursos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-gogh-black mb-1">
          Cursos
        </h1>
        <p className="text-xs sm:text-sm text-gogh-grayDark">
          Aprenda novas habilidades com nossos cursos exclusivos.
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
              ? <>Você precisa assinar o plano Gogh Pro para acessar os cursos. <Link href="/precos" className="font-medium underline">Assinar Gogh Pro</Link></>
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
                  {!hasActiveSubscription ? 'Assine o Gogh Pro para acessar' : 'Cursos Exclusivos do Plano Pro'}
                </h3>
                <p className="text-gogh-grayDark mb-6 max-w-md mx-auto">
                  {!hasActiveSubscription
                    ? 'Para acessar os cursos é necessário assinar o plano Gogh Pro.'
                    : 'Faça upgrade para o plano Pro e tenha acesso completo a todos os nossos cursos de Canva e CapCut.'}
                </p>
                <Link
                  href="/precos"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gogh-yellow text-gogh-black font-medium rounded-xl hover:bg-gogh-yellow/90 transition-colors"
                >
                  {!hasActiveSubscription ? 'Assinar Gogh Pro' : 'Fazer Upgrade'}
                </Link>
              </div>
            </div>
          )}

          <div className={!hasCourseAccess ? 'pointer-events-none select-none blur-sm opacity-60' : ''}>
            <CourseSection courses={courses} hasAccess={hasCourseAccess} />
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

function CourseSection({
  courses,
  hasAccess,
}: {
  courses: Course[]
  hasAccess: boolean
}) {
  const [modalCourseId, setModalCourseId] = useState<string | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)

  const modalCourse = courses.find((course) => course.id === modalCourseId) || null
  const selectedLesson =
    modalCourse?.lessons?.find((lesson) => lesson.id === selectedLessonId) || null

  const items = courses.map((course) => {
    const lessonsCount = course.lessons?.length || 0
    return {
      id: course.id,
      title: course.title,
      description: '',
      imageUrl: course.thumbnail_url || null,
      status: `${lessonsCount} aula${lessonsCount !== 1 ? 's' : ''}`,
      cta: 'Abrir curso →',
      colSpan: 1,
      hasPersistentHover: modalCourseId === course.id,
    }
  })

  return (
    <div className="mt-6 sm:mt-8">
      <CourseBentoGrid
        items={items}
        selectedId={modalCourseId}
        className="max-w-3xl p-0 md:grid-cols-2"
        onItemClick={(item) => {
          const course = courses.find((c) => c.id === item.id)
          const firstLessonId = course?.lessons?.[0]?.id || null
          setModalCourseId(item.id)
          setSelectedLessonId(firstLessonId)
        }}
      />

      <Modal
        isOpen={!!modalCourse}
        onClose={() => {
          setModalCourseId(null)
          setSelectedLessonId(null)
        }}
        title={modalCourse?.title || 'Curso'}
        size="xl"
      >
        {modalCourse ? (
          hasAccess ? (
            <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4">
              <div className="border border-gogh-grayLight rounded-lg p-2 max-h-[60vh] overflow-y-auto">
                {modalCourse.lessons && modalCourse.lessons.length > 0 ? (
                  <div className="space-y-2">
                    {modalCourse.lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLessonId(lesson.id)}
                        className={`w-full p-2.5 rounded-lg text-left transition-colors ${
                          selectedLessonId === lesson.id
                            ? 'bg-gogh-yellow/20 border border-gogh-yellow/50'
                            : 'hover:bg-gogh-grayLight'
                        }`}
                      >
                        <p className="text-sm font-medium text-gogh-black">{lesson.title}</p>
                        {lesson.description ? (
                          <p className="text-xs text-gogh-grayDark mt-0.5 line-clamp-2">{lesson.description}</p>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gogh-grayDark text-center py-6">Nenhuma aula disponível ainda.</p>
                )}
              </div>

              <div className="border border-gogh-grayLight rounded-lg p-3 bg-gogh-grayLight/20 min-h-[320px] flex items-center justify-center">
                {selectedLesson?.video_url ? (() => {
                  const youtubeId = getYouTubeId(selectedLesson.video_url)
                  if (!youtubeId) {
                    return <p className="text-sm text-gogh-grayDark">URL de vídeo inválida. Use uma URL do YouTube.</p>
                  }
                  const containerClasses = getYouTubeContainerClasses(selectedLesson.video_url)
                  const embedUrl = getYouTubeEmbedUrl(selectedLesson.video_url)
                  return (
                    <div className={`relative w-full ${containerClasses.wrapper}`}>
                      <div className="relative rounded-xl overflow-hidden bg-black">
                        <div className={`relative ${containerClasses.aspectRatio} bg-black`}>
                          <iframe
                            src={embedUrl || ''}
                            title={selectedLesson.title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    </div>
                  )
                })() : (
                  <div className="text-center">
                    <Play className="w-8 h-8 text-gogh-grayDark mx-auto mb-2" />
                    <p className="text-sm text-gogh-grayDark">Selecione uma aula à esquerda para assistir.</p>
                  </div>
                )}
              </div>
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
          )
        ) : null}
      </Modal>
    </div>
  )
}
