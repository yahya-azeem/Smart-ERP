import { AppShell, Burger, Group, NavLink, ScrollArea, Title, Tabs, CloseButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useWindowManager } from '../context/WindowManagerContext';
import { ProductList } from '../pages/ProductList';
import { Dashboard } from '../pages/Dashboard';
import { CustomerCenter } from '../pages/CustomerCenter';
import { Purchasing } from '../pages/Purchasing';
import { Manufacturing } from '../pages/Manufacturing';
import { Accounting } from '../pages/Accounting';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const [opened, { toggle }] = useDisclosure();
  const { tabs, activeTabId, openTab, closeTab, setActiveTabId } = useWindowManager();
  const { user, logout } = useAuth();

  const links = [
    { label: 'Home', id: 'home', component: <Dashboard /> },
    { label: 'Customer Center', id: 'customers', component: <CustomerCenter /> },
    { label: 'Products', id: 'products', component: <ProductList /> },
    { label: 'Purchasing', id: 'purchasing', component: <Purchasing /> },
    { label: 'Manufacturing', id: 'manufacturing', component: <Manufacturing /> },
    { label: 'Accounting', id: 'accounting', component: <Accounting /> },
  ];

  const items = links.map((link) => (
    <NavLink
      key={link.id}
      label={link.label}
      onClick={() => openTab(link.id, link.label, link.component)}
      variant="filled"
      active={activeTabId === link.id}
    />
  ));

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3}>Smart ERP</Title>
          </Group>
          <Group>
            <div>{user?.username} ({user?.role})</div>
            <NavLink label="Logout" onClick={logout} w="auto" />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          {items}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        {tabs.length > 0 ? (
          <Tabs value={activeTabId} onChange={(val) => val && setActiveTabId(val)}>
            <Tabs.List>
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
                >
                  {tab.title}
                </Tabs.Tab>
              ))}
            </Tabs.List>

            {tabs.map((tab) => (
              <Tabs.Panel key={tab.id} value={tab.id} pt="xs">
                {tab.component}
              </Tabs.Panel>
            ))}
          </Tabs>
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>
            Select an item from the menu to open a window.
          </div>
        )}
      </AppShell.Main>
    </AppShell>
  );
}
