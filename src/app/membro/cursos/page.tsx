'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Play, 
  Crown, 
  Lock,
  ChevronRight,
  Star
} from 'lucide-react'

interface Course {
  id: string
  slug: string
  title: string
  description: string | null
  thumbnail_url: string | null
  instructor_name: string | null
  course_type: 'canva' | 'capcut' | 'strategy' | 'other'
  modules: any[]
  is_premium_only: boolean
  is_active: boolean
  order_index: number
}

interface CourseProgress {
  course_id: string
  completed_lessons: number
  total_lessons: number
  progress_percent: number
}

export default function CoursesPage() {
  const { user, subscription, isPro } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [progress, setProgress] = useState<Record<string, CourseProgress>>({})
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return

      try {
        // Buscar cursos ativos
        const { data: coursesData, error } = await (supabase as any)
          .from('courses')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true })

        if (error) throw error
        setCourses(coursesData || [])

        // Buscar progresso do usuário
        const { data: progressData } = await (supabase as any)
          .from('user_course_progress')
          .select('course_id, completed')
          .eq('user_id', user.id)

        // Calcular progresso por curso
        if (progressData) {
          const progressMap: Record<string, CourseProgress> = {}
          
          for (const course of coursesData || []) {
            const courseProgress = (progressData as any[]).filter((p: any) => p.course_id === course.id)
            const completedLessons = courseProgress.filter((p: any) => p.completed).length
            
            progressMap[course.id] = {
              course_id: course.id,
              completed_lessons: completedLessons,
              total_lessons: course.lessons_count,
              progress_percent: course.lessons_count > 0 
                ? Math.round((completedLessons / course.lessons_count) * 100)
                : 0
            }
          }
          
          setProgress(progressMap)
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [user])

  // Verificar se usuário tem acesso ao curso
  const hasAccessToCourse = (course: Course) => {
    // Se não é premium_only, todos com assinatura podem acessar
    if (!course.is_premium_only) return !!subscription
    // Se é premium_only, apenas Pro
    return isPro
  }

  // Separar cursos por tipo
  const featuredCourses = courses.filter(c => c.course_type === 'strategy')
  const otherCourses = courses.filter(c => c.course_type !== 'strategy')

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

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gogh-black mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-gogh-yellow fill-gogh-yellow" />
            Em Destaque
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredCourses.map((course, index) => {
              const hasAccess = hasAccessToCourse(course)
              const courseProgress = progress[course.id]

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {hasAccess ? (
                    <Link
                      href={`/membro/cursos/${course.slug}`}
                      className="group block bg-white rounded-xl border border-gogh-grayLight shadow-sm overflow-hidden hover:shadow-lg hover:border-gogh-yellow transition-all"
                    >
                      <CourseCard course={course} progress={courseProgress} />
                    </Link>
                  ) : (
                    <div className="relative bg-white rounded-xl border border-gogh-grayLight shadow-sm overflow-hidden opacity-75">
                      <CourseCard course={course} progress={courseProgress} locked />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center pb-6">
                        <Link
                          href="/membro/upgrade"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-amber-700 transition-colors"
                        >
                          <Crown className="w-4 h-4" />
                          Upgrade para Pro
                        </Link>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* All Courses */}
      <div>
        <h2 className="text-lg font-semibold text-gogh-black mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-gogh-grayDark" />
          Todos os Cursos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(otherCourses.length > 0 ? otherCourses : courses).map((course, index) => {
            const hasAccess = hasAccessToCourse(course)
            const courseProgress = progress[course.id]

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {hasAccess ? (
                  <Link
                    href={`/membro/cursos/${course.slug}`}
                    className="group block bg-white rounded-xl border border-gogh-grayLight shadow-sm overflow-hidden hover:shadow-lg hover:border-gogh-yellow transition-all h-full"
                  >
                    <CourseCardCompact course={course} progress={courseProgress} />
                  </Link>
                ) : (
                  <div className="relative bg-white rounded-xl border border-gogh-grayLight shadow-sm overflow-hidden opacity-75 h-full">
                    <CourseCardCompact course={course} progress={courseProgress} locked />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center pb-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                        <Lock className="w-3 h-3" />
                        Exclusivo Pro
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

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

// Componente do Card de Curso (Featured)
function CourseCard({ 
  course, 
  progress, 
  locked = false 
}: { 
  course: Course
  progress?: CourseProgress
  locked?: boolean 
}) {
  return (
    <>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gogh-grayLight">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-gogh-grayDark" />
          </div>
        )}
        {!locked && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-gogh-black ml-1" />
            </div>
          </div>
        )}
                {course.is_premium_only && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                    <Crown className="w-3 h-3" />
                    Pro
                  </span>
                )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-gogh-black group-hover:text-gogh-yellow transition-colors line-clamp-1">
          {course.title}
        </h3>
        <p className="text-sm text-gogh-grayDark mt-1 line-clamp-2">
          {course.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gogh-grayDark">
          <span className="flex items-center gap-1">
            <Play className="w-4 h-4" />
            {course.modules?.length || 0} módulos
          </span>
          <span className="capitalize text-xs bg-gogh-grayLight px-2 py-0.5 rounded">
            {course.course_type}
          </span>
        </div>

        {/* Progress */}
        {progress && progress.progress_percent > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gogh-grayDark mb-1">
              <span>{progress.completed_lessons}/{progress.total_lessons} aulas</span>
              <span>{progress.progress_percent}%</span>
            </div>
            <div className="h-2 bg-gogh-grayLight rounded-full overflow-hidden">
              <div 
                className="h-full bg-gogh-yellow rounded-full transition-all"
                style={{ width: `${progress.progress_percent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Componente do Card Compacto
function CourseCardCompact({ 
  course, 
  progress, 
  locked = false 
}: { 
  course: Course
  progress?: CourseProgress
  locked?: boolean 
}) {
  return (
    <div className="p-5 h-full flex flex-col">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 bg-gogh-grayLight rounded-lg flex items-center justify-center flex-shrink-0">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              width={56}
              height={56}
              className="object-cover rounded-lg"
            />
          ) : (
            <BookOpen className="w-6 h-6 text-gogh-grayDark" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gogh-black group-hover:text-gogh-yellow transition-colors line-clamp-1">
              {course.title}
            </h3>
            {course.is_premium_only && (
              <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gogh-grayDark mt-0.5">
            {course.instructor_name || 'Gogh Lab'}
          </p>
        </div>
      </div>

      <p className="text-sm text-gogh-grayDark line-clamp-2 flex-1">
        {course.description}
      </p>

      {/* Meta */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gogh-grayLight">
        <div className="flex items-center gap-3 text-xs text-gogh-grayDark">
          <span className="flex items-center gap-1">
            <Play className="w-3 h-3" />
            {course.modules?.length || 0} módulos
          </span>
          <span className="capitalize bg-gogh-grayLight px-2 py-0.5 rounded">
            {course.course_type}
          </span>
        </div>

        {!locked && (
          <ChevronRight className="w-4 h-4 text-gogh-grayDark group-hover:text-gogh-yellow group-hover:translate-x-1 transition-all" />
        )}
      </div>

      {/* Progress */}
      {progress && progress.progress_percent > 0 && !locked && (
        <div className="mt-3">
          <div className="h-1.5 bg-gogh-grayLight rounded-full overflow-hidden">
            <div 
              className="h-full bg-gogh-yellow rounded-full transition-all"
              style={{ width: `${progress.progress_percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

