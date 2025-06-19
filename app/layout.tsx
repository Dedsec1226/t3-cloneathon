import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";


const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "T3 Chat – The Best AI Assistant & ChatGPT Alternative",
	description:
		"T3 is your personal assistant. It completes your thoughts, remembers your context, and adapts the interface as you write. Built for developers, powered by AI, and integrated with your tools.",
	keywords: [
		"T3",
		"AI",
		"text editor",
		"autocomplete",
		"developer tools",
		"productivity",
	],
	authors: [
		{
			name: "Abhinav",
			url: "https://github.com/abhinavkale-dev",
		},
		{
			name: "Pratik",
			url: "https://github.com/Prtik12",
		},
	],
	applicationName: "T3",
	metadataBase: new URL("https://t3.chat"),
	openGraph: {
		type: "website",
		locale: "en_US",
		title: "T3 Chat – The Best AI Assistant & ChatGPT Alternative",
		description:
			"T3 is your personal assistant. It completes your thoughts, remembers your context, and adapts the interface as you write. Built for developers, powered by AI, and integrated with your tools.",
		url: "https://t3.chat",
		images: [
			{
				url: "https://t3.chat/og.png",
				width: 1200,
				height: 630,
				alt: "T3 – Built by Abhinav and Pratik",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "T3 Chat – The Best AI Assistant & ChatGPT Alternative",
		description:
			"T3 is your personal assistant. It completes your thoughts, remembers your context, and adapts the interface as you write. Built for developers, powered by AI, and integrated with your tools.",
		images: ["https://t3.chat/og.png"],
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
			>
			<ClerkProvider>
				<Providers>
					{children}
				</Providers>
        	</ClerkProvider>
			</body>
		</html>
	);
}
