// pages/admin-dashboard.tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { 
  Users, 
  BarChart3, 
  Shield, 
  Settings, 
  Search, 
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  UserCheck,
  UserX,
  AlertCircle,
  TrendingUp,
  Globe,
  
  Calendar,
  
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Label,
} from "recharts";
import { Select } from "react-day-picker";
import { SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { Switch } from "../components/ui/switch";

const mockUsers = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "USER",
    status: "active",
    joined: "2024-01-15",
    contexts: 12,
    lastLogin: "2 hours ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    role: "ADMIN",
    status: "active",
    joined: "2024-01-10",
    contexts: 25,
    lastLogin: "1 day ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  },
  {
    id: 3,
    name: "Charlie Brown",
    email: "charlie@example.com",
    role: "USER",
    status: "suspended",
    joined: "2024-01-05",
    contexts: 3,
    lastLogin: "1 week ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  },
  {
    id: 4,
    name: "Diana Prince",
    email: "diana@example.com",
    role: "SUPER_ADMIN",
    status: "active",
    joined: "2024-01-01",
    contexts: 45,
    lastLogin: "Just now",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diana",
  },
];

const mockContexts = [
  {
    id: 1,
    title: "General Knowledge Quiz",
    creator: "Alice Johnson",
    type: "QUIZ",
    participants: 125,
    status: "active",
    created: "2024-01-20",
    reported: false,
  },
  {
    id: 2,
    title: "Team Feedback Poll",
    creator: "Bob Smith",
    type: "POLL",
    participants: 45,
    status: "active",
    created: "2024-01-18",
    reported: false,
  },
  {
    id: 3,
    title: "Inappropriate Content",
    creator: "Charlie Brown",
    type: "QUIZ",
    participants: 8,
    status: "reported",
    created: "2024-01-15",
    reported: true,
  },
  {
    id: 4,
    title: "Company Values Assessment",
    creator: "Diana Prince",
    type: "ASSESSMENT",
    participants: 230,
    status: "active",
    created: "2024-01-10",
    reported: false,
  },
];

const analyticsData = [
  { name: "Jan", contexts: 45, participants: 1200 },
  { name: "Feb", contexts: 52, participants: 1450 },
  { name: "Mar", contexts: 48, participants: 1380 },
  { name: "Apr", contexts: 60, participants: 1650 },
  { name: "May", contexts: 55, participants: 1520 },
  { name: "Jun", contexts: 65, participants: 1800 },
];

const typeData = [
  { name: "Quiz", value: 45, color: "#8884d8" },
  { name: "Poll", value: 25, color: "#82ca9d" },
  { name: "Vote", value: 15, color: "#ffc658" },
  { name: "Game", value: 10, color: "#ff8042" },
  { name: "Survey", value: 5, color: "#0088fe" },
];

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  
  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredContexts = mockContexts.filter(
    (ctx) =>
      ctx.title.toLowerCase().includes(search.toLowerCase()) ||
      ctx.creator.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage users, contexts, and platform analytics
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-10 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <h3 className="text-3xl font-bold mt-2">1,248</h3>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" /> +12% this month
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Contexts</p>
                  <h3 className="text-3xl font-bold mt-2">156</h3>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" /> +8% this week
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Globe className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Participants</p>
                  <h3 className="text-3xl font-bold mt-2">8,942</h3>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" /> +24% this month
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reported Issues</p>
                  <h3 className="text-3xl font-bold mt-2">3</h3>
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" /> Needs attention
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <BarChart3 className="mr-2 h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="contexts">
              <Globe className="mr-2 h-4 w-4" /> Contexts
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="participants"
                          stroke="#8884d8"
                          strokeWidth={2}
                          name="Participants"
                        />
                        <Line
                          type="monotone"
                          dataKey="contexts"
                          stroke="#82ca9d"
                          strokeWidth={2}
                          name="Contexts"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Context Types Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { user: "Alice Johnson", action: "created new quiz", time: "2 hours ago", type: "success" },
                      { user: "Bob Smith", action: "reported inappropriate content", time: "4 hours ago", type: "warning" },
                      { user: "System", action: "auto-suspended user 'Charlie Brown'", time: "1 day ago", type: "danger" },
                      { user: "Diana Prince", action: "updated platform settings", time: "2 days ago", type: "info" },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${
                            activity.type === 'success' ? 'bg-green-500' :
                            activity.type === 'warning' ? 'bg-yellow-500' :
                            activity.type === 'danger' ? 'bg-red-500' : 'bg-blue-500'
                          }`} />
                          <span className="font-medium">{activity.user}</span>
                          <span className="text-muted-foreground">{activity.action}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <Button>
                    <UserCheck className="mr-2 h-4 w-4" /> Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">User</th>
                        <th className="text-left py-3 px-4">Role</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Contexts</th>
                        <th className="text-left py-3 px-4">Last Login</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/30">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-10 w-10 rounded-full"
                              />
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                user.role === "SUPER_ADMIN"
                                  ? "destructive"
                                  : user.role === "ADMIN"
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                user.status === "active"
                                  ? "default"
                                  : user.status === "suspended"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {user.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{user.contexts}</td>
                          <td className="py-3 px-4 text-muted-foreground">{user.lastLogin}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <UserCheck className="mr-2 h-4 w-4" /> Promote to Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <UserX className="mr-2 h-4 w-4" /> Suspend Account
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contexts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Context Management</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                    <Button>
                      <Eye className="mr-2 h-4 w-4" /> View All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContexts.map((context) => (
                    <Card key={context.id} className={`relative ${context.reported ? 'border-red-300' : ''}`}>
                      {context.reported && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="destructive">Reported</Badge>
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-bold text-lg mb-1">{context.title}</h3>
                            <p className="text-sm text-muted-foreground">by {context.creator}</p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{context.type}</Badge>
                            <div className="text-sm text-muted-foreground">
                              {context.participants} participants
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {context.created}
                            </div>
                            <Badge variant={context.status === "active" ? "default" : "secondary"}>
                              {context.status}
                            </Badge>
                          </div>
                          
                          <div className="flex gap-2 pt-4 border-t">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Edit className="h-3 w-3 mr-1" /> Edit
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                <DropdownMenuItem>Archive</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">General Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Platform Name</Label>
                        <Input defaultValue="Engage Interactive" />
                      </div>
                      <div className="space-y-2">
                        <Label>Default Theme</Label>
                        <Select defaultValue="default">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="light">Light</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Security Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Require Email Verification</Label>
                          <p className="text-sm text-muted-foreground">Users must verify email</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Two-Factor Authentication</Label>
                          <p className="text-sm text-muted-foreground">For admin accounts</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Content Moderation</Label>
                          <p className="text-sm text-muted-foreground">Auto-flag inappropriate content</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Limits & Restrictions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label>Max Contexts per User</Label>
                        <Input type="number" defaultValue="50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Questions per Context</Label>
                        <Input type="number" defaultValue="100" />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Participants per Context</Label>
                        <Input type="number" defaultValue="1000" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t">
                    <div className="flex justify-between">
                      <Button variant="outline">Reset to Defaults</Button>
                      <Button>Save Settings</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}