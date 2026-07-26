import { RoleName } from "@/lib/roles";
import { Locale } from "@/lib/dictionary";

export type DashboardWidget = {
  id: string;
  title: string;
  type: "stat" | "chart" | "list" | "action";
  w: number; // width in grid columns (1-4)
  h: number; // height in grid rows
  dataSource: string; // API endpoint or server action name
};

export type DashboardTab = {
  id: string;
  label: string;
  icon?: string;
  widgets: DashboardWidget[];
};

export type NavigationItem = {
  label: string;
  href: string;
  icon: string;
};

export type DashboardConfig = {
  title: string;
  basePath: string;
  navigation: NavigationItem[]; // NEW: Sidebar items
  tabs: DashboardTab[];
  defaultTab: string;
  allowedActions: string[];
};

export function getDashboardConfig(
  role: RoleName | string,
  locale: Locale = "ar",
  department?: string,
  pathname?: string,
): DashboardConfig {
  const isAr = locale === "ar";

  // 1. مالك النظام (الوصول الشامل)
  if (role === "SYSTEM_OWNER") {
    // محاكاة الأنظمة الفرعية لمالك النظام بناءً على المسار

    // نظام المختبر
    if (pathname && pathname.includes("/system/lab")) {
      return {
        title: isAr ? "نظام المختبر (إشراف كامل)" : "Lab System (Super Admin)",
        basePath: "/system/lab",
        defaultTab: "pending",
        allowedActions: ["*"],
        navigation: [
          {
            label: isAr ? "العودة للوحة الإدارة" : "Back to Admin",
            href: "/admin",
            icon: "ArrowRight",
          },
          {
            label: isAr ? "تصاميم الخلطات" : "Mix Designs",
            href: "/system/lab/mix-designs",
            icon: "Beaker",
          },
          {
            label: isAr ? "شاشة التلفزيون الحي" : "Live TV Dashboard",
            href: "/system/tv",
            icon: "Monitor",
          },
          {
            label: isAr ? "اعتمادات الطلبات" : "Order Approvals",
            href: "/system/lab/approvals",
            icon: "CheckSquare",
          },
          {
            label: isAr ? "نتائج النماذج الخرسانية" : "Cube Results",
            href: "/system/lab/cube-results",
            icon: "Activity",
          },
          {
            label: isAr ? "المعايير والمواصفات" : "Standards",
            href: "/system/lab/standards",
            icon: "Scale",
          },
          {
            label: isAr ? "تحليل المناخل" : "Sieve Analysis",
            href: "/system/lab/sieve-analysis",
            icon: "Filter",
          },
          {
            label: isAr ? "أرشيف المختبر" : "Lab Archive",
            href: "/system/lab/archive",
            icon: "Archive",
          },
          {
            label: isAr ? "الأدوات" : "Tools",
            href: "/system/lab/tools",
            icon: "Tool",
          },
          {
            label: isAr ? "ذكاء المختبر" : "Lab Intelligence",
            href: "/system/lab/intelligence",
            icon: "Brain",
          },
          {
            label: isAr ? "إعدادات المختبر" : "Lab Settings",
            href: "/system/lab/settings",
            icon: "Settings",
          },
          {
            label: isAr ? "مشاركة الملفات" : "File Share",
            href: "/system/lab/share",
            icon: "Upload",
          },
        ],
        tabs: [],
      };
    }

    // نظام التشغيل
    if (pathname && pathname.includes("/system/operator")) {
      return {
        title: isAr
          ? "نظام التشغيل (إشراف كامل)"
          : "Operation System (Super Admin)",
        basePath: "/system/operator",
        defaultTab: "production",
        allowedActions: ["*"],
        navigation: [
          {
            label: isAr ? "العودة للوحة الإدارة" : "Back to Admin",
            href: "/admin",
            icon: "ArrowRight",
          },
          {
            label: isAr ? "خط الإنتاج" : "Production",
            href: "/system/operator/production",
            icon: "Factory",
          },
          {
            label: isAr ? "تذاكر التسليم" : "Tickets",
            href: "/system/operator/tickets",
            icon: "Ticket",
          },
          {
            label: isAr ? "مخزون المواد" : "Materials",
            href: "/system/operator/material-status",
            icon: "Box",
          },
        ],
        tabs: [],
      };
    }

    // نظام المحاسبة
    if (pathname && pathname.includes("/system/accountant")) {
      return {
        title: isAr
          ? "النظام المحاسبي (إشراف كامل)"
          : "Accounting System (Super Admin)",
        basePath: "/system/accountant",
        defaultTab: "invoices",
        allowedActions: ["*"],
        navigation: [
          {
            label: isAr ? "العودة للوحة الإدارة" : "Back to Admin",
            href: "/admin",
            icon: "ArrowRight",
          },
          {
            label: isAr ? "إدارة الفواتير" : "Invoices",
            href: "/system/accountant/invoices",
            icon: "FileText",
          },
          {
            label: isAr ? "المصاريف التشغيلية" : "Expenses",
            href: "/system/accountant/expenses",
            icon: "TrendingDown",
          },
          {
            label: isAr ? "رواتب الموظفين" : "Payroll",
            href: "/system/accountant/payroll",
            icon: "Users",
          },
          {
            label: isAr ? "التقارير المالية" : "Financial Reports",
            href: "/system/accountant/reports",
            icon: "BarChart2",
          },
          {
            label: isAr ? "مشاركة الملفات" : "File Share",
            href: "/system/accountant/share",
            icon: "Upload",
          },
        ],
        tabs: [],
      };
    }

    // نظام المبيعات لمالك النظام
    if (pathname && pathname.includes("/system/sales")) {
      return {
        title: isAr
          ? "نظام المبيعات (إشراف كامل)"
          : "Sales System (Super Admin)",
        basePath: "/system/sales",
        defaultTab: "orders",
        allowedActions: ["*"],
        navigation: [
          {
            label: isAr ? "العودة للوحة الإدارة" : "Back to Admin",
            href: "/admin",
            icon: "ArrowRight",
          },
          {
            label: isAr ? "طلبات الزبائن" : "Orders",
            href: "/system/sales/orders",
            icon: "Briefcase",
          },
          {
            label: isAr ? "العملاء" : "Customers",
            href: "/system/sales/customers",
            icon: "Users",
          },
          {
            label: isAr ? "المشاريع" : "Projects",
            href: "/system/sales/projects",
            icon: "Project",
          },
          {
            label: isAr ? "مشاركة الملفات" : "File Share",
            href: "/system/sales/share",
            icon: "Upload",
          },
        ],
        tabs: [],
      };
    }

    // لوحة تحكم الإدارة (الافتراضية لمالك النظام)
    if (
      pathname &&
      (pathname.includes("/system/manager") ||
        pathname.includes("/system/dashboard"))
    ) {
      return {
        title: isAr
          ? "نظام الإدارة (إشراف كامل)"
          : "Manager System (Super Admin)",
        basePath: "/system/manager",
        defaultTab: "overview",
        allowedActions: ["*"],
        navigation: [
          {
            label: isAr ? "العودة للوحة الإدارة" : "Back to Admin",
            href: "/admin",
            icon: "ArrowRight",
          },
          {
            label: isAr ? "نظرة عامة" : "Dashboard",
            href: "/system/manager/dashboard",
            icon: "Dashboard",
          },
          {
            label: isAr ? "شاشة التلفزيون الحي" : "Live TV Dashboard",
            href: "/system/tv",
            icon: "Monitor",
          },
          {
            label: isAr ? "طلبات الزبائن" : "Orders",
            href: "/system/orders",
            icon: "Briefcase",
          },
          {
            label: isAr ? "العملاء" : "Customers",
            href: "/system/sales/customers",
            icon: "Users",
          },
          {
            label: isAr ? "مراقبة المواد" : "Materials",
            href: "/system/manager/materials",
            icon: "Box",
          },
          {
            label: isAr ? "إدارة المعدات" : "Machines",
            href: "/system/manager/machines",
            icon: "Truck",
          },
          {
            label: isAr ? "إشعارات المختبر" : "Lab Alerts",
            href: "/system/manager/lab-notifications",
            icon: "Bell",
          },
          {
            label: isAr ? "سجل العمليات" : "Logs",
            href: "/system/manager/logs",
            icon: "History",
          },
          {
            label: isAr ? "إعدادات بوابة العملاء" : "Client Portal Settings",
            href: "/system/manager/portal-settings",
            icon: "Globe",
          },
          {
            label: isAr ? "مشاركة الملفات" : "File Share",
            href: "/system/manager/network/share",
            icon: "Upload",
          },
          {
            label: isAr ? "تتبع الشاحنات" : "Vehicle Tracking",
            href: "/system/manager/tracking",
            icon: "MapPin",
          },
          {
            label: isAr ? "إعدادات الشركة" : "Company Settings",
            href: "/system/manager/settings",
            icon: "Settings",
          },
        ],
        tabs: [],
      };
    }

    // الواجهة الرئيسية لمالك النظام (Admin Panel)
    return {
      title: isAr ? "برج المراقبة" : "Control Tower",
      basePath: "/admin",
      defaultTab: "overview",
      allowedActions: ["*"],
      navigation: [
        {
          label: isAr ? "لوحة المعلومات" : "Dashboard",
          href: "/admin",
          icon: "Dashboard",
        },
        {
          label: isAr ? "إدارة الشركات" : "Companies",
          href: "/admin/companies",
          icon: "Factory",
        },
        {
          label: isAr ? "خطط الاشتراك" : "Plans",
          href: "/admin/plans",
          icon: "CreditCard",
        },
        {
          label: isAr ? "الفواتير والنظام المالي" : "Billing",
          href: "/admin/billing",
          icon: "DollarSign",
        },
        {
          label: isAr ? "الصلاحيات والأدوار" : "Permissions",
          href: "/admin/rbac",
          icon: "Lock",
        },
        {
          label: isAr ? "المميزات والخدمات" : "Features",
          href: "/admin/features",
          icon: "Box",
        },
        {
          label: isAr ? "سجل النشاط العالمي" : "Activity",
          href: "/admin/activity",
          icon: "Activity",
        },
        {
          label: isAr ? "تنبيهات النظام" : "System Alerts",
          href: "/admin/alerts",
          icon: "ShieldAlert",
        },
        {
          label: isAr ? "إعدادات النظام" : "System Settings",
          href: "/admin/settings/system",
          icon: "Settings",
        },
        {
          label: isAr ? "التحكم بالصفحة الرئيسية" : "Landing Page",
          href: "/admin/landing",
          icon: "Globe",
        },
        {
          label: isAr ? "النسخ الاحتياطي" : "Backups",
          href: "/admin/settings/backup",
          icon: "Database",
        },
        {
          label: isAr ? "السجل الزمني (آلة الزمن)" : "Time-Travel Ledger",
          href: "/admin/settings/ledger",
          icon: "Clock",
        },
      ],
      tabs: [],
    };
  }

  // 2. المحاسب
  if (role === "ACCOUNTANT") {
    return {
      title: isAr ? "النظام المحاسبي" : "Accounting System",
      basePath: "/system/accountant",
      defaultTab: "invoices",
      allowedActions: ["ViewFinance", "ManageInvoices", "ManagePayroll"],
      navigation: [
        {
          label: isAr ? "الفواتير والذمم" : "Invoices",
          href: "/system/accountant/invoices",
          icon: "FileText",
        },
        {
          label: isAr ? "المصاريف التشغيلية" : "Expenses",
          href: "/system/accountant/expenses",
          icon: "TrendingDown",
        },
        {
          label: isAr ? "رواتب الموظفين" : "Payroll",
          href: "/system/accountant/payroll",
          icon: "Users",
        },
        {
          label: isAr ? "التقارير المالية" : "Financial Reports",
          href: "/system/accountant/reports",
          icon: "BarChart2",
        },
        {
          label: isAr ? "مشاركة الملفات" : "File Share",
          href: "/system/accountant/share",
          icon: "Upload",
        },
      ],
      tabs: [],
    };
  }

  // 3. الإدارة
  if (role === "MANAGER" || role === "COMPANY_ADMIN") {
    // If manager visits lab routes, show lab context
    if (pathname && pathname.includes("/system/lab")) {
      return getDashboardConfig("LAB_MANAGER", locale, department, pathname);
    }

    return {
      title: isAr ? "نظام الإدارة" : "Manager System",
      basePath: "/system/manager",
      defaultTab: "overview",
      allowedActions: ["ManageUsers", "ViewFinance", "ApproveOrders"],
      navigation: [
        {
          label: isAr ? "لوحة المعلومات" : "Dashboard",
          href: "/system/manager/dashboard",
          icon: "Dashboard",
        },
        {
          label: isAr ? "شاشة التلفزيون الحي" : "Live TV Dashboard",
          href: "/system/tv",
          icon: "Monitor",
        },
        {
          label: isAr ? "الطلبات" : "Orders",
          href: "/system/orders",
          icon: "Briefcase",
        },
        {
          label: isAr ? "العملاء" : "Customers",
          href: "/system/sales/customers",
          icon: "Users",
        },
        {
          label: isAr ? "المواد" : "Materials",
          href: "/system/manager/materials",
          icon: "Box",
        },
        {
          label: isAr ? "المعدات" : "Machines",
          href: "/system/manager/machines",
          icon: "Truck",
        },
        {
          label: isAr ? "تنبيهات المختبر" : "Lab Alerts",
          href: "/system/manager/lab-notifications",
          icon: "Bell",
        },
        {
          label: isAr ? "التقارير" : "Reports",
          href: "/system/manager/logs",
          icon: "FileText",
        },
        {
          label: isAr ? "المستخدمون والمشتركون" : "Users",
          href: "/system/manager/users",
          icon: "Users",
        },
        {
          label: isAr ? "إدارة الأجهزة والشبكة" : "Network & Devices",
          href: "/system/manager/network",
          icon: "Activity",
        },
        {
          label: isAr ? "مشاركة الملفات" : "File Share",
          href: "/system/manager/network/share",
          icon: "Upload",
        },
        {
          label: isAr ? "إعدادات الشركة" : "Company Settings",
          href: "/system/manager/settings",
          icon: "Settings",
        },
      ],
      tabs: [],
    };
  }

  // 4. المختبر
  if (["LAB_TECH", "LAB_ENGINEER", "LAB_MANAGER"].includes(role)) {
    const fullNavigation = [
      {
        label: isAr ? "نظرة عامة" : "Overview",
        href: "/system/lab",
        icon: "Dashboard",
      },
      {
        label: isAr ? "شاشة التلفزيون الحي" : "Live TV Dashboard",
        href: "/system/tv",
        icon: "Monitor",
      },
      {
        label: isAr ? "تصاميم الخلطات" : "Mix Designs",
        href: "/system/lab/mix-designs",
        icon: "Beaker",
      },
      {
        label: isAr ? "اعتمادات الطلبات" : "Order Approvals",
        href: "/system/lab/approvals",
        icon: "CheckSquare",
      },
      {
        label: isAr ? "نتائج النماذج الخرسانية" : "Cube Results",
        href: "/system/lab/cube-results",
        icon: "Activity",
      },
      {
        label: isAr ? "تحليل المناخل" : "Sieve Analysis",
        href: "/system/lab/sieve-analysis",
        icon: "Filter",
      },
      {
        label: isAr ? "المعايير والمواصفات" : "Standards",
        href: "/system/lab/standards",
        icon: "Scale",
      },
      {
        label: isAr ? "الأرشيف" : "Archive",
        href: "/system/lab/archive",
        icon: "Archive",
      },
      {
        label: isAr ? "الأدوات" : "Tools",
        href: "/system/lab/tools",
        icon: "Tool",
      },
      {
        label: isAr ? "إعدادات المختبر" : "Lab Settings",
        href: "/system/lab/settings",
        icon: "Settings",
      },
      {
        label: isAr ? "مشاركة الملفات" : "File Share",
        href: "/system/lab/share",
        icon: "Upload",
      },
    ];

    let navigation = fullNavigation;

    if (role === "LAB_TECH") {
      // فني المختبر: يرى فقط (نظرة عامة، نتائج النماذج، تحليل المناخل، مشاركة الملفات، واعتمادات الطلبات)
      navigation = fullNavigation.filter((item) =>
        [
          "/system/lab",
          "/system/lab/cube-results",
          "/system/lab/sieve-analysis",
          "/system/lab/share",
          "/system/lab/approvals",
        ].includes(item.href),
      );
    } else if (role === "LAB_ENGINEER") {
      // مهندس المختبر: يرى كل شيء عدا إعدادات المختبر
      navigation = fullNavigation.filter(
        (item) => item.href !== "/system/lab/settings",
      );
    }

    if (role === "LAB_MANAGER") {
      navigation.push({
        label: isAr ? "المستخدمون" : "Users",
        href: "/system/manager/users",
        icon: "Users",
      });
    }

    return {
      title: isAr ? "نظام المختبر" : "Lab System",
      basePath: "/system/lab",
      defaultTab: "pending",
      allowedActions: ["EnterMixDesigns", "ApproveSamples"],
      navigation,
      tabs: [],
    };
  }

  // 5. التشغيل
  if (role === "OPERATOR") {
    return {
      title: isAr ? "نظام التشغيل" : "Operation System",
      basePath: "/system/operator",
      defaultTab: "production",
      allowedActions: ["ViewOrders", "LogProduction"],
      navigation: [
        {
          label: isAr ? "الإنتاج" : "Production",
          href: "/system/operator/production",
          icon: "Factory",
        },
        {
          label: isAr ? "تذاكر التسليم" : "Tickets",
          href: "/system/operator/tickets",
          icon: "Ticket",
        },
        {
          label: isAr ? "المواد" : "Materials",
          href: "/system/operator/material-status",
          icon: "Box",
        },
      ],
      tabs: [],
    };
  }

  // 6. المبيعات
  if (role === "SALES" || role === "SALES_REP" || role === "SALES_MANAGER") {
    const navigation = [
      {
        label: isAr ? "طلبات الزبائن" : "Orders",
        href: "/system/sales/orders",
        icon: "Briefcase",
      },
      {
        label: isAr ? "العملاء" : "Customers",
        href: "/system/sales/customers",
        icon: "Users",
      },
      {
        label: isAr ? "المشاريع" : "Projects",
        href: "/system/sales/projects",
        icon: "Project",
      },
      {
        label: isAr ? "مشاركة الملفات" : "File Share",
        href: "/system/sales/share",
        icon: "Upload",
      },
    ];

    if (role === "SALES_MANAGER") {
      navigation.push({
        label: isAr ? "المستخدمون" : "Users",
        href: "/system/manager/users",
        icon: "Users",
      });
    }

    return {
      title: isAr ? "نظام المبيعات" : "Sales System",
      basePath: "/system/sales",
      defaultTab: "orders",
      allowedActions: ["ViewOrders", "ManageSales"],
      navigation,
      tabs: [],
    };
  }

  // الافتراضي (حماية)
  return {
    title: isAr ? "لوحة المعلومات" : "Dashboard",
    basePath: "/system/dashboard",
    defaultTab: "home",
    allowedActions: [],
    navigation: [],
    tabs: [],
  };
}
