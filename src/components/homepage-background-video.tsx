export function HomepageBackgroundVideo() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0 scale-[1.02] bg-[url('/backgrounds/green1.jpg')] bg-cover bg-center bg-no-repeat"
      />
      <div
        className="absolute inset-0 bg-black/15 dark:bg-black/55"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/25 to-background/90 dark:from-black/78 dark:via-black/35 dark:to-black/88"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgb(0_0_0/0.34)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_46%,rgb(0_0_0/0.5)_100%)]"
      />
    </div>
  );
}
