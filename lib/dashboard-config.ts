import { prisma } from "@/lib/prisma";

export interface DashboardConfig {
  kpis: {
    orders: boolean;
    production: boolean;
    lab: boolean;
    system: boolean;
    finance: boolean;
  };
  showUsage: boolean;
  showAlerts: boolean;
  sections: {
    lab: boolean;
    management: boolean;
    system: boolean;
  };
  order: ("kpis" | "usage" | "alerts" | "lab" | "management" | "system")[];
}

// Helper function to get default config based on role
function getRoleBasedDefaultConfig(role: string): DashboardConfig {
  // LAB_MANAGER, LAB_TECH, LAB_ENGINEER - Laboratory focused
  if (["LAB_MANAGER", "LAB_TECH", "LAB_ENGINEER"].includes(role)) {
    return {
      kpis: {
        orders: true, // ✓ Orders need lab approval
        production: true, // ✓ Production creates lab samples
        lab: true, // ✓ Lab tests and cubes
        system: false, // ✗ System-wide admin info
        finance: false, // ✗ Financial info
      },
      showUsage: false,
      showAlerts: true,
      sections: {
        lab: true, // ✓ FULL LAB SECTION with converter & tests
        management: false,
        system: false,
      },
      order: ["kpis", "alerts", "lab"],
    };
  }

  // SYSTEM_OWNER - Full system access
  if (role === "SYSTEM_OWNER") {
    return {
      kpis: {
        orders: true,
        production: true,
        lab: true,
        system: true,
        finance: true,
      },
      showUsage: true,
      showAlerts: true,
      sections: {
        lab: false,
        management: false,
        system: true,
      },
      order: ["kpis", "usage", "alerts", "system"],
    };
  }

  // MANAGER, COMPANY_ADMIN, DEPARTMENT_MANAGER - Management focused
  if (["MANAGER", "COMPANY_ADMIN", "DEPARTMENT_MANAGER"].includes(role)) {
    return {
      kpis: {
        orders: true,
        production: true,
        lab: true,
        system: false,
        finance: true,
      },
      showUsage: false,
      showAlerts: true,
      sections: {
        lab: false,
        management: true,
        system: false,
      },
      order: ["kpis", "alerts", "management"],
    };
  }

  // Default for other roles
  return {
    kpis: {
      orders: true,
      production: true,
      lab: false,
      system: false,
      finance: false,
    },
    showUsage: false,
    showAlerts: true,
    sections: {
      lab: false,
      management: false,
      system: false,
    },
    order: ["kpis", "alerts"],
  };
}

export async function getUserDashboardLayout(
  userId: number,
  role?: string, // Add role parameter
): Promise<DashboardConfig> {
  try {
    const setting = await prisma.userSetting.findUnique({
      where: {
        userId_key: {
          userId,
          key: "DASHBOARD_LAYOUT",
        },
      },
    });

    // Get role-based default
    const defaultConfig = role
      ? getRoleBasedDefaultConfig(role)
      : getRoleBasedDefaultConfig("OPERATOR");

    if (setting && setting.value) {
      try {
        const parsed = JSON.parse(setting.value);
        // User preferences override role defaults
        return {
          ...defaultConfig,
          ...parsed,
          kpis: { ...defaultConfig.kpis, ...(parsed.kpis || {}) },
          sections: {
            ...defaultConfig.sections,
            ...(parsed.sections || {}),
          },
          order: Array.isArray(parsed.order)
            ? parsed.order
            : defaultConfig.order,
        };
      } catch (e) {
        console.error("Failed to parse DASHBOARD_LAYOUT for user", userId, e);
      }
    }
  } catch (error) {
    console.warn("Error fetching dashboard layout:", error);
  }

  // Return role-based default
  return role
    ? getRoleBasedDefaultConfig(role)
    : getRoleBasedDefaultConfig("OPERATOR");
}
