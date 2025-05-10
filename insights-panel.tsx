import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, MessageSquare, Zap, Target } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: Date
  model?: string
}

interface InsightsPanelProps {
  messages: Message[]
  metadata: Record<string, any>
}

export function InsightsPanel({ messages, metadata }: InsightsPanelProps) {
  // Filter out only assistant messages
  const assistantMessages = messages.filter((message) => message.role === "assistant")

  // No insights to show if no assistant messages
  if (assistantMessages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Zap className="h-8 w-8 text-primary/60" />
        </div>
        <h3 className="text-xl font-medium mb-2">No Insights Available</h3>
        <p className="text-muted-foreground max-w-md">
          Start a conversation with Sentient AI to generate insights. As the conversation progresses, this panel will
          display analytics and contextual understanding metrics.
        </p>
      </div>
    )
  }

  // Extract all metadata for analysis
  const allMetadata = Object.values(metadata)

  // Count response types
  const responseTypes: Record<string, number> = {}
  allMetadata.forEach((meta) => {
    if (meta.responseType) {
      responseTypes[meta.responseType] = (responseTypes[meta.responseType] || 0) + 1
    }
  })

  // Get all entities mentioned
  const allEntities = allMetadata.flatMap((meta) => meta.entities || [])
  const uniqueEntities = [...new Set(allMetadata.flatMap((meta) => meta.entities || []))]

  // Get all topics mentioned
  const allTopics = allMetadata.flatMap((meta) => meta.keyTopics || [])
  const uniqueTopics = [...new Set(allMetadata.flatMap((meta) => meta.keyTopics || []))]

  // Count sentiment distribution
  const sentimentCounts = {
    positive: allMetadata.filter((meta) => meta.sentiment === "positive").length,
    neutral: allMetadata.filter((meta) => meta.sentiment === "neutral").length,
    negative: allMetadata.filter((meta) => meta.sentiment === "negative").length,
  }

  // Count complexity levels
  const complexityCounts = {
    high: allMetadata.filter((meta) => meta.complexity === "high").length,
    medium: allMetadata.filter((meta) => meta.complexity === "medium").length,
    low: allMetadata.filter((meta) => meta.complexity === "low").length,
  }

  // Count reasoning depth
  const reasoningCounts = {
    deep: allMetadata.filter((meta) => meta.reasoningDepth === "deep").length,
    moderate: allMetadata.filter((meta) => meta.reasoningDepth === "moderate").length,
    basic: allMetadata.filter((meta) => meta.reasoningDepth === "basic").length,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>Conversation Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Messages</span>
                <span className="font-medium">{messages.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">User Messages</span>
                <span className="font-medium">{messages.filter((m) => m.role === "user").length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">AI Responses</span>
                <span className="font-medium">{assistantMessages.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Avg. Response Length</span>
                <span className="font-medium">
                  {Math.round(
                    assistantMessages.reduce((sum, msg) => sum + msg.content.length, 0) /
                      Math.max(1, assistantMessages.length),
                  )}{" "}
                  chars
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Brain className="h-4 w-4 text-primary" />
              <span>Topic Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Main Topics</span>
                <span className="font-medium">{uniqueTopics.length}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {uniqueTopics.slice(0, 5).map((topic, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-primary/5 border-primary/20">
                    {topic}
                  </Badge>
                ))}
                {uniqueTopics.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{uniqueTopics.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Target className="h-4 w-4 text-primary" />
              <span>Response Quality</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Avg. Complexity</span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-2 bg-secondary rounded-full">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${Math.round(
                          (complexityCounts.high * 100 + complexityCounts.medium * 50 + complexityCounts.low * 25) /
                            Math.max(1, allMetadata.length),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Reasoning Depth</span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-2 bg-secondary rounded-full">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${Math.round(
                          (reasoningCounts.deep * 100 + reasoningCounts.moderate * 60 + reasoningCounts.basic * 30) /
                            Math.max(1, allMetadata.length),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="topics" className="w-full">
        <TabsList className="w-full bg-primary/10">
          <TabsTrigger
            value="topics"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Topics & Entities
          </TabsTrigger>
          <TabsTrigger
            value="sentiment"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Sentiment Analysis
          </TabsTrigger>
          <TabsTrigger
            value="complexity"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Complexity & Reasoning
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Key Topics</CardTitle>
                <CardDescription>Main subjects discussed in the conversation</CardDescription>
              </CardHeader>
              <CardContent>
                {uniqueTopics.length > 0 ? (
                  <div className="space-y-3">
                    {uniqueTopics.map((topic, i) => {
                      const count = allTopics.filter((t) => t === topic).length
                      const percentage = Math.round((count / allMetadata.length) * 100)

                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span>{topic}</span>
                            <span className="text-xs text-muted-foreground">{percentage}%</span>
                          </div>
                          <div className="w-full h-2 bg-secondary rounded-full">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No topics detected yet</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Entities Mentioned</CardTitle>
                <CardDescription>Organizations, technologies, and concepts</CardDescription>
              </CardHeader>
              <CardContent>
                {uniqueEntities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {uniqueEntities.map((entity, i) => {
                      const count = allEntities.filter((e) => e === entity).length
                      const size = count > 2 ? "medium" : count > 1 ? "small" : "xs"

                      return (
                        <Badge
                          key={i}
                          variant="outline"
                          className={cn(
                            "border-primary/20",
                            size === "medium"
                              ? "text-sm px-2.5 py-0.5"
                              : size === "small"
                                ? "text-xs px-2 py-0.5"
                                : "text-xs px-1.5 py-0",
                          )}
                        >
                          {entity}
                          {count > 1 && <span className="ml-1 text-muted-foreground">({count})</span>}
                        </Badge>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No entities detected yet</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sentiment" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sentiment Distribution</CardTitle>
                <CardDescription>Emotional tone of the conversation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>Positive</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {sentimentCounts.positive} (
                        {Math.round((sentimentCounts.positive / Math.max(1, allMetadata.length)) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(sentimentCounts.positive / Math.max(1, allMetadata.length)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        <span>Neutral</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {sentimentCounts.neutral} (
                        {Math.round((sentimentCounts.neutral / Math.max(1, allMetadata.length)) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full">
                      <div
                        className="h-full bg-gray-400 rounded-full"
                        style={{ width: `${(sentimentCounts.neutral / Math.max(1, allMetadata.length)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span>Negative</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {sentimentCounts.negative} (
                        {Math.round((sentimentCounts.negative / Math.max(1, allMetadata.length)) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${(sentimentCounts.negative / Math.max(1, allMetadata.length)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Response Types</CardTitle>
                <CardDescription>Categories of AI responses</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(responseTypes).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(responseTypes).map(([type, count], i) => {
                      const percentage = Math.round((count / allMetadata.length) * 100)

                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="capitalize">{type}</span>
                            <span className="text-xs text-muted-foreground">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-secondary rounded-full">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No response types detected yet</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="complexity" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Response Complexity</CardTitle>
                <CardDescription>Depth and sophistication of responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>High Complexity</span>
                      <span className="text-xs text-muted-foreground">
                        {complexityCounts.high} (
                        {Math.round((complexityCounts.high / Math.max(1, allMetadata.length)) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(complexityCounts.high / Math.max(1, allMetadata.length)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>Medium Complexity</span>
                      <span className="text-xs text-muted-foreground">
                        {complexityCounts.medium} (
                        {Math.round((complexityCounts.medium / Math.max(1, allMetadata.length)) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full">
                      <div
                        className="h-full bg-primary/70 rounded-full"
                        style={{ width: `${(complexityCounts.medium / Math.max(1, allMetadata.length)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>Low Complexity</span>
                      <span className="text-xs text-muted-foreground">
                        {complexityCounts.low} (
                        {Math.round((complexityCounts.low / Math.max(1, allMetadata.length)) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full">
                      <div
                        className="h-full bg-primary/40 rounded-full"
                        style={{ width: `${(complexityCounts.low / Math.max(1, allMetadata.length)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Reasoning Depth</CardTitle>
                <CardDescription>Level of analytical reasoning in responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>Deep Reasoning</span>
                      <span className="text-xs text-muted-foreground">
                        {reasoningCounts.deep} (
                        {Math.round((reasoningCounts.deep / Math.max(1, allMetadata.length)) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(reasoningCounts.deep / Math.max(1, allMetadata.length)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>Moderate Reasoning</span>
                      <span className="text-xs text-muted-foreground">
                        {reasoningCounts.moderate} (
                        {Math.round((reasoningCounts.moderate / Math.max(1, allMetadata.length)) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full">
                      <div
                        className="h-full bg-primary/70 rounded-full"
                        style={{ width: `${(reasoningCounts.moderate / Math.max(1, allMetadata.length)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>Basic Reasoning</span>
                      <span className="text-xs text-muted-foreground">
                        {reasoningCounts.basic} (
                        {Math.round((reasoningCounts.basic / Math.max(1, allMetadata.length)) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full">
                      <div
                        className="h-full bg-primary/40 rounded-full"
                        style={{ width: `${(reasoningCounts.basic / Math.max(1, allMetadata.length)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

