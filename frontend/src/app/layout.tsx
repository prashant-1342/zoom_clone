import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zoom Workplace | Video Meetings & Team Collaboration',
  description: 'Replicating Zoom design, user experience, and core video conferencing workflows.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full bg-[#131417] text-gray-100 antialiased selection:bg-[#0e71eb] selection:text-white">
        {children}
      </body>
    </html>
  );
}
