"use client";

import { SpinnerIcon } from "@/components/ui/icons/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface KeyProps {
	char: string;
	span?: boolean;
	active?: boolean;
	onClick: () => void;
	onMouseDown: () => void;
	onMouseUp: () => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
	onKeyUp?: (e: React.KeyboardEvent) => void;
	tabIndex?: number;
}

const Key: React.FC<KeyProps> = ({
	char,
	span,
	active,
	onClick,
	onMouseDown,
	onMouseUp,
	onKeyDown,
	onKeyUp,
	tabIndex = 0,
}) => {
	return (
		<div
			className={`key p-2 ${span ? "span" : ""} ${active ? "active" : ""}`}
			onClick={onClick}
			onMouseDown={onMouseDown}
			onMouseUp={onMouseUp}
			onKeyDown={onKeyDown}
			onKeyUp={onKeyUp}
			tabIndex={tabIndex}
		>
			<div
				onClick={onClick}
				className="side"
				onKeyDown={onKeyDown}
				onKeyUp={onKeyUp}
			/>
			<div
				className="top"
				onClick={onClick}
				onKeyDown={onKeyDown}
				onKeyUp={onKeyUp}
			/>
			{active && (
				<SpinnerIcon className="char w-full h-full animate-spin transition-opacity duration-200 ease-in-out" />
			)}
		</div>
	);
};

const Column: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<div className="column">{children}</div>
);

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<div className="row">{children}</div>
);

const useSetState = (initialState: string[] = []) => {
	const [state, setState] = useState(new Set(initialState));

	const add = (item: string) => setState((state) => new Set(state.add(item)));
	const remove = (item: string) => {
		setState((state) => {
			const newState = new Set(state);
			newState.delete(item);
			return newState;
		});
		return state;
	};

	return {
		set: state,
		add,
		remove,
		has: (char: string) => state.has(char),
	};
};

const useSound = (url: string) => {
	const audio = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		audio.current = new Audio(url);
	}, [url]);

	return {
		play: () => {
			if (audio.current) {
				audio.current.currentTime = 0;
				audio.current
					.play()
					.catch((err) => console.log("Audio play error:", err));
			}
		},
		stop: () => {
			if (audio.current) {
				audio.current.pause();
				audio.current.currentTime = 0;
			}
		},
	};
};

export const T0Keycap: React.FC = () => {
	const router = useRouter();
	const pathname = usePathname();
	const { add, remove, has } = useSetState([]);
	const { play, stop } = useSound("/keytype.mp3");
	const [isNavigating, setIsNavigating] = useState(false);
	const isMobile = useIsMobile();

	// Check localStorage on mount and clear if we're already on home page
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const wasNavigating = localStorage.getItem('t3-keycap-navigating') === 'true';
			if (wasNavigating) {
				// If we're on any page and there's a stale navigation state, clear it
				// This handles page reloads where navigation is no longer happening
				localStorage.removeItem('t3-keycap-navigating');
				setIsNavigating(false);
			}
		}
	}, [pathname]);

	// Persist navigation state to localStorage
	useEffect(() => {
		if (typeof window !== 'undefined') {
			if (isNavigating) {
				localStorage.setItem('t3-keycap-navigating', 'true');
			} else {
				localStorage.removeItem('t3-keycap-navigating');
			}
		}
	}, [isNavigating]);

	const handleNavigation = useCallback(() => {
		if (isNavigating) return; // Prevent multiple simultaneous navigations
		
		console.log("🔄 Keycap navigation to /home initiated");
		setIsNavigating(true);
		
		try {
			// Use push for better navigation tracking
			router.push("/home");
		} catch (error) {
			console.error("❌ Navigation error:", error);
			setIsNavigating(false);
		}
	}, [router, isNavigating]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === "t" && !isNavigating) {
				add(e.key);
				stop();
				play();
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === "t" && !isNavigating) {
				remove(e.key);
				handleNavigation();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("keyup", handleKeyUp);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("keyup", handleKeyUp);
		};
	}, [add, remove, play, stop, isNavigating, handleNavigation]);

	// Reset navigation state when we reach the home page or after timeout
	useEffect(() => {
		if (isNavigating) {
			// Check if we're on the home page
			if (pathname === "/home") {
				// Add a small delay to ensure the page has fully loaded
				const resetTimeout = setTimeout(() => {
					setIsNavigating(false);
					// Clear the char state to hide spinner
					remove("t");
				}, 100);

				return () => clearTimeout(resetTimeout);
			}

			// Otherwise, set a longer timeout as fallback
			const timeout = setTimeout(() => {
				setIsNavigating(false);
				// Clear the char state to hide spinner
				remove("t");
			}, 5000); // 5 second timeout

			return () => clearTimeout(timeout);
		}
	}, [isNavigating, pathname, remove]);

	const handleClick = (char: string) => {
		if (isNavigating) return;
		add(char);
		stop();
		play();
		// Start navigation immediately with slight delay for animation
		setTimeout(() => {
			handleNavigation();
		}, 100);
	};

	const handleMouseDown = (char: string) => {
		if (isNavigating) return;
		add(char);
		stop();
		play();
	};

	const handleMouseUp = (char: string) => {
		if (isNavigating) return;
		// Start navigation immediately, don't remove char state
		handleNavigation();
	};

	const handleKeyDown = (char: string, e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (isNavigating) return;
			add(char);
			stop();
			play();
		}
	};

	const handleKeyUp = (char: string, e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (isNavigating) return;
			// Start navigation immediately, don't remove char state
			handleNavigation();
		}
	};

	const keys = (chars: string[], spans: boolean[] = []) =>
		chars.map((char, i) => (
			<Key
				key={char}
				char={char}
				span={spans[i] || false}
				active={has(char) || isNavigating}
				onClick={() => handleClick(char)}
				onMouseDown={() => handleMouseDown(char)}
				onMouseUp={() => handleMouseUp(char)}
				onKeyDown={(e) => handleKeyDown(char, e)}
				onKeyUp={(e) => handleKeyUp(char, e)}
			/>
		));

	return (
		<div className={cn("keyboard", "relative")}>
			<Column>
				<Row>{keys(["t"])}</Row>
			</Column>
			<div className="cover" />
			<button
				disabled={!isMobile}
				className="-inset-30 absolute z-10 bg-transparent sm:hidden"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					if (isMobile && !isNavigating) {
						handleNavigation();
					}
				}}
				type="button"
			/>
		</div>
	);
};
 