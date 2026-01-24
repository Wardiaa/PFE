// components/notifications-panel.tsx
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Bell,
  Check,
  Trash2,
  Mail,
  Calendar,
  Users,
  Trophy,
  Clock,
  Settings,
} from "lucide-react";
import { cn } from "../lib/utils";

const mockNotifications = [
  {
    id: 1,
    type: "invitation",
    title: "Join Team Quiz",
    message: "You've been invited to participate in the weekly team quiz",
    time: "5 minutes ago",
    read: false,
    icon: Mail,
    color: "text-blue-500",
  },
  {
    id: 2,
    type: "reminder",
    title: "Context Ending Soon",
    message: "Your 'Marketing Survey' ends in 2 hours",
    time: "1 hour ago",
    read: false,
    icon: Clock,
    color: "text-amber-500",
  },
  {
    id: 3,
    type: "result",
    title: "Results Available",
    message: "Check the results for 'General Knowledge Quiz'",
    time: "3 hours ago",
    read: true,
    icon: Trophy,
    color: "text-green-500",
  },
  {
    id: 4,
    type: "participation",
    title: "New Participant",
    message: "Alex joined your 'Team Building Game'",
    time: "1 day ago",
    read: true,
    icon: Users,
    color: "text-purple-500",
  },
  {
    id: 5,
    type: "system",
    title: "System Update",
    message: "New features available in the dashboard",
    time: "2 days ago",
    read: true,
    icon: Settings,
    color: "text-gray-500",
  },
];

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState(mockNotifications);
  
  const unreadCount = notifications.filter((n) => !n.read).length;
  
  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };
  
  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };
  
  const clearAll = () => {
    setNotifications([]);
  };
  
  return (
    <div
      className={cn(
        "fixed top-16 right-4 w-96 bg-background border rounded-lg shadow-xl z-50 transition-all duration-300",
        isOpen
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      )}
    >
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="ml-2">{unreadCount} new</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer group",
                        !notification.read && "bg-blue-50 dark:bg-blue-950/20"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg", notification.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium truncate">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {notification.time}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          
          <div className="p-4 border-t">
            <Button variant="outline" className="w-full" onClick={() => {}}>
              <Settings className="mr-2 h-4 w-4" />
              Notification Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}