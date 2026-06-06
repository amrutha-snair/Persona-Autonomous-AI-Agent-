import './globals.css';

export const metadata = {
  title: 'Amrutha Satheesan — AI Persona',
  description: 'Chat with Amrutha\'s AI representative. Ask about skills, projects, and book an interview.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
