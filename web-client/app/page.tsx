'use client';

import React, { useState } from 'react';
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
  TextInput,
  PasswordInput,
  Button,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconHome,
  IconUsers,
  IconBuildingStore,
  IconPackage,
  IconUsersGroup,
  IconReportAnalytics,
  IconBuildingFactory2,
  IconScale,
  IconSun,
  IconMoon,
  IconLogout,
} from '@tabler/icons-react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { WindowManagerProvider, useWindowManager } from '../src/context/WindowManagerContext';

import { Dashboard } from '../src/views/Dashboard';
import { CustomerCenter } from '../src/views/CustomerCenter';
import { Purchasing } from '../src/views/Purchasing';
import { Accounting } from '../src/views/Accounting';
import { ProductList } from '../src/views/ProductList';
import { Bills } from '../src/views/Bills';
import { ReportCenter } from '../src/views/ReportCenter';
import { Employees } from '../src/views/Employees';
import { Payroll } from '../src/views/Payroll';
import { Manufacturing } from '../src/views/Manufacturing';
import { ChartOfAccounts } from '../src/views/ChartOfAccounts';
import { JournalEntries } from '../src/views/JournalEntries';
import { BankReconciliation } from '../src/views/BankReconciliation';
import { SalesReceipts } from '../src/views/SalesReceipts';
import { SalesTaxManagement } from '../src/views/SalesTaxManagement';
import { CreditMemos } from '../src/views/CreditMemos';
import { Estimates } from '../src/views/Estimates';
import { InventoryActivities } from '../src/views/InventoryActivities';
import { Checks } from '../src/views/Checks';

const navGroups = [
  {
    label: 'Customers',
    icon: IconUsers,
    items: [
      { label: 'Customer Center', id: 'customers', component: <CustomerCenter /> },
      { label: 'Invoices', id: 'invoices', component: <Accounting /> },
      { label: 'Estimates', id: 'estimates', component: <Estimates /> },
      { label: 'Sales Receipts', id: 'sales-receipts', component: <SalesReceipts /> },
      { label: 'Credit Memos', id: 'credit-memos', component: <CreditMemos /> },
    ],
  },
  {
    label: 'Vendors',
    icon: IconBuildingStore,
    items: [
      { label: 'Vendor Center', id: 'purchasing', component: <Purchasing /> },
      { label: 'Purchase Orders', id: 'purchase-orders', component: <Purchasing /> },
      { label: 'Enter Bills', id: 'enter-bills', component: <Bills /> },
      { label: 'Pay Bills', id: 'pay-bills', component: <Bills /> },
    ],
  },
  {
    label: 'Employees',
    icon: IconUsersGroup,
    items: [
      { label: 'Employee Center', id: 'employees', component: <Employees /> },
      { label: 'Payroll', id: 'payroll', component: <Payroll /> },
    ],
  },
  {
    label: 'Inventory',
    icon: IconPackage,
    items: [
      { label: 'Item List', id: 'products', component: <ProductList /> },
      { label: 'Inventory Activities', id: 'inventory-activities', component: <InventoryActivities /> },
    ],
  },
  {
    label: 'Manufacturing',
    icon: IconBuildingFactory2,
    items: [
      { label: 'Recipes / BOMs', id: 'manufacturing', component: <Manufacturing /> },
      { label: 'Work Orders', id: 'work-orders', component: <Manufacturing /> },
    ],
  },
  {
    label: 'Banking & Accounting',
    icon: IconScale,
    items: [
      { label: 'Chart of Accounts', id: 'chart-of-accounts', component: <ChartOfAccounts /> },
      { label: 'Journal Entries', id: 'journal-entries', component: <JournalEntries /> },
      { label: 'Bank Deposits', id: 'bank-deposits', component: <Accounting /> },
      { label: 'Write Checks', id: 'write-checks', component: <Checks /> },
      { label: 'Bank Reconciliation', id: 'bank-recon', component: <BankReconciliation /> },
      { label: 'Sales Tax', id: 'sales-tax', component: <SalesTaxManagement /> },
    ],
  },
  {
    label: 'Reports',
    icon: IconReportAnalytics,
    items: [
      { label: 'Report Center', id: 'reports', component: <ReportCenter /> },
    ],
  },
];

function Layout() {
  const [opened, { toggle }] = useDisclosure();
  const { tabs, activeTabId, openTab, closeTab, setActiveTabId } = useWindowManager();
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  React.useEffect(() => {
    openTab('home', 'Home', <Dashboard />);
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
            onClick={() => openTab('home', 'Home', <Dashboard />)}
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
                  onClick={() => openTab(item.id, item.label, item.component)}
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

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '11111111-1111-1111-1111-111111111111'
        },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        login(data.token, data.user);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }

    setLoading(false);
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

function AppContent() {
  const { user, token } = useAuth();

  if (!token) {
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
