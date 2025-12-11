import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Package, 
  Download, 
  Settings, 
  Filter,
  Grid3X3,
  List,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Extension, ExtensionCategory, ExtensionSearchFilters } from "@/types/extensions";
import { extensionService } from "@/services/extensionService";
import { ExtensionCard } from "./ExtensionCard";
import { toast } from "sonner";

interface ExtensionsManagerProps {
  onClose: () => void;
}

export function ExtensionsManager({ onClose }: ExtensionsManagerProps) {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [categories, setCategories] = useState<ExtensionCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<ExtensionSearchFilters['sortBy']>("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("marketplace");

  const loadExtensions = async () => {
    setIsLoading(true);
    try {
      const filters: ExtensionSearchFilters = {
        category: selectedCategory,
        sortBy,
        showInstalled: activeTab === "installed" ? true : undefined,
        showEnabled: activeTab === "enabled" ? true : undefined,
      };

      const [extensionsData, categoriesData] = await Promise.all([
        extensionService.searchExtensions(searchQuery, filters),
        extensionService.getCategories()
      ]);

      setExtensions(extensionsData);
      setCategories(categoriesData);
    } catch (error) {
      toast.error("Failed to load extensions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExtensions();
  }, [searchQuery, selectedCategory, sortBy, activeTab]);

  const handleRefresh = () => {
    loadExtensions();
    toast.success("Extensions refreshed");
  };

  const getTabCount = (tab: string): number => {
    switch (tab) {
      case "installed":
        return extensions.filter(e => e.isInstalled).length;
      case "enabled":
        return extensions.filter(e => e.isEnabled).length;
      default:
        return extensions.length;
    }
  };

  const filteredExtensions = extensions.filter(ext => {
    switch (activeTab) {
      case "installed":
        return ext.isInstalled;
      case "enabled":
        return ext.isEnabled;
      default:
        return true;
    }
  });

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="h-14 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-semibold text-white">Extensions</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-gray-300 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="text-gray-300 hover:text-white"
          >
            {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-gray-300 hover:text-white"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search extensions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 space-y-4 border-b border-gray-700">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {category.count}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Sort by</label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as ExtensionSearchFilters['sortBy'])}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="downloads">Downloads</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="updated">Recently Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Categories List */}
          <div className="flex-1 overflow-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Browse Categories</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      selectedCategory === category.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span className="flex-1">{category.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="bg-gray-800 border-b border-gray-700 px-4">
              <TabsList className="bg-transparent border-none h-12 w-full justify-start">
                <TabsTrigger
                  value="marketplace"
                  className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Marketplace
                  <Badge variant="secondary" className="ml-2">
                    {getTabCount("marketplace")}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="installed"
                  className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Installed
                  <Badge variant="secondary" className="ml-2">
                    {getTabCount("installed")}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="enabled"
                  className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Enabled
                  <Badge variant="secondary" className="ml-2">
                    {getTabCount("enabled")}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <TabsContent value={activeTab} className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                      </div>
                    ) : filteredExtensions.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-300 mb-2">
                          No extensions found
                        </h3>
                        <p className="text-gray-500">
                          {searchQuery
                            ? `No extensions match "${searchQuery}"`
                            : "Try adjusting your filters or search terms"}
                        </p>
                      </div>
                    ) : (
                      <div className={
                        viewMode === "grid"
                          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                          : "space-y-4"
                      }>
                        {filteredExtensions.map((extension) => (
                          <ExtensionCard
                            key={extension.id}
                            extension={extension}
                            onUpdate={loadExtensions}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}