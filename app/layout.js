export const metadata = {
  title: 'Trading Journal',
  description: 'Personal Trading Journal',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0f1117' }}>
        {children}
      </body>
    </html>
  )
}
