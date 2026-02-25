import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { apiClient } from '../api/client';
import { DenseTable } from '../components/DenseTable';
import { Title, Badge, SimpleGrid, Paper, Text, Group, ThemeIcon, Loader, Center } from '@mantine/core';
import { IconTruck, IconPackage, IconBuildingStore } from '@tabler/icons-react';

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  contact_person: string | null;
}

interface PurchaseOrder {
  id: string;
  supplier_id: string;
  order_number: string;
  date: string;
  status: string;
  total_amount: string;
}

const supplierColumnHelper = createColumnHelper<Supplier>();
const supplierColumns = [
  supplierColumnHelper.accessor('name', { header: 'Supplier Name' }),
  supplierColumnHelper.accessor('contact_person', { header: 'Contact Person', cell: info => info.getValue() || '—' }),
  supplierColumnHelper.accessor('email', { header: 'Email', cell: info => info.getValue() || '—' }),
  supplierColumnHelper.accessor('phone', { header: 'Phone', cell: info => info.getValue() || '—' }),
];

const poColumnHelper = createColumnHelper<PurchaseOrder>();
const poColumns = [
  poColumnHelper.accessor('order_number', { header: 'Order #' }),
  poColumnHelper.accessor('date', { header: 'Date', cell: info => new Date(info.getValue()).toLocaleDateString() }),
  poColumnHelper.accessor('status', {
    header: 'Status',
    cell: info => {
      const status = info.getValue();
      const color = status === 'RECEIVED' ? 'green' : status === 'ORDERED' ? 'blue' : status === 'CANCELLED' ? 'red' : 'gray';
      return <Badge color={color} size="sm">{status}</Badge>;
    },
  }),
  poColumnHelper.accessor('total_amount', { header: 'Total', cell: info => `$${Number(info.getValue()).toLocaleString()}` }),
];

export function Purchasing() {
  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const r = await apiClient.get<Supplier[]>('/purchasing/suppliers');
      return r.data;
    },
  });

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const r = await apiClient.get<PurchaseOrder[]>('/purchasing/orders');
      return r.data;
    },
  });

  const s = suppliers || [];
  const o = orders || [];
  const received = o.filter(x => x.status === 'RECEIVED').length;
  const totalValue = o.reduce((sum, x) => sum + Number(x.total_amount), 0);

  if (loadingSuppliers || loadingOrders) {
    return <Center h={300}><Loader size="lg" /></Center>;
  }

  return (
    <div style={{ padding: 20 }}>
      <Title order={2} mb="lg">Purchasing</Title>

      <SimpleGrid cols={3} mb="xl">
        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size={40} radius="md" variant="light" color="blue">
              <IconBuildingStore size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Suppliers</Text>
              <Text fw={700} size="xl">{s.length}</Text>
            </div>
          </Group>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size={40} radius="md" variant="light" color="violet">
              <IconPackage size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Purchase Orders</Text>
              <Text fw={700} size="xl">{o.length} ({received} received)</Text>
            </div>
          </Group>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size={40} radius="md" variant="light" color="teal">
              <IconTruck size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Total PO Value</Text>
              <Text fw={700} size="xl">${totalValue.toLocaleString()}</Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Title order={4} mb="sm">Suppliers</Title>
      <Paper withBorder mb="xl" radius="md" style={{ overflow: 'hidden' }}>
        <DenseTable data={s} columns={supplierColumns} />
      </Paper>

      <Title order={4} mb="sm">Purchase Orders</Title>
      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        <DenseTable data={o} columns={poColumns} />
      </Paper>
    </div>
  );
}
