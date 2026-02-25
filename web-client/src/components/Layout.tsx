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
import { useWindowManager } from '../context/WindowManagerContext';
import { ProductList } from '../pages/ProductList';
import { Dashboard } from '../pages/Dashboard';
import { CustomerCenter } from '../pages/CustomerCenter';
import { Purchasing } from '../pages/Purchasing';
import { Manufacturing } from '../pages/Manufacturing';
import { Accounting } from '../pages/Accounting';
import { ChartOfAccounts } from '../pages/ChartOfAccounts';
import { Employees } from '../pages/Employees';
import { Estimates } from '../pages/Estimates';
import { Bills } from '../pages/Bills';
import { SalesReceipts } from '../pages/SalesReceipts';
import { CreditMemos } from '../pages/CreditMemos';
import { JournalEntries } from '../pages/JournalEntries';
import { Checks } from '../pages/Checks';
import { ReportCenter } from '../pages/ReportCenter';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  label: string;
  id: string;
  icon: any;
  component: React.ReactNode;
}

interface NavGroup {
  label: string;
  icon: any;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Customers',
    icon: IconUsers,
    items: [
      { label: 'Customer Center', id: 'customers', icon: IconUsers, component: <CustomerCenter /> },
      { label: 'Invoices', id: 'invoices', icon: IconFileInvoice, component: <Accounting /> },
      { label: 'Estimates', id: 'estimates', icon: IconFileText, component: <Estimates /> },
      { label: 'Sales Receipts', id: 'sales-receipts', icon: IconReceipt, component: <SalesReceipts /> },
      { label: 'Credit Memos', id: 'credit-memos', icon: IconCreditCard, component: <CreditMemos /> },
    ],
  },
  {
    label: 'Vendors',
    icon: IconBuildingStore,
    items: [
      { label: 'Vendor Center', id: 'purchasing', icon: IconTruck, component: <Purchasing /> },
      { label: 'Purchase Orders', id: 'purchase-orders', icon: IconShoppingCart, component: <Purchasing /> },
      { label: 'Enter Bills', id: 'enter-bills', icon: IconFileText, component: <Bills /> },
      { label: 'Pay Bills', id: 'pay-bills', icon: IconCash, component: <Bills /> },
    ],
  },
  {
    label: 'Employees',
    icon: IconUsersGroup,
    items: [
      { label: 'Employee Center', id: 'employees', icon: IconUsersGroup, component: <Employees /> },
      { label: 'Payroll', id: 'payroll', icon: IconCoin, component: <div>Payroll — Coming Soon</div> },
    ],
  },
  {
    label: 'Inventory',
    icon: IconPackage,
    items: [
      { label: 'Item List', id: 'products', icon: IconBox, component: <ProductList /> },
      { label: 'Inventory Activities', id: 'inventory-activities', icon: IconClipboardList, component: <div>Inventory Activities — Coming Soon</div> },
    ],
  },
  {
    label: 'Manufacturing',
    icon: IconBuildingFactory2,
    items: [
      { label: 'Recipes / BOMs', id: 'manufacturing', icon: IconTool, component: <Manufacturing /> },
      { label: 'Work Orders', id: 'work-orders', icon: IconClipboardList, component: <Manufacturing /> },
    ],
  },
  {
    label: 'Banking & Accounting',
    icon: IconScale,
    items: [
      { label: 'Chart of Accounts', id: 'chart-of-accounts', icon: IconListDetails, component: <ChartOfAccounts /> },
      { label: 'Journal Entries', id: 'journal-entries', icon: IconCalculator, component: <JournalEntries /> },
      { label: 'Bank Deposits', id: 'bank-deposits', icon: IconCash, component: <SalesReceipts /> },
      { label: 'Write Checks', id: 'write-checks', icon: IconFileText, component: <Checks /> },
    ],
  },
  {
    label: 'Reports',
    icon: IconReportAnalytics,
    items: [
      { label: 'Report Center', id: 'reports', icon: IconChartBar, component: <ReportCenter /> },
    ],
  },
];

export function Layout() {
  const [opened, { toggle }] = useDisclosure();
  const { tabs, activeTabId, openTab, closeTab, setActiveTabId } = useWindowManager();
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

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
          {/* Home */}
          <NavLink
            label="Home"
            leftSection={<IconHome size={18} />}
            onClick={() => openTab('home', 'Home', <Dashboard />)}
            active={activeTabId === 'home'}
            variant="filled"
            style={{ fontWeight: 500 }}
          />
          <Divider my={4} />

          {/* Grouped sections */}
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
                  leftSection={<item.icon size={16} />}
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
