import { Card } from "@/components/ui/card";

const technologies = [
  {
    name: "Azure OpenAI",
    description: "Enterprise-grade AI reasoning for autonomous debugging & fixes",
    icon: "🧠",
    color: "from-blue-500 to-indigo-600",
  },
  {
    name: "GitHub OAuth",
    description: "One-click connection for repository and CI/CD access",
    icon: "🐙",
    color: "from-gray-700 to-gray-900",
  },
  {
    name: "Supabase",
    description: "Real-time backend orchestration via Deno Edge Functions",
    icon: "⚡",
    color: "from-emerald-500 to-teal-600",
  },
  {
    name: "Multi-Agent Logic",
    description: "Coordinated agent chain: detection → analysis → automation",
    icon: "🤖",
    color: "from-purple-500 to-pink-600",
  },
  {
    name: "Self-Healing CI",
    description: "Automated recovery flow with zero developer intervention",
    icon: "🛠️",
    color: "from-orange-500 to-red-600",
  },
];

const features = [
  { label: "Self-Correction Loop", value: "Tries multiple fixes until success" },
  { label: "Web Search", value: "Searches StackOverflow & GitHub Issues" },
  { label: "File Modification", value: "Patches code autonomously" },
  { label: "Auto PR Creation", value: "Creates fix branches automatically" },
];

export function TechStackSection() {
  return (
    <section className="py-24 bg-card/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full border border-accent/30 bg-accent/10 text-sm">
            🛠️ Built for Hackathon
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powered by Modern <span className="text-primary">Infrastructure</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A winning combination of orchestration, hosting, and AI
          </p>
        </div>
        
        {/* Tech cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-16">
          {technologies.map((tech, i) => (
            <Card
              key={i}
              className="bg-card border-border p-6 text-center hover:border-primary/30 transition-all group"
            >
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${tech.color} flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}
              >
                {tech.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{tech.name}</h3>
              <p className="text-sm text-muted-foreground">{tech.description}</p>
            </Card>
          ))}
        </div>
        
        {/* Features grid */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-center mb-8">
            What Makes It <span className="text-accent-foreground">Unique</span>
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {i + 1}
                </div>
                <div>
                  <p className="font-medium">{feature.label}</p>
                  <p className="text-sm text-muted-foreground">{feature.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
