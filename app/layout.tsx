import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from '@/components/providers';

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "T3 – The AI-Native Personal Text Editor",
	description:
		"T3 is your personal thinking partner. It completes your thoughts, remembers your context, and adapts the interface as you write. Built for developers, powered by AI, and integrated with your tools.",
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
			name: "Railly Hugo",
			url: "https://github.com/raillyhugo",
		},
		{
			name: "Anthony Cueva",
			url: "https://github.com/anthonycuervo",
		},
	],
	applicationName: "T3",
	metadataBase: new URL("https://t3.dev"),
	openGraph: {
		type: "website",
		locale: "en_US",
		title: "T3 – The AI-Native Personal Text Editor",
		description:
			"T3 is your personal thinking partner. It completes your thoughts, remembers your context, and adapts the interface as you write. Built for developers, powered by AI, and integrated with your tools.",
		url: "https://t3.dev",
		images: [
			{
				url: "https://t3.dev/og.png",
				width: 1200,
				height: 630,
				alt: "T3 – Built by Railly Hugo and Anthony Cueva",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "T3 – The AI-Native Text Editor That Thinks With You",
		description:
			"More than autocomplete. T3 remembers your context, adapts the interface, and integrates your tools into your flow. Write with AI that feels personal.",
		images: ["https://t3.dev/og.png"],
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
				<Providers>
					{children}
				</Providers>
			</body>
		</html>
	);
}
