"use client";

import { motion } from "framer-motion";

export const AnimatedPrompt = () => {
	return (
		<motion.div
			className="mb-8 text-center"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<p className="text-lg text-muted-foreground">
				<span className="md:hidden">Press the button to get started</span>
				<span className="hidden md:inline">
					Press{" "}
					<kbd className="inline-flex size-5 max-h-full items-center justify-center rounded border bg-muted px-1 font-medium font-mono text-[0.625rem] text-foreground">
						T
					</kbd>{" "}
					to get started
				</span>
			</p>
		</motion.div>
	);
};
