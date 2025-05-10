"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Database, FileText, ExternalLink, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

type Dataset = {
  id: string
  name: string
  description: string
  category: string
  url: string
}

export default function DatasetBrowser() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([])
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [samples, setSamples] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSampleLoading, setIsSampleLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetch("/api/datasets")
        const data = await response.json()
        setDatasets(data.datasets)
        setFilteredDatasets(data.datasets)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching datasets:", error)
        setIsLoading(false)
      }
    }

    fetchDatasets()
  }, [])

  useEffect(() => {
    // Filter datasets based on search query and active category
    let filtered = datasets

    if (searchQuery) {
      filtered = filtered.filter(
        (dataset) =>
          dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dataset.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (activeCategory !== "all") {
      filtered = filtered.filter((dataset) => dataset.category === activeCategory)
    }

    setFilteredDatasets(filtered)
  }, [searchQuery, activeCategory, datasets])

  const handleDatasetSelect = async (dataset: Dataset) => {
    setSelectedDataset(dataset)
    setIsSampleLoading(true)

    try {
      const response = await fetch("/api/datasets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ datasetId: dataset.id }),
      })

      const data = await response.json()
      setSamples(data.samples || [])
    } catch (error) {
      console.error("Error fetching dataset samples:", error)
    } finally {
      setIsSampleLoading(false)
    }
  }

  // Get unique categories
  const categories = ["all", ...new Set(datasets.map((dataset) => dataset.category))]

  return (
    <Card className="w-full border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Hugging Face Datasets
        </CardTitle>
        <CardDescription>Browse and explore datasets available for use with Sentient AI</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-primary/20"
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-4 w-full overflow-x-auto flex-nowrap justify-start">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Available Datasets</h3>
              <ScrollArea className="h-[400px] rounded-md border border-primary/20 p-2">
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredDatasets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No datasets found matching your criteria</div>
                ) : (
                  <div className="space-y-2">
                    {filteredDatasets.map((dataset) => (
                      <div
                        key={dataset.id}
                        className={`p-2 rounded-md cursor-pointer transition-colors ${
                          selectedDataset?.id === dataset.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-secondary"
                        }`}
                        onClick={() => handleDatasetSelect(dataset)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{dataset.name}</h4>
                          <Badge variant="outline" className="text-xs border-primary/20">
                            {dataset.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{dataset.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Dataset Details</h3>
              <div className="rounded-md border border-primary/20 h-[400px] p-4">
                {selectedDataset ? (
                  <div className="h-full flex flex-col">
                    <div className="mb-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold">{selectedDataset.name}</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 border-primary/20 hover:bg-primary/10 hover:text-primary"
                          asChild
                        >
                          <a href={selectedDataset.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                            View on HF
                          </a>
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{selectedDataset.description}</p>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Sample Data
                      </h4>

                      <ScrollArea className="h-[calc(100%-2rem)] rounded-md border border-primary/20 p-2">
                        {isSampleLoading ? (
                          <div className="space-y-2 p-2">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                          </div>
                        ) : samples.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No sample data available</div>
                        ) : (
                          <div className="space-y-3">
                            {samples.map((sample, index) => (
                              <div key={index} className="p-2 rounded-md border border-primary/10 bg-secondary/50">
                                {Object.entries(sample).map(([key, value]) => (
                                  <div key={key} className="mb-1">
                                    <span className="text-xs font-medium text-primary">{key}: </span>
                                    <span className="text-xs">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center">
                    <div className="max-w-xs">
                      <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium">No Dataset Selected</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select a dataset from the list to view details and sample data
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}

