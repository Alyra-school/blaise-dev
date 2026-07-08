const Footer = () => {
  return (
    <footer className="border-t">
      <div className="container max-w-4xl mx-auto text-center px-4 py-5 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Alyra. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer