"use client"

import { ReactNode, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

type AlertVariant = "success" | "error" | "warning" | "info"

interface CustomAlertProps {
  variant?: AlertVariant
  title?: string
  description?: string
  visible?: boolean
  onClose?: () => void
  action?: ReactNode
  actionLabel?: string
  onAction?: () => void
  className?: string
}

const icons: Record<AlertVariant, JSX.Element> = {
  success: <CheckCircle2 className="h-5 w-5" />,
  error: <X className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
}

export default function CustomAlert({
  variant = "success",
  title = "Default Alert Title",
  description = "This is a default description for the alert. You can customize this text by passing props.",
  visible = true,
  onClose,
  action,
  actionLabel,
  onAction,
  className,
}: CustomAlertProps) {
  const icon = useMemo(() => icons[variant], [variant])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "relative w-full max-w-[320px] sm:max-w-sm p-3 sm:p-3.5 rounded-xl shadow-lg border backdrop-blur-md",
            "bg-white/10 dark:bg-black/20 border-white/20 dark:border-white/10",
            "text-slate-900 dark:text-white",
            className
          )}
        >
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-2.5 right-2.5 rounded-full p-1 hover:bg-white/20 transition"
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="flex items-start gap-2.5 pr-7">
            <div className="flex-shrink-0 font-normal">{icon}</div>
            <div className="flex flex-col min-w-0 flex-1">
              <h4 className="text-sm font-semibold leading-tight">{title}</h4>
              {description && (
                <p className="text-xs opacity-80 mt-1 leading-snug">{description}</p>
              )}
              {action ? (
                <div className="mt-2">{action}</div>
              ) : actionLabel && onAction ? (
                <button
                  type="button"
                  onClick={onAction}
                  className="mt-2 w-fit text-xs font-semibold px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 transition"
                >
                  {actionLabel}
                </button>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

