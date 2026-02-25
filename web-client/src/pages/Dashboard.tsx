import { SimpleGrid, Paper, Title, Text, Group, ThemeIcon, Card, Center, Stack, Table, Badge } from '@mantine/core';
import { IconArrowRight, IconShoppingCart, IconTruck, IconFileInvoice, IconCoin, IconReportAnalytics } from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useWindowManager } from '../context/WindowManagerContext';
import { ProductList } from './ProductList';
import { Purchasing } from './Purchasing';
import { Accounting } from './Accounting';
import { Bills } from './Bills';
import { ReportCenter } from './ReportCenter';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

const COLORS = ['#228be6', '#40c057', '#fab005', '#fa5252', '#7950f2', '#20c997'];

const WorkflowStep = ({ icon: Icon, label, onClick }: any) => (
  <Stack align="center" gap="xs" style={{ cursor: 'pointer' }} onClick={onClick}>
    <ThemeIcon size={50} radius="md" variant="light">
      <Icon size={30} />
    </ThemeIcon>
    <Text size="sm" fw={500}>{label}</Text>
  </Stack>
);

const Arrow = () => (
  <Center h={50} mx="md">
    <IconArrowRight color="gray" />
  </Center>
);

function fmt(v: any): string { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}` }

export function Dashboard() {
  const { openTab } = useWindowManager();

  const { data: pnl } = useQuery({ queryKey: ['dash-pnl'], queryFn: async () => { try { return (await apiClient.get('/reports/profit-loss')).data; } catch { return null; } } });
  const { data: bs } = useQuery({ queryKey: ['dash-bs'], queryFn: async () => { try { return (await apiClient.get('/reports/balance-sheet')).data; } catch { return null; } } });
  const { data: sales } = useQuery({ queryKey: ['dash-sales'], queryFn: async () => { try { return (await apiClient.get('/reports/sales-summary')).data; } catch { return null; } } });
  const { data: ar } = useQuery({ queryKey: ['dash-ar'], queryFn: async () => { try { return (await apiClient.get('/reports/ar-aging')).data; } catch { return null; } } });
  const { data: ap } = useQuery({ queryKey: ['dash-ap'], queryFn: async () => { try { return (await apiClient.get('/reports/ap-aging')).data; } catch { return null; } } });
  const { data: invoices } = useQuery({ queryKey: ['dash-inv'], queryFn: async () => { try { return (await apiClient.get('/accounting/invoices')).data; } catch { return []; } } });
  const { data: bills } = useQuery({ queryKey: ['dash-bills'], queryFn: async () => { try { return (await apiClient.get('/bills')).data; } catch { return []; } } });
  const { data: employees } = useQuery({ queryKey: ['dash-emp'], queryFn: async () => { try { return (await apiClient.get('/employees')).data; } catch { return []; } } });

  const inv = invoices || [];
  const bil = bills || [];
  const emp = employees || [];
  const overdue = inv.filter((i: any) => i.status === 'OVERDUE').length;
  const openBills = bil.filter((b: any) => b.status === 'OPEN' || b.status === 'OVERDUE').length;

  // Pie chart data
  const pieData = [
    { name: 'Collected', value: Number(sales?.total_collected || 0) },
    { name: 'Outstanding', value: Number(sales?.outstanding || 0) },
  ].filter(d => d.value > 0);

  // Monthly bar data
  const monthlyData = (sales?.monthly || []).slice().reverse().map((m: any) => ({ month: m.month.slice(5), revenue: Number(m.revenue) }));

  return (
    <div style={{ padding: 20 }}>
      <Title order={2} mb="lg">Executive Dashboard</Title>

      {/* KPI Cards */}
      <SimpleGrid cols={5} mb="xl">
        <Card withBorder radius="md" p="md" style={{ borderLeft: '4px solid var(--mantine-color-green-6)' }}>
          <Text size="xs" tt="uppercase" c="dimmed" fw={700}>TOTAL INVOICED</Text>
          <Text size="xl" fw={700}>{fmt(sales?.total_invoiced)}</Text>
          <Text size="xs" c="dimmed">{inv.length} invoices</Text>
        </Card>
        <Card withBorder radius="md" p="md" style={{ borderLeft: '4px solid var(--mantine-color-red-6)' }}>
          <Text size="xs" tt="uppercase" c="dimmed" fw={700}>A/R OUTSTANDING</Text>
          <Text size="xl" fw={700} c="red">{fmt(ar?.grand_total)}</Text>
          <Text size="xs" c="dimmed">{overdue} overdue</Text>
        </Card>
        <Card withBorder radius="md" p="md" style={{ borderLeft: '4px solid var(--mantine-color-orange-6)' }}>
          <Text size="xs" tt="uppercase" c="dimmed" fw={700}>A/P OUTSTANDING</Text>
          <Text size="xl" fw={700} c="orange">{fmt(ap?.grand_total)}</Text>
          <Text size="xs" c="dimmed">{openBills} open bills</Text>
        </Card>
        <Card withBorder radius="md" p="md" style={{ borderLeft: '4px solid var(--mantine-color-blue-6)' }}>
          <Text size="xs" tt="uppercase" c="dimmed" fw={700}>NET INCOME</Text>
          <Text size="xl" fw={700} c={Number(pnl?.net_income || 0) >= 0 ? 'green' : 'red'}>{fmt(pnl?.net_income)}</Text>
          <Text size="xs" c="dimmed">Gross: {fmt(pnl?.gross_profit)}</Text>
        </Card>
        <Card withBorder radius="md" p="md" style={{ borderLeft: '4px solid var(--mantine-color-violet-6)' }}>
          <Text size="xs" tt="uppercase" c="dimmed" fw={700}>TOTAL ASSETS</Text>
          <Text size="xl" fw={700}>{fmt(bs?.total_assets)}</Text>
          <Text size="xs" c="dimmed">{emp.length} employees</Text>
        </Card>
      </SimpleGrid>

      {/* Business Workflow */}
      <Paper p="lg" radius="md" withBorder mb="xl">
        <Title order={4} mb="md" c="dimmed">QUICK ACTIONS</Title>
        <Group justify="center">
          <WorkflowStep icon={IconShoppingCart} label="Purchase Order" onClick={() => openTab('purchasing', 'Purchasing', <Purchasing />)} />
          <Arrow />
          <WorkflowStep icon={IconTruck} label="Receive Items" onClick={() => openTab('products', 'Inventory', <ProductList />)} />
          <Arrow />
          <WorkflowStep icon={IconFileInvoice} label="Enter Bills" onClick={() => openTab('enter-bills', 'Enter Bills', <Bills />)} />
          <Arrow />
          <WorkflowStep icon={IconCoin} label="Payments" onClick={() => openTab('invoices', 'Invoices', <Accounting />)} />
          <Arrow />
          <WorkflowStep icon={IconReportAnalytics} label="Reports" onClick={() => openTab('reports', 'Report Center', <ReportCenter />)} />
        </Group>
      </Paper>

      {/* Charts Row */}
      <SimpleGrid cols={2} mb="xl">
        <Card withBorder radius="md" p="md">
          <Title order={4} mb="md">Monthly Revenue</Title>
          <div style={{ height: 250 }}>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-dark-4)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--mantine-color-dimmed)' }} />
                  <YAxis tick={{ fill: 'var(--mantine-color-dimmed)' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ background: 'var(--mantine-color-dark-7)', border: '1px solid var(--mantine-color-dark-4)', borderRadius: 8 }} />
                  <Bar dataKey="revenue" fill="url(#blueGreen)" radius={[4, 4, 0, 0]} />
                  <defs><linearGradient id="blueGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#228be6" /><stop offset="100%" stopColor="#40c057" /></linearGradient></defs>
                </BarChart>
              </ResponsiveContainer>
            ) : <Center h={250}><Text c="dimmed">No revenue data yet</Text></Center>}
          </div>
        </Card>

        <Card withBorder radius="md" p="md">
          <Title order={4} mb="md">Collections vs Outstanding</Title>
          <div style={{ height: 250 }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} contentStyle={{ background: 'var(--mantine-color-dark-7)', border: '1px solid var(--mantine-color-dark-4)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Center h={250}><Text c="dimmed">No collection data</Text></Center>}
          </div>
        </Card>
      </SimpleGrid>

      {/* Recent Activity */}
      <SimpleGrid cols={2}>
        <Card withBorder radius="md" p="md">
          <Title order={5} mb="sm">Recent Invoices</Title>
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Invoice</Table.Th><Table.Th>Amount</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {inv.slice(0, 5).map((i: any) => (
                <Table.Tr key={i.id}>
                  <Table.Td fw={500}>{i.invoice_number}</Table.Td>
                  <Table.Td>{fmt(i.total_amount)}</Table.Td>
                  <Table.Td><Badge color={i.status === 'PAID' ? 'green' : i.status === 'OVERDUE' ? 'red' : 'blue'} variant="light" size="sm">{i.status}</Badge></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
        <Card withBorder radius="md" p="md">
          <Title order={5} mb="sm">Recent Bills</Title>
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Bill</Table.Th><Table.Th>Amount</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {bil.slice(0, 5).map((b: any) => (
                <Table.Tr key={b.id}>
                  <Table.Td fw={500}>{b.bill_number}</Table.Td>
                  <Table.Td>{fmt(b.total_amount)}</Table.Td>
                  <Table.Td><Badge color={b.status === 'PAID' ? 'green' : b.status === 'OVERDUE' ? 'red' : 'blue'} variant="light" size="sm">{b.status}</Badge></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </SimpleGrid>
    </div>
  );
}
