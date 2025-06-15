"use client";

import { useEffect, useState } from "react";
import RotatingText from "@/components/RotatingText";

export function AnimatedBadge() {
	const [isVercel, setIsVercel] = useState(true);

	useEffect(() => {
		const interval = setInterval(() => {
			setIsVercel((prev) => !prev);
		}, 2000); // Switch every 2 seconds

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="mb-8 flex w-[24ch] items-center justify-center gap-2  bg-background/50 px-3 py-1.5 backdrop-blur-sm">
			<div className="flex items-center justify-center gap-2">
				<RotatingText
					texts={[
						isVercel ? "Built for T3 Cloneathon" : "Built by DedSec",
					]}
					transition={{ type: "spring", damping: 25, stiffness: 300 }}
					initial={{ y: "100%", opacity: 0 } as any}
					animate={{ y: 0, opacity: 1 } as any}
					exit={{ y: "-120%", opacity: 0 } as any}
					animatePresenceMode="wait"
					animatePresenceInitial={false}
					rotationInterval={2000}
					staggerDuration={0}
					staggerFrom="first"
					loop={false}
					auto={false}
					splitBy="characters"
					mainClassName="text-center text-muted-foreground text-sm"
				/>
			</div>
		</div>
	);
}
 