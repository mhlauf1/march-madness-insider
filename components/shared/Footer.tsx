export function Footer() {
  return (
    <footer className="mt-auto border-t border-border-subtle">
      <div className="mx-auto max-w-400 px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center text-xs text-text-muted">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <span>Data: ESPN</span>
            <span>Analytics: KenPom</span>
            <span>Odds: The-Odds-API</span>
          </div>

          <p>Made by Mike with love ❤️</p>
          <p>&copy; {new Date().getFullYear()} BurgerLab</p>
        </div>
      </div>
    </footer>
  );
}
