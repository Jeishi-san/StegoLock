import {
  Users,
  UserCheck,
  Lock,
  AlertCircle,
  TrendingUp,
  Activity,
  Database,
  Shield,
} from "lucide-react";

export function AdminDashboard() {
  const stats = [
    {
      label: "Total Users",
      value: "1,284",
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "blue",
    },
    {
      label: "Active Users",
      value: "892",
      change: "+5%",
      trend: "up",
      icon: UserCheck,
      color: "green",
    },
    {
      label: "Encrypted Containers",
      value: "15,432",
      change: "+18%",
      trend: "up",
      icon: Lock,
      color: "purple",
    },
    {
      label: "Failed Reconstructions",
      value: "23",
      change: "-8%",
      trend: "down",
      icon: AlertCircle,
      color: "red",
    },
  ];

  const systemHealth = [
    { label: "Fragment Storage", status: "operational", value: "99.8%" },
    { label: "Encryption Service", status: "operational", value: "100%" },
    { label: "User Authentication", status: "operational", value: "99.9%" },
    { label: "API Gateway", status: "degraded", value: "95.2%" },
  ];

  const recentActivity = [
    { user: "john.smith@company.com", action: "Created new container", time: "2 minutes ago", status: "success" },
    { user: "admin@stegolock.com", action: "Suspended user account", time: "15 minutes ago", status: "warning" },
    { user: "jane.doe@company.com", action: "Failed reconstruction attempt", time: "1 hour ago", status: "error" },
    { user: "system", action: "Automated backup completed", time: "2 hours ago", status: "success" },
    { user: "mike.jones@company.com", action: "Fragment integrity check passed", time: "3 hours ago", status: "success" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">System overview and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-slate-400 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stat.value}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-sm font-medium ${
                      stat.trend === "up" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-slate-500 text-xs">vs last month</span>
                </div>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  stat.color === "blue"
                    ? "bg-blue-600/20"
                    : stat.color === "green"
                      ? "bg-green-600/20"
                      : stat.color === "purple"
                        ? "bg-purple-600/20"
                        : "bg-red-600/20"
                }`}
              >
                <stat.icon
                  className={`size-6 ${
                    stat.color === "blue"
                      ? "text-blue-400"
                      : stat.color === "green"
                        ? "text-green-400"
                        : stat.color === "purple"
                          ? "text-purple-400"
                          : "text-red-400"
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="size-5 text-slate-400" />
            <h2 className="text-xl font-semibold text-white">System Health</h2>
          </div>
          <div className="space-y-4">
            {systemHealth.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      item.status === "operational"
                        ? "bg-green-500"
                        : item.status === "degraded"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  <span className="text-slate-300 text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium text-sm">
                    {item.value}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.status === "operational"
                        ? "bg-green-600/20 text-green-400"
                        : item.status === "degraded"
                          ? "bg-yellow-600/20 text-yellow-400"
                          : "bg-red-600/20 text-red-400"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Database className="size-5 text-slate-400" />
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`mt-1 p-1.5 rounded-full ${
                    activity.status === "success"
                      ? "bg-green-600/20"
                      : activity.status === "warning"
                        ? "bg-yellow-600/20"
                        : "bg-red-600/20"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.status === "success"
                        ? "bg-green-500"
                        : activity.status === "warning"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 text-sm">{activity.action}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
