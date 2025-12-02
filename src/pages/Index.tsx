import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        
        {/* CTA Section */}
        <section className="py-24 border-t border-border">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stop Debugging. Start <span className="text-primary">Shipping.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              Let AI handle your CI/CD failures while you focus on building features.
            </p>
            <div className="flex justify-center gap-4">
              <a href="/dashboard">
                <button className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-[var(--glow-primary)] transition-all">
                  Get Started Free
                </button>
              </a>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-8 border-t border-border">
          <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 ResurrectCI. Built for the Kestra x Vercel Hackathon.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Documentation
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                GitHub
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Twitter
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
