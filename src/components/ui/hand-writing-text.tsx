"use client";

import { motion } from "framer-motion";

interface HandWrittenTitleProps {
    title?: string;
    subtitle?: string;
}

function HandWrittenTitle({
    title = "Hand Written",
    subtitle = "Optional subtitle",
}: HandWrittenTitleProps) {
    const draw = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                pathLength: { duration: 2.5, ease: [0.43, 0.13, 0.23, 0.96] },
                opacity: { duration: 0.5 },
            },
        },
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto py-12 md:py-16">
            <div className="relative text-center flex flex-col items-center justify-center">
                {/* SVG apenas ao redor do título */}
                <div className="relative inline-block mb-4 px-12 py-8 md:px-20 md:py-14">
                    <div className="absolute inset-0">
                        <motion.svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 1200 600"
                            preserveAspectRatio="none"
                            initial="hidden"
                            animate="visible"
                            className="w-full h-full"
                            style={{ pointerEvents: 'none' }}
                        >
                            <title>Hand Written Title</title>
                            <motion.path
                                d="M 950 90 
                                   C 1250 300, 1050 480, 600 520
                                   C 250 520, 150 480, 150 300
                                   C 150 120, 350 80, 600 80
                                   C 850 80, 950 180, 950 180"
                                fill="none"
                                strokeWidth="12"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                variants={draw}
                                className="text-white opacity-90"
                            />
                        </motion.svg>
                    </div>
                    <motion.h1
                        className="relative z-10 text-3xl md:text-5xl lg:text-6xl text-white tracking-tighter font-bold whitespace-nowrap"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        {title}
                    </motion.h1>
                </div>
                {subtitle && (
                    <motion.p
                        className="relative z-10 text-lg md:text-xl text-white/90 mt-8 md:mt-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.8 }}
                    >
                        {subtitle}
                    </motion.p>
                )}
            </div>
        </div>
    );
}

export { HandWrittenTitle }

