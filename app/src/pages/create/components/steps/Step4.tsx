import { Label } from "../../../../components/ui/label";
import { Switch } from "../../../../components/ui/switch";
import { Slider } from "../../../../components/ui/slider";
import { Input } from "../../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Users, Globe, Lock, Copy, Settings, Music, Bell } from "lucide-react";
import type { ContextData } from "../../types";

interface Step4Props {
  context: ContextData;
  onSettingsChange: (updates: any) => void;
}

export function Step4({ context, onSettingsChange }: Step4Props) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8">
      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-6">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5" /> Participation
          </h3>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <Label>Participation Mode</Label>
                <p className="text-sm text-muted-foreground">Who can join?</p>
              </div>
              <Select
                value={context.settings.participationMode}
                onValueChange={(value) =>
                  onSettingsChange({ participationMode: value })
                }
              >
                <SelectTrigger className="w-full sm:w-45">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">
                    <Globe className="mr-2 h-4 w-4 inline" /> Public
                  </SelectItem>
                  <SelectItem value="INVITE_ONLY">
                    <Lock className="mr-2 h-4 w-4 inline" /> Invite Only
                  </SelectItem>
                  <SelectItem value="CODE_REQUIRED">
                    <Copy className="mr-2 h-4 w-4 inline" /> Code Required
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Require Account</Label>
                  <p className="text-sm text-muted-foreground">Users must sign in</p>
                </div>
                <Switch
                  checked={context.settings.requireAccount}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ requireAccount: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Allow Guest Participation</Label>
                  <p className="text-sm text-muted-foreground">Guests can join without account</p>
                </div>
                <Switch
                  checked={context.settings.allowGuest}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ allowGuest: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Allow Anonymous</Label>
                  <p className="text-sm text-muted-foreground">Hide participant names</p>
                </div>
                <Switch
                  checked={context.settings.allowAnonymous}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ allowAnonymous: checked })
                  }
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Max Participants: {context.settings.maxParticipants}</Label>
              </div>
              <Slider
                value={[context.settings.maxParticipants]}
                onValueChange={([value]) =>
                  onSettingsChange({ maxParticipants: value })
                }
                min={1}
                max={1000}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Settings className="h-5 w-5" /> Game Rules
          </h3>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <Label>Time Limit (minutes)</Label>
                <p className="text-sm text-muted-foreground">Overall time limit</p>
              </div>
              <Input
                type="number"
                value={context.settings.timeLimit}
                onChange={(e) =>
                  onSettingsChange({ timeLimit: parseInt(e.target.value) || 60 })
                }
                className="w-full sm:w-24"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Answer Validation</Label>
              </div>
              <Select
                value={context.settings.answerValidation}
                onValueChange={(value) =>
                  onSettingsChange({ answerValidation: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO">Automatic</SelectItem>
                  <SelectItem value="MANUAL">Manual Review</SelectItem>
                  <SelectItem value="REAL_TIME">Real-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Show Leaderboard</Label>
                  <p className="text-sm text-muted-foreground">Display scores during game</p>
                </div>
                <Switch
                  checked={context.settings.showLeaderboard}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ showLeaderboard: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Show Progress</Label>
                  <p className="text-sm text-muted-foreground">Show question progress</p>
                </div>
                <Switch
                  checked={context.settings.showProgress}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ showProgress: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Allow Retry</Label>
                  <p className="text-sm text-muted-foreground">Participants can try again</p>
                </div>
                <Switch
                  checked={context.settings.allowRetry}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ allowRetry: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Shuffle Questions</Label>
                  <p className="text-sm text-muted-foreground">Randomize question order</p>
                </div>
                <Switch
                  checked={context.settings.shuffleQuestions}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ shuffleQuestions: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Music className="h-5 w-5" /> Audio & Effects
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label>Sound Effects</Label>
                <p className="text-sm text-muted-foreground">Play sounds during game</p>
              </div>
              <Switch
                checked={context.settings.soundEffects}
                onCheckedChange={(checked) =>
                  onSettingsChange({ soundEffects: checked })
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label>Background Music</Label>
              <Select
                value={context.settings.backgroundMusic}
                onValueChange={(value) =>
                  onSettingsChange({ backgroundMusic: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select music track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upbeat">Upbeat Energy</SelectItem>
                  <SelectItem value="calm">Calm Focus</SelectItem>
                  <SelectItem value="epic">Epic Adventure</SelectItem>
                  <SelectItem value="none">No Music</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifications
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label>Send Notifications</Label>
                <p className="text-sm text-muted-foreground">Email reminders and updates</p>
              </div>
              <Switch
                checked={context.settings.notifications}
                onCheckedChange={(checked) =>
                  onSettingsChange({ notifications: checked })
                }
              />
            </div>
            
            {context.settings.notifications && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Join reminders</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Results ready</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Time limit warnings</Label>
                  <Switch defaultChecked />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}