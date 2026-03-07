'use client';

import { useState, useEffect, useRef, ReactNode, createContext, useContext } from 'react';
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  ScrollArea,
  Title,
  Tabs,
  CloseButton,
  Text,
  Divider,
  useMantineColorScheme,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconHome,
  IconUsers,
  IconFileInvoice,
  IconFileText,
  IconReceipt,
  IconCreditCard,
  IconBuildingStore,
  IconTruck,
  IconShoppingCart,
  IconPackage,
  IconUsersGroup,
  IconCash,
  IconReportAnalytics,
  IconChartBar,
  IconTool,
  IconClipboardList,
  IconBuildingFactory2,
  IconBox,
  IconSun,
  IconMoon,
  IconLogout,
  IconCoin,
  IconScale,
  IconListDetails,
  IconCalculator,
} from '@tabler/icons-react';

interface User {
  id: string;
  username: string;
  role: string;
  tenant_id: string;
}

interface Tab {
  id: string;
  title: string;
  component: ReactNode;
}

interface WindowManagerContextType {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (id: string, title: string, component: ReactNode) => void;
  closeTab: (id: string) => void;
  setActiveTabId: (id: string) => void;
}

const WindowManagerContext = createContext<WindowManagerContextType | null>(null);

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error('useWindowManager must be used within provider');
  return ctx;
}

function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const openTab = (id: string, title: string, component: ReactNode) => {
    setTabs((prev) => {
      if (prev.some((t) => t.id === id)) {
        setActiveTabId(id);
        return prev;
      }
      return [...prev, { id, title, component }];
    });
    setActiveTabId(id);
  };

  const closeTab = (id: string) => {
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== id);
      if (activeTabId === id && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }
      return newTabs;
    });
  };

  return (
    <WindowManagerContext.Provider value={{ tabs, activeTabId, openTab, closeTab, setActiveTabId }}>
      {children}
    </WindowManagerContext.Provider>
  );
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('smart_erp_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        const userData = { ...data.user, token: data.token };
        localStorage.setItem('smart_erp_user', JSON.stringify(userData));
        setUser(userData);
        return true;
      }
    } catch (e) {
      console.error('Login error:', e);
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('smart_erp_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

const navGroups = [
  {
    label: 'Customers',
    icon: IconUsers,
    items: [
      { label: 'Customer Center', id: 'customers' },
      { label: 'Invoices', id: 'invoices' },
      { label: 'Estimates', id: 'estimates' },
      { label: 'Sales Receipts', id: 'sales-receipts' },
      { label: 'Credit Memos', id: 'credit-memos' },
    ],
  },
  {
    label: 'Vendors',
    icon: IconBuildingStore,
    items: [
      { label: 'Vendor Center', id: 'purchasing' },
      { label: 'Purchase Orders', id: 'purchase-orders' },
      { label: 'Enter Bills', id: 'enter-bills' },
      { label: 'Pay Bills', id: 'pay-bills' },
    ],
  },
  {
    label: 'Employees',
    icon: IconUsersGroup,
    items: [
      { label: 'Employee Center', id: 'employees' },
      { label: 'Payroll', id: 'payroll' },
    ],
  },
  {
    label: 'Inventory',
    icon: IconPackage,
    items: [
      { label: 'Item List', id: 'products' },
      { label: 'Inventory Activities', id: 'inventory-activities' },
    ],
  },
  {
    label: 'Manufacturing',
    icon: IconBuildingFactory2,
    items: [
      { label: 'Recipes / BOMs', id: 'manufacturing' },
      { label: 'Work Orders', id: 'work-orders' },
    ],
  },
  {
    label: 'Banking & Accounting',
    icon: IconScale,
    items: [
      { label: 'Chart of Accounts', id: 'chart-of-accounts' },
      { label: 'Journal Entries', id: 'journal-entries' },
      { label: 'Bank Deposits', id: 'bank-deposits' },
      { label: 'Write Checks', id: 'write-checks' },
      { label: 'Bank Reconciliation', id: 'bank-recon' },
      { label: 'Sales Tax', id: 'sales-tax' },
    ],
  },
  {
    label: 'Reports',
    icon: IconReportAnalytics,
    items: [
      { label: 'Report Center', id: 'reports' },
    ],
  },
];

function DashboardContent() {
  return (
    <div style={{ padding: 20 }}>
      <Title order={2} mb="md">Dashboard</Title>
      <Text c="dimmed">Welcome to Smart ERP</Text>
    </div>
  );
}

function Layout() {
  const [opened, { toggle }] = useDisclosure();
  const { tabs, activeTabId, openTab, closeTab, setActiveTabId } = useWindowManager();
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const hasOpened = useRef(false);

  useEffect(() => {
    if (!hasOpened.current) {
      hasOpened.current = true;
      openTab('home', 'Home', <DashboardContent />);
    }
  }, []);

  return (
    <AppShell
      header={{ height: 50 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding={0}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4} fw={700}>Smart ERP</Title>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed">{user?.username} ({user?.role})</Text>
            <Tooltip label={colorScheme === 'dark' ? 'Light mode' : 'Dark mode'}>
              <ActionIcon variant="subtle" onClick={() => toggleColorScheme()} size="md">
                {colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Logout">
              <ActionIcon variant="subtle" color="red" onClick={logout} size="md">
                <IconLogout size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <AppShell.Section grow component={ScrollArea} scrollbarSize={6}>
          <NavLink
            label="Home"
            leftSection={<IconHome size={18} />}
            onClick={() => openTab('home', 'Home', <DashboardContent />)}
            active={activeTabId === 'home'}
            variant="filled"
            style={{ fontWeight: 500 }}
          />
          <Divider my={4} />

          {navGroups.map((group) => (
            <NavLink
              key={group.label}
              label={group.label}
              leftSection={<group.icon size={18} />}
              childrenOffset={24}
              defaultOpened={false}
              style={{ fontWeight: 500 }}
            >
              {group.items.map((item) => (
                <NavLink
                  key={item.id}
                  label={item.label}
                  onClick={() => openTab(item.id, item.label, <div style={{ padding: 20 }}><Title order={3}>{item.label}</Title><Text c="dimmed" mt="md">Page: {item.id}</Text></div>)}
                  active={activeTabId === item.id}
                  variant="filled"
                  style={{ fontSize: 13 }}
                />
              ))}
            </NavLink>
          ))}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        {tabs.length > 0 ? (
          <Tabs
            value={activeTabId}
            onChange={(val) => val && setActiveTabId(val)}
            variant="outline"
            style={{ height: 'calc(100vh - 50px)', display: 'flex', flexDirection: 'column' }}
          >
            <Tabs.List style={{ flexShrink: 0, borderBottom: '1px solid var(--mantine-color-dark-4)' }}>
              {tabs.map((tab) => (
                <Tabs.Tab
                  key={tab.id}
                  value={tab.id}
                  rightSection={
                    <CloseButton
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                    />
                  }
                  style={{ fontSize: 13 }}
                >
                  {tab.title}
                </Tabs.Tab>
              ))}
            </Tabs.List>

            <div style={{ flex: 1, overflow: 'auto' }}>
              {tabs.map((tab) => (
                <Tabs.Panel key={tab.id} value={tab.id} p="md" style={{ minHeight: '100%' }}>
                  {tab.component}
                </Tabs.Panel>
              ))}
            </div>
          </Tabs>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--mantine-color-dimmed)' }}>
            <IconHome size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <Text size="lg" fw={500}>Welcome to Smart ERP</Text>
            <Text size="sm" c="dimmed" mt={4}>Select an item from the sidebar to get started.</Text>
          </div>
        )}
      </AppShell.Main>
    </AppShell>
  );
}

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(username, password);
    setLoading(false);
    if (!success) {
      setError('Invalid credentials');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--mantine-color-dark-8)',
    }}>
      <div style={{
        width: 400,
        padding: 30,
        borderRadius: 8,
        background: 'var(--mantine-color-dark-7)',
      }}>
        <Title order={2} ta="center" mb="lg">Smart ERP</Title>
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            mb="sm"
          />
          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            mb="md"
          />
          {error && <Text c="red" size="sm" mb="sm">{error}</Text>}
          <Button type="submit" fullWidth loading={loading}>
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}

import { TextInput, PasswordInput, Button } from '@mantine/core';

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <WindowManagerProvider>
      <Layout />
    </WindowManagerProvider>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
