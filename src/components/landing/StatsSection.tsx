const stats = [
  { value: "50%", label: "Dev Time Saved", sublabel: "on debugging" },
  { value: "< 30s", label: "Average Fix Time", sublabel: "per build failure" },
  { value: "99.2%", label: "Success Rate", sublabel: "on common errors" },
  { value: "24/7", label: "Autonomous", sublabel: "monitoring" },
];

export function StatsSection() {
  return (
    <section className="py-16 border-y border-border bg-background">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {stat.value}
              </p>
              <p className="font-medium">{stat.label}</p>
              <p className="text-sm text-muted-foreground">{stat.sublabel}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
