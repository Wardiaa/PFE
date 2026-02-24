import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Eye, Users, Globe, Timer, Star, Copy, Calendar, Bell, TestTube, Download, CheckCircle2, Save } from "lucide-react";
import type { ContextData } from "../../types";

interface Step5Props {
  context: ContextData;
  onHandleCreate: () => void;
}

export function Step5({ context, onHandleCreate }: Step5Props) {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8">
      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Card className="overflow-hidden border-2">
            <div className="h-32 md:h-48 bg-linear-to-r from-purple-500 to-pink-500 relative">
              <div className="absolute bottom-3 md:bottom-4 left-4 md:left-6">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                  <Eye className="mr-1 h-3 w-3" /> Preview Mode
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">{context.title || "Your Context Title"}</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {context.description || "Context description will appear here"}
                  </p>
                </div>
                <Badge variant="outline" className="text-base md:text-lg">
                  {context.questions.length} Qs
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  {context.settings.maxParticipants} Participants
                </div>
                <div className="flex items-center">
                  <Globe className="mr-1 h-4 w-4" />
                  {context.settings.participationMode}
                </div>
                <div className="flex items-center">
                  <Timer className="mr-1 h-4 w-4" />
                  {context.settings.timeLimit} min limit
                </div>
                <div className="flex items-center">
                  <Star className="mr-1 h-4 w-4" />
                  {context.questions.reduce((sum, q) => sum + (q.points || 0), 0)} total points
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 md:p-6">
              <h4 className="font-bold mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Template
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Launch
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Bell className="mr-2 h-4 w-4" />
                  Set Reminders
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Participation
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Questions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quiz Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">{context.questions.length}</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">
                    {context.questions.reduce((sum, q) => sum + (q.timeLimit || 30), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total seconds</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Avg. time per question:</span>
                  <span className="font-medium">
                    {context.questions.length > 0 
                      ? Math.round(context.questions.reduce((sum, q) => sum + (q.timeLimit || 30), 0) / context.questions.length)
                      : 0}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total points:</span>
                  <span className="font-medium">
                    {context.questions.reduce((sum, q) => sum + (q.points || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Question types:</span>
                  <span className="font-medium">
                    {[...new Set(context.questions.map(q => q.type))].length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ready to Launch?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Title and description set</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-5 w-5 ${context.questions.length > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm">At least one question added</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Participation settings configured</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Theme selected</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Button onClick={onHandleCreate} className="w-full" size="lg">
                  <Save className="mr-2 h-5 w-5" />
                  Publish & Share
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  You can always edit this later from your dashboard
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}