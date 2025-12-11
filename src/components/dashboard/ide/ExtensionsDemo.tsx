import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Play, Download, Star, Zap } from "lucide-react";
import { ExtensionsManager } from "./ExtensionsManager";

export function ExtensionsDemo() {
  const [showManager, setShowManager] = useState(false);

  const featuredExtensions = [
    {
      name: "Python",
      icon: "🐍",
      description: "Rich Python language support with IntelliSense, debugging, and more",
      downloads: "85M",
      rating: 4.8,
      category: "Languages"
    },
    {
      name: "GitHub Copilot",
      icon: "🤖",
      description: "Your AI pair programmer for faster coding",
      downloads: "25M",
      rating: 4.4,
      category: "Productivity"
    },
    {
      name: "Prettier",
      icon: "💅",
      description: "Code formatter for consistent code style",
      downloads: "35M",
      rating: 4.7,
      category: "Formatters"
    }
  ];

  if (showManager) {
    return <ExtensionsManager onClose={() => setShowManager(false)} />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Package className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Extensions Marketplace</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Enhance your IDE with powerful extensions. Install language support, themes, 
          productivity tools, and more to customize your development experience.
        </p>
        <Button
          size="lg"
          onClick={() => setShowManager(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Package className="w-5 h-5 mr-2" />
          Browse Extensions
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-yellow-500" />
              Productivity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Boost your coding efficiency with AI assistants, code snippets, and automation tools.
            </p>
            <div className="space-y-2">
              <Badge variant="outline">GitHub Copilot</Badge>
              <Badge variant="outline">Live Share</Badge>
              <Badge variant="outline">Code Spell Checker</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="w-5 h-5 text-blue-500" />
              Languages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Get rich language support with syntax highlighting, IntelliSense, and debugging.
            </p>
            <div className="space-y-2">
              <Badge variant="outline">Python</Badge>
              <Badge variant="outline">TypeScript</Badge>
              <Badge variant="outline">Rust</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-purple-500" />
              Themes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Customize your IDE appearance with beautiful color themes and icon packs.
            </p>
            <div className="space-y-2">
              <Badge variant="outline">Dracula</Badge>
              <Badge variant="outline">One Dark Pro</Badge>
              <Badge variant="outline">Material Theme</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Featured Extensions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {featuredExtensions.map((ext, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{ext.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{ext.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {ext.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {ext.downloads}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {ext.rating}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {ext.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => setShowManager(true)}
          className="w-full max-w-md"
        >
          <Play className="w-4 h-4 mr-2" />
          Try Extensions Manager
        </Button>
      </div>
    </div>
  );
}