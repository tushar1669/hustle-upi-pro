export default function Footer() {
  return (
    <footer className="border-t bg-background/50 backdrop-blur-sm">
      <div className="container py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">HustleHub</span>
            <span className="text-muted-foreground">Your UPI-first Hustle-HQ</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2025 HustleHub. Built for hustlers, by hustlers.
          </div>
        </div>
      </div>
    </footer>
  );
}