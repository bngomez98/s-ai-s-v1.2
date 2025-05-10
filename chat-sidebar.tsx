"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useConversation } from "@/lib/conversation-context"
import { MessageSquare, Plus, Settings, Trash, Brain, History, Database, Sparkles } from "lucide-react"
import { useState } from "react"
import { Separator } from "@/components/ui/separator"
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar"
import { formatDistanceToNow } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

export default function ChatSidebar() {
  const {
    conversations,
    currentConversationId,
    startNewConversation,
    loadConversation,
    deleteConversation,
    settings,
    updateSettings,
    saveConversation,
  } = useConversation()

  const { toast } = useToast()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [conversationTitle, setConversationTitle] = useState("")
  const [isRenamingConversation, setIsRenamingConversation] = useState(false)

  const handleNewChat = () => {
    startNewConversation()
  }

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteConversation(id)
    toast({
      description: "Conversation deleted",
    })
  }

  const handleRenameConversation = () => {
    if (!conversationTitle.trim()) return

    saveConversation(conversationTitle)
    setIsRenamingConversation(false)
    setConversationTitle("")

    toast({
      description: "Conversation renamed successfully",
    })
  }

  const getConversationTitle = (conversation: any) => {
    if (conversation.title) return conversation.title

    // Get the first user message or use a default title
    const firstUserMessage = conversation.messages.find((m: any) => m.role === "user")
    if (firstUserMessage) {
      const title = firstUserMessage.content.slice(0, 30)
      return title.length < firstUserMessage.content.length ? `${title}...` : title
    }

    return "New conversation"
  }

  const getCurrentConversation = () => {
    return conversations.find((c) => c.id === currentConversationId)
  }

  return (
    <>
      <SidebarHeader className="border-b border-primary/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Sentient AI</h2>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNewChat}
                    className="border-primary/20 hover:bg-primary/10 hover:text-primary"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New conversation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-primary/20 hover:bg-primary/10 hover:text-primary"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] border-primary/20">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Sentient AI Settings
                  </DialogTitle>
                  <DialogDescription>Customize the AI's behavior and response patterns</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="mt-2">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    <TabsTrigger value="memory">Memory</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="temperature">Temperature: {settings.temperature}</Label>
                      <Slider
                        id="temperature"
                        min={0}
                        max={1}
                        step={0.1}
                        value={[settings.temperature]}
                        onValueChange={(value) => updateSettings({ temperature: value[0] })}
                        className="[&>span]:bg-primary"
                      />
                      <p className="text-xs text-muted-foreground">
                        Controls randomness. Lower values (0.1-0.4) make responses more focused and deterministic.
                        Higher values (0.7-1.0) make responses more creative and varied.
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="maxTokens">Max Tokens: {settings.maxTokens}</Label>
                      <Slider
                        id="maxTokens"
                        min={100}
                        max={4000}
                        step={100}
                        value={[settings.maxTokens]}
                        onValueChange={(value) => updateSettings({ maxTokens: value[0] })}
                        className="[&>span]:bg-primary"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum length of the response. Higher values allow for more detailed answers but may take
                        longer to generate.
                      </p>
                    </div>

                    {currentConversationId && (
                      <div className="pt-2">
                        <Label htmlFor="renameConversation">Rename Current Conversation</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="renameConversation"
                            placeholder={getConversationTitle(getCurrentConversation())}
                            value={conversationTitle}
                            onChange={(e) => setConversationTitle(e.target.value)}
                            className="border-primary/20"
                          />
                          <Button
                            onClick={handleRenameConversation}
                            className="bg-primary hover:bg-primary/90"
                            disabled={!conversationTitle.trim()}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="advancedReasoning" className="text-base">
                          Advanced Reasoning
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enables complex reasoning capabilities for sophisticated queries
                        </p>
                      </div>
                      <Switch
                        id="advancedReasoning"
                        checked={settings.advancedReasoning}
                        onCheckedChange={(checked) => updateSettings({ advancedReasoning: checked })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>

                    <Separator className="my-2" />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="technicalPrecision" className="text-base">
                          Technical Precision
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Prioritizes technical accuracy in specialized domains
                        </p>
                      </div>
                      <Switch
                        id="technicalPrecision"
                        checked={settings.technicalPrecision || false}
                        onCheckedChange={(checked) => updateSettings({ technicalPrecision: checked })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>

                    <Separator className="my-2" />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="creativeMode" className="text-base">
                          Creative Mode
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enhances creative and imaginative responses
                        </p>
                      </div>
                      <Switch
                        id="creativeMode"
                        checked={settings.creativeMode || false}
                        onCheckedChange={(checked) => updateSettings({ creativeMode: checked })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="memory" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="contextRetention" className="text-base">
                          Context Retention
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Maintains conversation context for more coherent interactions
                        </p>
                      </div>
                      <Switch
                        id="contextRetention"
                        checked={settings.contextRetention}
                        onCheckedChange={(checked) => updateSettings({ contextRetention: checked })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>

                    <Separator className="my-2" />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="longTermMemory" className="text-base">
                          Long-Term Memory
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Remembers key information across multiple conversations
                        </p>
                      </div>
                      <Switch
                        id="longTermMemory"
                        checked={settings.longTermMemory || false}
                        onCheckedChange={(checked) => updateSettings({ longTermMemory: checked })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>

                    <Separator className="my-2" />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="adaptiveLearning" className="text-base">
                          Adaptive Learning
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Learns from interactions to improve future responses
                        </p>
                      </div>
                      <Switch
                        id="adaptiveLearning"
                        checked={settings.adaptiveLearning || false}
                        onCheckedChange={(checked) => updateSettings({ adaptiveLearning: checked })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>

                    {settings.longTermMemory && (
                      <>
                        <Separator className="my-2" />
                        <div className="p-3 bg-secondary/30 rounded-md">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Memory Storage</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Used: 24MB</span>
                            <Badge variant="outline" className="text-xs">
                              Active
                            </Badge>
                          </div>
                          <div className="mt-1 w-full h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="bg-primary h-full" style={{ width: "24%" }}></div>
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                  <Button onClick={() => setIsSettingsOpen(false)} className="bg-primary hover:bg-primary/90">
                    Apply Settings
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Conversations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <SidebarMenu>
                {conversations.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-center text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 text-primary/40" />
                    <p>No conversations yet.</p>
                    <p>Start a new chat to begin!</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <SidebarMenuItem key={conversation.id}>
                      <SidebarMenuButton
                        onClick={() => loadConversation(conversation.id)}
                        isActive={currentConversationId === conversation.id}
                        className="w-full justify-between group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          <span className="truncate">{getConversationTitle(conversation)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                        </span>
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash className="h-4 w-4" />
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-primary/20 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium">System Status: Online</span>
            </div>
            <Badge variant="outline" className="text-xs border-primary/20">
              v1.2.0
            </Badge>
          </div>
          <Separator className="bg-primary/20" />
          <div className="text-xs text-muted-foreground">
            <p>Powered by Sentient AI Neural Core</p>
            <p>© {new Date().getFullYear()} Sentient AI Technologies</p>
          </div>
        </div>
      </SidebarFooter>
    </>
  )
}

