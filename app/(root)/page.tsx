import { AnimatedBadge } from "@/components/animated-badge";
import { AnimatedPrompt } from "@/components/animated-prompt";
import { T0Keycap } from "@/components/t0-keycap";
import { TextScramble } from "@/components/text-scramble";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function LandingPage() {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Theme Toggle - positioned in top right */}
      <div className="absolute top-4 right-4 z-20 theme-toggle">
        <ThemeToggle />
      </div>
      
      {/* Main Content */}
      <main className="relative z-10 flex h-full flex-1 items-center justify-center overflow-auto">
        <div className="container mx-auto my-auto flex h-full max-w-2xl flex-col items-center justify-center">
          {/* Hackathon Badge */}
          <AnimatedBadge />

          {/* App Title */}
          <div className="mb-8 flex items-center justify-center gap-4 px-4 text-center">
            <div className="flex flex-col gap-1">
              <TextScramble
                as="h1"
                className="font-semibold text-4xl tracking-tight"
                characterSet={[
                  "0",
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "6",
                  "7",
                  "8",
                  "9",
                ]}
                animateOnHover={false}
              >
                T3.Chat
              </TextScramble>
              <p className="font-mono text-base text-muted-foreground uppercase">
                Your helpful, and engaging AI assistant.
              </p>
            </div>
          </div>

          {/* Press T to Start Prompt */}
          <AnimatedPrompt />

          {/* Keyboard */}
          <div className="size-40">
            <T0Keycap />
          </div>
        </div>
      </main>
    </div>
  );
} 