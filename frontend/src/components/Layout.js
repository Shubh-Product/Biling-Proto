import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Plus, 
  CreditCard, 
  TrendingUp, 
  BarChart3,
  Building2,
  Settings,
  Users,
  FileText
} from "lucide-react";

const Layout = ({ children }) => {
  const location = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: location.pathname === "/" || location.pathname === "/dashboard"
    },
    {
      name: "New Transaction",
      href: "/new-transaction", 
      icon: Plus,
      current: location.pathname === "/new-transaction"
    },
    {
      name: "Upgrade/Renewal",
      href: "/upgrade-renewal",
      icon: TrendingUp,
      current: location.pathname === "/upgrade-renewal"
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      current: location.pathname === "/analytics"
    }
  ];

  const secondaryNavigation = [
    { name: "Customers", href: "#", icon: Users },
    { name: "Reports", href: "#", icon: FileText },
    { name: "Settings", href: "#", icon: Settings }
  ];

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="flex h-16 items-center px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">BIPL Sales Portal</h1>
              <p className="text-xs text-gray-500">Internal Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="mt-8 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
                    ${item.current
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <Icon
                    className={`
                      mr-3 h-5 w-5 transition-colors
                      ${item.current ? "text-blue-700" : "text-gray-400 group-hover:text-gray-500"}
                    `}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Management
            </h3>
            <div className="mt-2 space-y-1">
              {secondaryNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Icon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                    {item.name}
                  </a>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">SA</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Sales Admin</p>
              <p className="text-xs text-gray-500 truncate">admin@company.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="main-content">
        <div className="fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;