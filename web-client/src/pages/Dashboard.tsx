import { SimpleGrid, Paper, Title, Text, Group, ThemeIcon, Card, RingProgress, Center, Stack } from '@mantine/core';
import { IconArrowRight, IconShoppingCart, IconTruck, IconFileInvoice, IconCoin, IconBox, IconUsers } from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWindowManager } from '../context/WindowManagerContext';
import { ProductList } from './ProductList';
import { Purchasing } from './Purchasing';
import { Accounting } from './Accounting';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

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

export function Dashboard() {
  const { openTab } = useWindowManager();

  const { data: trend } = useQuery({
    queryKey: ['sales-trend'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/sales/trend');
        return res.data.map((d: any) => ({ ...d, amount: Number(d.amount) }));
      } catch {
        return [];
      }
    }
  });

  const data = trend || [];

  return (
    <div style={{ padding: 20 }}>
      <Title order={2} mb="lg">Home</Title>

      <Paper p="xl" radius="md" withBorder mb="xl">
        <Title order={4} mb="md" c="dimmed">BUSINESS WORKFLOW</Title>

        <Group justify="center" mb="xl">
          <WorkflowStep
            icon={IconShoppingCart}
            label="Purchase Order"
            onClick={() => openTab('purchasing', 'Purchasing', <Purchasing />)}
          />
          <Arrow />
          <WorkflowStep
            icon={IconTruck}
            label="Receive Items"
            onClick={() => openTab('inventory', 'Inventory', <ProductList />)}
          />
          <Arrow />
          <WorkflowStep
            icon={IconFileInvoice}
            label="Enter Bills"
            onClick={() => openTab('accounting', 'Accounting', <Accounting />)}
          />
        </Group>

        <Group justify="center">
          <WorkflowStep
            icon={IconUsers}
            label="Sales Order"
            onClick={() => openTab('sales', 'Sales Orders', <div>Sales Module</div>)}
          />
          <Arrow />
          <WorkflowStep
            icon={IconBox}
            label="Ship / Invoice"
            onClick={() => openTab('sales', 'Invoicing', <div>Invoicing Module</div>)}
          />
          <Arrow />
          <WorkflowStep
            icon={IconCoin}
            label="Receive Payment"
            onClick={() => openTab('accounting', 'Accounting', <Accounting />)}
          />
        </Group>
      </Paper>

      <SimpleGrid cols={2}>
        <Card withBorder radius="md" padding="xl">
          <Title order={4} mb="md">Income Trend</Title>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#228be6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card withBorder radius="md" padding="xl">
          <Title order={4} mb="md">Company Snapshot</Title>
          <Group justify="center" gap="xl">
            <RingProgress
              size={150}
              roundCaps
              thickness={12}
              sections={[{ value: 65, color: 'teal' }]}
              label={
                <Center>
                  <Stack gap={0} align="center">
                    <Text fw={700} size="xl">65%</Text>
                    <Text size="xs" c="dimmed">Goal Reached</Text>
                  </Stack>
                </Center>
              }
            />
            <Stack>
              <Text size="xl" fw={700}>$145,230</Text>
              <Text size="sm" c="dimmed">Total Income</Text>
              <Text size="xl" fw={700} c="red">$23,400</Text>
              <Text size="sm" c="dimmed">Expenses</Text>
            </Stack>
          </Group>
        </Card>
      </SimpleGrid>
    </div>
  );
}
